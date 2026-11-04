import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Camera, UserRound } from 'lucide-react';
import { type ChangeEvent, useRef, useState } from 'react';
import { toast } from 'sonner';
import { ChangePasswordDialog } from './change-password-dialog';
import { PhotoPreviewDialog } from './photo-preview-dialog';
import { type Account } from './settings-data';

interface Props {
    account: Account;
    onSaveAccount: (account: Account) => void;
    avatar: string | null;
    onAvatarChange: (url: string | null) => void;
}

export function AccountSettings({ account, onSaveAccount, avatar, onAvatarChange }: Props) {
    const [form, setForm] = useState(account);
    const [preview, setPreview] = useState<string | null>(null);
    const [passwordOpen, setPasswordOpen] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    const changed = form.name !== account.name || form.email !== account.email;
    const canSave = changed && form.name.trim() !== '' && form.email.trim() !== '';

    const saveAccount = () => {
        onSaveAccount(form);
        toast.success('Perubahan akun disimpan');
    };

    const pickPhoto = (e: ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) setPreview(URL.createObjectURL(file));
        e.target.value = '';
    };

    const confirmPhoto = () => {
        onAvatarChange(preview);
        setPreview(null);
        toast.success('Foto profil diperbarui');
    };

    return (
        <>
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
                    <Button type="button" variant="outline" size="sm" className="gap-1.5 rounded-full" onClick={() => fileRef.current?.click()}>
                        <Camera className="size-3.5" /> Add Photo
                    </Button>
                </div>

                <div className="mt-6 space-y-4">
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">Nama Lengkap</Label>
                        <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">Email</Label>
                        <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl" />
                    </div>
                    <div className="space-y-1.5">
                        <Label className="text-sm font-semibold">Password</Label>
                        <Input type="password" value="**********" disabled className="bg-muted rounded-xl" />
                        <button type="button" className="cursor-pointer text-xs text-[#0A84FF] hover:underline" onClick={() => setPasswordOpen(true)}>
                            Ganti Password?
                        </button>
                    </div>
                </div>

                <Button type="button" className="mt-6 w-full" disabled={!canSave} onClick={saveAccount}>
                    Simpan Perubahan
                </Button>
            </div>

            <PhotoPreviewDialog
                src={preview}
                onClose={() => setPreview(null)}
                onChangePhoto={() => fileRef.current?.click()}
                onConfirm={confirmPhoto}
            />
            <ChangePasswordDialog open={passwordOpen} onOpenChange={setPasswordOpen} />
        </>
    );
}
