import { type PersonOption } from '@/components/design-system/pop-up/people-picker';
import { PersonSelect } from '@/components/design-system/pop-up/person-select';
import { Button } from '@/components/ui/button';
import { Plus, Trash2 } from 'lucide-react';
import { type ReactNode } from 'react';
import { type DraftDepartment, type DraftDivision } from './types';
import { shortName } from './utils';

interface OrganizationPositionPanelProps {
    departments: DraftDepartment[];
    selectedId: string;
    taken: Set<string>;
    onDepartmentHeadChange: (departmentId: string, personId: string) => void;
    onAddStaff: (departmentId: string) => void;
    onRemoveStaff: (departmentId: string, slotId: string) => void;
    onStaffChange: (departmentId: string, slotId: string, personId: string) => void;
    onDivisionHeadChange: (departmentId: string, divisionId: string, personId: string) => void;
    onAddDivisionStaff: (departmentId: string, divisionId: string) => void;
    onRemoveDivisionStaff: (departmentId: string, divisionId: string, slotId: string) => void;
    onDivisionStaffChange: (departmentId: string, divisionId: string, slotId: string, personId: string) => void;
}

type SelectedNode =
    | { kind: 'company' }
    | { kind: 'department'; department: DraftDepartment }
    | { kind: 'division'; department: DraftDepartment; division: DraftDivision };

function findDivision(divisions: DraftDivision[], divisionId: string): DraftDivision | null {
    for (const division of divisions) {
        if (division.id === divisionId) return division;
        const nested = findDivision(division.divisions, divisionId);
        if (nested) return nested;
    }
    return null;
}

function findSelectedNode(departments: DraftDepartment[], selectedId: string): SelectedNode {
    if (selectedId === 'company') return { kind: 'company' };

    for (const department of departments) {
        if (department.id === selectedId) return { kind: 'department', department };
        const division = findDivision(department.divisions, selectedId);
        if (division) return { kind: 'division', department, division };
    }

    return { kind: 'company' };
}

/**
 * Chrome for the floating position card. The positioning wrapper is
 * `pointer-events-none` so the chart underneath stays pannable around the
 * card — only the card itself captures clicks.
 */
function FloatingCard({ title, subtitle, onAddStaff, children }: { title: string; subtitle: string; onAddStaff?: () => void; children: ReactNode }) {
    return (
        <div className="pointer-events-none absolute inset-x-4 top-14 bottom-4 z-10 flex justify-end">
            <div className="pointer-events-auto flex max-h-full w-[340px] flex-col overflow-hidden rounded-xl border border-[#E2E8F0] bg-white shadow-lg">
                <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[#F1F5F9] px-4 py-3">
                    <div className="min-w-0">
                        <p className="font-poppins truncate text-[16px] font-semibold text-[#0F172A]">{title}</p>
                        <p className="mt-0.5 truncate text-[14px] text-[#64748B]">{subtitle}</p>
                    </div>
                    {onAddStaff && (
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onAddStaff}
                            className="h-auto shrink-0 gap-1 rounded-lg border-[#1980C0] bg-white px-3 py-1.5 text-[12px] font-medium text-[#1980C0] hover:bg-[#1980C0]/10 hover:text-[#1980C0]"
                        >
                            <Plus className="size-3.5" />
                            Staff
                        </Button>
                    )}
                </div>
                <div className="flex min-h-0 flex-col gap-3 overflow-y-auto px-4 py-4">{children}</div>
            </div>
        </div>
    );
}

function StaffSlotRow({
    value,
    placeholder,
    taken,
    onChange,
    onRemove,
}: {
    value: string | null;
    placeholder: string;
    taken: Set<string>;
    onChange: (person: PersonOption) => void;
    onRemove: () => void;
}) {
    return (
        <div className="flex w-full items-center gap-3">
            <div className="min-w-0 flex-1">
                <PersonSelect value={value} onChange={onChange} placeholder={placeholder} taken={taken} />
            </div>
            <button
                type="button"
                onClick={onRemove}
                aria-label="Hapus staff"
                className="shrink-0 rounded-md p-1.5 text-[#E84A39] transition-colors hover:bg-[#FEF2F2] focus-visible:ring-2 focus-visible:ring-[#E84A39] focus-visible:outline-none"
            >
                <Trash2 className="size-4" />
            </button>
        </div>
    );
}

export function OrganizationPositionPanel({
    departments,
    selectedId,
    taken,
    onDepartmentHeadChange,
    onAddStaff,
    onRemoveStaff,
    onStaffChange,
    onDivisionHeadChange,
    onAddDivisionStaff,
    onRemoveDivisionStaff,
    onDivisionStaffChange,
}: OrganizationPositionPanelProps) {
    const selected = findSelectedNode(departments, selectedId);

    if (selected.kind === 'company') return null;

    if (selected.kind === 'department') {
        const { department } = selected;
        const hasStaffSlots = !department.hasDivisions;

        return (
            <FloatingCard
                title={shortName(department.name)}
                subtitle="Kepala Bagian & Staff"
                onAddStaff={hasStaffSlots ? () => onAddStaff(department.id) : undefined}
            >
                <PersonSelect
                    value={department.headPersonId}
                    onChange={(person) => onDepartmentHeadChange(department.id, person.id)}
                    placeholder="Pilih Kepala Bagian"
                    taken={taken}
                />
                {hasStaffSlots ? (
                    department.staff.length > 0 ? (
                        department.staff.map((slot) => (
                            <StaffSlotRow
                                key={slot.id}
                                value={slot.personId}
                                placeholder="Pilih Staff"
                                taken={taken}
                                onChange={(person) => onStaffChange(department.id, slot.id, person.id)}
                                onRemove={() => onRemoveStaff(department.id, slot.id)}
                            />
                        ))
                    ) : (
                        <p className="text-[14px] text-[#94A3B8]">Belum ada staff. Klik tombol Staff untuk menambahkan.</p>
                    )
                ) : (
                    <p className="text-[14px] text-[#94A3B8]">
                        Bagian ini punya divisi — pilih divisi di sebelah kiri untuk mengatur kepala dan staffnya.
                    </p>
                )}
            </FloatingCard>
        );
    }

    const { department, division } = selected;

    return (
        <FloatingCard
            title={division.name}
            subtitle={`Divisi dari ${shortName(department.name)}`}
            onAddStaff={() => onAddDivisionStaff(department.id, division.id)}
        >
            <PersonSelect
                value={division.headPersonId}
                onChange={(person) => onDivisionHeadChange(department.id, division.id, person.id)}
                placeholder="Pilih Kepala Divisi (Opsional)"
                taken={taken}
            />
            {division.staff.length > 0 ? (
                division.staff.map((slot) => (
                    <StaffSlotRow
                        key={slot.id}
                        value={slot.personId}
                        placeholder="Pilih Staff"
                        taken={taken}
                        onChange={(person) => onDivisionStaffChange(department.id, division.id, slot.id, person.id)}
                        onRemove={() => onRemoveDivisionStaff(department.id, division.id, slot.id)}
                    />
                ))
            ) : (
                <p className="text-[14px] text-[#94A3B8]">Belum ada staff. Klik tombol Staff untuk menambahkan.</p>
            )}
        </FloatingCard>
    );
}
