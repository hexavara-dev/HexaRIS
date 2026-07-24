import AppLogoIcon from '@/components/icons/app-logo-icon';
import { Button } from '@/components/ui/button';
import { type SharedData } from '@/types';
import { Head, Link, usePage } from '@inertiajs/react';

export default function Welcome() {
    const { auth } = usePage<SharedData>().props;
    const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

    return (
        <>
            <Head title="Welcome" />
            <div className="bg-background flex min-h-screen flex-col items-center justify-center gap-8 p-6 text-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="bg-primary text-primary-foreground flex h-14 w-14 items-center justify-center rounded-xl">
                        <AppLogoIcon className="h-8 w-8 fill-current" />
                    </div>
                    <div className="space-y-1">
                        <h1 className="text-2xl font-semibold tracking-tight">{appName}</h1>
                        <p className="text-muted-foreground text-sm">A modular Laravel + Inertia starter.</p>
                    </div>
                </div>
                <Button asChild>
                    {auth.user ? <Link href={route('dashboard')}>Go to dashboard</Link> : <Link href={route('login')}>Log in</Link>}
                </Button>
            </div>
        </>
    );
}
