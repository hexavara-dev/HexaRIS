import { FormField } from '@/components/form/form-field';
import { FormLayout } from '@/components/form/form-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface Role {
    id: number;
    name: string;
    permissions: string[];
}

interface Props {
    role: Role | null;
    permissions: Record<string, string[]>;
}

const getBreadcrumbs = (role: Props['role']): BreadcrumbItem[] => [
    { title: 'Roles', href: '/iam/roles' },
    { title: role ? 'Edit' : 'New', href: '#' },
];

export default function Form({ role, permissions }: Props) {
    const breadcrumbs = getBreadcrumbs(role);
    const { data, setData, post, put, processing, errors } = useForm<{ name: string; permissions: string[] }>({
        name: role?.name ?? '',
        permissions: role?.permissions ?? [],
    });

    const toggle = (name: string) => {
        setData('permissions', data.permissions.includes(name) ? data.permissions.filter((p) => p !== name) : [...data.permissions, name]);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (role) {
            put(`/iam/roles/${role.id}`);
        } else {
            post('/iam/roles');
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="p-6">
                <Head title={role ? 'Edit role' : 'New role'} />
                <PageHeader title={role ? 'Edit role' : 'New role'} />

                <div className="mt-6">
                    <FormLayout
                        onSubmit={submit}
                        footer={
                            <Button type="submit" disabled={processing}>
                                Save
                            </Button>
                        }
                    >
                        <FormField label="Name" htmlFor="name" error={errors.name}>
                            <Input id="name" value={data.name} onChange={(e) => setData('name', e.target.value)} />
                        </FormField>

                        <FormField label="Permissions" error={errors.permissions as string | undefined}>
                            <div className="space-y-4">
                                {Object.entries(permissions).map(([group, names]) => (
                                    <fieldset key={group} className="rounded border p-3">
                                        <legend className="px-1 text-sm font-semibold capitalize">{group}</legend>
                                        <div className="grid grid-cols-2 gap-2">
                                            {names.map((name) => (
                                                <label key={name} className="flex items-center gap-2 text-sm">
                                                    <input type="checkbox" checked={data.permissions.includes(name)} onChange={() => toggle(name)} />
                                                    {name}
                                                </label>
                                            ))}
                                        </div>
                                    </fieldset>
                                ))}
                            </div>
                        </FormField>
                    </FormLayout>
                </div>
            </div>
        </AppLayout>
    );
}
