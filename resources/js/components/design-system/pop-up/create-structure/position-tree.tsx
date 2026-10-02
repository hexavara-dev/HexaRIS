import { useMemo, useState } from 'react';
import { AddPositionDialog } from './add-position-dialog';
import { FolderChildren, PositionsBlock, TreeRow } from './position-tree-nodes';
import { type DraftDepartment, type PositionInput } from './types';
import { collectFolderIds, COMPANY_NAME, shortName } from './utils';

interface PositionTreeProps {
    departments: DraftDepartment[];
    selectedId: string;
    onSelect: (id: string) => void;
    onRemoveDepartment: (departmentId: string) => void;
    onRemoveDivision: (departmentId: string, divisionId: string) => void;
    onAddPosition: (targetId: string, input: PositionInput) => void;
    onRemovePosition: (targetId: string, positionId: string) => void;
}

export function PositionTree({
    departments,
    selectedId,
    onSelect,
    onRemoveDepartment,
    onRemoveDivision,
    onAddPosition,
    onRemovePosition,
}: PositionTreeProps) {
    const allFolderIds = useMemo(() => collectFolderIds(departments), [departments]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(allFolderIds));
    const [positionTargetId, setPositionTargetId] = useState<string | null>(null);

    function toggleExpanded(id: string) {
        setExpandedIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function startAddingPosition(targetId: string) {
        setPositionTargetId(targetId);
        setExpandedIds((current) => new Set(current).add(targetId));
    }

    function handleSubmitPositions(inputs: PositionInput[]) {
        if (!positionTargetId) return;

        inputs.forEach((input) => onAddPosition(positionTargetId, input));
        setExpandedIds((current) => new Set(current).add(positionTargetId));
        setPositionTargetId(null);
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#F1F5F9] px-4 py-3">
                <div className="min-w-0">
                    <p className="font-poppins text-[16px] font-semibold text-[#0F172A]">Struktur Organisasi</p>
                    <p className="mt-0.5 text-[14px] text-[#64748B]">Tentukan posisi jabatan di tiap unit organisasi</p>
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                <TreeRow
                    label={COMPANY_NAME}
                    isExpanded={expandedIds.has('company')}
                    isSelected={selectedId === 'company'}
                    onSelect={() => onSelect('company')}
                    onToggle={() => toggleExpanded('company')}
                />

                {expandedIds.has('company') && (
                    <div className="ml-4 border-l border-[#E2E8F0] pl-3">
                        {departments.map((department) => (
                            <div key={department.id} className="mb-1">
                                <TreeRow
                                    label={shortName(department.name)}
                                    subtitle={expandedIds.has(department.id) ? `Parents ${COMPANY_NAME}` : undefined}
                                    isExpanded={expandedIds.has(department.id)}
                                    isSelected={selectedId === department.id}
                                    onSelect={() => onSelect(department.id)}
                                    onToggle={() => toggleExpanded(department.id)}
                                    onDelete={() => onRemoveDepartment(department.id)}
                                />

                                {expandedIds.has(department.id) && (
                                    <>
                                        <PositionsBlock
                                            positions={department.positions}
                                            onAdd={() => startAddingPosition(department.id)}
                                            onRemove={(positionId) => onRemovePosition(department.id, positionId)}
                                        />
                                        <FolderChildren
                                            parentLabel={shortName(department.name)}
                                            departmentId={department.id}
                                            divisions={department.divisions}
                                            selectedId={selectedId}
                                            expandedIds={expandedIds}
                                            onSelect={onSelect}
                                            onToggle={toggleExpanded}
                                            onRemoveDivision={onRemoveDivision}
                                            onAddPosition={startAddingPosition}
                                            onRemovePosition={onRemovePosition}
                                        />
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <AddPositionDialog
                open={positionTargetId !== null}
                onOpenChange={(next) => !next && setPositionTargetId(null)}
                onSubmit={handleSubmitPositions}
            />
        </div>
    );
}
