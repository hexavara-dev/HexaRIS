import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';
import { Search } from 'lucide-react';
import { useState } from 'react';
import { AccountSettings } from './settings/account-settings';
import { CompanySettings } from './settings/company-settings';
import { type Account, INITIAL_COMPANY, MENUS, type MenuValue } from './settings/settings-data';

interface Props {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function SettingsDialog({ open, onOpenChange }: Props) {
    const { auth } = usePage<SharedData>().props;
    const [menu, setMenu] = useState<MenuValue>('perusahaan');
    const [search, setSearch] = useState('');

    const [company, setCompany] = useState(INITIAL_COMPANY);
    const [account, setAccount] = useState<Account>({ name: auth.user.name, email: auth.user.email });
    const [avatar, setAvatar] = useState<string | null>(null);

    const visibleMenus = MENUS.filter((m) => m.label.toLowerCase().includes(search.trim().toLowerCase()));
    const active = MENUS.find((m) => m.value === menu)!;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
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
                                    onClick={() => setMenu(value)}
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

                        {menu === 'perusahaan' && <CompanySettings company={company} onSave={setCompany} />}
                        {menu === 'akun' && (
                            <AccountSettings account={account} onSaveAccount={setAccount} avatar={avatar} onAvatarChange={setAvatar} />
                        )}
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}
