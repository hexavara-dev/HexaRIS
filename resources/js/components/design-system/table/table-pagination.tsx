import { ChevronLeft, ChevronRight } from 'lucide-react';

import { cn } from '@/lib/utils';

interface TablePaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
}

function getPageNumbers(current: number, total: number): (number | 'ellipsis')[] {
    const delta = 2;
    const range: number[] = [];

    for (let i = Math.max(2, current - delta); i <= Math.min(total - 1, current + delta); i++) {
        range.push(i);
    }

    const pages: (number | 'ellipsis')[] = [1];
    if (range[0] > 2) pages.push('ellipsis');
    pages.push(...range);
    if (range[range.length - 1] < total - 1) pages.push('ellipsis');
    if (total > 1) pages.push(total);

    return pages;
}

export function TablePagination({ currentPage, totalPages, onPageChange }: TablePaginationProps) {
    const pages = getPageNumbers(currentPage, totalPages);

    return (
        <div className="flex w-full items-center gap-2">
            <div className="flex w-full items-center gap-2">
                {pages.map((page, index) =>
                    page === 'ellipsis' ? (
                        <span
                            key={`ellipsis-${index}`}
                            className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E2E2] bg-white text-sm text-[#9C9C9C]"
                        >
                            ...
                        </span>
                    ) : (
                        <button
                            key={page}
                            type="button"
                            onClick={() => onPageChange(page)}
                            className={cn(
                                'font-poppins flex h-8 w-8 items-center justify-center rounded-lg text-sm font-medium',
                                page === currentPage ? 'bg-[#F8FAFC] text-[#030616]' : 'border border-[#E2E2E2] text-[#9C9C9C]',
                            )}
                        >
                            {page}
                        </button>
                    ),
                )}
            </div>

            <div className="flex w-fit items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage <= 1}
                    className="font-poppins flex h-8 w-fit items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white px-2.5 py-1.5 text-sm font-medium text-[#030616] disabled:opacity-50"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                </button>
                <button
                    type="button"
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage >= totalPages}
                    className="font-poppins flex h-8 w-fit items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white px-2.5 py-1.5 text-sm font-medium text-[#030616] disabled:opacity-50"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
