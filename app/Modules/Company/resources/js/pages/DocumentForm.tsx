import { Head } from '@inertiajs/react';
import { toast } from 'sonner';

import { COMPANY_ID } from '@/data/Employee/employee';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';

import { TemplateEditor, type TemplateEditorValues } from '../components/template-editor';
import { TemplateNotFound } from '../components/template-not-found';
import { useDocumentTemplates } from '../hooks/use-document-templates';

interface DocumentFormProps {
    /** Present only when editing — absent means this is the create form (mirrors Iam's `user: UserRow | null` on users/Form.tsx). */
    templateId?: string;
}

export default function DocumentForm({ templateId }: DocumentFormProps) {
    const { findTemplate, addTemplate, updateTemplate } = useDocumentTemplates();
    const template = templateId ? findTemplate(templateId) : null;
    const isEditing = templateId !== undefined;

    const breadcrumbs: BreadcrumbItem[] = [
        { title: 'Dokumen Center', href: '/company/documents' },
        { title: isEditing ? 'Edit Template' : 'Buat Template', href: isEditing ? '/company/documents' : '/company/documents/create' },
    ];

    // Editing a template whose id no longer resolves (deleted, stale link, a
    // different browser's localStorage, ...) — the server can't 404 on
    // something it doesn't store, so this is caught here instead.
    if (isEditing && !template) {
        return (
            <AppLayout breadcrumbs={breadcrumbs}>
                <Head title="Edit Template" />
                <TemplateNotFound />
            </AppLayout>
        );
    }

    function handleSubmit(values: TemplateEditorValues): string | false {
        if (!values.name.trim()) {
            toast.error('Nama template wajib diisi.');
            return false;
        }

        const payload = {
            name: values.name.trim(),
            description: values.description.trim(),
            type: values.templateType,
            documentCategory: values.documentCategory,
            layout: values.layout,
            signatoryCount: values.signatoryCount,
            body: values.body,
            company_id: template?.company_id ?? COMPANY_ID,
        };

        if (template) {
            updateTemplate(template.id, payload);
            return 'Template berhasil diperbarui.';
        }

        addTemplate(payload);
        return 'Template berhasil dibuat.';
    }

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title={template ? 'Edit Template' : 'Buat Template'} />
            <TemplateEditor
                heading={template ? 'Edit Template' : 'Template Baru'}
                submitLabel={template ? 'Perbarui' : 'Simpan Template'}
                initial={template ?? undefined}
                onSubmit={handleSubmit}
            />
        </AppLayout>
    );
}
