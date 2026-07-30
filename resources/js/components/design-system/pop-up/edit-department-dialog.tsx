import { Building2, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

import { type OrgDepartment, type OrgMember } from '@/components/design-system/org-chart/org-chart';
import { DEPARTMENT_CATALOG, DIVISION_CATALOG } from '@/components/design-system/pop-up/add-department-dialog';
import { type PersonOption } from '@/components/design-system/pop-up/people-picker';
import { avatarFor, PersonSelect } from '@/components/design-system/pop-up/person-select';
import { ORG_STRUCTURE_STEPS, Stepper } from '@/components/design-system/stepper/stepper';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { filterAvailable } from '@/lib/utils';

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

interface EditableMember extends OrgMember {
    id: string;
}

interface EditableDivision {
    id: string;
    name: string;
    members: EditableMember[];
}

interface EditableDepartment {
    name: string;
    head?: OrgMember;
    members: EditableMember[];
    divisions: EditableDivision[];
}

function toEditable(department: OrgDepartment): EditableDepartment {
    return {
        name: department.name,
        head: department.head,
        members: (department.members ?? []).map((member, index) => ({ ...member, id: `member-${index}` })),
        divisions: (department.divisions ?? []).map((division, dIndex) => ({
            id: `division-${dIndex}`,
            name: division.name,
            members: division.members.map((member, mIndex) => ({ ...member, id: `division-${dIndex}-member-${mIndex}` })),
        })),
    };
}

function stripId(member: EditableMember): OrgMember {
    return { name: member.name, role: member.role, avatarUrl: member.avatarUrl };
}

function toOrgDepartment(editable: EditableDepartment): OrgDepartment {
    return {
        name: editable.name,
        head: editable.head,
        members: editable.members.length > 0 ? editable.members.map(stripId) : undefined,
        divisions:
            editable.divisions.length > 0
                ? editable.divisions.map((division) => ({ name: division.name, members: division.members.map(stripId) }))
                : undefined,
    };
}

function newId(prefix: string) {
    return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

export function shortName(name: string) {
    return name.replace(/^Dept\.\s*/, '');
}

function collectTakenNames(editable: EditableDepartment): Set<string> {
    const names = new Set<string>();
    if (editable.head?.name) names.add(editable.head.name);
    editable.members.forEach((member) => member.name && names.add(member.name));
    editable.divisions.forEach((division) => division.members.forEach((member) => member.name && names.add(member.name)));
    return names;
}

interface EditDepartmentDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    department: OrgDepartment | null;
    siblingDepartmentNames: string[];
    onSave: (updated: OrgDepartment) => void;
}

export function EditDepartmentDialog({ open, onOpenChange, department, siblingDepartmentNames, onSave }: EditDepartmentDialogProps) {
    const [step, setStep] = useState(1);
    const [editable, setEditable] = useState<EditableDepartment | null>(null);
    const scrollRef = useRef<HTMLDivElement>(null);

    // Re-seed the editable copy whenever a fresh department is opened for editing.
    if (open && department && editable === null) {
        setEditable(toEditable(department));
    }

    useEffect(() => {
        if (open) scrollRef.current?.scrollTo({ top: 0 });
    }, [open, step]);

    function resetAndClose() {
        setStep(1);
        setEditable(null);
        onOpenChange(false);
    }

    if (!editable) {
        return (
            <Dialog open={open} onOpenChange={(next) => !next && resetAndClose()}>
                <DialogContent className="max-w-5xl" />
            </Dialog>
        );
    }

    function removeDivision(divisionId: string) {
        setEditable((current) => (current ? { ...current, divisions: current.divisions.filter((division) => division.id !== divisionId) } : current));
    }

    function renameDivision(divisionId: string, name: string) {
        setEditable((current) =>
            current
                ? { ...current, divisions: current.divisions.map((division) => (division.id === divisionId ? { ...division, name } : division)) }
                : current,
        );
    }

    function addDivision() {
        setEditable((current) =>
            current ? { ...current, divisions: [...current.divisions, { id: newId('division'), name: 'Divisi Baru', members: [] }] } : current,
        );
    }

    function removeDivisionMember(divisionId: string, memberId: string) {
        setEditable((current) =>
            current
                ? {
                      ...current,
                      divisions: current.divisions.map((division) =>
                          division.id === divisionId
                              ? { ...division, members: division.members.filter((member) => member.id !== memberId) }
                              : division,
                      ),
                  }
                : current,
        );
    }

    function setDepartmentHead(person: PersonOption) {
        setEditable((current) => {
            if (!current) return current;
            const member: EditableMember = {
                id: current.divisions.length === 0 ? (current.members[0]?.id ?? newId('member')) : newId('member'),
                name: person.name,
                role: `Kepala Departemen ${shortName(current.name)}`,
                avatarUrl: avatarFor(person.name),
            };
            if (current.divisions.length > 0) {
                return { ...current, head: member };
            }
            return { ...current, members: [member, ...current.members.slice(1)] };
        });
    }

    function addStaffMember() {
        setEditable((current) =>
            current ? { ...current, members: [...current.members, { id: newId('member'), name: '', role: '', avatarUrl: undefined }] } : current,
        );
    }

    function setStaffMember(memberId: string, person: PersonOption) {
        setEditable((current) =>
            current
                ? {
                      ...current,
                      members: current.members.map((member) =>
                          member.id === memberId
                              ? { ...member, name: person.name, role: `Staff ${shortName(current.name)}`, avatarUrl: avatarFor(person.name) }
                              : member,
                      ),
                  }
                : current,
        );
    }

    function removeStaffMember(memberId: string) {
        setEditable((current) => (current ? { ...current, members: current.members.filter((member) => member.id !== memberId) } : current));
    }

    function setDivisionHead(divisionId: string, person: PersonOption) {
        setEditable((current) =>
            current
                ? {
                      ...current,
                      divisions: current.divisions.map((division) => {
                          if (division.id !== divisionId) return division;
                          const member: EditableMember = {
                              id: division.members[0]?.id ?? newId('member'),
                              name: person.name,
                              role: `Kepala Divisi ${division.name}`,
                              avatarUrl: avatarFor(person.name),
                          };
                          return { ...division, members: [member, ...division.members.slice(1)] };
                      }),
                  }
                : current,
        );
    }

    function addDivisionStaffMember(divisionId: string) {
        setEditable((current) =>
            current
                ? {
                      ...current,
                      divisions: current.divisions.map((division) =>
                          division.id === divisionId
                              ? { ...division, members: [...division.members, { id: newId('member'), name: '', role: '', avatarUrl: undefined }] }
                              : division,
                      ),
                  }
                : current,
        );
    }

    function setDivisionStaffMember(divisionId: string, memberId: string, person: PersonOption) {
        setEditable((current) =>
            current
                ? {
                      ...current,
                      divisions: current.divisions.map((division) =>
                          division.id === divisionId
                              ? {
                                    ...division,
                                    members: division.members.map((member) =>
                                        member.id === memberId
                                            ? { ...member, name: person.name, role: `Staff ${division.name}`, avatarUrl: avatarFor(person.name) }
                                            : member,
                                    ),
                                }
                              : division,
                      ),
                  }
                : current,
        );
    }

    function handleSave() {
        if (!editable) return;
        onSave(toOrgDepartment(editable));
        resetAndClose();
    }

    const hasDivisions = editable.divisions.length > 0;
    const takenNames = collectTakenNames(editable);

    return (
        <Dialog open={open} onOpenChange={(next) => !next && resetAndClose()}>
            <DialogContent className="flex max-h-[85vh] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-0 p-0 shadow-[0_1px_6px_0_rgba(0,0,0,0.09),2px_10px_16px_-2px_rgba(0,0,0,0.10)]">
                <div className="flex w-full items-center justify-between border-b border-[#E2E8F0] px-8 py-6">
                    <p className="font-poppins text-2xl font-bold text-[#0F172A]">Edit Departemen</p>
                    <Stepper steps={ORG_STRUCTURE_STEPS} currentStep={step} />
                </div>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6">
                    <div className="mb-6 flex w-full items-center gap-3 rounded-xl border border-[#1980C0] p-4">
                        <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#EEF8FF]">
                            <Building2 className="size-5 text-[#1980C0]" />
                        </div>
                        <div className="flex flex-col items-start">
                            <p className="font-poppins text-base font-semibold text-black">PT. Abadi Jaya</p>
                            <p className="text-sm text-[#64748B]">Direktur Nicholas Raharja</p>
                        </div>
                    </div>

                    {step === 1 && (
                        <div className="flex w-full gap-6">
                            <div className="flex w-full flex-col gap-2">
                                <p className="font-poppins text-sm font-semibold text-black">
                                    Departemen <span className="text-[#E84A39]">*</span>
                                </p>
                                <p className="text-sm text-[#64748B]">Tambahkan seluruh departemen yang ada di perusahaan.</p>

                                <div className="mt-2 flex w-full flex-col gap-4 rounded-xl border border-[#E2E8F0] p-4">
                                    <div className="flex w-full items-center gap-2">
                                        {(() => {
                                            const departmentTaken = new Set(siblingDepartmentNames);
                                            const departmentOptions = filterAvailable(DEPARTMENT_CATALOG, shortName(editable.name), departmentTaken);
                                            return (
                                                <Select
                                                    value={shortName(editable.name) || undefined}
                                                    onValueChange={(value) =>
                                                        setEditable((current) => (current ? { ...current, name: `Dept. ${value}` } : current))
                                                    }
                                                >
                                                    <SelectTrigger className="font-poppins h-auto flex-1 gap-1 border-0 bg-transparent p-0 text-base font-semibold text-black shadow-none focus:ring-0 focus:ring-offset-0 [&>svg]:size-4 [&>svg]:text-[#94A3B8] [&>svg]:opacity-100">
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
                                            );
                                        })()}
                                        <button
                                            type="button"
                                            onClick={() => toast.info('Hapus departemen belum tersedia')}
                                            aria-label={`Hapus ${editable.name}`}
                                        >
                                            <Trash2 className="size-4 text-[#E84A39]" />
                                        </button>
                                    </div>

                                    <div className="flex w-full flex-col gap-3">
                                        {editable.divisions.map((division) => {
                                            const divisionTaken = new Set(editable.divisions.map((sibling) => sibling.name).filter(Boolean));
                                            const divisionOptions = filterAvailable(DIVISION_CATALOG, division.name, divisionTaken);
                                            return (
                                                <div
                                                    key={division.id}
                                                    className="flex h-11 w-full items-center gap-2 rounded-xl border border-[#E2E8F0] px-4"
                                                >
                                                    <Select
                                                        value={division.name || undefined}
                                                        onValueChange={(value) => renameDivision(division.id, value)}
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
                                                        onClick={() => removeDivision(division.id)}
                                                        aria-label={`Hapus ${division.name}`}
                                                    >
                                                        <Trash2 className="size-4 text-[#E84A39]" />
                                                    </button>
                                                </div>
                                            );
                                        })}

                                        <button
                                            type="button"
                                            onClick={addDivision}
                                            className="flex w-fit items-center gap-1 text-sm font-semibold text-[#1980C0]"
                                        >
                                            <Plus className="size-4" />
                                            Tambah Divisi
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="w-full max-w-xs shrink-0 rounded-xl border border-[#E2E8F0] p-4">
                                <p className="font-poppins mb-4 text-sm font-semibold text-black">Preview Struktur</p>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2">
                                        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#EEF8FF]">
                                            <Building2 className="size-4 text-[#1980C0]" />
                                        </div>
                                        <div className="flex flex-col items-start">
                                            <p className="font-poppins text-sm font-semibold text-black">PT. Abadi Jaya</p>
                                            <p className="text-xs text-[#64748B]">CEO / Direktur Utama</p>
                                        </div>
                                    </div>
                                    <p className="font-poppins text-sm font-semibold text-black">{editable.name}</p>
                                    {editable.divisions.map((division) => (
                                        <p key={division.id} className="pl-2 text-sm text-[#64748B]">
                                            {division.name}
                                        </p>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}

                    {step === 2 && (
                        <div className="flex w-full flex-col gap-2">
                            <p className="font-poppins text-lg font-semibold text-black">Daftar Departemen &amp; Divisi</p>
                            <p className="text-sm text-[#64748B]">Atur delegasi staff dan penanggung jawab di masing-masing sub-bidang.</p>

                            <div className="mt-2 flex w-full flex-col gap-4 rounded-xl border border-[#E2E8F0] p-5">
                                <div className="flex w-full items-center justify-between">
                                    <p className="font-poppins text-base font-semibold text-black">{editable.name}</p>
                                    {!hasDivisions && (
                                        <Button
                                            variant="outline"
                                            className="h-auto gap-1 rounded-lg border-[#1980C0] px-3 py-1.5 text-xs text-[#1980C0] hover:bg-[#1980C0]/10 hover:text-[#1980C0]"
                                            onClick={addStaffMember}
                                        >
                                            <Plus className="size-3.5" />
                                            Staff
                                        </Button>
                                    )}
                                </div>

                                <PersonSelect
                                    value={hasDivisions ? (editable.head?.name ?? '') : (editable.members[0]?.name ?? '')}
                                    onChange={setDepartmentHead}
                                    placeholder="Pilih Kepala Departemen"
                                    taken={takenNames}
                                    getKey={(person) => person.name}
                                    initials={initials}
                                />

                                {!hasDivisions &&
                                    editable.members.slice(1).map((member) => (
                                        <div key={member.id} className="flex w-full items-center gap-3">
                                            <div className="flex-1">
                                                <PersonSelect
                                                    value={member.name}
                                                    onChange={(person) => setStaffMember(member.id, person)}
                                                    placeholder="Pilih Staff"
                                                    taken={takenNames}
                                                    getKey={(person) => person.name}
                                                    initials={initials}
                                                />
                                            </div>
                                            <button type="button" onClick={() => removeStaffMember(member.id)} aria-label="Hapus staff">
                                                <Trash2 className="size-4 text-[#E84A39]" />
                                            </button>
                                        </div>
                                    ))}

                                {hasDivisions &&
                                    editable.divisions.map((division) => (
                                        <div
                                            key={division.id}
                                            className="flex w-full flex-col gap-3 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC] p-4"
                                        >
                                            <div className="flex w-full items-center justify-between">
                                                <p className="font-poppins text-sm font-semibold text-black">{division.name}</p>
                                                <Button
                                                    variant="outline"
                                                    className="h-auto gap-1 rounded-lg border-[#1980C0] bg-white px-3 py-1.5 text-xs text-[#1980C0] hover:bg-[#1980C0]/10 hover:text-[#1980C0]"
                                                    onClick={() => addDivisionStaffMember(division.id)}
                                                >
                                                    <Plus className="size-3.5" />
                                                    Staff
                                                </Button>
                                            </div>

                                            <PersonSelect
                                                value={division.members[0]?.name ?? ''}
                                                onChange={(person) => setDivisionHead(division.id, person)}
                                                placeholder="Pilih Kepala Divisi (Opsional)"
                                                taken={takenNames}
                                                getKey={(person) => person.name}
                                                initials={initials}
                                            />

                                            {division.members.slice(1).map((member) => (
                                                <div key={member.id} className="flex w-full items-center gap-3">
                                                    <div className="flex-1">
                                                        <PersonSelect
                                                            value={member.name}
                                                            onChange={(person) => setDivisionStaffMember(division.id, member.id, person)}
                                                            placeholder="Pilih Staff"
                                                            taken={takenNames}
                                                            getKey={(person) => person.name}
                                                            initials={initials}
                                                        />
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeDivisionMember(division.id, member.id)}
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
                    )}

                    {step === 3 && (
                        <div className="flex w-full flex-col gap-4">
                            <p className="font-poppins text-lg font-semibold text-black">Preview</p>
                            <p className="text-sm text-[#64748B]">Tinjau kembali sebelum menyimpan perubahan.</p>

                            <div className="flex w-full flex-col gap-3 rounded-xl border border-[#E2E8F0] p-5">
                                <div className="flex w-full items-center justify-between border-b border-[#E2E8F0] pb-3">
                                    <p className="font-poppins text-base font-semibold text-black">{editable.name}</p>
                                    <span className="rounded-full bg-[#F8FAFC] px-2.5 py-1 text-xs text-[#64748B]">
                                        {(editable.head ? 1 : 0) +
                                            editable.members.length +
                                            editable.divisions.reduce((sum, division) => sum + division.members.length, 0)}{' '}
                                        Staff
                                    </span>
                                </div>

                                {editable.head && (
                                    <div className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] p-3">
                                        <Avatar className="size-9">
                                            <AvatarImage src={editable.head.avatarUrl} alt={editable.head.name} />
                                            <AvatarFallback className="text-xs">{initials(editable.head.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start">
                                            <p className="font-poppins text-sm font-semibold text-black">{editable.head.name}</p>
                                            <p className="text-xs text-[#64748B]">{editable.head.role}</p>
                                        </div>
                                    </div>
                                )}

                                {editable.members.map((member) => (
                                    <div key={member.id} className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] p-3">
                                        <Avatar className="size-8">
                                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                                            <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex flex-col items-start">
                                            <p className="text-sm font-medium text-black">{member.name}</p>
                                            <p className="text-xs text-[#64748B]">{member.role}</p>
                                        </div>
                                    </div>
                                ))}

                                {editable.divisions.length > 0 && (
                                    <div className="grid w-full grid-cols-1 gap-x-8 gap-y-3 sm:grid-cols-2">
                                        {editable.divisions.map((division) => (
                                            <div key={division.id} className="flex w-full flex-col gap-3">
                                                <p className="border-b border-[#E2E8F0] pb-2 text-xs text-[#64748B]">{division.name}</p>
                                                {division.members.length === 0 && <p className="text-sm text-[#94A3B8]">Belum ada staff.</p>}
                                                {division.members.map((member) => (
                                                    <div
                                                        key={member.id}
                                                        className="flex w-full items-center gap-3 rounded-xl border border-[#E2E8F0] p-3"
                                                    >
                                                        <Avatar className="size-8">
                                                            <AvatarImage src={member.avatarUrl} alt={member.name} />
                                                            <AvatarFallback className="text-xs">{initials(member.name)}</AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex flex-col items-start">
                                                            <p className="text-sm font-medium text-black">{member.name}</p>
                                                            <p className="text-xs text-[#64748B]">{member.role}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex w-full items-center justify-between border-t border-[#E2E8F0] px-8 py-5">
                    <div className="flex items-center gap-3">
                        <Button variant="outline" className="h-auto rounded-lg px-6 py-2.5" onClick={resetAndClose}>
                            Batal
                        </Button>
                        {step > 1 && (
                            <button type="button" className="text-sm font-semibold text-[#1980C0]" onClick={() => setStep((current) => current - 1)}>
                                Kembali
                            </button>
                        )}
                    </div>
                    {step < 3 ? (
                        <Button className="h-auto rounded-lg px-6 py-2.5" onClick={() => setStep((current) => current + 1)}>
                            Selanjutnya
                        </Button>
                    ) : (
                        <Button className="h-auto rounded-lg px-6 py-2.5" onClick={handleSave}>
                            Simpan Perubahan
                        </Button>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
