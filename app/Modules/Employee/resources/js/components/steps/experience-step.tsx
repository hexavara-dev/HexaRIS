import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';
import { createEmptyWorkExperience, type EmployeeFormData, type FieldErrors, type WorkExperience } from '../../types/employee-form';
import { ExperienceEntry } from './experience-entry';

interface ExperienceStepProps {
    data: EmployeeFormData;
    setData: <K extends keyof EmployeeFormData>(key: K, value: EmployeeFormData[K]) => void;
    errors: FieldErrors;
}

export function ExperienceStep({ data, setData, errors }: ExperienceStepProps) {
    function updateAt(index: number, updated: WorkExperience) {
        setData(
            'work_experiences',
            data.work_experiences.map((experience, i) => (i === index ? updated : experience)),
        );
    }

    function removeAt(index: number) {
        setData(
            'work_experiences',
            data.work_experiences.filter((_, i) => i !== index),
        );
    }

    function addExperience() {
        setData('work_experiences', [...data.work_experiences, createEmptyWorkExperience()]);
    }

    return (
        <div className="flex flex-col gap-5">
            {data.work_experiences.map((experience, index) => (
                <ExperienceEntry
                    key={index}
                    index={index}
                    experience={experience}
                    onChange={(updated) => updateAt(index, updated)}
                    onRemove={() => removeAt(index)}
                    removable={data.work_experiences.length > 1}
                    errors={{
                        company_name: errors[`work_experiences.${index}.company_name`],
                        employment_type: errors[`work_experiences.${index}.employment_type`],
                        position: errors[`work_experiences.${index}.position`],
                        description: errors[`work_experiences.${index}.description`],
                        start_date: errors[`work_experiences.${index}.start_date`],
                        end_date: errors[`work_experiences.${index}.end_date`],
                    }}
                />
            ))}

            <Button
                type="button"
                variant="outline"
                onClick={addExperience}
                className="h-12 rounded-lg border-[#1980C0] text-base font-semibold text-[#1980C0] hover:bg-[#1980C0]/5 hover:text-[#1980C0]"
            >
                <Plus className="size-4" />
                Tambah Pengalaman
            </Button>
        </div>
    );
}
