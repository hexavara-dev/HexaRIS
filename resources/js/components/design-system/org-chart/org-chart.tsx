import { useRef, useState, type PointerEvent } from 'react';

export interface OrgMember {
    name: string;
    role: string;
    avatarUrl?: string;
}

export interface OrgDivision {
    name: string;
    members: OrgMember[];
}

export interface OrgDepartment {
    name: string;
    /** Full-width "Kepala Bagian" card shown directly under the header (used by departments that own divisions). */
    head?: OrgMember;
    /** Stacked member cards shown directly under the header (used by departments without divisions). */
    members?: OrgMember[];
    /** Division sub-columns, each with its own sub-header and member cards. */
    divisions?: OrgDivision[];
}

export interface OrgTree {
    cabang?: string;
    cabangOptions?: string[];
    ceo: OrgMember;
    departments: OrgDepartment[];
}

function shortDepartmentName(name: string) {
    return name.replace(/^Dept\.\s*/, '');
}

function roleLabel(role: string) {
    if (/^Kepala\s+Divisi/i.test(role)) return 'Kepala Divisi';
    if (/^Kepala\s+(Departemen|Bagian)/i.test(role)) return 'Kepala Bagian';
    if (/^Staff/i.test(role)) return 'Staff';
    return role;
}

interface NodePeople {
    lead?: OrgMember;
    leadLabel?: string;
    staff: OrgMember[];
}

function peopleFromMembers(members: OrgMember[] | undefined): NodePeople {
    const list = members ?? [];
    if (list.length === 0) return { staff: [] };

    const leadIndex = list.findIndex((member) => /^Kepala\s+(Departemen|Divisi|Bagian)/i.test(member.role));
    const lead = leadIndex >= 0 ? list[leadIndex] : list[0];
    const staff = list.filter((_, index) => index !== (leadIndex >= 0 ? leadIndex : 0));

    return { lead, leadLabel: roleLabel(lead.role), staff };
}

function CompactNode({ title, subtitle, people, active = false }: { title: string; subtitle?: string; people?: NodePeople; active?: boolean }) {
    const staff = people?.staff ?? [];

    return (
        <div
            className={[
                'flex min-h-24 w-[230px] flex-col items-center justify-center rounded-xl border bg-white px-4 py-3 text-center shadow-[0_1px_2px_rgba(15,23,42,0.06)]',
                active ? 'border-[#1980C0] bg-[#EEF8FF]' : 'border-[#DCE5EF]',
            ].join(' ')}
        >
            <p className="font-poppins max-w-full truncate text-[16px] leading-5 font-semibold text-[#0F172A]">{title}</p>

            {active ? (
                <>
                    {subtitle && <p className="mt-1 max-w-full truncate text-[13px] leading-5 text-[#64748B]">{subtitle}</p>}
                    {people?.lead && <p className="max-w-full truncate text-[14px] leading-5 text-[#334155]">{people.lead.name}</p>}
                </>
            ) : (
                <>
                    {people?.lead ? (
                        <>
                            <p className="mt-1 max-w-full truncate text-[12px] leading-4 text-[#7A7A7A]">{people.leadLabel ?? 'Kepala Bagian'}</p>
                            <p className="max-w-full truncate text-[14px] leading-5 text-[#4B5563]">{people.lead.name}</p>
                        </>
                    ) : (
                        subtitle && <p className="mt-1 max-w-full truncate text-[13px] leading-5 text-[#64748B]">{subtitle}</p>
                    )}

                    {staff.length > 0 && (
                        <div className="mt-0.5 max-w-full">
                            <p className="text-[12px] leading-4 text-[#7A7A7A]">Staff</p>
                            <div className="space-y-0.5">
                                {staff.map((member, index) => (
                                    <p key={`${member.name}-${member.role}-${index}`} className="truncate text-[14px] leading-5 text-[#4B5563]">
                                        {index + 1}. {member.name}
                                    </p>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function DivisionNode({ division }: { division: OrgDivision }) {
    const people = peopleFromMembers(division.members);

    return (
        <div className="relative flex justify-center pt-8 before:absolute before:top-0 before:left-1/2 before:h-8 before:border-l before:border-[#CBD5E1] before:content-['']">
            <CompactNode title={division.name} subtitle="Divisi" people={people} />
        </div>
    );
}

function DepartmentColumn({ department }: { department: OrgDepartment }) {
    const departmentTitle = shortDepartmentName(department.name);
    const people = department.head
        ? { lead: department.head, leadLabel: roleLabel(department.head.role), staff: [] }
        : peopleFromMembers(department.members);
    const divisions = department.divisions ?? [];
    const hasChildren = divisions.length > 0;

    return (
        <div className="inline-flex w-[260px] flex-col items-center">
            <CompactNode title={departmentTitle} subtitle="Bagian" people={people} />

            {hasChildren && (
                <div className="flex flex-col items-center gap-0">
                    {divisions.map((division) => (
                        <DivisionNode key={division.name} division={division} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface OrgChartProps {
    tree: OrgTree;
    /** 1 = 100%. The chart is scaled from the top-center. */
    zoom?: number;
}

export function OrgChart({ tree, zoom = 1 }: OrgChartProps) {
    const canvasRef = useRef<HTMLDivElement>(null);
    const dragRef = useRef({ pointerId: -1, x: 0, y: 0, offsetX: 0, offsetY: 0 });
    const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
    const [isPanning, setIsPanning] = useState(false);

    function startPan(event: PointerEvent<HTMLDivElement>) {
        if (event.button !== 0 || !canvasRef.current) return;

        dragRef.current = {
            pointerId: event.pointerId,
            x: event.clientX,
            y: event.clientY,
            offsetX: panOffset.x,
            offsetY: panOffset.y,
        };
        canvasRef.current.setPointerCapture(event.pointerId);
        setIsPanning(true);
    }

    function pan(event: PointerEvent<HTMLDivElement>) {
        if (!isPanning || dragRef.current.pointerId !== event.pointerId) return;

        event.preventDefault();
        setPanOffset({
            x: dragRef.current.offsetX + event.clientX - dragRef.current.x,
            y: dragRef.current.offsetY + event.clientY - dragRef.current.y,
        });
    }

    function stopPan(event: PointerEvent<HTMLDivElement>) {
        if (!canvasRef.current || dragRef.current.pointerId !== event.pointerId) return;

        if (canvasRef.current.hasPointerCapture(event.pointerId)) {
            canvasRef.current.releasePointerCapture(event.pointerId);
        }
        dragRef.current.pointerId = -1;
        setIsPanning(false);
    }

    return (
        <div
            ref={canvasRef}
            className={['h-full w-full touch-none overflow-hidden select-none', isPanning ? 'cursor-grabbing' : 'cursor-grab'].join(' ')}
            onPointerDown={startPan}
            onPointerMove={pan}
            onPointerUp={stopPan}
            onPointerCancel={stopPan}
        >
            <div
                className="flex min-w-max origin-top justify-center px-16 py-8"
                style={{ transform: `translate3d(${panOffset.x}px, ${panOffset.y}px, 0) scale(${zoom})`, transformOrigin: 'top center' }}
            >
                <div className="flex flex-col items-center">
                    <CompactNode title="PT. Abadi Jaya" subtitle={tree.ceo.role} people={{ lead: tree.ceo, staff: [] }} active />

                    <ul className="relative flex justify-center gap-16 pt-20 before:absolute before:top-0 before:left-1/2 before:h-10 before:border-l before:border-[#CBD5E1] before:content-[''] after:absolute after:top-10 after:right-[130px] after:left-[130px] after:border-t after:border-[#CBD5E1] after:content-['']">
                        {tree.departments.map((department) => (
                            <li
                                key={department.name}
                                className="relative flex flex-col items-center before:absolute before:top-[-40px] before:left-1/2 before:h-10 before:border-l before:border-[#CBD5E1] before:content-['']"
                            >
                                <DepartmentColumn department={department} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function avatarFor(seed: string) {
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
}

export const ORG_CHART_DEMO: OrgTree = {
    ceo: { name: 'Nikolas Raharjo', role: 'Direktur Utama', avatarUrl: avatarFor('Nikolas Raharjo') },
    departments: [
        {
            name: 'Dept. Human Resource',
            members: [
                { name: 'Ayu Anindita', role: 'Kepala Bagian HR', avatarUrl: avatarFor('HR Head') },
                { name: 'Ayu Anindita', role: 'HR General', avatarUrl: avatarFor('HR General') },
                { name: 'Ayu Anindita', role: 'HR Administrasi', avatarUrl: avatarFor('HR Admin') },
            ],
        },
        {
            name: 'Dept. Information Technology',
            head: { name: 'M Zainudin', role: 'Kepala Bagian IT', avatarUrl: avatarFor('M Zainudin') },
            divisions: [
                {
                    name: 'Divisi Developer',
                    members: [
                        { name: 'Sarah Amelia', role: 'Kepala Divisi Developer', avatarUrl: avatarFor('Sarah Amelia Dev Lead') },
                        { name: 'Aini Rahma', role: 'Fullstack Developer', avatarUrl: avatarFor('Aini Rahma') },
                        { name: 'Sarah Amelia', role: 'Fullstack Developer', avatarUrl: avatarFor('Sarah Amelia Dev') },
                    ],
                },
                {
                    name: 'Divisi UI/UX Design',
                    members: [
                        { name: 'Andi Kurniawan', role: 'Kepala Divisi UI/UX', avatarUrl: avatarFor('Andi Kurniawan') },
                        { name: 'Rizky Pratama', role: 'UI/UX Designer', avatarUrl: avatarFor('Rizky Pratama') },
                        { name: 'Maya Safitri', role: 'UX Researcher', avatarUrl: avatarFor('Maya Safitri Research') },
                    ],
                },
                {
                    name: 'Divisi QA',
                    members: [
                        { name: 'Maya Safitri', role: 'Kepala Divisi QA', avatarUrl: avatarFor('Maya Safitri QA Lead') },
                        { name: 'Ajeng Nafisa', role: 'QA Tester', avatarUrl: avatarFor('Ajeng Nafisa') },
                    ],
                },
            ],
        },
        {
            name: 'Dept. Kreatif',
            head: { name: 'Ayu Anindita', role: 'Kepala Bagian Creative', avatarUrl: avatarFor('Creative Head') },
            divisions: [
                {
                    name: 'Design',
                    members: [
                        { name: 'Ayu Anindita', role: 'Kepala Divisi Design', avatarUrl: avatarFor('Design Lead') },
                        { name: 'Ayu Anindita', role: 'Graphich Designer', avatarUrl: avatarFor('Graphic 1') },
                        { name: 'Ayu Anindita', role: 'Graphich Designer', avatarUrl: avatarFor('Graphic 2') },
                    ],
                },
                {
                    name: 'Marketing',
                    members: [
                        { name: 'Ayu Anindita', role: 'Kepala Divisi Design', avatarUrl: avatarFor('Marketing Lead') },
                        { name: 'Ayu Anindita', role: 'Talent', avatarUrl: avatarFor('Talent') },
                    ],
                },
            ],
        },
        {
            name: 'Dept. Finance',
            members: [
                { name: 'Ayu Anindita', role: 'Kepala Bagian Finance', avatarUrl: avatarFor('Finance Head') },
                { name: 'Ayu Anindita', role: 'Payroll', avatarUrl: avatarFor('Payroll') },
            ],
        },
        {
            name: 'Dept. Operasional',
            members: [
                { name: 'Ayu Anindita', role: 'Kepala Bagian Ops', avatarUrl: avatarFor('Ops Head') },
                { name: 'Staff Operasional 2', role: 'Logistics', avatarUrl: avatarFor('Logistics') },
            ],
        },
    ],
};
