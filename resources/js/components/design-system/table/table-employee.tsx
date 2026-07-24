import { MoreVertical } from 'lucide-react';

import { Chip } from '@/components/design-system/chip/chip';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface EmployeeRow {
    id: string;
    name: string;
    branch: string;
    division: string;
    status: 'Active' | 'Inactive';
    jobPosition: string;
}

const headerClassName = 'bg-[#FAFBFD] font-poppins text-xs font-normal text-[#0A0A0A]';
const cellClassName = 'font-poppins text-xs text-[#424242]';

interface TableEmployeeProps {
    data: EmployeeRow[];
    onEdit?: (row: EmployeeRow) => void;
    onDelete?: (row: EmployeeRow) => void;
}

export function TableEmployee({ data, onEdit, onDelete }: TableEmployeeProps) {
    return (
        <div className="w-full overflow-hidden rounded-md border border-[#E7E7E7] bg-white">
            <Table>
                <TableHeader>
                    <TableRow className="border-[#E7E7E7] hover:bg-transparent">
                        <TableHead className={headerClassName}>Id Employee</TableHead>
                        <TableHead className={headerClassName}>Name</TableHead>
                        <TableHead className={headerClassName}>Branch</TableHead>
                        <TableHead className={headerClassName}>Division</TableHead>
                        <TableHead className={headerClassName}>Status</TableHead>
                        <TableHead className={headerClassName}>Job Position</TableHead>
                        <TableHead className={cn('w-[83px] border-x border-x-[#E7E7E7]', headerClassName)} />
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.id} className="border-[#E7E7E7] hover:bg-transparent">
                            <TableCell className={cellClassName}>{row.id}</TableCell>
                            <TableCell className={cellClassName}>{row.name}</TableCell>
                            <TableCell className={cellClassName}>{row.branch}</TableCell>
                            <TableCell className={cellClassName}>{row.division}</TableCell>
                            <TableCell>
                                <Chip variant={row.status === 'Active' ? 'success' : 'danger'}>{row.status}</Chip>
                            </TableCell>
                            <TableCell className={cellClassName}>{row.jobPosition}</TableCell>
                            <TableCell className="border-x border-x-[#E7E7E7] text-center">
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
                                        <DropdownMenuItem onClick={() => onEdit?.(row)}>Edit</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onDelete?.(row)}>Delete</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
