// app/Modules/Company/resources/js/components/asset/add-asset-menu.tsx
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

export function AddAssetMenu() {
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button className="h-9 gap-2 rounded-lg px-4 text-xs">
                    <Plus className="size-4" />
                    Aset
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => toast('Segera hadir')}>Aset Perusahaan</DropdownMenuItem>
                <DropdownMenuItem onClick={() => toast('Segera hadir')}>Dipinjam Karyawan</DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
