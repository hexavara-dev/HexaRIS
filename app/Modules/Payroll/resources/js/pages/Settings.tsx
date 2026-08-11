import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AppLayout from '@/layouts/app-layout';

const TAB_LIST_CLASS = 'flex items-start rounded-lg border border-[#E7E7E7] w-full h-[45px]';

function tabTriggerClass(active: boolean) {
    return active
        ? 'flex h-full w-full items-center justify-center rounded-lg border-l-4 border-l-[#1980C0] bg-[#E9F2F9] py-3 px-4 font-poppins text-sm font-semibold text-[#1980C0]'
        : 'flex h-full w-full items-center justify-center rounded-lg py-3 px-4 font-poppins text-sm font-semibold text-[#5C5C5C]';
}

export default function Settings() {
    return (
        <AppLayout>
            <div className="flex flex-col items-start gap-[19px] p-6">
                <Tabs defaultValue="umum" className="w-full">
                    <TabsList className={TAB_LIST_CLASS}>
                        <TabsTrigger value="umum" variant="button" className={tabTriggerClass(true)}>
                            Umum
                        </TabsTrigger>
                        <TabsTrigger value="tunjangan" variant="button" className={tabTriggerClass(false)}>
                            Tunjangan
                        </TabsTrigger>
                        <TabsTrigger value="potongan" variant="button" className={tabTriggerClass(false)}>
                            Potongan
                        </TabsTrigger>
                        <TabsTrigger value="lembur" variant="button" className={tabTriggerClass(false)}>
                            Lembur
                        </TabsTrigger>
                    </TabsList>
                    <TabsContent value="umum" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                    <TabsContent value="tunjangan" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                    <TabsContent value="potongan" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                    <TabsContent value="lembur" className="w-full pt-[19px]">
                        <div>Coming in a later task</div>
                    </TabsContent>
                </Tabs>
            </div>
        </AppLayout>
    );
}
