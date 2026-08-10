import { Pagination } from '@/components/pagination';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Paginated } from '@/types';
import { MoreVertical, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { type StructureGroup } from '../lib/structure-transforms';

const GROUPS_PER_PAGE = 3;

interface StructureTableProps {
    groups: StructureGroup[];
    onDetail: (departmentLabel: string) => void;
    onEdit: (departmentLabel: string) => void;
    onDelete: (departmentLabel: string) => void;
}

/** The "Tabel Struktur" tab — searchable, paginated department/division/name breakdown. Owns its own search + page state. */
export function StructureTable({ groups, onDetail, onEdit, onDelete }: StructureTableProps) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const filteredGroups = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return groups;

        return groups
            .map((group) => ({
                ...group,
                rows: group.rows.filter((row) => row.nama.toLowerCase().includes(query) || row.divisi.toLowerCase().includes(query)),
            }))
            .filter((group) => group.rows.length > 0 || group.department.toLowerCase().includes(query));
    }, [groups, search]);

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

    return (
        <div className="flex flex-col gap-5 rounded-2xl border border-[#E2E8F0] bg-white p-5">
            <div className="relative w-full max-w-md">
                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94A3B8]" />
                <Input value={search} onChange={(event) => handleSearch(event.target.value)} placeholder="Search" className="h-11 rounded-xl pl-9" />
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
                                    <TableCell className="align-top text-sm text-[#0F172A]">{index === 0 ? group.department : ''}</TableCell>
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
                                                    <DropdownMenuItem onClick={() => onDetail(group.department)}>Detail</DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => onEdit(group.department)}>Edit</DropdownMenuItem>
                                                    <DropdownMenuItem
                                                        className="text-[#E84A39] focus:text-[#E84A39]"
                                                        onClick={() => onDelete(group.department)}
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
    );
}
