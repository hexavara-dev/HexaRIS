import AppLogoIcon from '@/components/icons/app-logo-icon';
import { Head, Link } from '@inertiajs/react';
import { Eye, EyeOff, LayoutGrid } from 'lucide-react';
import { FormEventHandler, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ResetPassword() {
    const [password, setPassword] = useState('');
    const [passwordConfirmation, setPasswordConfirmation] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmation, setShowConfirmation] = useState(false);

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
    };

    return (
        <div className="bg-background flex min-h-svh flex-col">
            <Head title="Reset Password" />

            <nav className="flex items-center justify-between px-6 py-4">
                <Link href={route('home')} className="flex items-center gap-2">
                    <AppLogoIcon className="text-primary size-6 shrink-0" />
                    <span className="font-poppins text-lg leading-none font-semibold">
                        <span className="text-primary">Hexa</span>
                        <span className="text-foreground">RIS</span>
                    </span>
                </Link>
                <div className="flex items-center gap-4">
                    <LayoutGrid aria-hidden="true" className="text-muted-foreground h-5 w-5" />
                    <Button asChild size="sm">
                        <Link href={route('login')}>Sign in</Link>
                    </Button>
                </div>
            </nav>

            <main className="flex flex-1 flex-col items-center justify-center p-6">
                <h1 className="font-poppins text-foreground mb-6 text-xl font-bold tracking-tight">Reset your password</h1>

                <div className="border-border w-full max-w-md rounded-lg border p-8 shadow-sm">
                    <form className="flex flex-col gap-5" onSubmit={submit}>
                        <div className="grid gap-2">
                            <Label htmlFor="password">New Password</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    required
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="new-password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((show) => !show)}
                                    tabIndex={-1}
                                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="grid gap-2">
                            <Label htmlFor="password_confirmation">Confirm Password</Label>
                            <div className="relative">
                                <Input
                                    id="password_confirmation"
                                    type={showConfirmation ? 'text' : 'password'}
                                    required
                                    tabIndex={2}
                                    autoComplete="new-password"
                                    value={passwordConfirmation}
                                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                                    className="pr-10"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmation((show) => !show)}
                                    tabIndex={-1}
                                    className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center"
                                    aria-label={showConfirmation ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmation ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button type="submit" className="mt-2 w-full" tabIndex={3}>
                            Send
                        </Button>
                    </form>
                </div>
            </main>

            <footer className="text-muted-foreground flex items-center justify-between px-6 py-4 text-xs">
                <div className="flex gap-6">
                    <span>Advertising</span>
                    <span>Business</span>
                    <span>How Search works</span>
                </div>
                <div className="flex gap-6">
                    <span>Privacy</span>
                    <span>Terms</span>
                    <span>Settings</span>
                </div>
            </footer>
        </div>
    );
}
