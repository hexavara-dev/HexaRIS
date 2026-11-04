import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CalendarDays, Code, MapPin, PenLine, UserRound } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { CEO_OPTIONS, type Company, today } from './settings-data';

interface Props {
    company: Company;
    onSave: (company: Company) => void;
}

export function CompanySettings({ company, onSave }: Props) {
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState(company);

    const canSave = form.name.trim() !== '' && form.address.trim() !== '';

    const save = () => {
        onSave({ ...form, updatedAt: today() });
        setEditing(false);
        toast.success('Data perusahaan diperbarui');
    };

    if (editing) {
        return (
            <>
                <p className="text-muted-foreground mt-2 text-xs">
                    <button type="button" className="cursor-pointer hover:underline" onClick={() => setEditing(false)}>
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
                            <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                Alamat <span className="text-red-500">*</span>
                            </Label>
                            <Input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="rounded-xl" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-sm font-semibold">
                                CEO/Founder <span className="text-red-500">*</span>
                            </Label>
                            <Select value={form.pic} onValueChange={(pic) => setForm({ ...form, pic })}>
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
                    <Button type="button" className="mt-6 w-full" disabled={!canSave} onClick={save}>
                        Simpan
                    </Button>
                </div>
            </>
        );
    }

    return (
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
                        setForm(company);
                        setEditing(true);
                    }}
                >
                    <PenLine className="size-3.5" /> Edit Data
                </Button>
            </div>
            <dl className="text-muted-foreground mt-5 space-y-3 text-sm">
                <div className="flex items-center gap-2.5">
                    <Code className="size-4" /> {company.code}
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
    );
}
