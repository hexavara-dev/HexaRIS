import { FormField } from '@/components/form/form-field';
import { FormLayout } from '@/components/form/form-layout';
import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import AppLayout from '@/layouts/app-layout';
import { useForm } from '@inertiajs/react';
import type { FormEvent } from 'react';

interface UserRow {
    id: number;
    name: string;
    email: string;
    roles: string[];
}

interface Props {
    user: UserRow | null;
    roles: string[];
}

export default function Form({ user, roles }: Props) {
    const { data, setData, post, put, processing, errors } = useForm<{
        name: string;
        email: string;
        password: string;
        roles: string[];
    }>({
        name: user?.name ?? '',
        email: user?.email ?? '',
        password: '',
        roles: user?.roles ?? [],
    });

    const toggle = (name: string) => {
        setData('roles', data.roles.includes(name) ? data.roles.filter((r) => r !== name) : [...data.roles, name]);
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        if (user) {
            put(`/iam/users/${user.id}`);
        } else {
            post('/iam/users');
        }
    };

    return (
        <AppLayout>
            <div className="p-6">
                <PageHeader title={user ? 'Edit user' : 'New user'} />

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

                        <FormField label="Email" htmlFor="email" error={errors.email}>
                            <Input id="email" type="email" value={data.email} onChange={(e) => setData('email', e.target.value)} />
                        </FormField>

                        <FormField label={user ? 'Password (leave blank to keep)' : 'Password'} htmlFor="password" error={errors.password}>
                            <Input id="password" type="password" value={data.password} onChange={(e) => setData('password', e.target.value)} />
                        </FormField>

                        <FormField label="Roles" error={errors.roles as string | undefined}>
                            <div className="grid grid-cols-2 gap-2 rounded border p-3">
                                {roles.map((name) => (
                                    <label key={name} className="flex items-center gap-2 text-sm">
                                        <input type="checkbox" checked={data.roles.includes(name)} onChange={() => toggle(name)} />
                                        {name}
                                    </label>
                                ))}
                            </div>
                        </FormField>
                    </FormLayout>
                </div>
            </div>
        </AppLayout>
    );
}
