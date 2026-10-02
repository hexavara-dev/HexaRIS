import logoPt from '@/assets/icons/logo_pt.png';
import { cn } from '@/lib/utils';
import { Controls, Handle, Position, ReactFlow, type BuiltInEdge, type Node, type NodeProps, type ReactFlowInstance } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Building2, GitBranch, Maximize2, Minimize2 } from 'lucide-react';
import { memo, useEffect, useMemo, useRef } from 'react';
import { type BranchChoice, type DraftDepartment, type DraftDivision } from './types';
import { COMPANY_NAME, shortName } from './utils';

type StaticPreviewProps = {
    mode: 'static';
    branchChoice: BranchChoice;
    departments: DraftDepartment[];
    expanded: boolean;
    onToggleExpanded: () => void;
    hideExpandToggle?: boolean;
};

type DynamicPreviewProps = {
    mode: 'dynamic';
    departments: DraftDepartment[];
    selectedId: string;
    onSelect: (id: string) => void;
    expanded: boolean;
    onToggleExpanded: () => void;
    hideExpandToggle?: boolean;
};

type StructureFlowPreviewProps = StaticPreviewProps | DynamicPreviewProps;

type StructureNodeData = {
    kind: 'company' | 'department' | 'unit';
    title: string;
    description: string;
    parentPosition: Position | null;
    childrenPosition: Position | null;
};

type StructureNode = Node<StructureNodeData, 'structure'>;

const NODE_WIDTH = 214;
const NODE_HEIGHT = 72;
const LEVEL_GAP = 68;
const ROW_GAP = 22;

function StructureNodeCard({ data, selected }: NodeProps<StructureNode>) {
    const isCompany = data.kind === 'company';
    const isUnit = data.kind === 'unit';

    return (
        <div
            className={cn(
                'bg-background flex h-[72px] w-[214px] items-center gap-3 rounded-xl border px-4 transition-colors',
                isCompany ? 'border-primary' : 'border-[#B8DDF7]',
                selected && 'border-primary outline-primary/20 bg-[#F5FBFF] outline-2 outline-offset-2',
            )}
        >
            {data.parentPosition && (
                <Handle id="parent" type="target" position={data.parentPosition} className="!border-background !size-2 !border-2 !bg-[#70B7EA]" />
            )}

            <span className="text-primary flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#EAF6FF]">
                {isCompany ? (
                    <img src={logoPt} alt="" className="size-4" />
                ) : isUnit ? (
                    <GitBranch aria-hidden="true" className="size-4" />
                ) : (
                    <Building2 aria-hidden="true" className="size-4" />
                )}
            </span>
            <span className="min-w-0 text-left">
                <span className="font-poppins block truncate text-[15px] leading-5 font-semibold text-[#0F172A]">{data.title}</span>
                <span className="block truncate text-[14px] leading-5 text-[#64748B]">{data.description}</span>
            </span>

            {data.childrenPosition && (
                <Handle id="children" type="source" position={data.childrenPosition} className="!border-background !size-2 !border-2 !bg-[#70B7EA]" />
            )}
        </div>
    );
}

const nodeTypes = { structure: memo(StructureNodeCard) };

function descendantsCount(division: DraftDivision): number {
    return division.divisions.reduce((total, child) => total + 1 + descendantsCount(child), 0);
}

function createStaticFlowElements() {
    const nodes: StructureNode[] = [
        {
            id: 'company',
            type: 'structure',
            position: { x: 0, y: 0 },
            data: {
                kind: 'company',
                title: COMPANY_NAME,
                description: 'Kantor pusat',
                parentPosition: null,
                childrenPosition: null,
            },
            draggable: false,
            selectable: true,
            ariaLabel: `${COMPANY_NAME}, kantor pusat`,
        },
    ];

    return { nodes, edges: [] satisfies BuiltInEdge[], structureKey: 'static-company' };
}

function createDynamicFlowElements(departments: DraftDepartment[], selectedId: string) {
    const nodes: StructureNode[] = [];
    const edges: BuiltInEdge[] = [];
    let nextLeafX = 0;

    function pushNode({
        id,
        depth,
        x,
        kind,
        title,
        description,
        hasChildren,
    }: {
        id: string;
        depth: number;
        x: number;
        kind: StructureNodeData['kind'];
        title: string;
        description: string;
        hasChildren: boolean;
    }) {
        nodes.push({
            id,
            type: 'structure',
            position: { x, y: depth * (NODE_HEIGHT + LEVEL_GAP) },
            data: {
                kind,
                title,
                description,
                parentPosition: depth === 0 ? null : Position.Top,
                childrenPosition: hasChildren ? Position.Bottom : null,
            },
            selected: selectedId === id,
            draggable: false,
            selectable: true,
            ariaLabel: `${title}, ${description}`,
        });
    }

    function connect(parentId: string, childId: string, depth: number) {
        edges.push({
            id: `${parentId}-${childId}`,
            source: parentId,
            sourceHandle: 'children',
            target: childId,
            targetHandle: 'parent',
            type: 'smoothstep',
            pathOptions: { borderRadius: 6, offset: Math.max(20, 32 - depth * 2) },
            style: { stroke: depth > 1 ? '#9CCFF2' : '#70B7EA', strokeWidth: depth > 1 ? 1.35 : 1.5 },
            selectable: false,
        });
    }

    function layoutDivision(division: DraftDivision, parentId: string, depth: number): number {
        const hasChildren = division.divisions.length > 0;
        const startX = nextLeafX;
        const childXs = division.divisions.map((child) => layoutDivision(child, division.id, depth + 1));
        const x = hasChildren ? (childXs[0] + childXs[childXs.length - 1]) / 2 : startX * (NODE_WIDTH + ROW_GAP);
        if (!hasChildren) nextLeafX += 1;

        pushNode({
            id: division.id,
            depth,
            x,
            kind: 'unit',
            title: division.name,
            description: division.divisions.length > 0 ? `${division.divisions.length} sub-unit` : 'Unit organisasi',
            hasChildren,
        });
        connect(parentId, division.id, depth);
        return x;
    }

    function layoutDepartment(department: DraftDepartment): number {
        const hasChildren = department.divisions.length > 0;
        const startX = nextLeafX;
        const childXs = department.divisions.map((division) => layoutDivision(division, department.id, 2));
        const x = hasChildren ? (childXs[0] + childXs[childXs.length - 1]) / 2 : startX * (NODE_WIDTH + ROW_GAP);
        if (!hasChildren) nextLeafX += 1;

        pushNode({
            id: department.id,
            depth: 1,
            x,
            kind: 'department',
            title: shortName(department.name),
            description: department.divisions.length > 0 ? `${department.divisions.length} unit` : 'Departemen',
            hasChildren,
        });
        connect('company', department.id, 1);
        return x;
    }

    const departmentXs = departments.map(layoutDepartment);
    const companyX =
        departmentXs.length > 0
            ? (departmentXs[0] + departmentXs[departmentXs.length - 1]) / 2
            : Math.max(0, nextLeafX * (NODE_WIDTH + ROW_GAP) * 0.5);

    pushNode({
        id: 'company',
        depth: 0,
        x: companyX,
        kind: 'company',
        title: COMPANY_NAME,
        description: 'Kantor pusat',
        hasChildren: departments.length > 0,
    });

    return {
        nodes,
        edges,
        structureKey: JSON.stringify(
            departments.map((department) => [
                department.id,
                department.name,
                department.divisions.map((division) => [division.id, division.name, descendantsCount(division)]),
            ]),
        ),
    };
}

export function StructureFlowPreview(props: StructureFlowPreviewProps) {
    const flowInstance = useRef<ReactFlowInstance<StructureNode, BuiltInEdge> | null>(null);
    const flowCanvasRef = useRef<HTMLDivElement>(null);
    const selectedId = props.mode === 'dynamic' ? props.selectedId : 'company';
    const onSelect = props.mode === 'dynamic' ? props.onSelect : undefined;
    const fitPadding = props.mode === 'static' ? 0.24 : 0.16;
    const { nodes, edges, structureKey } = useMemo(
        () => (props.mode === 'static' ? createStaticFlowElements() : createDynamicFlowElements(props.departments, selectedId)),
        [props.mode, props.departments, selectedId],
    );
    const contentKey = props.mode === 'static' ? props.branchChoice : structureKey;
    const fitKey = `${props.mode}-${contentKey}-${selectedId}-${props.expanded}`;
    const previousExpanded = useRef<boolean | null>(null);

    useEffect(() => {
        const fit = (duration: number) => {
            window.requestAnimationFrame(() => {
                void flowInstance.current?.fitView({ padding: fitPadding, minZoom: 0.2, maxZoom: 1, duration });
            });
        };

        const isLayoutTransition = previousExpanded.current !== null && previousExpanded.current !== props.expanded;
        previousExpanded.current = props.expanded;

        // Static and dynamic previews use the same fit timing. During a panel
        // transition, the resize observer tracks each frame and this final
        // zero-duration fit settles the viewport after the CSS transition.
        const timer = window.setTimeout(() => fit(isLayoutTransition ? 0 : 180), isLayoutTransition ? 520 : 80);

        return () => window.clearTimeout(timer);
    }, [fitKey, fitPadding, props.expanded]);

    useEffect(() => {
        if (!flowCanvasRef.current) return;

        let frame: number | null = null;
        const observer = new ResizeObserver(() => {
            if (frame !== null) window.cancelAnimationFrame(frame);
            frame = window.requestAnimationFrame(() => {
                // The panel itself is animated by CSS. Track its changing
                // bounds directly instead of starting a new 120ms animation
                // on every resize frame.
                void flowInstance.current?.fitView({ padding: fitPadding, minZoom: 0.2, maxZoom: 1, duration: 0 });
            });
        });

        observer.observe(flowCanvasRef.current);

        return () => {
            if (frame !== null) window.cancelAnimationFrame(frame);
            observer.disconnect();
        };
    }, [fitPadding]);

    return (
        <div className="bg-background flex h-full min-h-0 w-full flex-col overflow-hidden rounded-xl border border-[#E2E8F0]">
            <div className="flex h-12 shrink-0 items-center justify-between border-b border-[#F1F5F9] px-4">
                <p className="font-poppins text-[16px] font-semibold text-[#0F172A]">Preview Struktur</p>
                {props.mode === 'static' ? (
                    !props.hideExpandToggle && (
                        <button
                            type="button"
                            onClick={props.onToggleExpanded}
                            className="flex size-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#EAF6FF] hover:text-[#1980C0] focus-visible:ring-2 focus-visible:ring-[#1980C0] focus-visible:outline-none"
                            aria-label={props.expanded ? 'Tutup preview penuh' : 'Perbesar preview struktur'}
                            title={props.expanded ? 'Tutup preview penuh' : 'Perbesar preview struktur'}
                        >
                            {props.expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                        </button>
                    )
                ) : (
                    <div className="flex items-center gap-2">
                        <span className="text-[14px] text-[#64748B]">Klik node untuk memilih</span>
                        {!props.hideExpandToggle && (
                            <button
                                type="button"
                                onClick={props.onToggleExpanded}
                                className="flex size-7 items-center justify-center rounded-md text-[#64748B] transition-colors hover:bg-[#EAF6FF] hover:text-[#1980C0] focus-visible:ring-2 focus-visible:ring-[#1980C0] focus-visible:outline-none"
                                aria-label={props.expanded ? 'Tutup preview penuh' : 'Perbesar preview struktur'}
                                title={props.expanded ? 'Tutup preview penuh' : 'Perbesar preview struktur'}
                            >
                                {props.expanded ? <Minimize2 className="size-4" /> : <Maximize2 className="size-4" />}
                            </button>
                        )}
                    </div>
                )}
            </div>
            <div ref={flowCanvasRef} className="min-h-0 flex-1 bg-[#FBFDFF]">
                <ReactFlow<StructureNode, BuiltInEdge>
                    nodes={nodes}
                    edges={edges}
                    nodeTypes={nodeTypes}
                    onInit={(instance) => {
                        flowInstance.current = instance;
                    }}
                    onNodeClick={(_, node) => onSelect?.(node.id)}
                    fitView
                    fitViewOptions={{ padding: fitPadding, minZoom: 0.2, maxZoom: 1 }}
                    minZoom={0.2}
                    maxZoom={props.mode === 'static' ? 1.6 : 1.4}
                    nodesDraggable={props.mode === 'static'}
                    nodesConnectable={false}
                    edgesFocusable={false}
                    elementsSelectable
                    panOnDrag
                    zoomOnScroll
                    zoomOnPinch
                    zoomOnDoubleClick={props.mode === 'static'}
                    preventScrolling
                    proOptions={{ hideAttribution: true }}
                >
                    {props.mode === 'dynamic' && (
                        <Controls position="bottom-right" showInteractive={false} fitViewOptions={{ padding: 0.16, maxZoom: 1 }} />
                    )}
                </ReactFlow>
            </div>
        </div>
    );
}
