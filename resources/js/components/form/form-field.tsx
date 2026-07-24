import { Eye, EyeOff, FileText, Trash2, Upload, XCircle } from 'lucide-react';
import { type ChangeEvent, type ReactNode, useState } from 'react';

import InputError from '@/components/input-error';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

export function FormField({
    label,
    htmlFor,
    error,
    hint,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    children: ReactNode;
}) {
    return (
        <div className="space-y-1.5">
            <Label htmlFor={htmlFor} className="font-poppins text-base font-semibold text-[#121212]">
                {label}
            </Label>
            {children}
            {hint && <p className="font-poppins text-xs text-[#8F8F8F]">{hint}</p>}
            <InputError message={error} className="font-poppins text-xs text-[#EE242D]" />
        </div>
    );
}

const fieldInputClassName =
    'h-auto w-full rounded-2xl border-[#ACACAC] px-4 py-4 font-poppins text-sm placeholder:text-[#ACACAC] disabled:bg-[#E7E7E7] disabled:text-[#8F8F8F] disabled:opacity-100';

interface TextFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function TextField({ label, htmlFor, error, hint, type = 'text', value, onChange, placeholder, disabled }: TextFieldProps) {
    return (
        <FormField label={label} htmlFor={htmlFor} error={error} hint={hint}>
            <Input
                id={htmlFor}
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(fieldInputClassName, error && 'border-[#E84A39]')}
            />
        </FormField>
    );
}

export function PasswordField({ label, htmlFor, error, hint, value, onChange, placeholder, disabled }: Omit<TextFieldProps, 'type'>) {
    const [visible, setVisible] = useState(false);

    return (
        <FormField label={label} htmlFor={htmlFor} error={error} hint={hint}>
            <div className="relative">
                <Input
                    id={htmlFor}
                    type={visible ? 'text' : 'password'}
                    value={value}
                    onChange={(event) => onChange(event.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={cn(fieldInputClassName, 'pr-11', error && 'border-[#E84A39]')}
                />
                <button
                    type="button"
                    onClick={() => setVisible((prev) => !prev)}
                    className="absolute top-1/2 right-4 -translate-y-1/2 text-[#4F4F4F]"
                    aria-label={visible ? 'Sembunyikan password' : 'Tampilkan password'}
                >
                    {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
            </div>
        </FormField>
    );
}

export interface SelectFieldOption {
    label: string;
    value: string;
}

interface SelectFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    options: SelectFieldOption[];
    disabled?: boolean;
}

export function SelectField({ label, htmlFor, error, hint, value, onValueChange, placeholder, options, disabled }: SelectFieldProps) {
    return (
        <FormField label={label} htmlFor={htmlFor} error={error} hint={hint}>
            <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                <SelectTrigger id={htmlFor} className={cn(fieldInputClassName, 'justify-between', error && 'border-[#E84A39]')}>
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </FormField>
    );
}

export interface UploadedFile {
    name: string;
    size: string;
}

interface FileUploadFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    file?: UploadedFile | null;
    onSelect: (file: File | null) => void;
    onRemove: () => void;
    accept?: string;
    helperText?: string;
}

export function FileUploadField({
    label,
    required,
    error,
    file,
    onSelect,
    onRemove,
    accept,
    helperText = 'Seret file ke sini atau klik untuk mengunggah, atau telusuri.',
}: FileUploadFieldProps) {
    const inputId = `file-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="flex w-full flex-col items-start gap-2">
            <p className={cn('font-poppins text-sm font-semibold tracking-[0.01em]', error ? 'text-[#E84A39]' : 'text-[#1B1B1B]')}>
                {label} {required && '*'}
            </p>

            {file ? (
                <div className="w-full rounded border border-dashed border-[#808080] p-4">
                    <div className="flex w-full items-center gap-4 rounded-lg bg-white px-4 py-2 shadow-[0_2px_4px_0_rgba(0,0,0,0.05),0_1px_8px_0_rgba(0,0,0,0.10)]">
                        <FileText className="h-9 w-9 shrink-0 text-[#E84A39]" />
                        <div className="flex w-full flex-col items-start">
                            <p className="font-poppins text-sm text-[#353535]">{file.name}</p>
                            <p className="font-poppins text-sm text-[#808080]">{file.size}</p>
                        </div>
                        <button type="button" onClick={onRemove} aria-label="Hapus file">
                            <Trash2 className="h-6 w-6 text-[#E84A39]" />
                        </button>
                    </div>
                </div>
            ) : (
                <label
                    htmlFor={inputId}
                    className="flex w-full cursor-pointer flex-col items-center gap-2 rounded border border-dashed border-[#808080] px-8 py-3.5"
                >
                    <Upload className="h-8 w-8 text-[#E7E7E7]" />
                    <span className="font-poppins text-center text-xs font-semibold text-[#41B4F2]">{helperText}</span>
                    <input
                        id={inputId}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => onSelect(event.target.files?.[0] ?? null)}
                    />
                </label>
            )}

            {error && <p className="font-poppins text-xs text-[#EE242D]">{error}</p>}
        </div>
    );
}

interface ImageUploadFieldProps {
    label: string;
    imageUrl?: string | null;
    onSelect: (file: File | null) => void;
    onRemove: () => void;
}

export function ImageUploadField({ label, imageUrl, onSelect, onRemove }: ImageUploadFieldProps) {
    const inputId = `image-${label.replace(/\s+/g, '-').toLowerCase()}`;

    return (
        <div className="flex w-full flex-col items-start gap-2">
            <p className="font-poppins text-sm font-semibold tracking-[0.01em] text-[#1B1B1B]">{label}</p>

            <div className="flex w-full flex-col items-center gap-2.5 rounded border border-dashed border-[#B2B2B2] px-5 py-3.5">
                {imageUrl ? (
                    <div className="relative">
                        <img src={imageUrl} className="h-[83px] w-[88px] rounded object-cover" alt={label} />
                        <button type="button" onClick={onRemove} className="absolute -top-2 -right-2 rounded-full bg-white" aria-label="Hapus foto">
                            <XCircle className="h-6 w-6 fill-[#E84A39] text-white" />
                        </button>
                    </div>
                ) : null}
                <label htmlFor={inputId} className="font-poppins cursor-pointer text-xs font-semibold text-[#41B4F2]">
                    {imageUrl ? 'Ganti Foto' : 'Unggah Foto'}
                </label>
                <input
                    id={inputId}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(event: ChangeEvent<HTMLInputElement>) => onSelect(event.target.files?.[0] ?? null)}
                />
            </div>
        </div>
    );
}
