import { SquarePen } from 'lucide-react';

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';

export interface KpiDefinition {
    label: string;
    weight: number;
    target: number;
}

export interface PerformanceReviewRow {
    no: number;
    employeeName: string;
    role: string;
    kpiScores: number[];
    supervisorRating: string;
    totalScore: number;
    status: 'Tercapai' | 'Tdk Tercapai';
}

interface TablePerformanceReviewProps {
    kpiDefinitions: KpiDefinition[];
    data: PerformanceReviewRow[];
    onEdit?: (row: PerformanceReviewRow) => void;
}

const headerClassName = 'font-poppins text-[13px] font-bold text-[#2C3E50]';
const cellClassName = 'font-poppins text-sm text-[#666]';

export function TablePerformanceReview({ kpiDefinitions, data, onEdit }: TablePerformanceReviewProps) {
    return (
        <div className="w-full overflow-hidden rounded-md border border-[#E7E7E7] bg-white">
            <Table>
                <TableHeader>
                    <TableRow className="border-[#E7E7E7] bg-[#F0F7FC] hover:bg-[#F0F7FC]">
                        <TableHead className={cn(headerClassName, 'text-center')}>No</TableHead>
                        <TableHead className={headerClassName}>Nama Karyawan</TableHead>
                        {kpiDefinitions.map((kpi) => (
                            <TableHead key={kpi.label} className={headerClassName}>
                                <div className="flex flex-col items-start gap-1">
                                    <span>{kpi.label}</span>
                                    <span className="font-poppins text-[11px] font-normal text-[#555]">
                                        Bobot {kpi.weight}% Target ≥{kpi.target}%
                                    </span>
                                </div>
                            </TableHead>
                        ))}
                        <TableHead className={headerClassName}>Nilai Atasan</TableHead>
                        <TableHead className={cn(headerClassName, 'text-right')}>Total Skor</TableHead>
                        <TableHead className={headerClassName}>Status</TableHead>
                        <TableHead className={headerClassName}>Aksi</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {data.map((row) => (
                        <TableRow key={row.no} className="border-[#E7E7E7]">
                            <TableCell className={cn(cellClassName, 'text-center font-medium')}>{row.no}</TableCell>
                            <TableCell>
                                <p className="font-poppins text-sm font-semibold text-[#1E293B]">{row.employeeName}</p>
                                <p className="font-poppins text-xs text-[#888]">{row.role}</p>
                            </TableCell>
                            {row.kpiScores.map((score, index) => {
                                const target = kpiDefinitions[index]?.target ?? 0;
                                const met = score >= target;
                                return (
                                    <TableCell key={kpiDefinitions[index]?.label ?? index}>
                                        <span
                                            className={cn(
                                                'font-poppins inline-flex rounded-md px-2 py-1 text-[13px] font-bold',
                                                met ? 'bg-[#E6F4EA] text-[#137333]' : 'bg-[#FCE8E6] text-[#C5221F]',
                                            )}
                                        >
                                            {score}%
                                        </span>
                                    </TableCell>
                                );
                            })}
                            <TableCell>
                                <span className="font-poppins text-sm font-semibold text-[#46B52B]">{row.supervisorRating}</span>
                            </TableCell>
                            <TableCell className="text-right">
                                <span className="font-poppins text-[15px] font-bold text-[#1980C0]">{row.totalScore}%</span>
                            </TableCell>
                            <TableCell>
                                <span
                                    className={cn(
                                        'font-poppins inline-flex rounded-md px-2.5 py-1 text-xs font-semibold',
                                        row.status === 'Tercapai' ? 'bg-[#E5F7EB] text-[#148C3D]' : 'bg-[#FEE2E2] text-[#DC2626]',
                                    )}
                                >
                                    {row.status}
                                </span>
                            </TableCell>
                            <TableCell>
                                <button
                                    type="button"
                                    onClick={() => onEdit?.(row)}
                                    aria-label="Edit"
                                    className="inline-flex items-center gap-3 rounded-md border border-[#E7E7E7] bg-white p-1"
                                >
                                    <SquarePen className="h-3.5 w-3.5 text-black" />
                                </button>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
