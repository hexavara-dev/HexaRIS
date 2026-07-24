import { ConfirmDialog } from '@/components/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { usePermissions } from '@/hooks/use-permissions';
import { sendApiRequest, type ApiResponseResult } from '@/lib/api-explorer-request';
import { usePage } from '@inertiajs/react';
import { useEffect, useState } from 'react';

export interface BodyField {
    rules: string[];
    required: boolean;
}

export interface RouteEntry {
    methods: string;
    uri: string;
    name: string | null;
    permission: string | null;
    action: string;
    pathParams: string[];
    body: Record<string, BodyField> | null;
}

const MUTATING = ['POST', 'PUT', 'PATCH', 'DELETE'];

function primaryMethod(methods: string): string {
    const list = methods.split('|');
    return MUTATING.find((m) => list.includes(m)) ?? list[0] ?? 'GET';
}

function buildUrl(uri: string, pathValues: Record<string, string>): string {
    return '/' + uri.replace(/\{(\w+)\??\}/g, (_, name: string) => encodeURIComponent(pathValues[name] ?? `:${name}`));
}

export function RequestPanel({ route, onResult }: { route: RouteEntry; onResult: (result: ApiResponseResult) => void }) {
    const page = usePage();
    const { can } = usePermissions();
    const method = primaryMethod(route.methods);
    const isMutation = MUTATING.includes(method);

    const [pathValues, setPathValues] = useState<Record<string, string>>({});
    const [queryRows, setQueryRows] = useState<{ key: string; value: string }[]>([]);
    const [bodyValues, setBodyValues] = useState<Record<string, string>>({});
    const [rawMode, setRawMode] = useState(false);
    const [rawBody, setRawBody] = useState('{}');
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [sending, setSending] = useState(false);

    useEffect(() => {
        setPathValues({});
        setQueryRows([]);
        setBodyValues({});
        setRawBody('{}');
        setRawMode(false);
    }, [route.uri, route.methods]);

    const lacksPermission = route.permission ? !can(route.permission) : false;

    const toggleRawMode = () => {
        if (!rawMode) {
            // entering raw mode: seed the textarea from the current field values
            const obj: Record<string, string> = {};
            for (const [field, value] of Object.entries(bodyValues)) {
                if (value !== '') obj[field] = value;
            }
            setRawBody(JSON.stringify(obj, null, 2));
        }
        setRawMode((m) => !m);
    };

    const resolveBody = (): unknown => {
        if (!isMutation) return undefined;
        if (rawMode || !route.body) {
            try {
                return JSON.parse(rawBody);
            } catch {
                return rawBody;
            }
        }
        const obj: Record<string, string> = {};
        for (const [field, value] of Object.entries(bodyValues)) {
            if (value !== '') obj[field] = value;
        }
        return obj;
    };

    const doSend = async () => {
        setSending(true);
        try {
            const query: Record<string, string> = {};
            for (const row of queryRows) {
                if (row.key) query[row.key] = row.value;
            }
            const result = await sendApiRequest({
                method,
                url: buildUrl(route.uri, pathValues),
                query,
                body: resolveBody(),
                inertiaVersion: typeof page.version === 'string' ? page.version : '',
            });
            onResult(result);
        } finally {
            setSending(false);
        }
    };

    const onSendClick = () => {
        if (isMutation) {
            setConfirmOpen(true);
        } else {
            void doSend();
        }
    };

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant={isMutation ? 'destructive' : 'default'}>{method}</Badge>
                <code className="font-mono text-sm">/{route.uri}</code>
                {route.permission && (
                    <Badge variant="secondary" className="font-mono text-[10px]">
                        {route.permission}
                    </Badge>
                )}
            </div>

            {lacksPermission && (
                <div className="border-destructive/40 bg-destructive/5 text-destructive rounded-md border p-2 text-xs">
                    You don't hold <span className="font-mono">{route.permission}</span> — this request will likely return 403.
                </div>
            )}

            {route.pathParams.length > 0 && (
                <div className="space-y-2">
                    <Label className="text-xs font-medium">Path parameters</Label>
                    {route.pathParams.map((param) => (
                        <div key={param} className="flex items-center gap-2">
                            <code className="text-muted-foreground w-32 font-mono text-xs">{param}</code>
                            <Input
                                value={pathValues[param] ?? ''}
                                onChange={(e) => setPathValues((p) => ({ ...p, [param]: e.target.value }))}
                                placeholder={param}
                                className="h-8"
                            />
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium">Query parameters</Label>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setQueryRows((r) => [...r, { key: '', value: '' }])}>
                        + Add
                    </Button>
                </div>
                {queryRows.map((row, i) => (
                    <div key={i} className="flex items-center gap-2">
                        <Input
                            value={row.key}
                            onChange={(e) => setQueryRows((rows) => rows.map((r, j) => (j === i ? { ...r, key: e.target.value } : r)))}
                            placeholder="key"
                            className="h-8"
                        />
                        <Input
                            value={row.value}
                            onChange={(e) => setQueryRows((rows) => rows.map((r, j) => (j === i ? { ...r, value: e.target.value } : r)))}
                            placeholder="value"
                            className="h-8"
                        />
                        <Button type="button" variant="ghost" size="sm" onClick={() => setQueryRows((rows) => rows.filter((_, j) => j !== i))}>
                            ×
                        </Button>
                    </div>
                ))}
            </div>

            {isMutation && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <Label className="text-xs font-medium">Request body</Label>
                        {route.body && (
                            <Button type="button" variant="ghost" size="sm" onClick={toggleRawMode}>
                                {rawMode ? 'Form' : 'Raw JSON'}
                            </Button>
                        )}
                    </div>

                    {!rawMode && route.body ? (
                        <div className="space-y-2">
                            {Object.entries(route.body).map(([field, schema]) => {
                                const nested = field.includes('.');
                                return (
                                    <div key={field} className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <code className="font-mono text-xs">{field}</code>
                                            {schema.required && <span className="text-destructive text-xs">*</span>}
                                            <span className="text-muted-foreground text-[10px]">{schema.rules.join(' · ')}</span>
                                        </div>
                                        {!nested && (
                                            <Input
                                                value={bodyValues[field] ?? ''}
                                                onChange={(e) => setBodyValues((b) => ({ ...b, [field]: e.target.value }))}
                                                placeholder={field}
                                                className="h-8"
                                            />
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <textarea
                            value={rawBody}
                            onChange={(e) => setRawBody(e.target.value)}
                            rows={6}
                            className="border-input bg-background w-full rounded-md border p-2 font-mono text-xs"
                        />
                    )}
                </div>
            )}

            <Button onClick={onSendClick} disabled={sending}>
                {sending ? 'Sending…' : 'Send'}
            </Button>

            <ConfirmDialog
                open={confirmOpen}
                onOpenChange={setConfirmOpen}
                onConfirm={() => void doSend()}
                title="Send a real request?"
                description={`This sends a real ${method} request to /${route.uri} and writes to your dev database.`}
                confirmLabel="Send request"
            />
        </div>
    );
}
