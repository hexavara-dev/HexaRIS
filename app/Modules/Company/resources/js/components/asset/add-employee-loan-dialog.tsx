import { EmployeeLoanFormDialog, type EmployeeLoanFormState } from './employee-loan-form-dialog';

interface AddEmployeeLoanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (values: EmployeeLoanFormState) => void;
}

export function AddEmployeeLoanDialog({ open, onOpenChange, onSubmit }: AddEmployeeLoanDialogProps) {
    return (
        <EmployeeLoanFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Aset Dipinjam Karyawan"
            successMessage="Peminjaman aset berhasil dicatat."
            onSubmit={onSubmit}
        />
    );
}
