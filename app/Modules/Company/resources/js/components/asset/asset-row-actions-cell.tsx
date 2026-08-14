import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { EllipsisVertical } from 'lucide-react';
import { useState } from 'react';

import { type Asset } from '../../lib/asset-dummy-data';
import { DeleteAssetDialog } from './delete-asset-dialog';
import { EditEmployeeLoanDialog } from './edit-employee-loan-dialog';
import { type EmployeeLoanFormState } from './employee-loan-form-dialog';
import { ReturnAssetDialog } from './return-asset-dialog';

interface AssetRowActionsCellProps {
    asset: Asset;
    onUpdate: (assetId: string, values: EmployeeLoanFormState) => void;
    onReturn: (assetId: string) => void;
    onDelete: (assetId: string) => void;
}

export function AssetRowActionsCell({ asset, onUpdate, onReturn, onDelete }: AssetRowActionsCellProps) {
    const [editDialogOpen, setEditDialogOpen] = useState(false);
    const [returnDialogOpen, setReturnDialogOpen] = useState(false);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

    return (
        <>
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="size-8">
                        <EllipsisVertical className="size-4" />
                        <span className="sr-only">Open actions</span>
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>Edit</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setReturnDialogOpen(true)}>Dikembalikan</DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive">
                        Hapus
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>

            <EditEmployeeLoanDialog
                open={editDialogOpen}
                onOpenChange={setEditDialogOpen}
                asset={asset}
                onSubmit={(values) => onUpdate(asset.id, values)}
            />
            <ReturnAssetDialog open={returnDialogOpen} onOpenChange={setReturnDialogOpen} onSubmit={() => onReturn(asset.id)} />
            <DeleteAssetDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={() => onDelete(asset.id)} />
        </>
    );
}
