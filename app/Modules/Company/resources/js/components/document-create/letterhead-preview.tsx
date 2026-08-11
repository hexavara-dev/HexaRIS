import { type DocumentLayout, type SignatoryCount } from '@/data/Company/companyDocumentTemplate';

import { usePageFitEditor } from '../../hooks/use-page-fit-editor';
import { useZoom } from '../../hooks/use-zoom';
import { DocumentPage, PAGE_HEIGHT, PAGE_WIDTH, RICH_TEXT_STYLES } from './document-page';
import { EditorToolbar } from './editor-toolbar';

interface LetterheadPreviewProps {
    layout: DocumentLayout;
    signatoryCount: SignatoryCount;
    body: string;
    onBodyChange: (value: string) => void;
}

/** The right-hand editor panel: toolbar on top, a zoomable A4 page below. */
export function LetterheadPreview({ layout, signatoryCount, body, onBodyChange }: LetterheadPreviewProps) {
    const { zoom, zoomIn, zoomOut, canZoomIn, canZoomOut, percentage } = useZoom();
    const editor = usePageFitEditor(body, onBodyChange);

    return (
        <div className="flex flex-col overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white">
            <EditorToolbar
                format={editor.format}
                onCommand={editor.exec}
                percentage={percentage}
                canZoomIn={canZoomIn}
                canZoomOut={canZoomOut}
                onZoomIn={zoomIn}
                onZoomOut={zoomOut}
            />

            <div className="max-h-[75vh] overflow-auto bg-[#FAFBFD] p-8">
                {/*
                    A `transform: scale()` element keeps reporting its *unscaled* size to an
                    `overflow-auto` ancestor, so the scrollbar/clipping goes by the wrong box while
                    the content paints smaller — this sizer wrapper is explicitly sized to the
                    already-scaled dimensions so the scroll area matches what's actually visible;
                    the transformed page inside is anchored top-left so it exactly fills it.
                */}
                <div className="mx-auto" style={{ width: PAGE_WIDTH * zoom, height: PAGE_HEIGHT * zoom }}>
                    <div style={{ transform: `scale(${zoom})`, transformOrigin: 'top left' }}>
                        <DocumentPage layout={layout} signatoryCount={signatoryCount}>
                            <div
                                ref={editor.ref}
                                contentEditable
                                suppressContentEditableWarning
                                {...editor.handlers}
                                data-placeholder="Tulis disini"
                                className={`min-h-0 flex-1 overflow-hidden text-sm text-[#0F172A] outline-none empty:before:text-[#94A3B8] empty:before:content-[attr(data-placeholder)] ${RICH_TEXT_STYLES}`}
                            />
                        </DocumentPage>
                    </div>
                </div>
            </div>
        </div>
    );
}
