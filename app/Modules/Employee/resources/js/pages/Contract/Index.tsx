import AppLayout from '@/layouts/app-layout';
import { ContractDataTable } from './components/contract-data-table';
import ContractSummary from './components/stat-card';

export default function Index() {
    return (
        <AppLayout>
            <div className="space-y-4 p-6">
                <ContractSummary />
                <ContractDataTable />
            </div>
        </AppLayout>
    );
}
