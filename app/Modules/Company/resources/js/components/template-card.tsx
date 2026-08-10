import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { type DocumentTemplate } from '@/data/Company/companyDocumentTemplate';
import { Link } from '@inertiajs/react';
import { MoreVertical } from 'lucide-react';

interface TemplateCardProps {
    template: DocumentTemplate;
    onDetail: (template: DocumentTemplate) => void;
    /** Requests confirmation before deleting — the parent owns the confirm dialog, not this card. */
    onDeleteRequest: (template: DocumentTemplate) => void;
}

/** One template's card in the Document Center grid — icon + name/description, "..." menu for Hapus. */
export function TemplateCard({ template, onDetail, onDeleteRequest }: TemplateCardProps) {
    return (
        <Card className="rounded-2xl border-[#E2E8F0]">
            <CardHeader className="flex flex-row items-center justify-between gap-3 space-y-0 p-5 pb-3">
                <div className="flex items-start gap-3">
                    <div className="flex flex-col gap-1">
                        <CardTitle className="font-poppins line-clamp-1 text-lg font-semibold text-[#0F172A]" title={template.name}>
                            {template.name}
                        </CardTitle>
                        <p className="text-sm">Terakhir edit 31/10/2026 13:32</p>
                    </div>
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <MoreVertical className="cursor-pointer text-[#1B1B1B]" />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem className="cursor-pointer" onClick={() => onDetail(template)}>
                            Detail
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={route('company.document.edit', template.id)}>Edit</Link>
                        </DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem className="cursor-pointer">Customize dan Kirim</DropdownMenuItem>
                        <Separator />
                        <DropdownMenuItem className="cursor-pointer text-[#E84A39] focus:text-[#E84A39]" onClick={() => onDeleteRequest(template)}>
                            Hapus
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </CardHeader>
            {template.description && (
                <CardContent className="p-5 pt-0">
                    <p className="line-clamp-1 text-sm text-[#475569]" title={template.description}>
                        {template.description}
                    </p>
                </CardContent>
            )}
        </Card>
    );
}
