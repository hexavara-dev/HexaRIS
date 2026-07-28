import { cn } from '@/lib/utils';
import { type Paginated } from '@/types';
import { Link, router } from '@inertiajs/react';

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

export function Pagination<T>({ page }: { page: Paginated<T> }) {
    const cls = 'rounded-md border px-2.5 py-1 text-sm';

    const goToPage = (pageNumber: number) => {
        const params = Object.fromEntries(new URLSearchParams(window.location.search));
        router.get(window.location.pathname, { ...params, page: pageNumber }, { preserveState: true, preserveScroll: true, replace: true });
    };

    return (
        <div className="text-muted-foreground flex items-center justify-between text-sm">
            <div>{page.total === 0 ? 'No results' : `${page.from}–${page.to} of ${page.total}`}</div>
            <div className="flex items-center gap-2">
                {page.prev_page_url ? (
                    <Link href={page.prev_page_url} preserveScroll className={`${cls} hover:bg-accent`}>
                        Prev
                    </Link>
                ) : (
                    <span className={`${cls} opacity-50`}>Prev</span>
                )}
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
                                onClick={() => goToPage(p)}
                                aria-current={p === page.current_page ? 'page' : undefined}
                                className={cn(cls, p === page.current_page ? 'bg-accent font-medium' : 'hover:bg-accent')}
                            >
                                {p}
                            </button>
                        ),
                    )}
                {page.next_page_url ? (
                    <Link href={page.next_page_url} preserveScroll className={`${cls} hover:bg-accent`}>
                        Next
                    </Link>
                ) : (
                    <span className={`${cls} opacity-50`}>Next</span>
                )}
            </div>
        </div>
    );
}
