import { ConfirmDialog } from '@/components/confirm-dialog';
import { Column, DataTable, type FilterConfig, type SearchConfig } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { Link, router } from '@inertiajs/react';
import { useState } from 'react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

interface Props {
    users: UserRow[];
    roleOptions: { value: string; label: string }[];
}

const userSearch: SearchConfig = {
    keys: ['name', 'email'],
    placeholder: 'Search users…',
};

export default function Index({ users, roleOptions }: Props) {
    const [toDelete, setToDelete] = useState<UserRow | null>(null);

    const userFilters: FilterConfig[] = [{ key: 'roles', type: 'select', label: 'Roles', options: roleOptions }];

    const columns: Column<UserRow>[] = [
        { key: 'name', label: 'Name', sortable: true },
        { key: 'email', label: 'Email', sortable: true },
        {
            key: 'roles',
            label: 'Roles',
            render: (u) =>
                u.roles.length === 0 ? (
                    '—'
                ) : (
                    <div className="flex flex-wrap gap-1">
                        {u.roles.map((role) => (
                            <Badge key={role} variant={role === 'super-admin' ? 'success' : 'secondary'}>
                                {role}
                            </Badge>
                        ))}
                    </div>
                ),
        },
    ];

    return (
        <AppLayout>
            <div className="space-y-4 p-6">
                <PageHeader
                    title="Users"
                    description="Manage accounts & roles"
                    actions={
                        <Button asChild>
                            <Link href="/iam/users/create">New user</Link>
                        </Button>
                    }
                />
                <DataTable
                    columns={columns}
                    data={users}
                    search={userSearch}
                    filters={userFilters}
                    rowActions={(u) => [
                        { label: 'Edit', href: `/iam/users/${u.id}/edit` },
                        { label: 'Delete', destructive: true, onClick: () => setToDelete(u) },
                    ]}
                />
            </div>
            <ConfirmDialog
                open={toDelete !== null}
                onOpenChange={(open) => !open && setToDelete(null)}
                title="Delete user?"
                description={toDelete ? `This permanently deletes ${toDelete.name}.` : undefined}
                confirmLabel="Delete"
                onConfirm={() => {
                    if (toDelete) router.delete(`/iam/users/${toDelete.id}`);
                }}
            />
        </AppLayout>
    );
}
