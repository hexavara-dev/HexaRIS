import { ConfirmDialog } from '@/components/confirm-dialog';
import { Column, DataTable, type SearchConfig } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

interface Props {
    roles: Role[];
}

const roleSearch: SearchConfig = { keys: ['name'], placeholder: 'Search roles…' };

export default function Index({ roles }: Props) {
    const [toDelete, setToDelete] = useState<Role | null>(null);

    const columns: Column<Role>[] = [
        {
            key: 'name',
            label: 'Name',
            sortable: true,
            render: (r) => <Badge variant={r.name === 'super-admin' ? 'success' : 'secondary'}>{r.name}</Badge>,
        },
        {
            key: 'permissions',
            label: 'Permissions',
            render: (r) => <Badge variant="info">{r.permissions.length} permissions</Badge>,
        },
    ];

    return (
        <AppLayout>
            <div className="space-y-4 p-6">
                <PageHeader
                    title="Roles"
                    description="Manage roles and their permissions"
                    actions={
                        <Button asChild>
                            <Link href="/iam/roles/create">New role</Link>
                        </Button>
                    }
                />
                <DataTable
                    columns={columns}
                    data={roles}
                    search={roleSearch}
                    // super-admin is the bypass role — it must not be editable or deletable.
                    rowActions={(r) =>
                        r.name === 'super-admin'
                            ? []
                            : [
                                  { label: 'Edit', href: `/iam/roles/${r.id}/edit` },
                                  { label: 'Delete', destructive: true, onClick: () => setToDelete(r) },
                              ]
                    }
                />
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
