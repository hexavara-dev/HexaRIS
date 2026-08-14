import { useMemo } from 'react';

import { type Asset } from '../../lib/asset-dummy-data';
import { EmployeeLoanFormDialog, type EmployeeLoanFormState } from './employee-loan-form-dialog';

interface EditEmployeeLoanDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    asset: Asset;
    onSubmit: (values: EmployeeLoanFormState) => void;
}

export function EditEmployeeLoanDialog({ open, onOpenChange, asset, onSubmit }: EditEmployeeLoanDialogProps) {
    // Asset only tracks aggregate loaned/available counts, not who borrowed a
    // unit or when — so "employee" and "loanDate" have no source field to
    // prefill from and are left for the admin to fill in.
    const initialValues: EmployeeLoanFormState = useMemo(
        () => ({
            branch: asset.branch,
            employee: '',
            category: asset.category,
            quantity: String(asset.loanedUnits),
            name: asset.name,
            loanDate: '',
        }),
        [asset],
    );

    return (
        <EmployeeLoanFormDialog
            open={open}
            onOpenChange={onOpenChange}
            title="Edit Aset Dipinjam Karyawan"
            initialValues={initialValues}
            successMessage="Perubahan berhasil disimpan."
            onSubmit={onSubmit}
        />
    );
}
