import { Head, Link } from '@inertiajs/react';
import { FileX, Filter, Plus, Search } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { type DocumentTemplate } from '@/data/Company/companyDocumentTemplate';
import AppLayout from '@/layouts/app-layout';
import { cn } from '@/lib/utils';
import { type BreadcrumbItem } from '@/types';

import { DeleteTemplateDialog } from '../components/delete-template-dialog';
import { TemplateCard } from '../components/template-card';
import { TemplateDetailDialog } from '../components/template-detail-dialog';
import { TemplateFilterDialog } from '../components/template-filter-dialog';
import { useDocumentTemplates } from '../hooks/use-document-templates';
import { type DocumentTab, DOCUMENT_TABS } from '../lib/document-catalog';

const breadcrumbs: BreadcrumbItem[] = [{ title: 'Dokumen', href: '/company/documents' }];

export default function DocumentCenter() {
    const [activeTab, setActiveTab] = useState<DocumentTab>('company');
    const [search, setSearch] = useState('');
    const [categories, setCategories] = useState<string[]>([]);
    const [filterOpen, setFilterOpen] = useState(false);
    const [detailTemplate, setDetailTemplate] = useState<DocumentTemplate | null>(null);
    const [deletingTemplate, setDeletingTemplate] = useState<DocumentTemplate | null>(null);
    const { templates, deleteTemplate } = useDocumentTemplates();

    const query = search.trim().toLowerCase();
    const isNarrowed = query !== '' || categories.length > 0;

    /** Search matches name or description; an empty category list means "no category filter", not "match nothing". */
    function matchesFilters(template: DocumentTemplate) {
        const matchesSearch =
            query === '' || template.name.toLowerCase().includes(query) || (template.description ?? '').toLowerCase().includes(query);
        const matchesCategory = categories.length === 0 || categories.includes(template.documentCategory ?? '');
        return matchesSearch && matchesCategory;
    }

    const visibleTemplates = templates.filter(matchesFilters);
    const companyTemplates = visibleTemplates.filter((template) => template.type === 'company');
    const departmentTemplates = visibleTemplates.filter((template) => template.type === 'department');

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Dokumen" />

            <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as DocumentTab)} className="flex h-full flex-1 flex-col gap-6 p-6">
                <div className="flex w-full flex-wrap items-center justify-between gap-4">
                    <TabsList variant="pill">
                        {DOCUMENT_TABS.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} variant="pill">
                                {tab.label}
                            </TabsTrigger>
                        ))}
                    </TabsList>

                    <div className="flex items-center gap-3">
                        <div className="relative w-56">
                            <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#94A3B8]" />
                            <Input
                                type="search"
                                value={search}
                                onChange={(event) => setSearch(event.target.value)}
                                placeholder="Search"
                                className="h-10 rounded-lg pl-9 text-sm"
                            />
                        </div>

                        <button
                            type="button"
                            onClick={() => setFilterOpen(true)}
                            aria-label="Filter"
                            title="Filter"
                            className={cn(
                                'flex size-10 cursor-pointer items-center justify-center rounded-lg border transition-colors',
                                // Border turns blue while a filter is applied — otherwise a narrowed
                                // grid looks identical to an empty one.
                                categories.length > 0 ? 'border-[#1980C0] text-[#1980C0]' : 'border-[#E2E8F0] text-[#64748B] hover:bg-[#F1F5F9]',
                            )}
                        >
                            <Filter className="size-4" />
                        </button>

                        {activeTab !== 'sent' && (
                            <Button asChild className="h-10 gap-2 rounded-lg px-4 text-xs">
                                <Link href={route('company.document.create')}>
                                    <Plus className="size-4" />
                                    Buat Template
                                </Link>
                            </Button>
                        )}
                    </div>
                </div>

                <TabsContent value="company">
                    <TemplateLibrary
                        templates={companyTemplates}
                        isNarrowed={isNarrowed}
                        emptyDescription="Buat template perusahaan pertama Anda."
                        onDetail={setDetailTemplate}
                        onDeleteRequest={setDeletingTemplate}
                    />
                </TabsContent>

                <TabsContent value="department">
                    <TemplateLibrary
                        templates={departmentTemplates}
                        isNarrowed={isNarrowed}
                        emptyDescription="Buat template departemen pertama Anda."
                        onDetail={setDetailTemplate}
                        onDeleteRequest={setDeletingTemplate}
                    />
                </TabsContent>

                <TabsContent value="sent">
                    <EmptyLibraryState title="Belum Ada Dokumen Terkirim" description="Dokumen yang dikirim ke karyawan akan muncul di sini." />
                </TabsContent>
            </Tabs>

            <TemplateFilterDialog open={filterOpen} onOpenChange={setFilterOpen} selected={categories} onApply={setCategories} />
            <TemplateDetailDialog template={detailTemplate} onOpenChange={(open) => !open && setDetailTemplate(null)} />
            <DeleteTemplateDialog
                template={deletingTemplate}
                onOpenChange={(open) => !open && setDeletingTemplate(null)}
                onConfirm={(id) => {
                    deleteTemplate(id);
                    toast.success('Template berhasil dihapus.');
                }}
            />
        </AppLayout>
    );
}

function EmptyLibraryState({ title, description }: { title: string; description: string }) {
    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-4 rounded-2xl border border-[#E2E8F0] bg-white py-24">
            <span className="flex size-14 items-center justify-center rounded-full bg-[#F1F5F9] text-[#94A3B8]">
                <FileX className="size-6" />
            </span>
            <div className="flex max-w-sm flex-col items-center gap-1 text-center">
                <p className="font-poppins text-base font-semibold text-black">{title}</p>
                <p className="text-sm text-[#64748B]">{description}</p>
            </div>
        </div>
    );
}

/** One tab's content: the empty state, or the template grid. */
function TemplateLibrary({
    templates,
    isNarrowed,
    emptyDescription,
    onDetail,
    onDeleteRequest,
}: {
    templates: DocumentTemplate[];
    /** A search term or category filter is active — so "nothing here" means "nothing matched", not "nothing exists". */
    isNarrowed: boolean;
    emptyDescription: string;
    onDetail: (template: DocumentTemplate) => void;
    onDeleteRequest: (template: DocumentTemplate) => void;
}) {
    if (templates.length === 0) {
        return isNarrowed ? (
            <EmptyLibraryState title="Tidak Ada Hasil" description="Tidak ada template yang cocok dengan pencarian atau filter Anda." />
        ) : (
            <EmptyLibraryState title="Belum Ada Template" description={emptyDescription} />
        );
    }

    return (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {templates.map((template) => (
                <TemplateCard key={template.id} template={template} onDetail={onDetail} onDeleteRequest={onDeleteRequest} />
            ))}
        </div>
    );
}
