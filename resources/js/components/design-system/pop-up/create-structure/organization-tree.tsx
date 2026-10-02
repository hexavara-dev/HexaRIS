import { Label } from '@/components/ui/label';
import { ChevronDown, ChevronRight, Folder, FolderOpen, Plus, Trash2 } from 'lucide-react';
import { useMemo, useState } from 'react';
import { type DraftDepartment, type DraftDivision } from './types';
import { collectFolderIds } from './utils';

interface OrganizationTreeProps {
    departments: DraftDepartment[];
    selectedId: string;
    onSelect: (id: string) => void;
    onAddDepartment: (name: string) => void;
    onAddDivision: (parentId: string, name: string) => void;
    onRemoveDepartment: (departmentId: string) => void;
    onRemoveDivision: (departmentId: string, divisionId: string) => void;
}

export function OrganizationTree({
    departments,
    selectedId,
    onSelect,
    onAddDepartment,
    onAddDivision,
    onRemoveDepartment,
    onRemoveDivision,
}: OrganizationTreeProps) {
    const allFolderIds = useMemo(() => collectFolderIds(departments), [departments]);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(() => new Set(allFolderIds));
    const [addingUnder, setAddingUnder] = useState<string | null>(null);
    const [newName, setNewName] = useState('');

    function toggleExpanded(id: string) {
        setExpandedIds((current) => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    }

    function startAdding(parentId: string) {
        setAddingUnder(parentId);
        setNewName('');
        setExpandedIds((current) => new Set(current).add(parentId));
    }

    function submitOrganization(parentId: string) {
        const name = newName.trim();
        if (!name) return;

        if (parentId === 'company') {
            onAddDepartment(name);
        } else {
            onAddDivision(parentId, name);
        }

        setExpandedIds((current) => new Set(current).add(parentId));
        setAddingUnder(null);
        setNewName('');
    }

    return (
        <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white">
            <div className="flex shrink-0 items-center justify-between border-b border-[#F1F5F9] px-4 py-3">
                <div>
                    <p className="font-poppins text-[16px] font-semibold text-[#0F172A]">Struktur Organisasi</p>
                    <p className="mt-0.5 text-[14px] text-[#64748B]">Tambah atau susun organisasi timmu</p>
                </div>
                <button
                    type="button"
                    onClick={() => startAdding('company')}
                    className="flex size-7 items-center justify-center rounded-md text-[#1980C0] transition-colors hover:bg-[#EAF6FF] focus-visible:ring-2 focus-visible:ring-[#1980C0] focus-visible:outline-none"
                    aria-label="Tambah departemen"
                    title="Tambah departemen"
                >
                    <Plus className="size-4" />
                </button>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
                <TreeRow
                    label="PT. Abadi Jaya"
                    isExpanded={expandedIds.has('company')}
                    isSelected={selectedId === 'company'}
                    onSelect={() => onSelect('company')}
                    onToggle={() => toggleExpanded('company')}
                />

                {expandedIds.has('company') && (
                    <div className="ml-4 border-l border-[#E2E8F0] pl-3">
                        {departments.map((department) => (
                            <div key={department.id}>
                                <TreeRow
                                    label={department.name.replace(/^Dept\.\s*/, '')}
                                    isExpanded={expandedIds.has(department.id)}
                                    isSelected={selectedId === department.id}
                                    onSelect={() => onSelect(department.id)}
                                    onToggle={() => toggleExpanded(department.id)}
                                    onDelete={() => onRemoveDepartment(department.id)}
                                />

                                {expandedIds.has(department.id) && (
                                    <FolderChildren
                                        parentId={department.id}
                                        departmentId={department.id}
                                        divisions={department.divisions}
                                        selectedId={selectedId}
                                        expandedIds={expandedIds}
                                        addingUnder={addingUnder}
                                        newName={newName}
                                        placeholder="Nama unit organisasi"
                                        onSelect={onSelect}
                                        onToggle={toggleExpanded}
                                        onStartAdding={startAdding}
                                        onNameChange={setNewName}
                                        onSubmit={submitOrganization}
                                        onCancel={() => setAddingUnder(null)}
                                        onRemoveDivision={onRemoveDivision}
                                    />
                                )}
                            </div>
                        ))}

                        {addingUnder === 'company' ? (
                            <InlineAdd
                                value={newName}
                                placeholder="Nama departemen"
                                onChange={setNewName}
                                onSubmit={() => submitOrganization('company')}
                                onCancel={() => setAddingUnder(null)}
                            />
                        ) : (
                            <AddOrganizationButton label="Tambah Departemen" onClick={() => startAdding('company')} />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function FolderChildren({
    parentId,
    departmentId,
    divisions,
    selectedId,
    expandedIds,
    addingUnder,
    newName,
    placeholder,
    onSelect,
    onToggle,
    onStartAdding,
    onNameChange,
    onSubmit,
    onCancel,
    onRemoveDivision,
}: {
    parentId: string;
    departmentId: string;
    divisions: DraftDivision[];
    selectedId: string;
    expandedIds: Set<string>;
    addingUnder: string | null;
    newName: string;
    placeholder: string;
    onSelect: (id: string) => void;
    onToggle: (id: string) => void;
    onStartAdding: (parentId: string) => void;
    onNameChange: (value: string) => void;
    onSubmit: (parentId: string) => void;
    onCancel: () => void;
    onRemoveDivision: (departmentId: string, divisionId: string) => void;
}) {
    return (
        <div className="ml-4 border-l border-[#E2E8F0] pl-3">
            {divisions.map((division) => (
                <div key={division.id}>
                    <TreeRow
                        label={division.name}
                        isExpanded={expandedIds.has(division.id)}
                        isSelected={selectedId === division.id}
                        onSelect={() => onSelect(division.id)}
                        onToggle={() => onToggle(division.id)}
                        onDelete={() => onRemoveDivision(departmentId, division.id)}
                    />

                    {expandedIds.has(division.id) && (
                        <FolderChildren
                            parentId={division.id}
                            departmentId={departmentId}
                            divisions={division.divisions}
                            selectedId={selectedId}
                            expandedIds={expandedIds}
                            addingUnder={addingUnder}
                            newName={newName}
                            placeholder={placeholder}
                            onSelect={onSelect}
                            onToggle={onToggle}
                            onStartAdding={onStartAdding}
                            onNameChange={onNameChange}
                            onSubmit={onSubmit}
                            onCancel={onCancel}
                            onRemoveDivision={onRemoveDivision}
                        />
                    )}
                </div>
            ))}

            {addingUnder === parentId ? (
                <InlineAdd
                    value={newName}
                    placeholder={placeholder}
                    onChange={onNameChange}
                    onSubmit={() => onSubmit(parentId)}
                    onCancel={onCancel}
                />
            ) : (
                <AddOrganizationButton label="Tambah Unit Organisasi" onClick={() => onStartAdding(parentId)} />
            )}
        </div>
    );
}

function TreeRow({
    label,
    isExpanded,
    isSelected,
    onSelect,
    onToggle,
    onDelete,
}: {
    label: string;
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
            <button type="button" onClick={onSelect} className="flex min-w-0 flex-1 items-center gap-2 text-left focus-visible:outline-none">
                {isExpanded ? <FolderOpen className="size-4 shrink-0 text-[#1980C0]" /> : <Folder className="size-4 shrink-0 text-[#1980C0]" />}
                <span className="truncate text-[15px] font-medium text-[#0F172A]">{label}</span>
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

function AddOrganizationButton({ label, onClick }: { label: string; onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="mt-1 flex items-center gap-1 px-7 py-2 text-[15px] font-medium text-[#1980C0] hover:underline focus-visible:ring-2 focus-visible:ring-[#1980C0] focus-visible:outline-none"
        >
            <Plus className="size-3.5" />
            {label}
        </button>
    );
}

function InlineAdd({
    value,
    placeholder,
    onChange,
    onSubmit,
    onCancel,
}: {
    value: string;
    placeholder: string;
    onChange: (value: string) => void;
    onSubmit: () => void;
    onCancel: () => void;
}) {
    return (
        <div className="mt-4 flex flex-col gap-1 pl-7">
            <Label htmlFor="x" className="font-semibold">
                Organisasi Unit <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2 flex items-center gap-2">
                <input
                    id="x"
                    autoFocus
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    onKeyDown={(event) => {
                        if (event.key === 'Enter') onSubmit();
                        if (event.key === 'Escape') onCancel();
                    }}
                    placeholder={placeholder}
                    className="h-10 min-w-0 flex-1 rounded-lg border border-[#B8DDF7] px-2.5 text-[15px] outline-none focus:border-[#1980C0]"
                />
                <button
                    type="button"
                    onClick={onSubmit}
                    className="cursor-pointer rounded-lg bg-[#1980C0] px-4 py-2 text-[15px] font-semibold text-white"
                >
                    Tambah
                </button>
            </div>
        </div>
    );
}
