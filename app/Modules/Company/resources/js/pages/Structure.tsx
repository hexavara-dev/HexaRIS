import { Head } from '@inertiajs/react';
import { Minus, MoreVertical, Plus, Search } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

import { OrgStructureEmptyState } from '@/components/design-system/empty-state/OrgStructureEmptyState';
import { OrgChart, type OrgDepartment, type OrgDivision, type OrgMember } from '@/components/design-system/org-chart/OrgChart';
import { CreateStructureDialog } from '@/components/design-system/pop-up/CreateStructureDialog';
import { DepartmentDetailPanel, type DepartmentStaff } from '@/components/design-system/pop-up/DepartmentDetailPanel';
import { DivisionDetailPanel, type DivisionStaff } from '@/components/design-system/pop-up/division-detail-panel';
import { EditDepartmentDialog, shortName } from '@/components/design-system/pop-up/EditDepartmentDialog';
import { Pagination } from '@/components/pagination';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem, type Paginated } from '@/types';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Struktur Organisasi', href: '/company/structure' }];

const TABS = [
    { value: 'bagan', label: 'Bagan Struktur' },
    { value: 'tabel', label: 'Tabel Struktur' },
] as const;

const ZOOM_MIN = 0.5;
const ZOOM_MAX = 1.5;
const ZOOM_STEP = 0.1;
const GROUPS_PER_PAGE = 3;

const STORAGE_KEY = 'hexaris.company-structure';

interface StoredStructure {
    ceo: OrgMember | null;
    departments: OrgDepartment[];
}

function loadStoredStructure(): StoredStructure {
    if (typeof window === 'undefined') return { ceo: null, departments: [] };
    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ceo: null, departments: [] };
        const parsed = JSON.parse(raw) as StoredStructure;
        return { ceo: parsed.ceo ?? null, departments: parsed.departments ?? [] };
    } catch {
        return { ceo: null, departments: [] };
    }
}

interface StructureRow {
    divisi: string;
    nama: string;
}

interface StructureGroup {
    id: string;
    department: string;
    rows: StructureRow[];
}

function toStructureGroups(departments: OrgDepartment[]): StructureGroup[] {
    return departments.map((department, index) => {
        const rows: StructureRow[] = [];
        if (department.head) rows.push({ divisi: department.head.role, nama: department.head.name });
        department.members?.forEach((member) => rows.push({ divisi: member.role, nama: member.name }));
        department.divisions?.forEach((division) => division.members.forEach((member) => rows.push({ divisi: member.role, nama: member.name })));

        return {
            id: `EM${187 + index}`,
            department: department.name.replace(/^Dept\.\s*/, ''),
            rows,
        };
    });
}

function divisionToStaff(division: OrgDivision): DivisionStaff[] {
    return division.members.map((member, index) => ({
        id: `${division.name}-${index}`,
        name: member.name,
        role: member.role,
        avatarUrl: member.avatarUrl,
    }));
}

function divisionPositionStats(division: OrgDivision) {
    const counts = new Map<string, number>();
    division.members.forEach((member) => counts.set(member.role, (counts.get(member.role) ?? 0) + 1));
    return Array.from(counts, ([label, count]) => ({ label, count }));
}

function departmentAllMembers(department: OrgDepartment) {
    const members = [...(department.members ?? [])];
    department.divisions?.forEach((division) => members.push(...division.members));
    return members;
}

function departmentToStaff(department: OrgDepartment): DepartmentStaff[] {
    return departmentAllMembers(department).map((member, index) => ({
        id: `${department.name}-${index}`,
        name: member.name,
        role: member.role,
        avatarUrl: member.avatarUrl,
    }));
}

function departmentPositionStats(department: OrgDepartment) {
    const counts = new Map<string, number>();
    departmentAllMembers(department).forEach((member) => counts.set(member.role, (counts.get(member.role) ?? 0) + 1));
    return Array.from(counts, ([label, count]) => ({ label, count }));
}

export default function CompanyStructure() {
    const [ceo, setCeo] = useState<OrgMember | null>(() => loadStoredStructure().ceo);
    const [departments, setDepartments] = useState<OrgDepartment[]>(() => loadStoredStructure().departments);
    const [activeTab, setActiveTab] = useState<(typeof TABS)[number]['value']>('bagan');
    const [zoom, setZoom] = useState(1);
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [selectedDivision, setSelectedDivision] = useState<{ division: OrgDivision; departmentName: string } | null>(null);
    const [selectedDepartment, setSelectedDepartment] = useState<OrgDepartment | null>(null);
    const [editingDepartment, setEditingDepartment] = useState<OrgDepartment | null>(null);
    const [creatingStructure, setCreatingStructure] = useState(false);

    const hasStructure = ceo !== null && departments.length > 0;

    useEffect(() => {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ ceo, departments }));
    }, [ceo, departments]);

    const structureGroups = useMemo(() => toStructureGroups(departments), [departments]);

    const filteredGroups = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return structureGroups;

        return structureGroups
            .map((group) => ({
                ...group,
                rows: group.rows.filter((row) => row.nama.toLowerCase().includes(query) || row.divisi.toLowerCase().includes(query)),
            }))
            .filter((group) => group.rows.length > 0 || group.department.toLowerCase().includes(query));
    }, [structureGroups, search]);

    const totalPages = Math.max(1, Math.ceil(filteredGroups.length / GROUPS_PER_PAGE));
    const currentPage = Math.min(page, totalPages);
    const pageGroups = filteredGroups.slice((currentPage - 1) * GROUPS_PER_PAGE, currentPage * GROUPS_PER_PAGE);
    const paginatedGroups: Paginated<StructureGroup> = {
        data: pageGroups,
        from: filteredGroups.length === 0 ? null : (currentPage - 1) * GROUPS_PER_PAGE + 1,
        to: filteredGroups.length === 0 ? null : Math.min(currentPage * GROUPS_PER_PAGE, filteredGroups.length),
        total: filteredGroups.length,
        current_page: currentPage,
        last_page: totalPages,
        prev_page_url: currentPage > 1 ? '#' : null,
        next_page_url: currentPage < totalPages ? '#' : null,
    };

    function handleSearch(value: string) {
        setSearch(value);
        setPage(1);
    }

    function zoomBy(delta: number) {
        setZoom((current) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, Math.round((current + delta) * 10) / 10)));
    }

    function findDepartmentByLabel(label: string) {
        return departments.find((department) => department.name.replace(/^Dept\.\s*/, '') === label);
    }

    function handleDepartmentSaved(updated: OrgDepartment) {
        setDepartments((current) => current.map((department) => (department === editingDepartment ? updated : department)));
        setSelectedDepartment(null);
        setEditingDepartment(null);
        toast.success('Departemen Berhasil Diperbarui');
    }

    function handleStructureCreated(tree: { ceo: OrgMember; departments: OrgDepartment[] }) {
        setCeo(tree.ceo);
        setDepartments(tree.departments);
        setPage(1);
        setCreatingStructure(false);
        toast.success('Struktur Organisasi Berhasil Diperbarui');
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Struktur Organisasi" />

            <div className="flex h-full flex-1 flex-col gap-6 p-6">
                {/* Tab bar + primary action */}
                <div className="flex w-full items-end justify-between">
                    <div className="flex items-center gap-8">
                        {TABS.map((tab) => (
                            <button
                                key={tab.value}
                                type="button"
                                onClick={() => setActiveTab(tab.value)}
                                className={cn(
                                    'font-poppins flex flex-col items-center gap-2 text-sm font-semibold',
                                    activeTab === tab.value ? 'text-[#1980C0]' : 'text-[#64748B]',
                                )}
                            >
                                {tab.label}
                                <span className={cn('h-0.5 w-full rounded-full', activeTab === tab.value ? 'bg-[#1980C0]' : 'bg-transparent')} />
                            </button>
                        ))}
                    </div>

                    <Button className="h-auto gap-2 rounded-lg px-4 py-2 text-xs" onClick={() => setCreatingStructure(true)}>
                        <Plus className="size-4" />
                        Atur Struktur
                    </Button>
                </div>

                {!hasStructure ? (
                    <OrgStructureEmptyState />
                ) : activeTab === 'bagan' ? (
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
                        {/* Zoom toolbar */}
                        <div className="flex items-center justify-end border-b border-[#E2E8F0] p-5">
                            <div className="flex items-center rounded-lg border border-[#E2E8F0]">
                                <button
                                    type="button"
                                    onClick={() => zoomBy(-ZOOM_STEP)}
                                    disabled={zoom <= ZOOM_MIN}
                                    className="flex items-center p-2 text-[#94A3B8] disabled:opacity-40"
                                    aria-label="Perkecil"
                                >
                                    <Minus className="size-4" />
                                </button>
                                <span className="w-12 text-center text-[13px] text-[#0F172A]">{Math.round(zoom * 100)}%</span>
                                <button
                                    type="button"
                                    onClick={() => zoomBy(ZOOM_STEP)}
                                    disabled={zoom >= ZOOM_MAX}
                                    className="flex items-center p-2 text-[#94A3B8] disabled:opacity-40"
                                    aria-label="Perbesar"
                                >
                                    <Plus className="size-4" />
                                </button>
                            </div>
                        </div>

                        <div className="bg-[#FAFBFD]">
                            <OrgChart
                                tree={{ ceo: ceo as OrgMember, departments }}
                                zoom={zoom}
                                onDivisionClick={(division, departmentName) => setSelectedDivision({ division, departmentName })}
                                onDepartmentClick={setSelectedDepartment}
                            />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 rounded-2xl border border-[#E2E8F0] bg-white p-5">
                        {/* Search */}
                        <div className="relative w-full max-w-md">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94A3B8]" />
                            <Input
                                value={search}
                                onChange={(event) => handleSearch(event.target.value)}
                                placeholder="Search"
                                className="h-11 rounded-xl pl-9"
                            />
                        </div>

                        <div className="w-full overflow-hidden rounded-xl border border-[#E2E8F0]">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-[#E2E8F0] bg-[#FAFBFD] hover:bg-[#FAFBFD]">
                                        <TableHead className="font-poppins text-xs font-medium text-[#0F172A]">ID Departemen</TableHead>
                                        <TableHead className="font-poppins text-xs font-medium text-[#0F172A]">Departemen</TableHead>
                                        <TableHead className="font-poppins text-xs font-medium text-[#0F172A]">Divisi</TableHead>
                                        <TableHead className="font-poppins text-xs font-medium text-[#0F172A]">Nama</TableHead>
                                        <TableHead className="w-16" />
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {pageGroups.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-8 text-center text-sm text-[#94A3B8]">
                                                Tidak ada data.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {pageGroups.map((group) =>
                                        group.rows.map((row, index) => (
                                            <TableRow key={`${group.id}-${index}`} className="border-[#E2E8F0] hover:bg-transparent">
                                                <TableCell className="align-top text-sm text-[#0F172A]">{index === 0 ? group.id : ''}</TableCell>
                                                <TableCell className="align-top text-sm text-[#0F172A]">
                                                    {index === 0 ? group.department : ''}
                                                </TableCell>
                                                <TableCell className="text-sm text-[#475569]">{row.divisi}</TableCell>
                                                <TableCell className="text-sm text-[#0F172A]">{row.nama}</TableCell>
                                                <TableCell className="align-top">
                                                    {index === 0 && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger asChild>
                                                                <button
                                                                    type="button"
                                                                    className="inline-flex items-center rounded-md border border-[#E2E8F0] bg-white p-1"
                                                                    aria-label="Aksi"
                                                                >
                                                                    <MoreVertical className="size-3.5 text-[#1B1B1B]" />
                                                                </button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setSelectedDepartment(findDepartmentByLabel(group.department) ?? null)
                                                                    }
                                                                >
                                                                    Detail
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setEditingDepartment(findDepartmentByLabel(group.department) ?? null)
                                                                    }
                                                                >
                                                                    Edit
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    className="text-[#E84A39] focus:text-[#E84A39]"
                                                                    onClick={() => toast.info(`Hapus ${group.department} belum tersedia`)}
                                                                >
                                                                    Hapus
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </TableCell>
                                            </TableRow>
                                        )),
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <Pagination page={paginatedGroups} onPageChange={setPage} />
                    </div>
                )}
            </div>

            <DivisionDetailPanel
                open={selectedDivision !== null}
                onOpenChange={(open) => !open && setSelectedDivision(null)}
                divisionName={selectedDivision?.division.name ?? ''}
                headName={selectedDivision?.division.members[0]?.name ?? ''}
                divisionAvatarUrl={selectedDivision?.division.members[0]?.avatarUrl}
                positionStats={selectedDivision ? divisionPositionStats(selectedDivision.division) : []}
                staff={selectedDivision ? divisionToStaff(selectedDivision.division) : []}
                onEdit={() => toast.info('Edit divisi belum tersedia')}
                onDelete={() => toast.info('Hapus divisi belum tersedia')}
            />

            <DepartmentDetailPanel
                open={selectedDepartment !== null}
                onOpenChange={(open) => !open && setSelectedDepartment(null)}
                departmentName={selectedDepartment?.name ?? ''}
                headName={selectedDepartment?.head?.name ?? selectedDepartment?.members?.[0]?.name ?? ''}
                headRole={selectedDepartment?.head?.role ?? selectedDepartment?.members?.[0]?.role ?? ''}
                headAvatarUrl={selectedDepartment?.head?.avatarUrl ?? selectedDepartment?.members?.[0]?.avatarUrl}
                positionStats={selectedDepartment ? departmentPositionStats(selectedDepartment) : []}
                staff={selectedDepartment ? departmentToStaff(selectedDepartment) : []}
                onEdit={() => {
                    setEditingDepartment(selectedDepartment);
                    setSelectedDepartment(null);
                }}
                onDelete={() => toast.info('Hapus departemen belum tersedia')}
            />

            <EditDepartmentDialog
                open={editingDepartment !== null}
                onOpenChange={(open) => !open && setEditingDepartment(null)}
                department={editingDepartment}
                siblingDepartmentNames={departments
                    .filter((sibling) => sibling.name !== editingDepartment?.name)
                    .map((sibling) => shortName(sibling.name))}
                onSave={handleDepartmentSaved}
            />

            <CreateStructureDialog
                open={creatingStructure}
                onOpenChange={setCreatingStructure}
                onSave={handleStructureCreated}
                existingTree={hasStructure ? { ceo: ceo as OrgMember, departments } : null}
            />
        </AppLayout>
    );
}
