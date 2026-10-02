import { Pagination } from '@/components/pagination';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { type Paginated } from '@/types';
import { MoreVertical, Search } from 'lucide-react';
import { useMemo, useState } from 'react';

import { type StructureGroup } from '../lib/structure-transforms';

const GROUPS_PER_PAGE = 3;

interface StructureTableProps {
    groups: StructureGroup[];
    cabang: string;
    cabangOptions: string[];
    onCabangChange: (value: string) => void;
    onDetail: (departmentLabel: string) => void;
    onDelete: (departmentLabel: string) => void;
}

/** The "Tabel Struktur" tab — searchable, paginated department/division/name breakdown. Owns its own search + page state. */
export function StructureTable({ groups, cabang, cabangOptions, onCabangChange, onDetail, onDelete }: StructureTableProps) {
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);

    const filteredGroups = useMemo(() => {
        const query = search.trim().toLowerCase();
        if (!query) return groups;

        return groups
            .map((group) =>
                group.department.toLowerCase().includes(query)
                    ? group
                    : {
                          ...group,
                          rows: group.rows.filter((row) => row.nama.toLowerCase().includes(query) || row.divisi.toLowerCase().includes(query)),
                      },
            )
            .filter((group) => group.rows.length > 0);
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
        <div className="flex min-h-[520px] flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F1F5F9] px-5 py-4">
                <Select value={cabang} onValueChange={onCabangChange}>
                    <SelectTrigger className="h-9 w-[190px] rounded-lg border-[#CBD5E1] bg-white px-3 text-left text-[12px] shadow-none">
                        <SelectValue placeholder="Pilih cabang" />
                    </SelectTrigger>
                    <SelectContent>
                        {cabangOptions.map((option) => (
                            <SelectItem key={option} value={option} className="text-[12px]">
                                Cabang: {option}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>

                <div className="relative w-full max-w-[260px]">
                    <Search className="absolute top-1/2 left-3 size-3.5 -translate-y-1/2 text-[#94A3B8]" />
                    <Input
                        value={search}
                        onChange={(event) => handleSearch(event.target.value)}
                        placeholder="Search"
                        className="h-9 rounded-lg border-[#E2E8F0] bg-white pl-9 text-[12px] shadow-none placeholder:text-[#94A3B8]"
                    />
                </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto px-5 pt-4">
                <Table>
                    <TableHeader>
                        <TableRow className="border-[#E2E8F0] bg-[#FAFBFD] hover:bg-[#FAFBFD]">
                            <TableHead className="font-poppins h-9 w-[120px] text-[11px] font-medium text-[#0F172A]">ID Departemen</TableHead>
                            <TableHead className="font-poppins h-9 w-[210px] text-[11px] font-medium text-[#0F172A]">Departemen</TableHead>
                            <TableHead className="font-poppins h-9 text-[11px] font-medium text-[#0F172A]">Divisi</TableHead>
                            <TableHead className="font-poppins h-9 w-[220px] text-[11px] font-medium text-[#0F172A]">Nama</TableHead>
                            <TableHead className="h-9 w-12" />
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {pageGroups.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={5} className="py-14 text-center text-sm text-[#94A3B8]">
                                    Tidak ada data.
                                </TableCell>
                            </TableRow>
                        )}
                        {pageGroups.map((group) =>
                            group.rows.map((row, index) => {
                                const isFirst = index === 0;

                                return (
                                    <TableRow key={`${group.id}-${index}`} className="border-[#EDF2F7] hover:bg-[#F8FCFF]">
                                        <TableCell className="h-9 align-top text-[12px] text-[#0F172A]">{isFirst ? group.id : ''}</TableCell>
                                        <TableCell className="h-9 align-top text-[12px] text-[#0F172A]">{isFirst ? group.department : ''}</TableCell>
                                        <TableCell className="h-9 text-[12px] text-[#475569]">{row.divisi}</TableCell>
                                        <TableCell className="h-9 text-[12px] text-[#0F172A]">{row.nama}</TableCell>
                                        <TableCell className="h-9 align-top">
                                            {isFirst && (
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <button
                                                            type="button"
                                                            className="inline-flex size-7 items-center justify-center rounded-md border border-[#E2E8F0] bg-white transition-colors hover:bg-[#F8FAFC]"
                                                            aria-label="Aksi"
                                                        >
                                                            <MoreVertical className="size-3.5 text-[#0F172A]" />
                                                        </button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent
                                                        align="end"
                                                        className="w-28 rounded-xl border-[#E2E8F0] p-1 shadow-[0_8px_24px_rgba(15,23,42,0.12)]"
                                                    >
                                                        <DropdownMenuItem
                                                            className="rounded-lg text-[12px]"
                                                            onClick={() => onDetail(group.department)}
                                                        >
                                                            Detail
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem className="rounded-lg text-[12px]">Edit</DropdownMenuItem>
                                                        <DropdownMenuItem
                                                            className="rounded-lg text-[12px] text-[#E84A39] focus:text-[#E84A39]"
                                                            onClick={() => onDelete(group.department)}
                                                        >
                                                            Hapus
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            }),
                        )}
                    </TableBody>
                </Table>
            </div>

            <div className="border-t border-[#F1F5F9] px-5 py-3">
                <Pagination page={paginatedGroups} onPageChange={setPage} />
            </div>
        </div>
    );
}
