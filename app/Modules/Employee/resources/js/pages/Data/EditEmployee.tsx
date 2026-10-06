import { EmployeeFormDialog } from '../../components/employee-form-dialog';

import type { Employee } from '@/data/Employee/employee';

import type {
    EmployeeFormData,
    FileFieldFlags,
} from '../../types/employee-form';

interface EditEmployeeProps {
    open: boolean;
    employee: Employee | null;
    onClose: () => void;

    onCreate: (
        formData: EmployeeFormData,
        fileFlags: FileFieldFlags,
    ) => Promise<void>;

    onUpdate: (
        target: Employee,
        formData: EmployeeFormData,
        fileFlags: FileFieldFlags,
    ) => Promise<void>;
}

export default function EditEmployee({
    open,
    employee,
    onClose,
    onCreate,
    onUpdate,
}: EditEmployeeProps) {
    return (
        <EmployeeFormDialog
            open={open}
            employee={employee}
            onClose={onClose}
            onCreate={onCreate}
            onUpdate={onUpdate}
        />
    );
}