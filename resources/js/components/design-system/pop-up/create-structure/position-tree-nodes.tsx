import { Badge } from '@/components/ui/badge';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, Trash2, X } from 'lucide-react';
import { type DraftDivision, type DraftPosition } from './types';

/** Chip label for a position — the user-multiplicity suffix shown in the design. */
function positionLabel(position: DraftPosition) {
    return `${position.name} (${position.type}-user)`;
}

/** One row: expand/collapse chevron, folder icon, label (+ optional `Parents …` subtitle), delete. */
export function TreeRow({
    label,
    subtitle,
    isExpanded,
    isSelected,
    onSelect,
    onToggle,
    onDelete,
}: {
    label: string;
    subtitle?: string;
    isExpanded: boolean;
    isSelected: boolean;
    onSelect: () => void;
    onToggle: () => void;
    onDelete?: () => void;
}) {
    return (
        <div
            className={[
                'group flex min-h-12 items-center gap-1 rounded-md px-1 transition-colors',
                isSelected ? 'bg-[#EAF6FF]' : 'hover:bg-[#F8FAFC]',
            ].join(' ')}
        >
            <button
                type="button"
                onClick={onToggle}
                className="flex size-7 items-center justify-center text-[#64748B]"
                aria-label={isExpanded ? 'Tutup folder' : 'Buka folder'}
            >
                {isExpanded ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            </button>
            <button
                type="button"
                onClick={onSelect}
                className="flex min-w-0 flex-1 flex-col items-start gap-0.5 py-1 text-left focus-visible:outline-none"
            >
                <span className="flex min-w-0 items-center gap-2">
                    {isExpanded ? <FolderOpen className="size-4 shrink-0 text-[#1980C0]" /> : <Folder className="size-4 shrink-0 text-[#1980C0]" />}
                    <span className="truncate text-[15px] font-medium text-[#0F172A]">{label}</span>
                </span>
                {subtitle && <span className="pl-6 text-[13px] text-[#94A3B8]">{subtitle}</span>}
            </button>

            {onDelete && (
                <button
                    type="button"
                    onClick={onDelete}
                    className="flex size-6 shrink-0 items-center justify-center text-[#E84A39] opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
                    aria-label={`Hapus ${label}`}
                >
                    <Trash2 className="size-3" />
                </button>
            )}
        </div>
    );
}

/** Position chips for one unit, followed by the "+ Tambah Posisi Jabatan" row. */
export function PositionsBlock({
    positions,
    onAdd,
    onRemove,
}: {
    positions: DraftPosition[];
    onAdd: () => void;
    onRemove: (positionId: string) => void;
}) {
    return (
        <div className="mb-1 flex flex-col items-start gap-1.5 pl-14">
            {positions.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {positions.map((position) => (
                        <Badge
                            key={position.id}
                            variant="outline"
                            className="gap-1 rounded-full border-[#9CCFF2] py-1 pr-1 pl-2.5 text-[12px] font-medium text-[#1980C0]"
                        >
                            {positionLabel(position)}
                            <button
                                type="button"
                                onClick={() => onRemove(position.id)}
                                aria-label={`Hapus posisi ${position.name}`}
                                className="rounded-full p-0.5 transition-colors hover:bg-[#1980C0]/15 focus-visible:ring-2 focus-visible:ring-[#1980C0] focus-visible:outline-none"
                            >
                                <X aria-hidden="true" className="size-3" />
                            </button>
                        </Badge>
                    ))}
                </div>
            )}

            <button
                type="button"
                onClick={onAdd}
                className="flex items-center gap-1 py-1 text-[14px] font-medium text-[#1980C0] hover:underline focus-visible:ring-2 focus-visible:ring-[#1980C0] focus-visible:outline-none"
            >
                <Plus aria-hidden="true" className="size-3.5" />
                Tambah Posisi Jabatan
            </button>
        </div>
    );
}

/** Recursively renders one department's divisions: their rows, their own children, and their position chips. */
export function FolderChildren({
    parentLabel,
    departmentId,
    divisions,
    selectedId,
    expandedIds,
    onSelect,
    onToggle,
    onRemoveDivision,
    onAddPosition,
    onRemovePosition,
}: {
    parentLabel: string;
    departmentId: string;
    divisions: DraftDivision[];
    selectedId: string;
    expandedIds: Set<string>;
    onSelect: (id: string) => void;
    onToggle: (id: string) => void;
    onRemoveDivision: (departmentId: string, divisionId: string) => void;
    onAddPosition: (targetId: string) => void;
    onRemovePosition: (targetId: string, positionId: string) => void;
}) {
    return (
        <div className="ml-4 border-l border-[#E2E8F0] pl-3">
            {divisions.map((division) => (
                <div key={division.id} className="mb-1">
                    <TreeRow
                        label={division.name}
                        subtitle={expandedIds.has(division.id) ? `Parents ${parentLabel}` : undefined}
                        isExpanded={expandedIds.has(division.id)}
                        isSelected={selectedId === division.id}
                        onSelect={() => onSelect(division.id)}
                        onToggle={() => onToggle(division.id)}
                        onDelete={() => onRemoveDivision(departmentId, division.id)}
                    />

                    {expandedIds.has(division.id) && (
                        <>
                            <PositionsBlock
                                positions={division.positions}
                                onAdd={() => onAddPosition(division.id)}
                                onRemove={(positionId) => onRemovePosition(division.id, positionId)}
                            />
                            <FolderChildren
                                parentLabel={division.name}
                                departmentId={departmentId}
                                divisions={division.divisions}
                                selectedId={selectedId}
                                expandedIds={expandedIds}
                                onSelect={onSelect}
                                onToggle={onToggle}
                                onRemoveDivision={onRemoveDivision}
                                onAddPosition={onAddPosition}
                                onRemovePosition={onRemovePosition}
                            />
                        </>
                    )}
                </div>
            ))}
        </div>
    );
}
