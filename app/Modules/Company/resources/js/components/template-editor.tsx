import { Link } from '@inertiajs/react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { type DocumentLayout, type DocumentTemplate, type SignatoryCount, type TemplateCategory } from '@/data/Company/companyDocumentTemplate';
import { setPendingToast } from '@/hooks/use-pending-toast';

import { useUnsavedChangesGuard } from '../hooks/use-unsaved-changes-guard';
import { LetterheadPreview } from './document-create/letterhead-preview';
import { TemplateFormPanel } from './document-create/template-form-panel';
import { UnsavedChangesDialog } from './document-create/unsaved-changes-dialog';

/** Everything the form collects — what a page hands back to storage on submit. */
export interface TemplateEditorValues {
    name: string;
    description: string;
    documentCategory: string;
    templateType: TemplateCategory;
    layout: DocumentLayout;
    signatoryCount: SignatoryCount;
    body: string;
}

interface TemplateEditorProps {
    /** The page heading, e.g. "Template Baru" or "Edit Template". */
    heading: string;
    /** Label for the primary button, e.g. "Simpan Template" or "Perbarui". */
    submitLabel: string;
    /** Prefills the form when editing; omitted when creating. */
    initial?: DocumentTemplate;
    /**
     * Validate and persist. Return the success toast message once persisted, or
     * `false` to keep the user on the page (e.g. a required field is empty). The
     * message is deliberately not shown here — it's shown once the navigation
     * away actually finishes, not the instant the button is clicked.
     */
    onSubmit: (values: TemplateEditorValues) => string | false;
}

/** The body is editor HTML — strip tags so leftover `<br>`/`<div>` scaffolding doesn't read as content. */
function bodyText(html: string): string {
    return html
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
}

/**
 * The shared "Buat/Edit Template" screen: form panel on the left, live letterhead
 * preview on the right. Owns the form state and the unsaved-changes guard; the
 * page above it owns only what "submit" means (create a template vs. update one).
 */
export function TemplateEditor({ heading, submitLabel, initial, onSubmit }: TemplateEditorProps) {
    // Captured once so it stays the yardstick for "has anything changed?" even as
    // the fields below move away from it.
    const [baseline] = useState<TemplateEditorValues>(() => ({
        name: initial?.name ?? '',
        description: initial?.description ?? '',
        documentCategory: initial?.documentCategory ?? '',
        templateType: initial?.type ?? 'company',
        layout: initial?.layout ?? 'logo-right',
        signatoryCount: initial?.signatoryCount ?? 1,
        body: initial?.body ?? '',
    }));

    const [name, setName] = useState(baseline.name);
    const [description, setDescription] = useState(baseline.description);
    const [documentCategory, setDocumentCategory] = useState(baseline.documentCategory);
    const [templateType, setTemplateType] = useState(baseline.templateType);
    const [layout, setLayout] = useState(baseline.layout);
    const [signatoryCount, setSignatoryCount] = useState(baseline.signatoryCount);
    const [body, setBody] = useState(baseline.body);

    // Any edit at all counts — including the letter body on its own, which is the
    // most expensive thing here to retype. Validation is deliberately *not* part
    // of this: required-field checks belong to submitting, not to guarding the exit.
    const isDirty =
        name.trim() !== baseline.name.trim() ||
        description.trim() !== baseline.description.trim() ||
        documentCategory !== baseline.documentCategory ||
        templateType !== baseline.templateType ||
        layout !== baseline.layout ||
        signatoryCount !== baseline.signatoryCount ||
        bodyText(body) !== bodyText(baseline.body);

    const guard = useUnsavedChangesGuard(isDirty);

    function submit(): string | false {
        return onSubmit({ name, description, documentCategory, templateType, layout, signatoryCount, body });
    }

    function handleSubmit() {
        const message = submit();
        if (!message) return;
        // Queued rather than shown here — the toast belongs on the page we land on.
        setPendingToast(message);
        guard.visit(route('company.document.index'));
    }

    /** The dialog's "Simpan" — save, then continue to wherever the user was headed. */
    function handleConfirmSave() {
        const message = submit();
        if (!message) return;
        setPendingToast(message);
        guard.proceedToPending();
    }

    return (
        <>
            <div className="flex flex-1 flex-col gap-6 p-6">
                <div className="flex items-center justify-between">
                    <p className="font-poppins text-xl font-semibold text-[#121212]">{heading}</p>
                    <div className="flex items-center gap-5">
                        <Link href={route('company.document.index')} className="font-poppins text-sm font-semibold text-[#64748B]">
                            Batal
                        </Link>
                        <Button
                            type="button"
                            onClick={handleSubmit}
                            className="h-auto rounded-lg bg-[#1980C0] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#1668a0]"
                        >
                            {submitLabel}
                        </Button>
                    </div>
                </div>

                <div className="flex items-start gap-6">
                    <TemplateFormPanel
                        name={name}
                        onNameChange={setName}
                        description={description}
                        onDescriptionChange={setDescription}
                        documentCategory={documentCategory}
                        onDocumentCategoryChange={setDocumentCategory}
                        templateType={templateType}
                        onTemplateTypeChange={setTemplateType}
                        layout={layout}
                        onLayoutChange={setLayout}
                        signatoryCount={signatoryCount}
                        onSignatoryCountChange={setSignatoryCount}
                    />

                    <div className="min-w-0 flex-1">
                        <LetterheadPreview layout={layout} signatoryCount={signatoryCount} body={body} onBodyChange={setBody} />
                    </div>
                </div>
            </div>

            <UnsavedChangesDialog
                open={guard.confirmOpen}
                onOpenChange={(open) => !open && guard.stay()}
                onDiscard={() => guard.proceedToPending()}
                onSave={handleConfirmSave}
            />
        </>
    );
}
