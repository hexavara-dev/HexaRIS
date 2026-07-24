import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import type { ApiResponseResult } from '@/lib/api-explorer-request';
import { useState } from 'react';

function statusVariant(status: number): 'default' | 'secondary' | 'destructive' {
    if (status >= 400) return 'destructive';
    if (status >= 200 && status < 300) return 'default';
    return 'secondary';
}

interface InertiaPage {
    component?: string;
    url?: string;
    props?: Record<string, unknown>;
}

function asInertiaPage(data: unknown): InertiaPage | null {
    if (data && typeof data === 'object' && 'component' in data && 'props' in data) {
        const page = data as Record<string, unknown>;
        return {
            component: typeof page.component === 'string' ? page.component : undefined,
            url: typeof page.url === 'string' ? page.url : undefined,
            props: (page.props as Record<string, unknown>) ?? undefined,
        };
    }
    return null;
}

function extractErrors(data: unknown, page: InertiaPage | null): Record<string, string> | undefined {
    const raw =
        (page?.props?.errors as Record<string, unknown> | undefined) ??
        (data && typeof data === 'object' && 'errors' in data
            ? ((data as Record<string, unknown>).errors as Record<string, unknown> | undefined)
            : undefined);

    if (!raw || typeof raw !== 'object') {
        return undefined;
    }

    const out: Record<string, string> = {};
    for (const [field, value] of Object.entries(raw)) {
        out[field] = Array.isArray(value) ? value.map(String).join('; ') : String(value);
    }

    return Object.keys(out).length > 0 ? out : undefined;
}

export function ResponseViewer({ result }: { result: ApiResponseResult | null }) {
    const [showHeaders, setShowHeaders] = useState(false);

    if (!result) {
        return (
            <div className="text-muted-foreground rounded-md border border-dashed p-6 text-center text-sm">Send a request to see the response.</div>
        );
    }

    const page = asInertiaPage(result.data);
    const errors = extractErrors(result.data, page);
    const body = page?.props ?? result.data;
    const pretty = typeof body === 'string' ? body : JSON.stringify(body, null, 2);

    return (
        <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
                <Badge variant={statusVariant(result.status)}>{result.status}</Badge>
                <span className="text-muted-foreground">{result.durationMs} ms</span>
                {page?.component && <span className="text-muted-foreground font-mono text-xs">{page.component}</span>}
            </div>

            {errors && Object.keys(errors).length > 0 && (
                <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border p-3 text-xs">
                    <div className="mb-1 font-medium">Validation errors</div>
                    <ul className="list-inside list-disc space-y-0.5">
                        {Object.entries(errors).map(([field, message]) => (
                            <li key={field}>
                                <span className="font-mono">{field}</span>: {String(message)}
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <pre className="bg-muted max-h-[28rem] overflow-auto rounded-md p-3 font-mono text-xs">{pretty}</pre>

            <div>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowHeaders((s) => !s)}>
                    {showHeaders ? 'Hide' : 'Show'} response headers
                </Button>
                {showHeaders && (
                    <pre className="bg-muted mt-2 overflow-auto rounded-md p-3 font-mono text-xs">
                        {Object.entries(result.headers)
                            .map(([k, v]) => `${k}: ${v}`)
                            .join('\n')}
                    </pre>
                )}
            </div>
        </div>
    );
}
