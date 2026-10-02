import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Building2, ChevronRight, Info, Plus, X } from 'lucide-react';
import { useState } from 'react';
import { BranchChoiceCard } from './branch-choice-card';
import { BranchSelectContent } from './branch-select-content';
import { CompanyCard } from './company-card';
import { ExpandablePreviewLayout } from './expandable-preview-layout';
import { StructureFlowPreview } from './structure-flow-preview';
import { type BranchChoice, type BranchOption, type DraftDepartment } from './types';

const BRANCH_PLACEHOLDER_VALUE = '__branch_placeholder__';

interface StructureStepProps {
    branchChoice: BranchChoice;
    branches: BranchOption[];
    departments: DraftDepartment[];
    hasSavedCabang: boolean;
    selectedBranch: string;
    selectedNodeId: string;
    previewExpanded: boolean;
    onBranchChoiceChange: (choice: Exclude<BranchChoice, null>) => void;
    onSelectBranch: (value: string) => void;
    onAddBranch: (name: string, address: string) => void;
    onRemoveBranch: (value: string) => void;
    onSelectNode: (id: string) => void;
    onTogglePreview: () => void;
    onOpenAddDepartment: () => void;
}

export function StructureStep({
    branchChoice,
    branches,
    departments,
    hasSavedCabang,
    selectedBranch,
    selectedNodeId,
    previewExpanded,
    onBranchChoiceChange,
    onSelectBranch,
    onAddBranch,
    onRemoveBranch,
    onSelectNode,
    onTogglePreview,
    onOpenAddDepartment,
}: StructureStepProps) {
    const [addBranchOpen, setAddBranchOpen] = useState(false);
    const [branchName, setBranchName] = useState('');
    const [branchAddress, setBranchAddress] = useState('');
    const [branchSelectTouched, setBranchSelectTouched] = useState(false);
    const [newBranchTag, setNewBranchTag] = useState<{ value: string; name: string; address: string } | null>(null);
    const choiceLayoutClass = hasSavedCabang ? 'flex flex-col gap-3' : 'grid grid-cols-2 items-stretch gap-3';
    const existingBranchSelected = selectedBranch !== '' && newBranchTag === null;

    function addNewBranch() {
        if (existingBranchSelected) return;
        setBranchSelectTouched(false);
        setAddBranchOpen(true);
    }

    function branchValue(name: string) {
        return name.toLowerCase().replace(/\s+/g, '-');
    }

    function handleSavedBranchSelect(value: string) {
        if (value === BRANCH_PLACEHOLDER_VALUE) {
            setBranchSelectTouched(false);
            onBranchChoiceChange('existing');
            onSelectBranch('');
            return;
        }

        setBranchSelectTouched(true);
        setNewBranchTag(null);
        onBranchChoiceChange('existing');
        onSelectBranch(value);
    }

    function handleSaveNewBranch() {
        const nextName = branchName.trim();
        if (!nextName) return;

        const value = branchValue(nextName);
        const nextAddress = branchAddress.trim();
        setAddBranchOpen(false);
        setBranchSelectTouched(false);
        setNewBranchTag({ value, name: nextName, address: nextAddress });
        onAddBranch(nextName, nextAddress);
        setBranchName('');
        setBranchAddress('');
    }

    function removeNewBranch() {
        if (!newBranchTag) return;
        onRemoveBranch(newBranchTag.value);
        setNewBranchTag(null);
        setBranchSelectTouched(false);
    }

    return (
        <>
            <ExpandablePreviewLayout
                expanded={previewExpanded}
                sidebar={
                    <>
                        <CompanyCard />
                        <div className="flex flex-col gap-3">
                            <div className="flex flex-col gap-1">
                                <p className="font-poppins text-[18px] leading-7 font-semibold text-[#0F172A]">Cabang Perusahaan</p>
                                <p className="text-[15px] leading-6 text-[#64748B]">
                                    Apakah perusahaan Anda memiliki cabang (branch) selain kantor pusat?
                                </p>
                            </div>
                            <div className={choiceLayoutClass}>
                                {hasSavedCabang ? (
                                    <>
                                        <SavedBranchSelectCard
                                            branches={branches}
                                            selectedBranch={selectedBranch}
                                            disabled={newBranchTag !== null}
                                            highlighted={existingBranchSelected || branchSelectTouched}
                                            onFocus={() => onBranchChoiceChange('existing')}
                                            onSelectBranch={handleSavedBranchSelect}
                                        />
                                        <SavedBranchChoiceCard
                                            icon="new"
                                            title="Buat Cabang Baru"
                                            description="Daftarkan cabang baru dan atur struktur organisasinya"
                                            selected={newBranchTag !== null}
                                            disabled={existingBranchSelected}
                                            tag={newBranchTag ?? undefined}
                                            onClick={addNewBranch}
                                            onRemoveTag={removeNewBranch}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <BranchChoiceCard
                                            icon="branch"
                                            title="Ya, ada cabang (branch)"
                                            description="Saya ingin menambahkan atau memilih cabang perusahaan."
                                            selected={branchChoice === 'existing'}
                                            onClick={() => onBranchChoiceChange('existing')}
                                        />
                                        <BranchChoiceCard
                                            icon="unit"
                                            title="Tidak, langsung ke unit organisasi"
                                            description="Perusahaan saya tidak memiliki cabang. Langsung ke unit organisasi."
                                            selected={branchChoice === 'new'}
                                            onClick={() => {
                                                onBranchChoiceChange('new');
                                                onOpenAddDepartment();
                                            }}
                                        />
                                    </>
                                )}
                            </div>
                            {branchChoice === 'existing' && !hasSavedCabang && (
                                <div className="mt-3 flex flex-col gap-3">
                                    <label className="text-[16px] leading-6 font-bold text-[#0F172A]">
                                        Pilih Cabang <span className="text-red-500">*</span>
                                    </label>
                                    <Select value={selectedBranch} onValueChange={onSelectBranch}>
                                        <SelectTrigger className="border-border bg-background h-12 w-full cursor-pointer rounded-xl border px-3 text-[16px] shadow-none">
                                            <SelectValue placeholder="Pilih Atau Masukkan Cabang" />
                                        </SelectTrigger>

                                        <BranchSelectContent branches={branches} onAddBranch={() => setAddBranchOpen(true)} />
                                    </Select>
                                </div>
                            )}
                            <div className="mt-2 flex items-start gap-2 rounded-lg bg-[#EAF6FF] px-3.5 py-3 text-[14px] leading-6 text-[#1980C0]">
                                <Info className="size-4 shrink-0" />
                                <span className="min-w-0 whitespace-normal">
                                    Branch digunakan untuk membedakan lokasi operasional atau kantor cabang perusahaan.
                                </span>
                            </div>
                        </div>
                    </>
                }
                preview={
                    departments.length > 0 ? (
                        <StructureFlowPreview
                            mode="dynamic"
                            departments={departments}
                            selectedId={selectedNodeId}
                            onSelect={onSelectNode}
                            expanded={previewExpanded}
                            onToggleExpanded={onTogglePreview}
                        />
                    ) : (
                        <StructureFlowPreview
                            mode="static"
                            branchChoice={branchChoice}
                            departments={departments}
                            expanded={previewExpanded}
                            onToggleExpanded={onTogglePreview}
                        />
                    )
                }
            />

            <Dialog open={addBranchOpen} onOpenChange={setAddBranchOpen}>
                <DialogContent className="max-w-[350px] gap-0 overflow-hidden rounded-xl p-0">
                    <DialogHeader className="border-b border-[#E2E8F0] px-3 py-3">
                        <DialogTitle className="text-[16px] font-semibold text-[#0F172A]">Tambah Cabang</DialogTitle>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 px-3 py-4">
                        <div className="flex flex-col gap-2">
                            <Label htmlFor="branch-name" className="text-[12px] font-medium text-[#0F172A]">
                                Nama Cabang <span className="text-red-500">*</span>
                            </Label>

                            <Input
                                id="branch-name"
                                placeholder="Masukkan nama cabang"
                                className="h-9 rounded-lg border-[#CBD5E1] text-[12px]"
                                value={branchName}
                                onChange={(e) => setBranchName(e.target.value)}
                            />
                        </div>

                        <div className="flex flex-col gap-2">
                            <Label htmlFor="branch-address" className="text-[12px] font-medium text-[#0F172A]">
                                Alamat Cabang <span className="text-red-500">*</span>
                            </Label>
                            <Input
                                id="branch-address"
                                placeholder="Masukkan alamat cabang"
                                className="h-9 rounded-lg border-[#CBD5E1] text-[12px]"
                                value={branchAddress}
                                onChange={(e) => setBranchAddress(e.target.value)}
                            />
                        </div>
                    </div>

                    <DialogFooter className="grid grid-cols-2 gap-2 border-t border-[#E2E8F0] px-3 py-3">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setAddBranchOpen(false)}
                            className="h-9 w-full rounded-lg border-[#1980C0] bg-white text-[12px] font-medium text-[#1980C0] hover:bg-[#EAF6FF] hover:text-[#1980C0]"
                        >
                            Batal
                        </Button>

                        <Button
                            type="button"
                            onClick={() => {
                                handleSaveNewBranch();
                            }}
                            className="h-9 w-full rounded-lg bg-[#1980C0] text-[12px] font-medium text-white hover:bg-[#1565A3]"
                        >
                            Simpan
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}

function SavedBranchSelectCard({
    branches,
    selectedBranch,
    disabled,
    highlighted,
    onFocus,
    onSelectBranch,
}: {
    branches: BranchOption[];
    selectedBranch: string;
    disabled: boolean;
    highlighted: boolean;
    onFocus: () => void;
    onSelectBranch: (value: string) => void;
}) {
    const selectValue = selectedBranch && !disabled ? selectedBranch : BRANCH_PLACEHOLDER_VALUE;
    const selected = branches.find((branch) => branch.value === selectedBranch);

    return (
        <div
            className={[
                'flex w-full items-center gap-3 rounded-lg border px-3 py-3 text-left transition-colors',
                highlighted ? 'border-[#1980C0] bg-[#F8FCFF]' : 'border-[#70B7EA] bg-white',
                disabled ? 'opacity-60' : '',
            ].join(' ')}
        >
            <span
                className={['flex size-10 shrink-0 items-center justify-center rounded-lg', highlighted ? 'bg-[#EAF6FF]' : 'bg-[#F1F5F9]'].join(' ')}
            >
                <Building2 className="size-5 text-[#1980C0]" />
            </span>
            <div className="flex min-w-0 flex-1 flex-col gap-2">
                <div className="flex min-w-0 flex-col gap-0.5">
                    <span className="font-poppins text-[13px] leading-5 font-semibold text-[#0F172A]">Pilih Cabang yang Sudah Ada</span>
                    <span className="text-[13px] leading-5 text-[#64748B]">Atur struktur organisasi untuk cabang yang sudah terdaftar</span>
                </div>
                <div className="flex items-center gap-2">
                    <Select value={selectValue} onValueChange={onSelectBranch} onOpenChange={(open) => open && onFocus()} disabled={disabled}>
                        <SelectTrigger className="h-auto min-h-[46px] flex-1 rounded-lg border-[#CBD5E1] bg-white px-3 py-1.5 text-left text-[13px] shadow-none">
                            {selected ? (
                                <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5 text-left">
                                    <span className="font-poppins block max-w-full truncate text-[13px] leading-4 font-semibold text-[#0F172A]">
                                        {selected.name}
                                    </span>
                                    {selected.address && selected.address !== '-' && (
                                        <span className="block max-w-full truncate text-[10px] leading-3 text-[#1980C0]">{selected.address}</span>
                                    )}
                                </div>
                            ) : (
                                <SelectValue placeholder="Pilih cabang yang tersedia" />
                            )}
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value={BRANCH_PLACEHOLDER_VALUE} textValue="Pilih cabang yang tersedia" disabled>
                                Pilih cabang yang tersedia
                            </SelectItem>
                            {branches.map((branch) => (
                                <SelectItem key={branch.value} value={branch.value} textValue={branch.name} className="items-start py-2">
                                    <span className="flex min-w-0 flex-col gap-0.5 text-left">
                                        <span className="font-poppins text-[13px] leading-5 font-semibold text-[#0F172A]">{branch.name}</span>
                                        {branch.address && branch.address !== '-' && (
                                            <span className="max-w-[260px] truncate text-[11px] leading-4 text-[#1980C0]">{branch.address}</span>
                                        )}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    <Button
                        type="button"
                        variant="outline"
                        disabled={!selectedBranch || disabled}
                        onClick={() => onSelectBranch(BRANCH_PLACEHOLDER_VALUE)}
                        className="h-10 shrink-0 rounded-lg border-[#1980C0] px-3 text-[12px] font-medium text-[#1980C0] hover:bg-[#EAF6FF] hover:text-[#1980C0] disabled:border-[#CBD5E1] disabled:text-[#94A3B8]"
                    >
                        Reset
                    </Button>
                </div>
            </div>
        </div>
    );
}

function SavedBranchChoiceCard({
    icon,
    title,
    description,
    selected,
    disabled = false,
    tag,
    onClick,
    onRemoveTag,
}: {
    icon: 'existing' | 'new';
    title: string;
    description: string;
    selected: boolean;
    disabled?: boolean;
    tag?: { name: string; address: string };
    onClick: () => void;
    onRemoveTag?: () => void;
}) {
    const Icon = icon === 'existing' ? Building2 : Plus;
    const canClick = !disabled && !tag;

    return (
        <div
            role={canClick ? 'button' : undefined}
            tabIndex={canClick ? 0 : undefined}
            onClick={canClick ? onClick : undefined}
            onKeyDown={(event) => {
                if (!canClick) return;
                if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    onClick();
                }
            }}
            className={[
                'flex w-full items-center gap-3 rounded-lg border bg-white px-3 py-3 text-left transition-colors',
                canClick
                    ? 'cursor-pointer focus-visible:ring-2 focus-visible:ring-[#1980C0] focus-visible:ring-offset-2 focus-visible:outline-none'
                    : '',
                selected ? 'border-[#1980C0] bg-[#F8FCFF]' : 'border-[#70B7EA] hover:bg-[#F8FCFF]',
                disabled ? 'cursor-not-allowed opacity-50 hover:bg-white' : '',
            ].join(' ')}
            aria-pressed={selected}
            aria-disabled={disabled}
        >
            <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-[#EAF6FF]">
                <Icon className="size-5 text-[#1980C0]" />
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="font-poppins text-[13px] leading-5 font-semibold text-[#0F172A]">{title}</span>
                <span className="text-[13px] leading-5 text-[#64748B]">{description}</span>
            </span>
            {tag ? (
                <span className="flex max-w-[190px] shrink-0 items-center gap-1.5 rounded-lg border border-[#70B7EA] bg-[#EAF6FF] px-2 py-1.5 text-[#1980C0]">
                    <span className="flex min-w-0 flex-col">
                        <span className="truncate text-[12px] leading-4 font-semibold">{tag.name}</span>
                        {tag.address && <span className="truncate text-[10px] leading-3">{tag.address}</span>}
                    </span>
                    <button
                        type="button"
                        onClick={(event) => {
                            event.stopPropagation();
                            onRemoveTag?.();
                        }}
                        className="flex size-6 shrink-0 items-center justify-center rounded-full text-[#1980C0] hover:bg-white"
                        aria-label="Hapus cabang baru"
                    >
                        <X className="size-4" strokeWidth={2.5} />
                    </button>
                </span>
            ) : (
                <ChevronRight className={['size-5 shrink-0 text-[#1980C0]', disabled ? 'opacity-40' : ''].join(' ')} />
            )}
        </div>
    );
}
