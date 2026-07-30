import { Folder, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

import iconStruktur from '@/assets/icons/icon_struktur.png';
import logoPt from '@/assets/icons/logo_pt.png';
import { type OrgDepartment, type OrgMember, type OrgTree } from '@/components/design-system/org-chart/org-chart';
import {
    AddDepartmentDialog,
    DEPARTMENT_CATALOG,
    DIVISION_CATALOG,
    type NewDepartmentDraft,
} from '@/components/design-system/pop-up/add-department-dialog';
import { type PersonOption } from '@/components/design-system/pop-up/people-picker';
import { avatarFor, PersonSelect, STAFF_POOL } from '@/components/design-system/pop-up/person-select';
import { ORG_STRUCTURE_STEPS, Stepper } from '@/components/design-system/stepper/stepper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { filterAvailable } from '@/lib/utils';

const COMPANY_NAME = 'PT. Abadi Jaya';
const COMPANY_CEO_NAME = 'Nicholas Raharja';

function newId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function shortName(name: string) {
    return name.replace(/^Dept\.\s*/, '');
}

interface StaffSlot {
    id: string;
    personId: string | null;
}

interface DraftDivision {
    id: string;
    name: string;
    headPersonId: string | null;
    staff: StaffSlot[];
}

interface DraftDepartment {
    id: string;
    name: string;
    hasDivisions: boolean;
    headPersonId: string | null;
    staff: StaffSlot[];
    divisions: DraftDivision[];
}

function emptyStaffSlots() {
    return [
        { id: newId('slot'), personId: null },
        { id: newId('slot'), personId: null },
    ];
}

function draftsToDepartments(drafts: NewDepartmentDraft[]): DraftDepartment[] {
    return drafts.map((draft) => ({
        id: newId('dept'),
        name: `Dept. ${draft.name}`,
        hasDivisions: draft.hasDivisions,
        headPersonId: null,
        staff: draft.hasDivisions ? [] : emptyStaffSlots(),
        divisions: draft.hasDivisions
            ? draft.divisionNames.map((name) => ({ id: newId('div'), name, headPersonId: null, staff: emptyStaffSlots() }))
            : [],
    }));
}

function pickedPersonIds(departments: DraftDepartment[]): Set<string> {
    const ids = new Set<string>();
    departments.forEach((department) => {
        if (department.headPersonId) ids.add(department.headPersonId);
        department.staff.forEach((slot) => slot.personId && ids.add(slot.personId));
        department.divisions.forEach((division) => {
            if (division.headPersonId) ids.add(division.headPersonId);
            division.staff.forEach((slot) => slot.personId && ids.add(slot.personId));
        });
    });
    return ids;
}

function findPerson(id: string | null) {
    return id ? (STAFF_POOL.find((person) => person.id === id) ?? null) : null;
}

function personIdByName(name: string): string | null {
    return STAFF_POOL.find((person) => person.name === name)?.id ?? null;
}

function slotsFromMembers(members: OrgMember[]): StaffSlot[] {
    const slots = members.map((member) => ({ id: newId('slot'), personId: personIdByName(member.name) }));
    return slots.length > 0 ? slots : emptyStaffSlots();
}

function draftDepartmentsFromTree(departments: OrgDepartment[]): DraftDepartment[] {
    return departments.map((department) => {
        if (department.divisions) {
            return {
                id: newId('dept'),
                name: department.name,
                hasDivisions: true,
                headPersonId: department.head ? personIdByName(department.head.name) : null,
                staff: [],
                divisions: department.divisions.map((division) => {
                    const headIndex = division.members.findIndex((member) => member.role.startsWith('Kepala Divisi'));
                    const head = headIndex >= 0 ? division.members[headIndex] : null;
                    const staffMembers = division.members.filter((_, index) => index !== headIndex);
                    return {
                        id: newId('div'),
                        name: division.name,
                        headPersonId: head ? personIdByName(head.name) : null,
                        staff: slotsFromMembers(staffMembers),
                    };
                }),
            };
        }

        const members = department.members ?? [];
        const headIndex = members.findIndex((member) => member.role.startsWith('Kepala Departemen'));
        const head = headIndex >= 0 ? members[headIndex] : null;
        const staffMembers = members.filter((_, index) => index !== headIndex);
        return {
            id: newId('dept'),
            name: department.name,
            hasDivisions: false,
            headPersonId: head ? personIdByName(head.name) : null,
            staff: slotsFromMembers(staffMembers),
            divisions: [],
        };
    });
}

function memberFromPerson(person: PersonOption, role: string): OrgMember {
    return { name: person.name, role, avatarUrl: avatarFor(person.name) };
}

function toOrgTree(departments: DraftDepartment[]): OrgTree {
    return {
        ceo: { name: COMPANY_CEO_NAME, role: 'Direktur Utama', avatarUrl: avatarFor(COMPANY_CEO_NAME) },
        departments: departments.map((department) => {
            const short = shortName(department.name);
            const head = findPerson(department.headPersonId);

            if (department.hasDivisions) {
                return {
                    name: department.name,
                    head: head ? memberFromPerson(head, `Kepala Departemen ${short}`) : undefined,
                    divisions: department.divisions.map((division) => {
                        const divisionHead = findPerson(division.headPersonId);
                        const members: OrgMember[] = [];
                        if (divisionHead) members.push(memberFromPerson(divisionHead, `Kepala Divisi ${division.name}`));
                        division.staff.forEach((slot) => {
                            const person = findPerson(slot.personId);
                            if (person) members.push(memberFromPerson(person, `Staff ${division.name}`));
                        });
                        return { name: division.name, members };
                    }),
                };
            }

            const members: OrgMember[] = [];
            if (head) members.push(memberFromPerson(head, `Kepala Departemen ${short}`));
            department.staff.forEach((slot) => {
                const person = findPerson(slot.personId);
                if (person) members.push(memberFromPerson(person, `Staff ${short}`));
            });
            return { name: department.name, members };
        }),
    };
}

function CompanyCard() {
    return (
        <div className="flex w-full items-center gap-2.5 rounded-xl border border-[#1980C0] px-3 py-2.5">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF8FF]">
                <img src={logoPt} alt="" className="size-4" />
            </div>
            <div className="flex flex-col items-start">
                <p className="font-poppins text-sm font-semibold text-black">{COMPANY_NAME}</p>
                <p className="text-xs text-[#64748B]">Direktur {COMPANY_CEO_NAME}</p>
            </div>
        </div>
    );
}

interface CreateStructureDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSave: (tree: OrgTree) => void;
    existingTree?: OrgTree | null;
}

export function CreateStructureDialog({ open, onOpenChange, onSave, existingTree }: CreateStructureDialogProps) {
    const [step, setStep] = useState(1);
    const [departments, setDepartments] = useState<DraftDepartment[]>([]);
    const [addDeptOpen, setAddDeptOpen] = useState(false);
    const [isReconfiguring, setIsReconfiguring] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const seededRef = useRef(false);

    useEffect(() => {
        if (!open) {
            seededRef.current = false;
            return;
        }
        if (seededRef.current) return;
        seededRef.current = true;
        if (existingTree && existingTree.departments.length > 0) {
            setDepartments(draftDepartmentsFromTree(existingTree.departments));
            setIsReconfiguring(true);
        } else {
            setDepartments([]);
            setIsReconfiguring(false);
        }
    }, [open, existingTree]);

    useEffect(() => {
        if (open) scrollRef.current?.scrollTo({ top: 0 });
    }, [open, step]);

    function resetAndClose() {
        setStep(1);
        setDepartments([]);
        setAddDeptOpen(false);
        setIsReconfiguring(false);
        onOpenChange(false);
    }

    function handleAddDepartments(drafts: NewDepartmentDraft[]) {
        setDepartments((current) => [...current, ...draftsToDepartments(drafts)]);
    }

    function removeDepartment(id: string) {
        setDepartments((current) => current.filter((department) => department.id !== id));
    }

    function renameDepartment(id: string, name: string) {
        setDepartments((current) => current.map((department) => (department.id === id ? { ...department, name: `Dept. ${name}` } : department)));
    }

    function removeDivisionFromDepartment(departmentId: string, divisionId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? { ...department, divisions: department.divisions.filter((division) => division.id !== divisionId) }
                    : department,
            ),
        );
    }

    function renameDivision(departmentId: string, divisionId: string, name: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          divisions: department.divisions.map((division) => (division.id === divisionId ? { ...division, name } : division)),
                      }
                    : department,
            ),
        );
    }

    function setDepartmentHead(id: string, personId: string) {
        setDepartments((current) => current.map((department) => (department.id === id ? { ...department, headPersonId: personId } : department)));
    }

    function addStaffSlot(departmentId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId ? { ...department, staff: [...department.staff, { id: newId('slot'), personId: null }] } : department,
            ),
        );
    }

    function removeStaffSlot(departmentId: string, slotId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId ? { ...department, staff: department.staff.filter((slot) => slot.id !== slotId) } : department,
            ),
        );
    }

    function setStaffPerson(departmentId: string, slotId: string, personId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? { ...department, staff: department.staff.map((slot) => (slot.id === slotId ? { ...slot, personId } : slot)) }
                    : department,
            ),
        );
    }

    function setDivisionHead(departmentId: string, divisionId: string, personId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          divisions: department.divisions.map((division) =>
                              division.id === divisionId ? { ...division, headPersonId: personId } : division,
                          ),
                      }
                    : department,
            ),
        );
    }

    function addDivisionStaffSlot(departmentId: string, divisionId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          divisions: department.divisions.map((division) =>
                              division.id === divisionId
                                  ? { ...division, staff: [...division.staff, { id: newId('slot'), personId: null }] }
                                  : division,
                          ),
                      }
                    : department,
            ),
        );
    }

    function removeDivisionStaffSlot(departmentId: string, divisionId: string, slotId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          divisions: department.divisions.map((division) =>
                              division.id === divisionId ? { ...division, staff: division.staff.filter((slot) => slot.id !== slotId) } : division,
                          ),
                      }
                    : department,
            ),
        );
    }

    function setDivisionStaffPerson(departmentId: string, divisionId: string, slotId: string, personId: string) {
        setDepartments((current) =>
            current.map((department) =>
                department.id === departmentId
                    ? {
                          ...department,
                          divisions: department.divisions.map((division) =>
                              division.id === divisionId
                                  ? { ...division, staff: division.staff.map((slot) => (slot.id === slotId ? { ...slot, personId } : slot)) }
                                  : division,
                          ),
                      }
                    : department,
            ),
        );
    }

    function handleSave() {
        onSave(toOrgTree(departments));
        resetAndClose();
    }

    const canProceedStep1 = departments.length > 0;
    const taken = pickedPersonIds(departments);

    return (
        <>
            <Dialog open={open} onOpenChange={(next) => !next && resetAndClose()}>
                <DialogContent className="flex max-h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                    <div className="flex w-full items-center justify-between border-b border-[#E2E8F0] px-8 py-4">
                        <p className="font-poppins text-xl font-bold text-[#0F172A]">
                            {isReconfiguring ? 'Atur Ulang Struktur Organisasi Perusahaan' : 'Struktur Organisasi Perusahaan'}
                        </p>
                        <Stepper steps={ORG_STRUCTURE_STEPS} currentStep={step} />
                    </div>

                    <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-4">
                        {step !== 1 && (
                            <div className="mb-4">
                                <CompanyCard />
                            </div>
                        )}

                        {step === 1 && (
                            <div className="flex w-full gap-6">
                                <div className="flex w-full flex-col gap-6">
                                    <CompanyCard />

                                    <div className="flex w-full flex-col gap-2">
                                        <p className="font-poppins text-sm font-semibold text-black">
                                            Departemen <span className="text-[#E84A39]">*</span>
                                        </p>
                                        <p className="text-sm text-[#64748B]">Tambahkan seluruh departemen yang ada di perusahaan.</p>

                                        {departments.length === 0 ? (
                                            <div className="mt-2 flex w-full flex-col items-center gap-2 rounded-xl border border-dashed border-[#E2E8F0] px-6 py-5 text-center">
                                                <div className="flex size-11 items-center justify-center rounded-full bg-[#EEF8FF]">
                                                    <Folder className="size-6 text-[#1980C0]" />
                                                </div>
                                                <p className="font-poppins text-sm font-semibold text-black">Belum ada departemen</p>
                                                <p className="max-w-xs text-sm text-[#64748B]">
                                                    Tambahkan departemen terlebih dahulu. Nanti Anda bisa menambahkan divisi di dalam departemen.
                                                </p>
                                                <Button
                                                    variant="outline"
                                                    className="h-auto gap-2 rounded-lg border-[#1980C0] px-4 py-2 text-sm text-[#1980C0] hover:bg-[#1980C0]/10 hover:text-[#1980C0]"
                                                    onClick={() => setAddDeptOpen(true)}
                                                >
                                                    <Plus className="size-4" />
                                                    Tambah Departemen
                                                </Button>
                                            </div>
                                        ) : (
                                            <div className="mt-2 flex w-full flex-col gap-3">
                                                {departments.map((department) => {
                                                    const departmentTaken = new Set(
                                                        departments
                                                            .filter((sibling) => sibling.id !== department.id)
                                                            .map((sibling) => shortName(sibling.name)),
                                                    );
                                                    const departmentOptions = filterAvailable(
                                                        DEPARTMENT_CATALOG,
                                                        shortName(department.name),
                                                        departmentTaken,
                                                    );
                                                    return (
                                                        <div
                                                            key={department.id}
                                                            className="flex w-full flex-col gap-3 rounded-xl border border-[#E2E8F0] p-4"
                                                        >
                                                            <div className="flex w-full items-center gap-2">
                                                                <Select
                                                                    value={shortName(department.name) || undefined}
                                                                    onValueChange={(value) => renameDepartment(department.id, value)}
                                                                >
                                                                    <SelectTrigger className="font-poppins h-auto flex-1 gap-1 border-0 bg-transparent p-0 text-sm font-semibold text-black shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:size-4 [&>svg]:text-[#94A3B8] [&>svg]:opacity-100">
                                                                        <SelectValue placeholder="Pilih Departemen" />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {departmentOptions.map((name) => (
                                                                            <SelectItem key={name} value={name}>
                                                                                {name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => removeDepartment(department.id)}
                                                                    aria-label={`Hapus ${department.name}`}
                                                                >
                                                                    <Trash2 className="size-4 text-[#E84A39]" />
                                                                </button>
                                                            </div>

                                                            {department.divisions.length > 0 && (
                                                                <div className="flex w-full flex-col gap-2">
                                                                    {department.divisions.map((division) => {
                                                                        const divisionTaken = new Set(
                                                                            department.divisions.map((sibling) => sibling.name).filter(Boolean),
                                                                        );
                                                                        const divisionOptions = filterAvailable(
                                                                            DIVISION_CATALOG,
                                                                            division.name,
                                                                            divisionTaken,
                                                                        );
                                                                        return (
                                                                            <div
                                                                                key={division.id}
                                                                                className="flex h-11 w-full items-center gap-2 rounded-xl border border-[#E2E8F0] px-4"
                                                                            >
                                                                                <Select
                                                                                    value={division.name || undefined}
                                                                                    onValueChange={(value) =>
                                                                                        renameDivision(department.id, division.id, value)
                                                                                    }
                                                                                >
                                                                                    <SelectTrigger className="h-11 flex-1 rounded-none border-0 bg-transparent p-0 shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:text-[#94A3B8] [&>svg]:opacity-100">
                                                                                        <SelectValue placeholder="Pilih Divisi" />
                                                                                    </SelectTrigger>
                                                                                    <SelectContent>
                                                                                        {divisionOptions.map((name) => (
                                                                                            <SelectItem key={name} value={name}>
                                                                                                {name}
                                                                                            </SelectItem>
                                                                                        ))}
                                                                                    </SelectContent>
                                                                                </Select>
                                                                                <button
                                                                                    type="button"
                                                                                    onClick={() =>
                                                                                        removeDivisionFromDepartment(department.id, division.id)
                                                                                    }
                                                                                    aria-label={`Hapus ${division.name}`}
                                                                                >
                                                                                    <Trash2 className="size-4 text-[#E84A39]" />
                                                                                </button>
                                                                            </div>
                                                                        );
                                                                    })}
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}

                                                <button
                                                    type="button"
                                                    onClick={() => setAddDeptOpen(true)}
                                                    className="flex w-full items-center justify-center gap-1 rounded-xl border border-dashed border-[#1980C0] py-3 text-sm font-semibold text-[#1980C0]"
                                                >
                                                    <Plus className="size-4" />
                                                    Tambah Departemen Lainnya
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="w-full max-w-xs shrink-0 rounded-xl border border-[#E2E8F0] p-4">
                                    <p className="font-poppins mb-4 text-sm font-semibold text-black">Preview Struktur</p>
                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center gap-2">
                                            <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF8FF]">
                                                <img src={logoPt} alt="" className="size-4" />
                                            </div>
                                            <div className="flex flex-col items-start">
                                                <p className="font-poppins text-sm font-semibold text-black">{COMPANY_NAME}</p>
                                                <p className="text-xs text-[#64748B]">CEO / Direktur Utama</p>
                                            </div>
                                        </div>

                                        {departments.length === 0 ? (
                                            <div className="flex flex-col items-center gap-3 py-6 text-center">
                                                <img src={iconStruktur} alt="" className="h-24 w-auto" />
                                                <p className="font-poppins text-sm font-semibold text-black">Belum ada struktur</p>
                                                <p className="text-xs text-[#64748B]">Tambahkan departemen untuk melihat preview struktur.</p>
                                            </div>
                                        ) : (
                                            departments.map((department) => (
                                                <div key={department.id} className="flex flex-col gap-1">
                                                    <p className="pl-2 text-sm font-medium text-[#0F172A]">{department.name}</p>
                                                    {department.divisions.map((division) => (
                                                        <p key={division.id} className="pl-4 text-sm text-[#64748B]">
                                                            {division.name}
                                                        </p>
                                                    ))}
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="flex w-full flex-col gap-2">
                                <p className="font-poppins text-lg font-semibold text-black">Daftar Departemen &amp; Divisi</p>
                                <p className="text-sm text-[#64748B]">Atur delegasi staff dan penanggung jawab di masing-masing sub-bidang.</p>

                                <div className="mt-2 flex w-full flex-col gap-5">
                                    {departments.map((department) => (
                                        <div
                                            key={department.id}
                                            className="flex max-h-[360px] w-full flex-col gap-3 rounded-xl border border-[#E2E8F0] p-5"
                                        >
                                            <div className="flex w-full shrink-0 items-center justify-between">
                                                <p className="font-poppins text-base font-semibold text-black">{department.name}</p>
                                                {!department.hasDivisions && (
                                                    <Button
                                                        variant="outline"
                                                        className="h-auto gap-1 rounded-lg border-[#1980C0] px-3 py-1.5 text-xs text-[#1980C0] hover:bg-[#1980C0]/10 hover:text-[#1980C0]"
                                                        onClick={() => addStaffSlot(department.id)}
                                                    >
                                                        <Plus className="size-3.5" />
                                                        Staff
                                                    </Button>
                                                )}
                                            </div>

                                            <div className="flex w-full flex-1 flex-col gap-4 overflow-y-auto pr-1">
                                                <PersonSelect
                                                    value={department.headPersonId}
                                                    onChange={(person) => setDepartmentHead(department.id, person.id)}
                                                    placeholder="Pilih Kepala Departemen"
                                                    taken={taken}
                                                />

                                                {!department.hasDivisions &&
                                                    department.staff.map((slot) => (
                                                        <div key={slot.id} className="flex w-full items-center gap-3">
                                                            <div className="flex-1">
                                                                <PersonSelect
                                                                    value={slot.personId}
                                                                    onChange={(person) => setStaffPerson(department.id, slot.id, person.id)}
                                                                    placeholder="Pilih Staff"
                                                                    taken={taken}
                                                                />
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeStaffSlot(department.id, slot.id)}
                                                                aria-label="Hapus staff"
                                                            >
                                                                <Trash2 className="size-4 text-[#E84A39]" />
                                                            </button>
                                                        </div>
                                                    ))}

                                                {department.hasDivisions &&
                                                    department.divisions.map((division) => (
                                                        <div
                                                            key={division.id}
                                                            className="flex w-full flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
                                                        >
                                                            <div className="flex w-full items-center justify-between">
                                                                <p className="font-poppins text-sm font-semibold text-black">{division.name}</p>
                                                                <Button
                                                                    variant="outline"
                                                                    className="h-auto gap-1 rounded-lg border-[#1980C0] bg-white px-3 py-1.5 text-xs text-[#1980C0] hover:bg-[#1980C0]/10 hover:text-[#1980C0]"
                                                                    onClick={() => addDivisionStaffSlot(department.id, division.id)}
                                                                >
                                                                    <Plus className="size-3.5" />
                                                                    Staff
                                                                </Button>
                                                            </div>

                                                            <PersonSelect
                                                                value={division.headPersonId}
                                                                onChange={(person) => setDivisionHead(department.id, division.id, person.id)}
                                                                placeholder="Pilih Kepala Divisi (Opsional)"
                                                                taken={taken}
                                                            />

                                                            {division.staff.map((slot) => (
                                                                <div key={slot.id} className="flex w-full items-center gap-3">
                                                                    <div className="flex-1">
                                                                        <PersonSelect
                                                                            value={slot.personId}
                                                                            onChange={(person) =>
                                                                                setDivisionStaffPerson(department.id, division.id, slot.id, person.id)
                                                                            }
                                                                            placeholder="Pilih Staff"
                                                                            taken={taken}
                                                                        />
                                                                    </div>
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => removeDivisionStaffSlot(department.id, division.id, slot.id)}
                                                                        aria-label="Hapus staff"
                                                                    >
                                                                        <Trash2 className="size-4 text-[#E84A39]" />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="flex w-full flex-col gap-4">
                                <p className="font-poppins text-lg font-semibold text-black">Preview</p>
                                <p className="text-sm text-[#64748B]">Tinjau kembali sebelum menyimpan struktur organisasi.</p>

                                {departments.map((department) => {
                                    const allStaffCount =
                                        (department.headPersonId ? 1 : 0) +
                                        department.staff.filter((slot) => slot.personId).length +
                                        department.divisions.reduce(
                                            (sum, division) =>
                                                sum + (division.headPersonId ? 1 : 0) + division.staff.filter((slot) => slot.personId).length,
                                            0,
                                        );

                                    return (
                                        <div key={department.id} className="flex w-full flex-col gap-3 rounded-xl border border-[#E2E8F0] p-5">
                                            <div className="flex w-full items-center justify-between border-b border-[#E2E8F0] pb-3">
                                                <p className="font-poppins text-base font-semibold text-black">{department.name}</p>
                                                <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-xs text-[#64748B]">
                                                    {allStaffCount} Staff
                                                </span>
                                            </div>

                                            {findPerson(department.headPersonId) && (
                                                <div className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] p-3">
                                                    <Avatar className="size-9">
                                                        <AvatarImage src={avatarFor(findPerson(department.headPersonId)!.name)} />
                                                        <AvatarFallback className="text-xs">
                                                            {findPerson(department.headPersonId)!.name.slice(0, 2).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex flex-col items-start">
                                                        <p className="font-poppins text-sm font-semibold text-black">
                                                            {findPerson(department.headPersonId)!.name}
                                                        </p>
                                                        <p className="text-xs text-[#64748B]">Kepala Departemen {shortName(department.name)}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {!department.hasDivisions &&
                                                department.staff
                                                    .filter((slot) => slot.personId)
                                                    .map((slot) => {
                                                        const person = findPerson(slot.personId)!;
                                                        return (
                                                            <div
                                                                key={slot.id}
                                                                className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] p-3"
                                                            >
                                                                <Avatar className="size-8">
                                                                    <AvatarImage src={avatarFor(person.name)} />
                                                                    <AvatarFallback className="text-xs">
                                                                        {person.name.slice(0, 2).toUpperCase()}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div className="flex flex-col items-start">
                                                                    <p className="text-sm font-medium text-black">{person.name}</p>
                                                                    <p className="text-xs text-[#64748B]">Staff {shortName(department.name)}</p>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}

                                            {department.divisions.length > 0 && (
                                                <div className="grid w-full grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                                                    {department.divisions.map((division) => (
                                                        <div key={division.id} className="flex w-full flex-col gap-3">
                                                            <p className="border-b border-[#E2E8F0] pb-2 text-xs text-[#64748B]">{division.name}</p>
                                                            {!findPerson(division.headPersonId) && division.staff.every((slot) => !slot.personId) && (
                                                                <p className="text-sm text-[#94A3B8]">Belum ada staff.</p>
                                                            )}
                                                            {findPerson(division.headPersonId) && (
                                                                <div className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] p-3">
                                                                    <Avatar className="size-8">
                                                                        <AvatarImage src={avatarFor(findPerson(division.headPersonId)!.name)} />
                                                                        <AvatarFallback className="text-xs">
                                                                            {findPerson(division.headPersonId)!.name.slice(0, 2).toUpperCase()}
                                                                        </AvatarFallback>
                                                                    </Avatar>
                                                                    <div className="flex flex-col items-start">
                                                                        <p className="text-sm font-medium text-black">
                                                                            {findPerson(division.headPersonId)!.name}
                                                                        </p>
                                                                        <p className="text-xs text-[#64748B]">Kepala Divisi {division.name}</p>
                                                                    </div>
                                                                </div>
                                                            )}
                                                            {division.staff
                                                                .filter((slot) => slot.personId)
                                                                .map((slot) => {
                                                                    const person = findPerson(slot.personId)!;
                                                                    return (
                                                                        <div
                                                                            key={slot.id}
                                                                            className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] p-3"
                                                                        >
                                                                            <Avatar className="size-8">
                                                                                <AvatarImage src={avatarFor(person.name)} />
                                                                                <AvatarFallback className="text-xs">
                                                                                    {person.name.slice(0, 2).toUpperCase()}
                                                                                </AvatarFallback>
                                                                            </Avatar>
                                                                            <div className="flex flex-col items-start">
                                                                                <p className="text-sm font-medium text-black">{person.name}</p>
                                                                                <p className="text-xs text-[#64748B]">Staff {division.name}</p>
                                                                            </div>
                                                                        </div>
                                                                    );
                                                                })}
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <div className="flex w-full items-center justify-between border-t border-[#E2E8F0] px-8 py-5">
                        <div className="flex items-center gap-3">
                            <Button variant="outline" className="h-auto rounded-lg px-6 py-2.5" onClick={resetAndClose}>
                                Batal
                            </Button>
                            {step > 1 && (
                                <button
                                    type="button"
                                    className="text-sm font-semibold text-[#1980C0]"
                                    onClick={() => setStep((current) => current - 1)}
                                >
                                    Kembali
                                </button>
                            )}
                        </div>
                        {step < 3 ? (
                            <Button
                                className="h-auto rounded-lg px-6 py-2.5"
                                onClick={() => setStep((current) => current + 1)}
                                disabled={step === 1 && !canProceedStep1}
                            >
                                Selanjutnya
                            </Button>
                        ) : (
                            <Button className="h-auto rounded-lg px-6 py-2.5" onClick={handleSave}>
                                Simpan
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>

            <AddDepartmentDialog
                open={addDeptOpen}
                onOpenChange={setAddDeptOpen}
                existingDepartmentNames={departments.map((department) => shortName(department.name))}
                onAdd={handleAddDepartments}
            />
        </>
    );
}
