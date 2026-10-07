import { DataTable } from '@/components/data-table';
import { useCallback, useMemo, useState } from 'react';
import { buildEmployeeContractColumns, type ContractAction, type EmployeeContractRow } from '../column';
import { contractData, contractFilters, contractSearch } from '../data';
import { ContractActionDialog } from './contract-action-dialog';

export function ContractDataTable() {
    const [selectedAction, setSelectedAction] = useState<ContractAction | null>(null);
    const [selectedContract, setSelectedContract] = useState<EmployeeContractRow | null>(null);

    const openContractAction = useCallback((action: ContractAction, row: EmployeeContractRow) => {
        setSelectedAction(action);
        setSelectedContract(row);
    }, []);

    const closeContractAction = () => {
        setSelectedAction(null);
        setSelectedContract(null);
    };

    const columns = useMemo(() => buildEmployeeContractColumns(openContractAction), [openContractAction]);

    return (
        <>
            <DataTable columns={columns} data={contractData} search={contractSearch} filters={contractFilters} />
            <ContractActionDialog
                action={selectedAction}
                contract={selectedContract}
                open={selectedAction !== null && selectedContract !== null}
                onOpenChange={(open) => {
                    if (!open) closeContractAction();
                }}
            />
        </>
    );
}
