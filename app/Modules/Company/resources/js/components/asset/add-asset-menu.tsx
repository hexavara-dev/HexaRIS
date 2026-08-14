import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import { useState } from 'react';

import { AddCompanyAssetDialog, type NewCompanyAssetValues } from './add-company-asset-dialog';
import { AddEmployeeLoanDialog } from './add-employee-loan-dialog';
import { type EmployeeLoanFormState } from './employee-loan-form-dialog';

interface AddAssetMenuProps {
    onAddCompanyAsset: (values: NewCompanyAssetValues) => void;
    onAddEmployeeLoan: (values: EmployeeLoanFormState) => void;
}

export function AddAssetMenu({ onAddCompanyAsset, onAddEmployeeLoan }: AddAssetMenuProps) {
    const [companyAssetDialogOpen, setCompanyAssetDialogOpen] = useState(false);
    const [employeeLoanDialogOpen, setEmployeeLoanDialogOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button className="h-9 gap-2 rounded-lg px-4 text-xs">
                        <Plus className="size-4" />
                        Aset
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setCompanyAssetDialogOpen(true)}>Aset Perusahaan</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setEmployeeLoanDialogOpen(true)}>Dipinjam Karyawan</DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <AddCompanyAssetDialog open={companyAssetDialogOpen} onOpenChange={setCompanyAssetDialogOpen} onSubmit={onAddCompanyAsset} />
            <AddEmployeeLoanDialog open={employeeLoanDialogOpen} onOpenChange={setEmployeeLoanDialogOpen} onSubmit={onAddEmployeeLoan} />
        </>
    );
}
