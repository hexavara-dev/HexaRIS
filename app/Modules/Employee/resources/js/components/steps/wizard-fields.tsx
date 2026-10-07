import {
    SelectField as BaseSelectField,
    compactFieldInputClassName,
    TextField as BaseTextField,
} from '@/components/form/form-field';

/**
 * TextField/SelectField bound to the compact wizard treatment: the tighter
 * `compactFieldInputClassName` box plus a `dense` label. The wizard stacks two
 * fields per row inside a dialog, where the app-wide `py-4`/`rounded-2xl`
 * default and the `text-base` label read oversized — steps import these so the
 * denser field is one decision instead of a prop on every field. FileUploadField
 * and the shared option types stay on form-field (pass `dense` there yourself),
 * and a step can still override with its own `inputClassName`/`dense`.
 */
export function TextField(props: Parameters<typeof BaseTextField>[0]) {
    return <BaseTextField dense inputClassName={compactFieldInputClassName} {...props} />;
}

export function SelectField(props: Parameters<typeof BaseSelectField>[0]) {
    return <BaseSelectField dense inputClassName={compactFieldInputClassName} {...props} />;
}

export type { SelectFieldOption } from '@/components/form/form-field';
