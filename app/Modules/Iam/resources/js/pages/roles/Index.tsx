import { ConfirmDialog } from '@/components/confirm-dialog';
import { Column, DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { RowActionMenu } from '@/components/row-action-menu';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Paginated } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Roles', href: '/iam/roles' }];

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

interface Props {
    roles: Paginated<Role>;
    sort: string | null;
    filters: Record<string, string>;
}

export default function Index({ roles, sort, filters }: Props) {
    const [toDelete, setToDelete] = useState<Role | null>(null);

    const columns: Column<Role>[] = [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            filter: { type: 'text' },
            render: (r) => <Badge variant={r.name === 'super-admin' ? 'success' : 'secondary'}>{r.name}</Badge>,
        },
        {
            key: 'permissions',
            label: 'Permissions',
            render: (r) => <Badge variant="info">{r.permissions.length} permissions</Badge>,
        },
        {
            key: 'actions',
            label: '',
            render: (r) => {
                if (r.name === 'super-admin') {
                    return <div className="flex justify-end" />;
                }
                return (
                    <div className="flex justify-end">
                        <RowActionMenu
                            actions={[
                                { label: 'Edit', href: `/iam/roles/${r.id}/edit` },
                                { label: 'Delete', destructive: true, onClick: () => setToDelete(r) },
                            ]}
                        />
                    </div>
                );
            },
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Roles" />
            <div className="space-y-4 p-6">
                <PageHeader
                    title="Roles"
                    subtitle="Manage roles and their permissions"
                    actions={
                        <Button asChild>
                            <Link href="/iam/roles/create">New role</Link>
                        </Button>
                    }
                />
                <DataTable columns={columns} rows={roles} sort={sort} filters={filters} />
            </div>
            <ConfirmDialog
                open={toDelete !== null}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="Delete role?"
                description={toDelete ? `This permanently deletes the "${toDelete.name}" role.` : undefined}
                confirmLabel="Delete"
                onConfirm={() => {
                    if (toDelete) router.delete(`/iam/roles/${toDelete.id}`);
                }}
            />
        </AppLayout>
    );
}
