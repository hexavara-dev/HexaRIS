import { Eye, EyeOff, FileText, FolderClosed, Trash2, XCircle } from 'lucide-react';
import { toast } from 'sonner';

import { type ChangeEvent, type ReactNode, useEffect, useState } from 'react';

import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';

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
    required,
    children,
}: {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    children: ReactNode;
}) {
    return (
        <div className="space-y-2.5">
            <Label htmlFor={htmlFor} className="font-poppins text-base font-semibold text-[#121212]">
                {label} <RequiredMark required={required} />
            </Label>
            {children}
            {hint && <p className="font-poppins text-xs text-[#8F8F8F]">{hint}</p>}
            <InputError message={error} className={cn('font-poppins text-xs', errorTextClassName)} />
        </div>
    );
}

const fieldInputClassName =
    'h-auto w-full rounded-2xl border-[#ACACAC] px-4 py-4 font-poppins text-sm placeholder:text-[#ACACAC] disabled:bg-[#E7E7E7] disabled:text-[#8F8F8F] disabled:opacity-100';

// Canonical error/required-marker red, shared by input borders, the required
// asterisk, and error messages so all three read as the same "error" signal.
const errorTextClassName = 'text-[#EE242D]';
const errorBorderClassName = 'border-[#EE242D]';

function RequiredMark({ required }: { required?: boolean }) {
    return required ? <span className={errorTextClassName}>*</span> : null;
}

interface TextFieldProps {
    label: string;
    htmlFor?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    type?: string;
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    disabled?: boolean;
}

export function TextField({ label, htmlFor, error, hint, required, type = 'text', value, onChange, placeholder, disabled }: TextFieldProps) {
    return (
        <FormField label={label} htmlFor={htmlFor} error={error} hint={hint} required={required}>
            <Input
                id={htmlFor}
                type={type}
                value={value}
                onChange={(event) => onChange(event.target.value)}
                placeholder={placeholder}
                disabled={disabled}
                className={cn(fieldInputClassName, error && errorBorderClassName)}
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
                    className={cn(fieldInputClassName, 'pr-11', error && errorBorderClassName)}
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
    required?: boolean;
    value?: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    options: SelectFieldOption[];
    disabled?: boolean;
}

export function SelectField({ label, htmlFor, error, hint, required, value, onValueChange, placeholder, options, disabled }: SelectFieldProps) {
    return (
        <FormField label={label} htmlFor={htmlFor} error={error} hint={hint} required={required}>
            <Select value={value} onValueChange={onValueChange} disabled={disabled}>
                <SelectTrigger id={htmlFor} className={cn(fieldInputClassName, 'justify-between', error && errorBorderClassName)}>
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

export interface StoredFile {
    name: string;
    type: string;
    dataUrl: string;
    /** Index signature (all fields are strings) so a StoredFile-typed form field can satisfy Inertia's FormDataConvertible without an explicit cast — File already qualifies via Blob. */
    [key: string]: string;
}

/** localStorage has ~5-10MB of headroom total per origin and this app has no backend to offload to — reject anything bigger at selection time rather than silently failing the save later. */
export const MAX_STORED_FILE_BYTES = 2 * 1024 * 1024;

export function isStoredFile(value: unknown): value is StoredFile {
    return typeof value === 'object' && value !== null && 'dataUrl' in value;
}

/** Converts a freshly picked File to something that survives JSON.stringify — called right before a save persists it. */
export function fileToStoredFile(file: File): Promise<StoredFile> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve({ name: file.name, type: file.type, dataUrl: reader.result as string });
        reader.onerror = () => reject(reader.error);
        reader.readAsDataURL(file);
    });
}

export interface UploadedFile {
    name: string;
    /** Only known for a freshly picked File — a hydrated StoredFile doesn't carry its byte size. */
    size: string | null;
}

/** FileUploadField shows name + size; the form itself holds the raw File or a previously stored one. */
export function toUploadedFile(file: File | StoredFile | null): UploadedFile | null {
    if (!file) return null;
    if (isStoredFile(file)) return { name: file.name, size: null };
    return { name: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} Mb` };
}

function fileExtension(name: string): string {
    const match = /\.([a-zA-Z0-9]+)$/.exec(name);
    return match ? match[1].toUpperCase() : '';
}

// PDF reads as red (matches its usual "danger/urgent" document association);
// every other extension shares one green, so the badge/icon color is a type
// signal (two states), not a per-extension rainbow.
const PDF_COLOR = '#E84A39';
const DEFAULT_COLOR = '#16A34A';

/** One document glyph whose color follows the file type (red for PDF, green otherwise), tagged with its extension on the right edge — no image thumbnails. */
export function FileTypeIcon({ name, className = 'h-9 w-9' }: { name: string; className?: string }) {
    const ext = fileExtension(name);
    const color = ext === 'PDF' ? PDF_COLOR : DEFAULT_COLOR;

    return (
        <span className="relative inline-flex shrink-0">
            <FileText className={className} style={{ color }} />
            {ext && (
                <span
                    className="absolute top-1/2 -right-1.5 -translate-y-1/2 rounded-[3px] px-1 py-px text-[8px] leading-none font-bold text-white"
                    style={{ backgroundColor: color }}
                >
                    {ext}
                </span>
            )}
        </span>
    );
}

/**
 * A live File gets an object URL (revoked on cleanup); a StoredFile's
 * dataUrl is already a usable src/href, no creation or revocation needed.
 */
export function useFilePreviewUrl(file: File | StoredFile | null): string | null {
    const [url, setUrl] = useState<string | null>(null);

    useEffect(() => {
        if (!file) {
            setUrl(null);
            return;
        }

        if (isStoredFile(file)) {
            setUrl(file.dataUrl);
            return;
        }

        const objectUrl = URL.createObjectURL(file);
        setUrl(objectUrl);

        return () => URL.revokeObjectURL(objectUrl);
    }, [file]);

    return url;
}

interface FilePreviewDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    name: string;
    /** MIME type — best-effort, both File and StoredFile carry one. */
    type: string;
    previewUrl: string | null;
}

/** Shared by FileUploadField's eye button and every read-only document row in the Employee Detail dialog. */
export function FilePreviewDialog({ open, onOpenChange, name, type, previewUrl }: FilePreviewDialogProps) {
    const isImage = type.startsWith('image/');
    const isPdf = type === 'application/pdf';

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl">
                <DialogTitle className="font-poppins truncate text-base font-semibold text-[#121212]">{name}</DialogTitle>
                {!previewUrl ? (
                    <p className="font-poppins text-sm text-[#8F8F8F]">File tidak tersedia untuk pratinjau.</p>
                ) : isImage ? (
                    <img src={previewUrl} alt={name} className="max-h-[70vh] w-full rounded object-contain" />
                ) : isPdf ? (
                    <iframe src={previewUrl} title={name} className="h-[70vh] w-full rounded border border-[#E7E7E7]" />
                ) : (
                    <a href={previewUrl} target="_blank" rel="noopener noreferrer" className="font-poppins text-sm text-[#1980C0] underline">
                        Buka file di tab baru
                    </a>
                )}
            </DialogContent>
        </Dialog>
    );
}

interface FileUploadFieldProps {
    label: string;
    required?: boolean;
    error?: string;
    file?: File | StoredFile | null;
    onSelect: (file: File | null) => void;
    onRemove: () => void;
    accept?: string;
    helperText?: string;
}

export function FileUploadField({
    label,
    required,
    error,
    file = null,
    onSelect,
    onRemove,
    accept,
    helperText = 'Seret file ke sini atau klik untuk mengunggah, atau telusuri.',
}: FileUploadFieldProps) {
    const inputId = `file-${label.replace(/\s+/g, '-').toLowerCase()}`;
    const uploaded = toUploadedFile(file);
    const previewUrl = useFilePreviewUrl(file);
    const [previewOpen, setPreviewOpen] = useState(false);

    const handleSelect = (selected: File | null) => {
        if (selected && selected.size > MAX_STORED_FILE_BYTES) {
            toast.error(`${selected.name} melebihi 2MB — pilih file yang lebih kecil.`);
            return;
        }
        onSelect(selected);
    };

    return (
        <div className="flex w-full flex-col items-start gap-2.5">
            <p className="font-poppins text-base font-semibold text-[#121212]">
                {label} <RequiredMark required={required} />
            </p>

            {uploaded ? (
                <div className="w-full rounded border border-dashed border-[#808080] p-4">
                    <div className="flex w-full items-center gap-4 rounded-lg bg-white px-4 py-2 shadow-[0_2px_4px_0_rgba(0,0,0,0.05),0_1px_8px_0_rgba(0,0,0,0.10)]">
                        <FileTypeIcon name={uploaded.name} />
                        <div className="flex min-w-0 flex-1 flex-col items-start">
                            <p className="font-poppins w-full truncate text-sm text-[#353535]">{uploaded.name}</p>
                            {uploaded.size && <p className="font-poppins text-sm text-[#808080]">{uploaded.size}</p>}
                        </div>
                        <button
                            type="button"
                            onClick={() => setPreviewOpen(true)}
                            aria-label={`Lihat ${uploaded.name}`}
                            className="cursor-pointer text-[#4F4F4F]"
                        >
                            <Eye className="h-5 w-5" />
                        </button>
                        <button type="button" onClick={onRemove} aria-label="Hapus file" className="cursor-pointer">
                            <Trash2 className="h-6 w-6 text-[#E84A39]" />
                        </button>
                    </div>
                    <FilePreviewDialog
                        open={previewOpen}
                        onOpenChange={setPreviewOpen}
                        name={uploaded.name}
                        type={file?.type ?? ''}
                        previewUrl={previewUrl}
                    />
                </div>
            ) : (
                <label
                    htmlFor={inputId}
                    className={cn(
                        'flex w-full cursor-pointer flex-col items-center gap-2 rounded border border-dashed border-[#808080] px-8 py-3.5',
                        error && errorBorderClassName,
                    )}
                >
                    <FolderClosed className="h-8 w-8 text-[#8F8F8F]" />
                    <span className="font-poppins text-center text-xs font-semibold text-[#121212]">{helperText}</span>
                    <input
                        id={inputId}
                        type="file"
                        accept={accept}
                        className="hidden"
                        onChange={(event: ChangeEvent<HTMLInputElement>) => handleSelect(event.target.files?.[0] ?? null)}
                    />
                </label>
            )}

            <InputError message={error} className={cn('font-poppins text-xs', errorTextClassName)} />
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
