import AppLogoIcon from '@/components/icons/app-logo-icon';
import GoogleIcon from '@/components/icons/google-icon';
import { Head, Link, router, useForm } from '@inertiajs/react';
import { Eye, EyeOff, LoaderCircle } from 'lucide-react';
import { FormEventHandler, useEffect, useState } from 'react';
import { toast } from 'sonner';

import InputError from '@/components/input-error';
import LoadingOverlay from '@/components/loading-overlay';
import { Toaster } from '@/components/toaster';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface LoginForm {
    email: string;
    password: string;
    remember: boolean;
    [key: string]: string | boolean | null | undefined;
}

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [resetEmail, setResetEmail] = useState('');
    const [resetEmailError, setResetEmailError] = useState('');
    const { data, setData, post, processing, errors, reset } = useForm<LoginForm>({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post(route('login'), {
            onError: () => {
                toast.error('Email atau kata sandi tidak sesuai', {
                    description: 'Periksa kembali data login Anda dan coba lagi atau hubungi admin untuk menindaklanjuti',
                }); 
            },
            onFinish: () => reset('password'),
        });
    };

    useEffect(() => {
        const offInvalid = router.on('invalid', (event) => {
            event.preventDefault();
            toast.error('Terjadi kesalahan saat memuat data', {
                description: 'Sepertinya ada kendala di sistem, coba beberapa saat lagi, atau hubungi admin untuk menindaklanjuti',
            });
        });

        const offException = router.on('exception', (event) => {
            event.preventDefault();
            toast.error('Periksa koneksi internet Anda', {
                description: 'Gagal memuat, sepertinya koneksi kamu bermasalah. Coba periksa jaringan lalu coba lagi.',
            });
        });

        return () => {
            offInvalid();
            offException();
        };
    }, []);

    return (
        <div className="flex min-h-svh">
            <Head title="Log in" />
            <Toaster />

            <LoadingOverlay show={processing} />

            <section className="relative hidden w-[46%] shrink-0 overflow-hidden lg:block">
                <img src="/images/login-image.jpeg" alt="" className="absolute inset-0 h-full w-full object-cover" />
                <div
                    aria-hidden="true"
                    className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(27,24,19,0.72)_0%,rgba(27,24,19,0.16)_38%,rgba(27,24,19,0.60)_74%,rgba(27,24,19,0.92)_100%)]"
                />

                <div className="relative flex h-full flex-col justify-between p-10 xl:p-14">
                    <Link href={route('home')} className="flex w-fit items-center gap-2.5">
                        <AppLogoIcon className="size-6 shrink-0 text-white" />
                        <span className="font-poppins text-lg leading-none font-semibold text-white">
                            HexaRIS
                        </span>
                    </Link>

                    <div className="max-w-md">
                        <h2 className="font-poppins text-3xl leading-[1.15] font-semibold tracking-tight text-white xl:text-4xl">
                            Platform Assistant
                            <br />
                            untuk Tim HRD
                        </h2>
                        <p className="mt-4 text-sm leading-relaxed text-white/75">
                            HRIS modern disertai AI untuk bantu menyederhanakan, mengotomatisasi, dan mengoptimalkan operasional perusahaan dalam
                            skala besar.
                        </p>
                    </div>
                </div>
            </section>

            {/* Form panel */}
            <main className="flex flex-1 items-center justify-center p-6 md:p-10">
                <div className="w-full max-w-lg">
                    <Link href={route('home')} className="mb-10 flex w-fit items-center gap-2.5 lg:hidden">
                        <AppLogoIcon className="text-primary size-6 shrink-0" />
                        <span className="font-poppins text-lg leading-none font-semibold">
                            <span className="text-primary">Hexa</span>
                            <span className="text-foreground">RIS</span>
                        </span>
                    </Link>

                    <div className="mb-8 space-y-2">
                        <h1 className="font-poppins text-2xl font-semibold tracking-tight">Selamat Datang di HRIS</h1>
                        <p className="text-muted-foreground text-sm">Silakan masukkan email dan kata sandi Anda untuk masuk.</p>
                    </div>

                    <form className="flex flex-col gap-6" onSubmit={submit}>
                        <div className="grid gap-6">
                            <div className="grid gap-2">
                                <Label htmlFor="email">Email</Label>
                                <Input
                                    id="email"
                                    type="email"
                                    autoFocus
                                    tabIndex={1}
                                    autoComplete="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Masukkan Email"
                                    className={errors.email && 'border-destructive focus-visible:ring-destructive'}
                                />
                                <InputError message={errors.email} />
                            </div>

                            <div className="grid gap-2">
                                <Label htmlFor="password">Kata Sandi</Label>
                                <div className="relative">
                                    <Input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        tabIndex={2}
                                        autoComplete="current-password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        placeholder="Masukkan Kata Sandi"
                                        className={cn('pr-10', errors.password && 'border-destructive focus-visible:ring-destructive')}

                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((show) => !show)}
                                        tabIndex={-1}
                                        className="text-muted-foreground hover:text-foreground absolute inset-y-0 right-0 flex w-10 items-center justify-center"
                                        aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <InputError message={errors.password} />
                            </div>

                            <div className="flex w-full justify-end">
                                <Dialog>
                                    <DialogTrigger asChild>
                                        <button type="button" className="text-primary font-semibold text-sm hover:underline">
                                            Lupa Kata Sandi?
                                        </button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Edit Password</DialogTitle>
                                            <DialogDescription>
                                                Masukkan email Anda dan kami akan mengirimkan tautan untuk mengatur ulang kata sandi Anda.
                                            </DialogDescription>
                                        </DialogHeader>
                                        <form
                                            className="flex flex-col gap-4"
                                            onSubmit={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();

                                                if (!resetEmail.trim()) {
                                                    setResetEmailError('Email wajib diisi.');
                                                    return;
                                                }

                                                if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail)) {
                                                    setResetEmailError('Format email tidak valid.');
                                                    return;
                                                }

                                                setResetEmailError('');
                                                router.visit(route('password.reset'));
                                            }}
                                        >
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="reset-email">Email</Label>
                                                <Input
                                                    id="reset-email"
                                                    type="email"
                                                    placeholder="Masukkan Email"
                                                    name="reset-password"
                                                    value={resetEmail}
                                                    onChange={(e) => {
                                                        setResetEmail(e.target.value);
                                                        if (resetEmailError) setResetEmailError('');
                                                    }}
                                                    className={cn(resetEmailError && 'border-destructive focus-visible:ring-destructive')}
                                                />
                                                <InputError message={resetEmailError} />
                                            </div>
                                            <Button type="submit" className="cursor-pointer w-full">
                                                Kirim
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>

                            <Button type="submit" className="cursor-pointer w-full" tabIndex={4} disabled={processing}>
                                {processing && <LoaderCircle className="h-4 w-4 animate-spin" />}
                                Kirim
                            </Button>

                            <div className="flex items-center gap-3">
                                <div className="bg-border h-px flex-1" />
                                <span className="text-muted-foreground text-xs">or log in with</span>
                                <div className="bg-border h-px flex-1" />
                            </div>

                            <Button type="button" variant="outline" className="w-full cursor-pointer">
                                <GoogleIcon className="h-4 w-4" />
                                Google
                            </Button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}
