import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Check, FileText } from 'lucide-react';
import { type ReactNode, useEffect, useState } from 'react';
import { type EmployeeContractRow } from '../column';

interface EmploymentChangeDialogProps {
    contract: EmployeeContractRow | null;
    initialBranchChange?: BranchChangeValue;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

type ChangeChoice = 'no' | 'yes';
type BranchChangeValue = ChangeChoice;

// Urutan wizard setelah kontrak berhasil disimpan:
// 1. Mutasi: cek apakah ada perubahan cabang.
// 2. Perubahan Jabatan: cek apakah ada perubahan posisi/organisasi.
// 3. Kompensasi: cek apakah ada perubahan gaji/tunjangan.
// 4. Preview: ringkasan semua pilihan sebelum selesai.
const steps = ['Mutasi', 'Perubahan Jabatan', 'Kompensasi', 'Preview'];

// Render tanda wajib isi (*) pada label field.
function RequiredMark() {
    return <span className="text-[#E84A39]">*</span>;
}

// Render indikator step di header dialog:
// step aktif berwarna biru, step yang sudah lewat pakai icon check.
function Stepper({ currentStep }: { currentStep: number }) {
    return (
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
            {steps.map((label, index) => {
                const stepNumber = index + 1;
                const isActive = stepNumber === currentStep;
                const isDone = stepNumber < currentStep;

                return (
                    <div key={label} className="flex items-center gap-2">
                        <div
                            className={[
                                'grid size-5 place-items-center rounded-full font-poppins text-[10px] font-semibold',
                                isActive ? 'bg-[#1980C0] text-white' : isDone ? 'bg-[#1980C0] text-white' : 'bg-[#8B8B8B] text-white',
                            ].join(' ')}
                        >
                            {isDone ? <Check className="size-3" /> : stepNumber}
                        </div>
                        <span className={['hidden font-poppins text-[11px] sm:inline', isActive ? 'font-semibold text-[#121212]' : 'text-[#9CA3AF]'].join(' ')}>
                            {label}
                        </span>
                        {index < steps.length - 1 && <div className="h-px w-5 bg-[#D1D5DB]" />}
                    </div>
                );
            })}
        </div>
    );
}

// Render ringkasan karyawan yang sedang diproses di bagian atas wizard.
function EmployeeSummary({ contract }: { contract: EmployeeContractRow }) {
    return (
        <div className="flex items-center gap-3">
            <div className="grid size-10 shrink-0 place-items-center overflow-hidden rounded-full bg-[#111827] text-[11px] font-semibold text-white">
                {contract.full_name
                    .split(' ')
                    .map((word) => word[0])
                    .join('')
                    .slice(0, 2)}
            </div>
            <div className="min-w-0">
                <p className="truncate font-poppins text-sm font-semibold text-[#121212]">{contract.full_name}</p>
                <p className="truncate font-poppins text-xs text-[#6B7280]">{contract.position}</p>
            </div>
        </div>
    );
}

// Render pilihan standar "Tidak Ada" / "Ya, ada perubahan".
// Dipakai ulang oleh step Mutasi, Perubahan Jabatan, dan Kompensasi.
function ChangeChoiceGroup({
    label,
    value,
    onValueChange,
}: {
    label: string;
    value: ChangeChoice;
    onValueChange: (value: ChangeChoice) => void;
}) {
    return (
        <div className="space-y-2">
            <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                {label} <RequiredMark />
            </Label>
            <RadioGroup value={value} onValueChange={(nextValue) => onValueChange(nextValue as ChangeChoice)} className="grid grid-cols-2 gap-3">
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#C9CED6] bg-white px-3 transition-colors has-[[data-state=checked]]:border-[#8DD3FF] has-[[data-state=checked]]:bg-[#F0FAFF]">
                    <RadioGroupItem value="no" className="size-4 border-[#1980C0] text-[#1980C0]" />
                    <span className="font-poppins text-xs text-[#121212]">Tidak Ada</span>
                </label>
                <label className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-[#C9CED6] bg-white px-3 transition-colors has-[[data-state=checked]]:border-[#8DD3FF] has-[[data-state=checked]]:bg-[#F0FAFF]">
                    <RadioGroupItem value="yes" className="size-4 border-[#1980C0] text-[#1980C0]" />
                    <span className="font-poppins text-xs text-[#121212]">Ya, ada perubahan</span>
                </label>
            </RadioGroup>
        </div>
    );
}

// Step 1: Mutasi.
// Kalau user pilih "Tidak Ada", hanya radio yang tampil.
// Kalau user pilih "Ya", field pindah cabang + alasan mutasi + checkbox konfirmasi ditampilkan.
function MutasiStep({ branchChange, onBranchChange }: { branchChange: BranchChangeValue; onBranchChange: (value: BranchChangeValue) => void }) {
    const [confirmMove, setConfirmMove] = useState(true);

    return (
        <div className="space-y-4">
            <ChangeChoiceGroup label="Apakah ada perubahan cabang?" value={branchChange} onValueChange={onBranchChange} />

            {branchChange === 'yes' && (
                <>
                    <div className="space-y-2">
                        <Label className="font-poppins text-[11px] font-semibold text-[#121212]">Pindah ke Cabang mana?</Label>
                        <Select defaultValue="surabaya">
                            <SelectTrigger className="h-11 rounded-xl border-[#C9CED6] bg-white font-poppins text-xs shadow-none focus:ring-1 focus:ring-[#1980C0] focus:ring-offset-0">
                                <SelectValue placeholder="Pilih cabang" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="surabaya">Surabaya</SelectItem>
                                <SelectItem value="jakarta">Jakarta</SelectItem>
                                <SelectItem value="bandung">Bandung</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                            Alasan Mutasi <RequiredMark />
                        </Label>
                        <Textarea
                            defaultValue="Kebijakan perusahaan"
                            className="min-h-[84px] resize-none rounded-xl border-[#C9CED6] font-poppins text-xs shadow-none focus-visible:ring-1 focus-visible:ring-[#1980C0] focus-visible:ring-offset-0"
                        />
                    </div>

                    <label className="flex cursor-pointer items-center gap-2 rounded-xl bg-[#F7F7F7] px-3 py-3">
                        <Checkbox checked={confirmMove} onCheckedChange={(checked) => setConfirmMove(checked === true)} />
                        <span className="font-poppins text-[11px] text-[#4B5563]">Apakah Anda yakin ingin memindahkan karyawan ini ke cabang yang dipilih?</span>
                    </label>
                </>
            )}
        </div>
    );
}

// Step 2: Perubahan Jabatan.
// Kalau user pilih "Tidak Ada", lanjut tanpa input detail.
// Kalau user pilih "Ya", tampil field organisasi baru, posisi jabatan baru, dan alasan perubahan.
function PositionChangeStep({ positionChange, onPositionChange }: { positionChange: ChangeChoice; onPositionChange: (value: ChangeChoice) => void }) {
    return (
        <div className="space-y-4">
            <ChangeChoiceGroup label="Apakah ada perubahan jabatan?" value={positionChange} onValueChange={onPositionChange} />

            {positionChange === 'yes' && (
                <>
                    <div className="space-y-2">
                        <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                            Organisasi baru <RequiredMark />
                        </Label>
                        <Select defaultValue="creative">
                            <SelectTrigger className="h-11 rounded-xl border-[#C9CED6] bg-white font-poppins text-xs shadow-none focus:ring-1 focus:ring-[#1980C0] focus:ring-offset-0">
                                <SelectValue placeholder="Pilih organisasi" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="creative">Creatif</SelectItem>
                                <SelectItem value="product">Product</SelectItem>
                                <SelectItem value="operational">Operational</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                            Posisi Jabatan Baru <RequiredMark />
                        </Label>
                        <Select defaultValue="staff">
                            <SelectTrigger className="h-11 rounded-xl border-[#C9CED6] bg-white font-poppins text-xs shadow-none focus:ring-1 focus:ring-[#1980C0] focus:ring-offset-0">
                                <SelectValue placeholder="Pilih posisi jabatan" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="staff">Staff</SelectItem>
                                <SelectItem value="staff-videographer">Staff Videografer</SelectItem>
                                <SelectItem value="senior-staff">Senior Staff</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                            Alasan Perubahan <RequiredMark />
                        </Label>
                        <Textarea
                            placeholder="Masukan Alasan Perubahan"
                            className="min-h-[84px] resize-none rounded-xl border-[#C9CED6] font-poppins text-xs shadow-none focus-visible:ring-1 focus-visible:ring-[#1980C0] focus-visible:ring-offset-0"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

// Step 3: Kompensasi.
// Kalau user pilih "Tidak Ada", lanjut tanpa input detail.
// Kalau user pilih "Ya", tampil field gaji terbaru, tunjangan terbaru, dan nomor BPJS.
function CompensationStep({ compensationChange, onCompensationChange }: { compensationChange: ChangeChoice; onCompensationChange: (value: ChangeChoice) => void }) {
    return (
        <div className="space-y-4">
            <ChangeChoiceGroup label="Apakah ada perubahan pada gaji dan tunjangan?" value={compensationChange} onValueChange={onCompensationChange} />

            {compensationChange === 'yes' && (
                <>
                    <div className="space-y-2">
                        <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                            Gaji Terbaru <RequiredMark />
                        </Label>
                        <Input
                            defaultValue="Rp. 10.000.000"
                            className="h-11 rounded-xl border-[#C9CED6] font-poppins text-xs shadow-none focus-visible:ring-1 focus-visible:ring-[#1980C0] focus-visible:ring-offset-0"
                        />
                        <div className="flex items-center gap-2 font-poppins text-[11px] text-[#6B7280]">
                            <span className="size-3 rounded-full border border-[#C9CED6]" />
                            <span>Gaji Sebelumnya Rp. 8.000.000</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                            Tunjangan Terbaru <RequiredMark />
                        </Label>
                        <Select defaultValue="bpjs-kesehatan-makan-internet">
                            <SelectTrigger className="h-11 rounded-xl border-[#C9CED6] bg-white font-poppins text-xs shadow-none focus:ring-1 focus:ring-[#1980C0] focus:ring-offset-0">
                                <SelectValue placeholder="Pilih tunjangan terbaru" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bpjs-kesehatan-makan-internet">BPJS Kesehatan, Makan, Internet</SelectItem>
                                <SelectItem value="bpjs-kesehatan">BPJS Kesehatan</SelectItem>
                                <SelectItem value="makan-transport">Makan, Transport</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label className="font-poppins text-[11px] font-semibold text-[#121212]">
                            No. BPJS Kesehatan <RequiredMark />
                        </Label>
                        <Input
                            defaultValue="092389391"
                            className="h-11 rounded-xl border-[#C9CED6] font-poppins text-xs shadow-none focus-visible:ring-1 focus-visible:ring-[#1980C0] focus-visible:ring-offset-0"
                        />
                    </div>
                </>
            )}
        </div>
    );
}

// Render 1 kartu section pada step Preview.
function PreviewCard({ title, children }: { title: string; children: ReactNode }) {
    return (
        <div className="rounded-xl border border-[#E5E7EB] bg-white p-4">
            <p className="mb-3 font-poppins text-xs font-semibold text-[#121212]">{title}</p>
            <div className="space-y-1 font-poppins text-[11px] leading-5 text-[#4B5563]">{children}</div>
        </div>
    );
}

// Render baris label-value pada kartu Preview.
function PreviewRow({ label, value }: { label: string; value: string }) {
    return (
        <p>
            <span className="text-[#6B7280]">{label}: </span>
            <span className="font-medium text-[#121212]">{value}</span>
        </p>
    );
}

// Step 4: Preview.
// Menampilkan ringkasan keputusan dari 3 step sebelumnya.
function PreviewStep({
    branchChange,
    positionChange,
    compensationChange,
}: {
    branchChange: ChangeChoice;
    positionChange: ChangeChoice;
    compensationChange: ChangeChoice;
}) {
    return (
        <div className="space-y-3">
            <PreviewCard title="Data Kontrak">
                <PreviewRow label="Jenis Kontrak" value="PKWT" />
                <PreviewRow label="Tgl Mulai" value="12/09/2026" />
                <PreviewRow label="Tgl Berakhir" value="12/09/2027" />
                <PreviewRow label="Durasi masa kontrak" value="1 Tahun" />
            </PreviewCard>

            <PreviewCard title="Data Mutasi">
                <PreviewRow label="Cabang Sebelumnya" value="Jakarta" />
                <PreviewRow label="Cabang Saat Ini" value={branchChange === 'yes' ? 'Surabaya' : 'Jakarta'} />
                <PreviewRow label="Alasan Mutasi" value={branchChange === 'yes' ? 'Kebijakan Kantor' : 'Tidak ada mutasi'} />
            </PreviewCard>

            <PreviewCard title="Data Perubahan Jabatan">
                <PreviewRow label="Organisasi Baru" value={positionChange === 'yes' ? 'Creatif' : 'Tidak berubah'} />
                <PreviewRow label="Posisi Jabatan Baru" value={positionChange === 'yes' ? 'Staff Videografer' : 'Tidak berubah'} />
                <PreviewRow label="Alasan Perubahan" value={positionChange === 'yes' ? 'Performa bagus dan layak naik jabatan' : 'Tidak ada perubahan jabatan'} />
            </PreviewCard>

            <PreviewCard title="Data Kompensasi">
                <PreviewRow label="Gaji Terbaru" value={compensationChange === 'yes' ? 'Rp. 10.000.000' : 'Tidak berubah'} />
                <PreviewRow label="Tunjangan Baru" value={compensationChange === 'yes' ? 'BPJS Kesehatan, Makan, Internet' : 'Tidak berubah'} />
                <PreviewRow label="No. BPJS Kesehatan" value={compensationChange === 'yes' ? '092389391' : '-'} />
            </PreviewCard>

            <PreviewCard title="Dokumen Kontrak">
                <div className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2">
                    <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-[#FFF2F0] text-[#EF4444]">
                        <FileText className="size-4" />
                    </div>
                    <div className="min-w-0">
                        <p className="truncate font-poppins text-xs font-semibold text-[#121212]">Kontrak.PDF</p>
                        <p className="font-poppins text-[10px] text-[#6B7280]">0.8 Mb</p>
                    </div>
                </div>
            </PreviewCard>
        </div>
    );
}

// Dialog wizard utama untuk mengecek perubahan kepegawaian setelah kontrak disimpan.
// Urutan navigasinya:
// 1. Mutasi -> 2. Perubahan Jabatan -> 3. Kompensasi -> 4. Preview.
export function EmploymentChangeDialog({ contract, initialBranchChange = 'yes', open, onOpenChange }: EmploymentChangeDialogProps) {
    const [currentStep, setCurrentStep] = useState(1);

    // State pilihan utama tiap step disimpan di parent supaya step Preview
    // bisa membaca semua jawaban dari step 1-3.
    const [branchChange, setBranchChange] = useState<BranchChangeValue>(initialBranchChange);
    const [positionChange, setPositionChange] = useState<ChangeChoice>('yes');
    const [compensationChange, setCompensationChange] = useState<ChangeChoice>('yes');

    useEffect(() => {
        if (!open) return;

        // Setiap wizard dibuka, mulai lagi dari step 1.
        // initialBranchChange datang dari popup kecil:
        // - "Tidak ada" => no
        // - "Ya, ada perubahan" => yes
        setCurrentStep(1);
        setBranchChange(initialBranchChange);
        setPositionChange('yes');
        setCompensationChange('yes');
    }, [initialBranchChange, open]);

    // Router konten step berdasarkan currentStep:
    // 1 = Mutasi, 2 = Jabatan, 3 = Kompensasi, 4 = Preview.
    const stepContent = (() => {
        if (currentStep === 1) return <MutasiStep branchChange={branchChange} onBranchChange={setBranchChange} />;
        if (currentStep === 2) return <PositionChangeStep positionChange={positionChange} onPositionChange={setPositionChange} />;
        if (currentStep === 3) return <CompensationStep compensationChange={compensationChange} onCompensationChange={setCompensationChange} />;

        return <PreviewStep branchChange={branchChange} positionChange={positionChange} compensationChange={compensationChange} />;
    })();

    const goToNextStep = () => {
        // Di step terakhir tombol berubah menjadi "Selesai" dan menutup wizard.
        if (currentStep === steps.length) {
            onOpenChange(false);
            return;
        }

        setCurrentStep((step) => step + 1);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="flex max-h-[90vh] max-w-5xl flex-col gap-0 overflow-hidden rounded-2xl border-0 bg-white p-0 shadow-[0_18px_50px_rgba(15,23,42,0.22)]">
                <DialogHeader className="flex-row items-center justify-between space-y-0 border-b border-[#E7E7E7] px-5 py-4 text-left">
                    <DialogTitle className="font-poppins text-base font-semibold text-[#121212]">Perubahan Lainnya</DialogTitle>
                    <Stepper currentStep={currentStep} />
                </DialogHeader>

                <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
                    {contract && currentStep !== steps.length && (
                        <div className="mb-5">
                            <EmployeeSummary contract={contract} />
                        </div>
                    )}
                    {stepContent}
                </div>

                <DialogFooter className="grid grid-cols-2 gap-2 border-t border-[#E7E7E7] px-5 py-4 sm:space-x-0">
                    <Button
                        type="button"
                        variant="outline"
                        className="h-11 rounded-xl border-[#1980C0] font-poppins text-xs font-semibold text-[#1980C0] hover:bg-[#EAF7FF] hover:text-[#1980C0]"
                        onClick={() => onOpenChange(false)}
                    >
                        Batal
                    </Button>
                    <Button
                        type="button"
                        className="h-11 rounded-xl bg-[#1980C0] font-poppins text-xs font-semibold hover:bg-[#1668A0]"
                        onClick={goToNextStep}
                    >
                        {currentStep === steps.length ? 'Simpan' : 'Selanjutnya'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
