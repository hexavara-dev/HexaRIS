import { PageHeader } from '@/components/page-header';
import { Button } from '@/components/ui/button';
import { usePermissions } from '@/hooks/use-permissions';
import AppLayout from '@/layouts/app-layout';
import { router } from '@inertiajs/react';
import { RotateCw } from 'lucide-react';
import { useState } from 'react';

export default function Index({ groups }: { groups: Record<string, string[]> }) {
    const { can } = usePermissions();
    const [syncing, setSyncing] = useState(false);

    const sync = () => {
        router.post(
            route('iam.permissions.sync'),
            {},
            {
                preserveScroll: true,
                onStart: () => setSyncing(true),
                onFinish: () => setSyncing(false),
            },
        );
    };

    return (
        <AppLayout>
            <div className="p-6">
                <PageHeader
                    title="Permissions"
                    description="Declared per module. Sync reconciles those declarations into the database."
                    actions={
                        can('permissions.sync') ? (
                            <Button onClick={sync} disabled={syncing}>
                                <RotateCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Syncing…' : 'Sync permissions'}
                            </Button>
                        ) : undefined
                    }
                />

                <div className="mt-6 grid gap-4 md:grid-cols-2">
                    {Object.entries(groups).map(([group, names]) => (
                        <div key={group} className="rounded border p-3">
                            <h2 className="mb-2 font-semibold capitalize">{group}</h2>
                            <ul className="space-y-1 text-sm">
                                {names.map((name) => (
                                    <li key={name} className="text-muted-foreground">
                                        {name}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}
