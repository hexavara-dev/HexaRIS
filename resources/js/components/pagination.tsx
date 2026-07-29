import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { ChevronLeft, ChevronRight } from 'lucide-react';

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

interface Props<T> {
    page: Paginated<T>;
    variant?: 'default' | 'design-system';
    onPageChange: (page: number) => void;
}

export function Pagination<T>({ page, variant = 'design-system', onPageChange }: Props<T>) {
    if (variant === 'design-system') {
        return <DesignSystemPagination page={page} goToPage={onPageChange} />;
    }

    const cls = 'rounded-md border px-2.5 py-1 text-sm';

    return (
        <div className="text-muted-foreground flex items-center justify-between text-sm">
            <div>{page.total === 0 ? 'No results' : `${page.from}–${page.to} of ${page.total}`}</div>
            <div className="flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => onPageChange(page.current_page - 1)}
                    disabled={page.current_page <= 1}
                    className={cn(cls, 'hover:bg-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50')}
                >
                    Prev
                </button>
                {page.last_page > 1 &&
                    getPageNumbers(page.current_page, page.last_page).map((p, index) =>
                        p === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="text-muted-foreground px-1">
                                …
                            </span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => onPageChange(p)}
                                aria-current={p === page.current_page ? 'page' : undefined}
                                className={cn(cls, 'cursor-pointer', p === page.current_page ? 'bg-accent font-medium' : 'hover:bg-accent')}
                            >
                                {p}
                            </button>
                        ),
                    )}
                <button
                    type="button"
                    onClick={() => onPageChange(page.current_page + 1)}
                    disabled={page.current_page >= page.last_page}
                    className={cn(cls, 'hover:bg-accent cursor-pointer disabled:cursor-not-allowed disabled:opacity-50')}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

function DesignSystemPagination<T>({ page, goToPage }: { page: Paginated<T>; goToPage: (page: number) => void }) {
    const pages = getPageNumbers(page.current_page, page.last_page);

    return (
        <div className="flex w-full items-center gap-2">
            <div className="flex w-full flex-wrap items-center gap-2">
                {page.last_page > 1 &&
                    pages.map((p, index) =>
                        p === 'ellipsis' ? (
                            <span
                                key={`ellipsis-${index}`}
                                className="font-poppins flex h-8 w-8 items-center justify-center rounded-lg border border-[#E2E2E2] bg-white text-sm text-[#9C9C9C]"
                            >
                                ...
                            </span>
                        ) : (
                            <button
                                key={p}
                                type="button"
                                onClick={() => goToPage(p)}
                                aria-current={p === page.current_page ? 'page' : undefined}
                                className={cn(
                                    'font-poppins flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg text-sm font-medium',
                                    p === page.current_page ? 'bg-[#F8FAFC] text-[#030616]' : 'border border-[#E2E2E2] text-[#9C9C9C]',
                                )}
                            >
                                {p}
                            </button>
                        ),
                    )}
            </div>

            <div className="flex w-fit items-center gap-2">
                <button
                    type="button"
                    onClick={() => goToPage(page.current_page - 1)}
                    disabled={page.current_page <= 1}
                    className="font-poppins flex h-8 w-fit cursor-pointer items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white px-2.5 py-1.5 text-sm font-medium text-[#030616] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    <ChevronLeft className="h-4 w-4" />
                    Prev
                </button>
                <button
                    type="button"
                    onClick={() => goToPage(page.current_page + 1)}
                    disabled={page.current_page >= page.last_page}
                    className="font-poppins flex h-8 w-fit cursor-pointer items-center gap-1 rounded-lg border border-[#E3E8EF] bg-white px-2.5 py-1.5 text-sm font-medium text-[#030616] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    Next
                    <ChevronRight className="h-4 w-4" />
                </button>
            </div>
        </div>
    );
}
