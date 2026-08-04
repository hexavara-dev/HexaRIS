import { type SelectFieldOption } from '@/components/form/form-field';
import { organization } from '@/data/Organization/organization';

export function labelFor(options: SelectFieldOption[], value: string): string {
    return options.find((option) => option.value === value)?.label || '—';
}

export function orgUnitName(id: string): string {
    return organization.find((unit) => unit.id === id)?.name || '—';
}

export function formatDate(value: string): string {
    if (!value) return '—';
    return new Date(value).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' });
}
