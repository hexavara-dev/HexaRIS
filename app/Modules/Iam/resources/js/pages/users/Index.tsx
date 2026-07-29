import { ConfirmDialog } from '@/components/confirm-dialog';
import { Column, DataTable } from '@/components/data-table';
import { PageHeader } from '@/components/page-header';
import { RowActionMenu } from '@/components/row-action-menu';
import { SearchInput } from '@/components/search-input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, Link, router } from '@inertiajs/react';
import { useMemo, useState } from 'react';

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

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Users', href: '/iam/users' }];

export default function Index({ users, roleOptions }: Props) {
    const [toDelete, setToDelete] = useState<UserRow | null>(null);
    const [search, setSearch] = useState('');

    const visibleUsers = useMemo(() => {
        const term = search.trim().toLowerCase();
        if (!term) return users;
        return users.filter((u) => u.name.toLowerCase().includes(term) || u.email.toLowerCase().includes(term));
    }, [users, search]);

    const columns: Column<UserRow>[] = [
        { key: 'name', label: 'Name', sortable: true, filter: { type: 'text' } },
        { key: 'email', label: 'Email', sortable: true, filter: { type: 'text' } },
        {
            key: 'roles',
            label: 'Roles',
            filter: { type: 'select', options: roleOptions },
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
        {
            key: 'actions',
            label: '',
            align: 'right',
            render: (u) => (
                <div className="flex justify-end">
                    <RowActionMenu
                        actions={[
                            { label: 'Edit', href: `/iam/users/${u.id}/edit` },
                            { label: 'Delete', destructive: true, onClick: () => setToDelete(u) },
                        ]}
                    />
                </div>
            ),
        },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Users" />
            <div className="space-y-4 p-6">
                <PageHeader
                    title="Users"
                    subtitle="Manage accounts & roles"
                    actions={
                        <div className="flex items-center gap-2">
                            <SearchInput placeholder="Search users…" onSearch={setSearch} />
                            <Button asChild>
                                <Link href="/iam/users/create">New user</Link>
                            </Button>
                        </div>
                    }
                />
                <DataTable columns={columns} rows={visibleUsers} />
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
