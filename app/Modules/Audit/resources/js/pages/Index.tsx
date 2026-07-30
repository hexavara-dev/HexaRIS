import { Column, DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, router } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Audit log', href: '/audit' }];

interface AuditEntry {
    id: number;
    description: string;
    event: string | null;
    subjectType: string | null;
    subjectId: number | string | null;
    causer: string | null;
    changes: { old: Record<string, unknown>; new: Record<string, unknown> } | null;
    properties: Record<string, unknown>;
    createdAt: string;
}

interface Props {
    activities: Paginated<AuditEntry>;
    filters: { event?: string; module?: string; date_from?: string; date_to?: string };
    events: string[];
}

export default function Index({ activities, filters, events }: Props) {
    const [event, setEvent] = useState(filters.event ?? '');
    const [moduleFilter, setModuleFilter] = useState(filters.module ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');

    const applyFilters = () => {
        router.get('/audit', { event, module: moduleFilter, date_from: dateFrom, date_to: dateTo }, { preserveState: true, replace: true });
    };

    const columns: Column<AuditEntry>[] = [
        {
            key: 'createdAt',
            label: 'When',
            render: (a) => <span className="whitespace-nowrap">{new Date(a.createdAt).toLocaleString()}</span>,
        },
        { key: 'event', label: 'Event', render: (a) => a.event ?? '—' },
        { key: 'description', label: 'Description' },
        {
            key: 'subject',
            label: 'Subject',
            render: (a) => (a.subjectType ? `${a.subjectType}#${a.subjectId}` : '—'),
        },
        {
            key: 'causer',
            label: 'By',
            render: (a) => a.causer ?? '—',
        },
        {
            key: 'changes',
            label: 'Changes',
            render: (a) => (a.changes ? <pre className="max-w-md overflow-x-auto text-xs">{JSON.stringify(a.changes, null, 2)}</pre> : '—'),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                <Head title="Audit log" />
                <PageHeader title="Audit log" />

                <div className="mt-4 mb-4 flex flex-wrap gap-2">
                    <select className="rounded border px-2 py-1 text-sm" value={event} onChange={(e) => setEvent(e.target.value)}>
                        <option value="">All events</option>
                        {events.map((ev) => (
                            <option key={ev} value={ev}>
                                {ev}
                            </option>
                        ))}
                    </select>
                    <Input className="h-8 w-40" placeholder="Module" value={moduleFilter} onChange={(e) => setModuleFilter(e.target.value)} />
                    <Input className="h-8 w-40" type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
                    <Input className="h-8 w-40" type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
                    <button className="rounded bg-black px-3 py-1 text-sm text-white" onClick={applyFilters}>
                        Filter
                    </button>
                </div>

                <DataTable mode="server" columns={columns} rows={activities} />
            </div>
        </AppLayout>
    );
}
