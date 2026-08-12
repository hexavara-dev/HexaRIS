import { NotificationBell } from '@/components/notification-bell';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';
import { useState } from 'react';
import { LemburPanel } from './settings/lembur-panel';
import { PotonganPanel } from './settings/potongan-panel';
import { TunjanganPanel } from './settings/tunjangan-panel';
import { UmumPanel } from './settings/umum-panel';

const TAB_LIST_CLASS = 'flex items-start rounded-lg border border-[#E7E7E7] w-full h-[45px]';
const TAB_TRIGGER_CLASS =
    'flex h-full w-full items-center justify-center rounded-lg py-3 px-4 font-poppins text-sm font-semibold text-[#5C5C5C] data-[state=active]:border-l-4 data-[state=active]:border-l-[#1980C0] data-[state=active]:bg-[#E9F2F9] data-[state=active]:text-[#1980C0]';

export default function Settings() {
    const [tab, setTab] = useState('umum');

    return (
        <AppLayout headerActions={<NotificationBell />}>
            <div className="flex flex-col items-start gap-[19px] p-6">
                <Tabs value={tab} onValueChange={setTab} className="w-full">
                    <TabsList className={TAB_LIST_CLASS}>
                        <TabsTrigger value="umum" variant="button" className={TAB_TRIGGER_CLASS}>
                            Umum
                        </TabsTrigger>
                        <TabsTrigger value="tunjangan" variant="button" className={TAB_TRIGGER_CLASS}>
                            Tunjangan
                        </TabsTrigger>
                        <TabsTrigger value="potongan" variant="button" className={TAB_TRIGGER_CLASS}>
                            Potongan
                        </TabsTrigger>
                        <TabsTrigger value="lembur" variant="button" className={TAB_TRIGGER_CLASS}>
                            Lembur
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="umum" className="w-full pt-[19px]">
                        <UmumPanel />
                    </TabsContent>
                    <TabsContent value="tunjangan" className="w-full pt-[19px]">
                        <TunjanganPanel />
                    </TabsContent>
                    <TabsContent value="potongan" className="w-full pt-[19px]">
                        <PotonganPanel />
                    </TabsContent>
                    <TabsContent value="lembur" className="w-full pt-[19px]">
                        <LemburPanel />
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
