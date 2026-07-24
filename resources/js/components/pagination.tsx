import { type Paginated } from '@/types';
import { Link } from '@inertiajs/react';

export function Pagination<T>({ page }: { page: Paginated<T> }) {
    const cls = 'rounded-md border px-2.5 py-1 text-sm';
    return (
        <div className="text-muted-foreground flex items-center justify-between text-sm">
            <div>{page.total === 0 ? 'No results' : `${page.from}–${page.to} of ${page.total}`}</div>
            <div className="flex items-center gap-2">
                <span>
                    Page {page.current_page} of {page.last_page}
                </span>
                {page.prev_page_url ? (
                    <Link href={page.prev_page_url} preserveScroll className={`${cls} hover:bg-accent`}>
                        Prev
                    </Link>
                ) : (
                    <span className={`${cls} opacity-50`}>Prev</span>
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
