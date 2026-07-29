import { RequestPanel, type RouteEntry } from '@/components/docs/request-panel';
import { ResponseViewer } from '@/components/docs/response-viewer';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import type { ApiResponseResult } from '@/lib/api-explorer-request';
import { useMemo, useState } from 'react';

export default function ApiExplorer({ routes }: { routes: RouteEntry[] }) {
    const [q, setQ] = useState('');
    const [selected, setSelected] = useState<RouteEntry | null>(null);
    const [result, setResult] = useState<ApiResponseResult | null>(null);

    const filtered = useMemo(() => {
        const term = q.toLowerCase();
        return term ? routes.filter((r) => `${r.uri} ${r.name ?? ''} ${r.permission ?? ''}`.toLowerCase().includes(term)) : routes;
    }, [routes, q]);

    const selectRoute = (r: RouteEntry) => {
        setSelected(r);
        setResult(null);
    };

    return (
        <AppLayout>
            <div className="space-y-4 p-6">
                <PageHeader
                    title="API Explorer"
                    description="Send requests to your app's routes — dev only"
                    actions={<Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter routes…" className="w-64" />}
                />
                <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <div className="bg-card max-h-[70vh] overflow-auto rounded-lg border">
                        <ul className="divide-y">
                            {filtered.map((r, i) => {
                                const active = selected?.uri === r.uri && selected?.methods === r.methods;
                                return (
                                    <li key={`${r.uri}-${i}`}>
                                        <button
                                            onClick={() => selectRoute(r)}
                                            className={`hover:bg-muted/50 flex w-full flex-col items-start gap-0.5 px-3 py-2 text-left ${active ? 'bg-muted' : ''}`}
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-[10px]">{r.methods}</span>
                                                <span className="font-mono text-xs">/{r.uri}</span>
                                            </div>
                                            <span className="text-muted-foreground text-[10px]">{r.name ?? '—'}</span>
                                        </button>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                    <div className="space-y-4">
                        <div className="bg-card rounded-lg border p-4">
                            {selected ? (
                                <RequestPanel route={selected} onResult={setResult} />
                            ) : (
                                <div className="text-muted-foreground p-6 text-center text-sm">Select a route to build a request.</div>
                            )}
                        </div>
                        {selected && (
                            <div className="bg-card rounded-lg border p-4">
                                <ResponseViewer result={result} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
