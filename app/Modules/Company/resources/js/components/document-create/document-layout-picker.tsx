import { type DocumentLayout } from '@/data/Company/companyDocumentTemplate';
import { cn } from '@/lib/utils';

import { DOCUMENT_LAYOUTS } from '../../lib/document-catalog';

interface DocumentLayoutPickerProps {
    value: DocumentLayout;
    onChange: (layout: DocumentLayout) => void;
}

export function DocumentLayoutPicker({ value, onChange }: DocumentLayoutPickerProps) {
    return (
        <div className="flex flex-col gap-2">
            <p className="font-poppins text-base font-semibold text-[#121212]">Document Layout</p>
            <div className="flex items-center gap-3">
                {DOCUMENT_LAYOUTS.map((layout) => (
                    <button
                        key={layout.value}
                        type="button"
                        onClick={() => onChange(layout.value)}
                        aria-label={layout.label}
                        aria-pressed={value === layout.value}
                        className={cn(
                            'overflow-hidden rounded-lg border-2 bg-white transition-colors',
                            value === layout.value ? 'border-[#1980C0]' : 'border-[#E2E8F0]',
                        )}
                    >
                        <img src={layout.thumbnail} alt={layout.label} className="h-16 w-16 object-contain" />
                    </button>
                ))}
            </div>
        </div>
    );
}
