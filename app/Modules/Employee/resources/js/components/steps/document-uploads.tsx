import { FileUploadField, toUploadedFile } from '@/components/form/form-field';
import { type EmployeeFormData } from '../../types/employee-form';

type DocumentKey = 'ktp' | 'npwp' | 'contract';

interface DocumentUploadsProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: Partial<Record<keyof EmployeeFormData, string>>;
}

const DOCUMENTS: { key: DocumentKey; label: string; required?: boolean }[] = [
    { key: 'ktp', label: 'Upload KTP', required: true },
    { key: 'npwp', label: 'Upload NPWP (Opsional)' },
    { key: 'contract', label: 'Upload Kontrak', required: true },
];

export function DocumentUploads({ data, setData, errors }: DocumentUploadsProps) {
    return (
        <div className="col-span-2 space-y-5">
            {DOCUMENTS.map((doc) => (
                <FileUploadField
                    key={doc.key}
                    label={doc.label}
                    required={doc.required}
                    accept="image/*,.pdf"
                    file={toUploadedFile(data[doc.key])}
                    onSelect={(f) => setData(doc.key, f)}
                    onRemove={() => setData(doc.key, null)}
                    error={errors[doc.key]}
                />
            ))}
        </div>
    );
}
