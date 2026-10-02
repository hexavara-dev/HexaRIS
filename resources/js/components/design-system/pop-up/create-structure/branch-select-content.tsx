import { SelectContent, SelectItem } from '@/components/ui/select';
import { type BranchOption } from './types';

interface BranchSelectContentProps {
    branches: BranchOption[];
    onAddBranch: () => void;
}

export function BranchSelectContent({ branches, onAddBranch }: BranchSelectContentProps) {
    return (
        <SelectContent className="border-border overflow-hidden rounded-xl border shadow-sm">
            {branches.map((branch, index) => (
                <div key={branch.value}>
                    <SelectItem value={branch.value} className="focus:bg-muted/50 rounded-none px-3 py-2">
                        <div className="flex flex-col items-start gap-0.5">
                            <span className="text-foreground text-[16px] font-medium">{branch.name}</span>

                            <span className="text-[10px] text-sky-600">{branch.address}</span>
                        </div>
                    </SelectItem>
                    {index < branches.length - 1 && <div className="border-border mx-2 border-t" />}
                </div>
            ))}
            <div className="border-border mx-2 border-t" />
            <button
                type="button"
                onClick={onAddBranch}
                className="hover:bg-muted/50 w-full cursor-pointer px-3 py-2 text-left text-[14px] text-sky-600"
            >
                Tambah Cabang Baru
            </button>
        </SelectContent>
    );
}
