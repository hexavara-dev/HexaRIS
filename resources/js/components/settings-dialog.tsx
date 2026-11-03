import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Building2, CalendarDays, Camera, Eye, EyeOff, Hash, MapPin, PenLine, Search, UserRound } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { toast } from 'sonner';

interface Company {
    name: string;
    code: string;
    address: string;
    pic: string;
    updatedAt: string;
}

// Mock until the company API exists.
const INITIAL_COMPANY: Company = {
    name: 'PT. Abadi Jaya',
    code: 'B1920',
    address: 'Jl. Ahmad Yani 09, Jakarta',
    pic: 'Agung Wijaya',
    updatedAt: '12 Oktober 2023',
};

const CEO_OPTIONS = ['Agung Wijaya', 'Rizky Pratama', 'Dinda Putri'];

const MENUS = [
    { value: 'perusahaan', label: 'Perusahaan', icon: Building2 },
    { value: 'akun', label: 'Akun', icon: UserRound },
] as const;

type MenuValue = (typeof MENUS)[number]['value'];

const today = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [menu, setMenu] = useState<MenuValue>('perusahaan');
    const [search, setSearch] = useState('');

    const [company, setCompany] = useState(INITIAL_COMPANY);
    const [editingCompany, setEditingCompany] = useState(false);
    const [companyForm, setCompanyForm] = useState(INITIAL_COMPANY);

    const [savedAccount, setSavedAccount] = useState({ name: auth.user.name, email: auth.user.email });
    const [accountForm, setAccountForm] = useState(savedAccount);

    const [avatar, setAvatar] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(null);
    const fileRef = useRef<HTMLInputElement>(null);

    const [passwordOpen, setPasswordOpen] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const canSavePassword = newPassword.length >= 8 && newPassword === confirmPassword;

    const resetPassword = () => {
        setNewPassword('');
        setConfirmPassword('');
        setShowNew(false);
        setShowConfirm(false);
    };

    const savePassword = () => {
        toast.success('Password berhasil diubah');
        setPasswordOpen(false);
        resetPassword();
    };

    const visibleMenus = MENUS.filter((m) => m.label.toLowerCase().includes(search.trim().toLowerCase()));
    const active = MENUS.find((m) => m.value === menu)!;

    const canSaveCompany = companyForm.name.trim() !== '' && companyForm.address.trim() !== '';
    const accountChanged = accountForm.name !== savedAccount.name || accountForm.email !== savedAccount.email;
    const canSaveAccount = accountChanged && accountForm.name.trim() !== '' && accountForm.email.trim() !== '';

    const close = (next: boolean) => {
        onOpenChange(next);
        if (!next) setEditingCompany(false);
    };

    const selectMenu = (value: MenuValue) => {
        setMenu(value);
        setEditingCompany(false);
    };

    const saveCompany = () => {
        setCompany({ ...companyForm, updatedAt: today() });
        setEditingCompany(false);
        toast.success('Data perusahaan diperbarui');
    };

    const saveAccount = () => {
        setSavedAccount(accountForm);
        toast.success('Perubahan akun disimpan');
    };

    const pickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreview(URL.createObjectURL(file));
        e.target.value = '';
    };

    const confirmPhoto = () => {
        setAvatar(preview);
        setPreview(null);
        toast.success('Foto profil diperbarui');
    };

    return (
        <Dialog open={open} onOpenChange={close}>
            <DialogContent className="font-poppins grid-cols-1 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-3xl">
                <DialogTitle className="sr-only">Setting</DialogTitle>
                <div className="grid h-[520px] grid-cols-[minmax(0,260px)_1fr]">
                    <aside className="flex flex-col gap-4 border-r p-4 pt-5">
                        <div className="relative">
                            <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
                            <Input
                                type="text"
                                placeholder="Search settings"
                                className="rounded-full pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                            />
                        </div>
                        <nav className="flex flex-col gap-1">
                            {visibleMenus.map(({ value, label, icon: Icon }) => (
                                <button
                                    key={value}
                                    type="button"
                                    onClick={() => selectMenu(value)}
                                    className={`flex cursor-pointer items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                                        menu === value ? 'bg-[#EEF6FF] font-medium text-[#0A84FF]' : 'text-muted-foreground hover:bg-muted'
                                    }`}
                                >
                                    <Icon className="size-4" />
                                    {label}
                                </button>
                            ))}
                        </nav>
                    </aside>

                    <section className="overflow-y-auto p-6">
                        <h2 className="text-lg font-semibold">{active.label}</h2>

                        {menu === 'perusahaan' && !editingCompany && (
                            <div className="mt-5 rounded-2xl border p-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <p className="text-muted-foreground text-xs">Perusahaan</p>
                                        <h3 className="mt-1 text-xl font-bold">{company.name}</h3>
                                    </div>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5"
                                        onClick={() => {
                                            setCompanyForm(company);
                                            setEditingCompany(true);
                                        }}
                                    >
                                        <PenLine className="size-3.5" /> Edit Data
                                    </Button>
                                </div>
                                <dl className="text-muted-foreground mt-5 space-y-3 text-sm">
                                    <div className="flex items-center gap-2.5">
                                        <Hash className="size-4" /> {company.code}
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <MapPin className="size-4" /> {company.address}
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <UserRound className="size-4" /> {company.pic}
                                    </div>
                                    <div className="flex items-center gap-2.5">
                                        <CalendarDays className="size-4" /> Diperbarui: {company.updatedAt}
                                    </div>
                                </dl>
                            </div>
                        )}

                        {menu === 'perusahaan' && editingCompany && (
                            <>
                                <p className="text-muted-foreground mt-2 text-xs">
                                    <button type="button" className="cursor-pointer hover:underline" onClick={() => setEditingCompany(false)}>
                                        Perusahaan
                                    </button>{' '}
                                    &gt; Edit Perusahaan
                                </p>
                                <div className="mt-4 rounded-2xl border p-5">
                                    <div className="space-y-4">
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">
                                                Nama Perusahaan <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                value={companyForm.name}
                                                onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                                                className="rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">
                                                Alamat <span className="text-red-500">*</span>
                                            </Label>
                                            <Input
                                                value={companyForm.address}
                                                onChange={(e) => setCompanyForm({ ...companyForm, address: e.target.value })}
                                                className="rounded-xl"
                                            />
                                        </div>
                                        <div className="space-y-1.5">
                                            <Label className="text-sm font-semibold">
                                                CEO/Founder <span className="text-red-500">*</span>
                                            </Label>
                                            <Select value={companyForm.pic} onValueChange={(pic) => setCompanyForm({ ...companyForm, pic })}>
                                                <SelectTrigger className="h-10 w-full rounded-xl">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="z-[60]">
                                                    {CEO_OPTIONS.map((name) => (
                                                        <SelectItem key={name} value={name}>
                                                            {name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                    <Button type="button" className="mt-6 w-full" disabled={!canSaveCompany} onClick={saveCompany}>
                                        Simpan
                                    </Button>
                                </div>
                            </>
                        )}

                        {menu === 'akun' && (
                            <div className="mt-5 rounded-2xl border p-6">
                                <div className="flex flex-col items-center gap-2">
                                    {avatar ? (
                                        <img src={avatar} alt="Foto profil" className="size-20 rounded-full object-cover" />
                                    ) : (
                                        <div className="bg-muted flex size-20 items-center justify-center rounded-full">
                                            <UserRound className="text-muted-foreground size-10" />
                                        </div>
                                    )}
                                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickPhoto} />
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="gap-1.5 rounded-full"
                                        onClick={() => fileRef.current?.click()}
                                    >
                                        <Camera className="size-3.5" /> Add Photo
                                    </Button>
                                </div>

                                <div className="mt-6 space-y-4">
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">Nama Lengkap</Label>
                                        <Input
                                            value={accountForm.name}
                                            onChange={(e) => setAccountForm({ ...accountForm, name: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">Email</Label>
                                        <Input
                                            type="email"
                                            value={accountForm.email}
                                            onChange={(e) => setAccountForm({ ...accountForm, email: e.target.value })}
                                            className="rounded-xl"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <Label className="text-sm font-semibold">Password</Label>
                                        <Input type="password" value="**********" disabled className="bg-muted rounded-xl" />
                                        <button
                                            type="button"
                                            className="cursor-pointer text-xs text-[#0A84FF] hover:underline"
                                            onClick={() => setPasswordOpen(true)}
                                        >
                                            Ganti Password?
                                        </button>
                                    </div>
                                </div>

                                <Button type="button" className="mt-6 w-full" disabled={!canSaveAccount} onClick={saveAccount}>
                                    Simpan Perubahan
                                </Button>
                            </div>
                        )}
                    </section>
                </div>

                <Dialog open={preview !== null} onOpenChange={(next) => !next && setPreview(null)}>
                    <DialogContent className="font-poppins grid-cols-1 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
                        <DialogHeader className="border-b px-6 py-4">
                            <DialogTitle className="text-base">Pratinjau</DialogTitle>
                        </DialogHeader>
                        <div className="flex justify-center px-6 py-8">
                            {preview && <img src={preview} alt="Pratinjau foto" className="size-52 rounded-full object-cover" />}
                        </div>
                        <div className="flex items-center justify-between px-6 pb-6">
                            <button
                                type="button"
                                className="cursor-pointer text-sm text-[#0A84FF] hover:underline"
                                onClick={() => fileRef.current?.click()}
                            >
                                Ubah Foto
                            </button>
                            <Button type="button" className="w-40 rounded-full" onClick={confirmPhoto}>
                                Simpan
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>

                <Dialog
                    open={passwordOpen}
                    onOpenChange={(next) => {
                        setPasswordOpen(next);
                        if (!next) resetPassword();
                    }}
                >
                    <DialogContent className="font-poppins grid-cols-1 gap-0 overflow-hidden rounded-2xl p-0 sm:max-w-md">
                        <DialogHeader className="border-b px-6 py-4">
                            <DialogTitle className="text-base">Account</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4 px-6 py-5">
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        type={showNew ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="rounded-xl pr-10"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showNew ? 'Sembunyikan password' : 'Tampilkan password'}
                                        className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                                        onClick={() => setShowNew(!showNew)}
                                    >
                                        {showNew ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <Label className="text-sm font-semibold">Konfirmasi Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        type={showConfirm ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="rounded-xl pr-10"
                                    />
                                    <button
                                        type="button"
                                        aria-label={showConfirm ? 'Sembunyikan password' : 'Tampilkan password'}
                                        className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2 cursor-pointer"
                                        onClick={() => setShowConfirm(!showConfirm)}
                                    >
                                        {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                    </button>
                                </div>
                                {confirmPassword !== '' && confirmPassword !== newPassword && (
                                    <p className="text-xs text-red-500">Konfirmasi password belum sama</p>
                                )}
                            </div>
                        </div>
                        <div className="border-t px-6 py-4">
                            <Button type="button" className="w-full" disabled={!canSavePassword} onClick={savePassword}>
                                Simpan
                            </Button>
                        </div>
                    </DialogContent>
                </Dialog>
            </DialogContent>
        </Dialog>
    );
}
