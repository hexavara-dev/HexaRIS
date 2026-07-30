import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createEmptyEducationEntry, type EducationEntry, type EmployeeFormData } from '../../types/employee-form';
import { EducationEntryFields } from './education-entry';

interface EducationStepProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: Partial<Record<keyof EmployeeFormData, string>>;
}

export function EducationStep({ data, setData }: EducationStepProps) {
    function updateAt(index: number, updated: EducationEntry) {
        setData(
            'educations',
            data.educations.map((education, i) => (i === index ? updated : education)),
        );
    }

    function removeAt(index: number) {
        setData(
            'educations',
            data.educations.filter((_, i) => i !== index),
        );
    }

    function addEducation() {
        setData('educations', [...data.educations, createEmptyEducationEntry()]);
    }

    return (
        <div className="flex flex-col gap-5">
            {data.educations.map((education, index) => (
                <EducationEntryFields
                    key={index}
                    index={index}
                    education={education}
                    onChange={(updated) => updateAt(index, updated)}
                    onRemove={() => removeAt(index)}
                    removable={data.educations.length > 1}
                />
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={addEducation}
                className="h-12 rounded-lg border-[#1980C0] text-base font-semibold text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
            >
                <Plus className="size-4" />
                Tambah Pendidikan
            </Button>
        </div>
    );
}
