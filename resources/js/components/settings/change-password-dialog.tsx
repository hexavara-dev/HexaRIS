import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ChangePasswordDialog({ open, onOpenChange }: Props) {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showNew, setShowNew] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);

    const canSave = newPassword.length >= 8 && newPassword === confirmPassword;

    const reset = () => {
        setNewPassword('');
        setConfirmPassword('');
        setShowNew(false);
        setShowConfirm(false);
    };

    const close = (next: boolean) => {
        onOpenChange(next);
        if (!next) reset();
    };

    const save = () => {
        toast.success('Password berhasil diubah');
        close(false);
    };

    return (
        <Dialog open={open} onOpenChange={close}>
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
                    <Button type="button" className="w-full" disabled={!canSave} onClick={save}>
                        Simpan
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
