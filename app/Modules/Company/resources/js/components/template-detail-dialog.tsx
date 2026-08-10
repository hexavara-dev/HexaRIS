import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { type DocumentTemplate } from '@/data/Company/companyDocumentTemplate';

import { useZoom } from '../hooks/use-zoom';
import { sanitizeHtml } from '../lib/sanitize-html';
import { DocumentPage, PAGE_HEIGHT, PAGE_WIDTH, RICH_TEXT_STYLES } from './document-create/document-page';
import { ZoomControl } from './zoom-control';

interface TemplateDetailDialogProps {
    /** `null` closes the dialog — same on/off signal as every other pop-up-by-selection dialog in this module (e.g. EditDepartmentDialog). */
    template: DocumentTemplate | null;
    onOpenChange: (open: boolean) => void;
}

/** Starting zoom — an A4 page can't fit a dialog at 100%, so it opens scaled down and the user zooms from there. */
const INITIAL_ZOOM = 0.75;

function notAvailable() {
    toast.info('Fitur belum tersedia.');
}

/** "Detail" from the template grid — a read-only, zoomable preview of the letterhead. */
export function TemplateDetailDialog({ template, onOpenChange }: TemplateDetailDialogProps) {
    const { zoom, zoomIn, zoomOut, canZoomIn, canZoomOut, percentage } = useZoom(INITIAL_ZOOM);

    return (
        <Dialog open={template !== null} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl gap-5 rounded-2xl p-8">
                <div className="flex items-center justify-between gap-4 pr-6">
                    <DialogTitle className="font-poppins text-xl font-semibold text-[#121212]">Detail Doc</DialogTitle>
                    {template && (
                        <ZoomControl percentage={percentage} canZoomIn={canZoomIn} canZoomOut={canZoomOut} onZoomIn={zoomIn} onZoomOut={zoomOut} />
                    )}
                </div>

                {template && (
                    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0]">
                        <div className="max-h-[60vh] overflow-auto bg-[#FAFBFD] p-6">
                            {/*
                                A `transform: scale()` element keeps reporting its *unscaled* size to
                                an overflow-auto ancestor, so without this sizer wrapper the scrollbar
                                would be sized for the full 600×849 page even though it paints smaller
                                — same fix as letterhead-preview.tsx.
                            */}
                            <div className="mx-auto" style={{ width: PAGE_WIDTH * zoom, height: PAGE_HEIGHT * zoom }}>
                                <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                                    <DocumentPage layout={template.layout ?? 'logo-right'} signatoryCount={template.signatoryCount ?? 1}>
                                        {/*
                                            Read-only render of the saved body. Re-sanitized on the way
                                            out, not just on the way in — the stored value could have
                                            been tampered with in localStorage since it was written.
                                        */}
                                        <div
                                            className={`min-h-0 flex-1 overflow-hidden text-sm text-[#0F172A] ${RICH_TEXT_STYLES}`}
                                            dangerouslySetInnerHTML={{ __html: sanitizeHtml(template.body ?? '') }}
                                        />
                                    </DocumentPage>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex items-center gap-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={notAvailable}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-lg border-[#1980C0] text-base font-semibold text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
                    >
                        Download
                    </Button>
                    <Button
                        type="button"
                        onClick={notAvailable}
                        className="font-poppins h-12 flex-1 cursor-pointer rounded-lg bg-[#1980C0] text-base font-semibold text-white hover:bg-[#1668a0]"
                    >
                        Costumize dan Kirim
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
