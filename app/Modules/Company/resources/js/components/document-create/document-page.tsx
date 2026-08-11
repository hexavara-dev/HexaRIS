import { type ReactNode } from 'react';

import AppLogoIcon from '@/components/icons/app-logo-icon';
import { type DocumentLayout, type SignatoryCount } from '@/data/Company/companyDocumentTemplate';
import { cn } from '@/lib/utils';

import { LETTERHEAD, SAMPLE_DOCUMENT, SIGNATORY_PLACEHOLDER } from '../../lib/letterhead-content';

/** A4 at 96dpi, rounded — 210mm × 297mm. The page keeps this ratio at every zoom level. */
export const PAGE_WIDTH = 600;
export const PAGE_HEIGHT = 849;

/**
 * Tailwind's preflight strips list markers and heading sizes, so the editor's
 * `execCommand` output would apply invisibly — a bulleted list would look
 * identical to plain text. These restore document-like defaults, scoped to the
 * body region. Shared by the editable preview and the read-only detail view so
 * both render a saved template identically.
 */
export const RICH_TEXT_STYLES = [
    '[&_ul]:list-disc [&_ul]:pl-5',
    '[&_ol]:list-decimal [&_ol]:pl-5',
    '[&_h1]:font-poppins [&_h1]:text-xl [&_h1]:font-bold',
    '[&_h2]:font-poppins [&_h2]:text-lg [&_h2]:font-bold',
    '[&_h3]:font-poppins [&_h3]:text-base [&_h3]:font-bold',
].join(' ');

/**
 * Per-layout class recipes, so adding another layout means adding one entry here
 * instead of threading another `isCentered`-style boolean through the markup.
 * Each entry mirrors the thumbnail shown in `DocumentLayoutPicker`.
 */
interface LayoutStyles {
    /** The letterhead row — controls where the logo lands. */
    header: string;
    /** The company name/address block inside it. */
    headerText: string;
    signatures: string;
}

const LAYOUT_STYLES: Record<DocumentLayout, LayoutStyles> = {
    'logo-left': {
        header: 'flex-row',
        headerText: '',
        signatures: 'w-full',
    },
    // row-reverse puts the logo (first child) on the right; justify-between pushes
    // the text block to the opposite edge.
    'logo-right': {
        header: 'flex-row-reverse justify-between',
        headerText: '',
        signatures: 'w-full',
    },
    'logo-center': {
        header: 'flex-col text-center',
        headerText: 'items-center',
        signatures: 'w-full justify-center',
    },
};

/** Templates saved before the layout options changed may carry an unknown value. */
const FALLBACK_LAYOUT: DocumentLayout = 'logo-left';

function SignatureBlock() {
    return (
        <div className="flex flex-col items-center gap-1 text-center">
            <div className="h-12 w-24 rounded-sm bg-[#F1F5F9]" />
            <p className="font-poppins text-xs font-semibold text-[#0F172A] underline">{SIGNATORY_PLACEHOLDER}</p>
        </div>
    );
}

interface DocumentPageProps {
    layout: DocumentLayout;
    signatoryCount: SignatoryCount;
    /** The body region — an editable element when authoring, static text when read-only. */
    children: ReactNode;
}

/**
 * One sheet of paper: letterhead, title, body, signatures. Fixed A4 size and
 * `overflow-hidden`, like a real page — content can't spill past the edge.
 */
export function DocumentPage({ layout, signatoryCount, children }: DocumentPageProps) {
    const styles = LAYOUT_STYLES[layout] ?? LAYOUT_STYLES[FALLBACK_LAYOUT];

    return (
        <div
            style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
            className="flex shrink-0 flex-col overflow-hidden rounded border border-[#E2E8F0] bg-white p-8 shadow-sm"
        >
            <div className={cn('flex shrink-0 items-center gap-3', styles.header)}>
                <AppLogoIcon className="size-10 shrink-0 text-[#1980C0]" />
                <div className={cn('flex flex-col', styles.headerText)}>
                    <p className="font-poppins text-sm font-bold text-[#0F172A]">{LETTERHEAD.companyName.toUpperCase()}</p>
                    <p className="text-xs text-[#64748B]">{LETTERHEAD.address}</p>
                    <p className="text-xs text-[#64748B]">{LETTERHEAD.contact}</p>
                    <p className="text-xs text-[#64748B]">{LETTERHEAD.website}</p>
                </div>
            </div>

            <div className="my-4 h-0.5 w-full shrink-0 bg-[#0F172A]" />

            <div className="mb-4 shrink-0 text-center">
                <p className="font-poppins text-sm font-bold text-[#0F172A]">{SAMPLE_DOCUMENT.title}</p>
                <p className="text-xs text-[#64748B]">{SAMPLE_DOCUMENT.number}</p>
            </div>

            {/*
                `flex-1 min-h-0` gives the body only the space left over after the
                letterhead, title, and signature blocks have taken theirs — so the
                signatures stay inside the page instead of being pushed past its edge.
            */}
            <div className="flex min-h-0 flex-1 flex-col gap-6">
                {children}

                <div className={cn('flex shrink-0 gap-6', styles.signatures)}>
                    {Array.from({ length: signatoryCount }, (_, index) => (
                        <SignatureBlock key={index} />
                    ))}
                </div>
            </div>
        </div>
    );
}
