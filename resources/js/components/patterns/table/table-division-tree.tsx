import { MoreVertical } from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface DivisionTeam {
    role: string;
    leadName: string;
    members: string[];
}

export interface DivisionGroup {
    id: string;
    division: string;
    headName: string;
    teams: DivisionTeam[];
}

interface TableDivisionTreeProps {
    data: DivisionGroup[];
    onEdit?: (division: DivisionGroup) => void;
    onDelete?: (division: DivisionGroup) => void;
}

const headerClassName = 'bg-[#FAFBFD] font-poppins text-xs font-normal text-[#0A0A0A]';
const cellClassName = 'font-poppins text-xs text-[#424242]';

interface FlatRow {
    key: string;
    id?: string;
    division?: string;
    role?: string;
    nama: string;
    showAction?: boolean;
}

function flattenGroup(group: DivisionGroup): FlatRow[] {
    const rows: FlatRow[] = [
        { key: `${group.id}-head`, id: group.id, division: group.division, role: 'Head', nama: group.headName, showAction: true },
    ];

    group.teams.forEach((team) => {
        rows.push({ key: `${group.id}-${team.role}`, role: team.role, nama: `${team.leadName} - Lead` });
        team.members.forEach((member) => {
            rows.push({ key: `${group.id}-${team.role}-${member}`, nama: member });
        });
    });

    return rows;
}

export function TableDivisionTree({ data, onEdit, onDelete }: TableDivisionTreeProps) {
    return (
        <div className="w-full overflow-hidden rounded-md border border-[#E7E7E7] bg-white">
            <Table>
                <TableHeader>
                    <TableRow className="border-[#E7E7E7] hover:bg-transparent">
                        <TableHead className={headerClassName}>ID Divisi</TableHead>
                        <TableHead className={headerClassName}>Divisi</TableHead>
                        <TableHead className={headerClassName}>Role</TableHead>
                        <TableHead className={headerClassName}>Nama</TableHead>
                        <TableHead className={cn('w-[83px] border-x border-x-[#E7E7E7]', headerClassName)} />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((group) => {
                        const rows = flattenGroup(group);

                        return rows.map((row, index) => (
                            <TableRow key={row.key} className={cn('border-[#E7E7E7] hover:bg-transparent', index === rows.length - 1 && 'border-b')}>
                                <TableCell className={cellClassName}>{row.id}</TableCell>
                                <TableCell className={cellClassName}>{row.division}</TableCell>
                                <TableCell className={cellClassName}>{row.role}</TableCell>
                                <TableCell className={cellClassName}>{row.nama}</TableCell>
                                <TableCell className="border-x border-x-[#E7E7E7] text-center">
                                    {row.showAction && (
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <button
                                                    type="button"
                                                    className="inline-flex items-center gap-3 rounded-md border border-[#E7E7E7] bg-white p-1"
                                                >
                                                    <MoreVertical className="h-3.5 w-3.5 text-[#1B1B1B]" />
                                                </button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem onClick={() => onEdit?.(group)}>Edit</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => onDelete?.(group)}>Delete</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    )}
                                </TableCell>
                            </TableRow>
                        ));
                    })}
                </TableBody>
            </Table>
        </div>
    );
}
