import AppLayout from '@/layouts/app-layout';

import { NotificationBell } from '@/components/notification-bell';

import { Button } from '@/components/ui/button';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

import { ChevronDown, ChevronLeft, ChevronRight, MoreVertical, Plus, Search } from 'lucide-react';

import { useMemo, useState } from 'react';

import { toast } from 'sonner';

import { type Employee } from '@/data/Employee/employee';

import {
    ApproveResignDialog,
    DeleteResignDialog,
    DetailResignDialog,
    RejectResignDialog,
    RESIGN_STATUS_STYLES as STATUS_STYLES,
} from '../../components/resign/resign-decision-dialogs';

import { ResignDialog, type ResignFormInput } from '../../components/resign/resign-dialog';

import { displayEmployeeId, withWizardDisplayFields, type WizardDisplayFields } from '../../lib/employee-display';

import { loadLocalEmployees, saveEmployeeOverride, updateLocalEmployee } from '../../lib/employee-storage';

import { loadDummyEmployees } from '../Data/employees-dummy';

import { loadResignRecords, saveResignRecords, type ResignRecord } from './resign-dummy';

/** A row source for "Pilih Karyawan": seeds keep their columns, wizard records get them from their overlay. */
type ResignableEmployee = Employee & Partial<WizardDisplayFields>;

/** Matches Data Karyawan — 10 rows per page, "Menampilkan" counts from it. */
const ROWS_PER_PAGE = 10;

/** Native date value (YYYY-MM-DD) → the short form the design shows, e.g. 12/19/26. */
function toShortDate(value: string): string {
    const [year, month, day] = value.split('-');

    if (!year || !month || !day) return value;

    return `${month}/${day}/${year.slice(2)}`;
}

const TH_CLASS = 'whitespace-nowrap px-5 py-4 text-left text-sm font-medium text-[#374151]';

export default function Index() {
    const [records, setRecords] = useState<ResignRecord[]>(() => loadResignRecords());

    const [search, setSearch] = useState('');
    const [branchFilter, setBranchFilter] = useState('all');
    const [branchOpen, setBranchOpen] = useState(false);

    const [currentPage, setCurrentPage] = useState(1);

    const [resignOpen, setResignOpen] = useState(false);

    const [approveRecord, setApproveRecord] = useState<ResignRecord | null>(null);
    const [rejectRecord, setRejectRecord] = useState<ResignRecord | null>(null);
    const [detailRecord, setDetailRecord] = useState<ResignRecord | null>(null);
    const [deleteRecord, setDeleteRecord] = useState<ResignRecord | null>(null);


    // ========================================================
    // EMPLOYEE SOURCES (for "Pilih Karyawan")
    // ========================================================

    const activeEmployees = useMemo<ResignableEmployee[]>(() => {
        const seeds = loadDummyEmployees().filter((employee) => !employee.is_archived);

        const locals = loadLocalEmployees()
            .filter((employee) => !employee.is_archived)
            .map(withWizardDisplayFields);

        return [...locals, ...seeds];
    }, []);

    const openRequestIds = useMemo(
        () => new Set(records.filter((record) => record.status === 'Menunggu').map((record) => record.employeeId)),
        [records],
    );

    const employeeOptions = useMemo(
        () =>
            activeEmployees
                // One open request per employee keeps the picker from stacking duplicates.
                .filter((employee) => !openRequestIds.has(displayEmployeeId(employee)))
                .map((employee) => ({
                    value: displayEmployeeId(employee),
                    label: `${displayEmployeeId(employee)} — ${employee.full_name}`,
                })),
        [activeEmployees, openRequestIds],
    );


    // ========================================================
    // SUMMARY (computed from the rows, so every action updates it)
    // ========================================================

    const pendingCount = records.filter((record) => record.status === 'Menunggu').length;
    const rejectedCount = records.filter((record) => record.status === 'Ditolak').length;
    const approvedCount = records.filter((record) => record.status === 'Non Aktif').length;


    // ========================================================
    // FILTER + PAGINATION
    // ========================================================

    const branches = useMemo(() => Array.from(new Set(records.map((record) => record.branch))), [records]);

    const filteredRecords = useMemo(() => {
        const keyword = search.trim().toLowerCase();

        return records.filter((record) => {
            const matchesBranch = branchFilter === 'all' || record.branch === branchFilter;

            const matchesSearch =
                !keyword ||
                record.employeeId.toLowerCase().includes(keyword) ||
                record.name.toLowerCase().includes(keyword) ||
                record.reason.toLowerCase().includes(keyword);

            return matchesBranch && matchesSearch;
        });
    }, [records, search, branchFilter]);

    const totalPages = Math.max(1, Math.ceil(filteredRecords.length / ROWS_PER_PAGE));
    const safePage = Math.min(currentPage, totalPages);
    const pageRecords = filteredRecords.slice((safePage - 1) * ROWS_PER_PAGE, safePage * ROWS_PER_PAGE);


    // ========================================================
    // ACTIONS
    // ========================================================

    const findEmployee = (displayId: string) =>
        activeEmployees.find((employee) => displayEmployeeId(employee) === displayId);

    /** Flips is_active off — local wizard records in their own store, seed rows through the override overlay. */
    const deactivate = (employee: ResignableEmployee) => {
        const storedLocal = loadLocalEmployees().find((record) => record.id === employee.id);

        if (storedLocal) {
            updateLocalEmployee(employee.id, { ...storedLocal, is_active: false });
        } else {
            saveEmployeeOverride(employee.id, { is_active: false });
        }
    };

    const handleApprove = (record: ResignRecord, accDate: string) => {
        const employee = findEmployee(record.employeeId);

        if (employee) deactivate(employee);

        setRecords(
            saveResignRecords(
                records.map((item) =>
                    item.id === record.id ? { ...item, status: 'Non Aktif' as const, accDate } : item,
                ),
            ),
        );

        setApproveRecord(null);
        toast.success('Berhasil Diapprove');
    };

    const handleReject = (record: ResignRecord, reason: string) => {
        setRecords(
            saveResignRecords(
                records.map((item) =>
                    item.id === record.id ? { ...item, status: 'Ditolak' as const, rejectReason: reason } : item,
                ),
            ),
        );

        setRejectRecord(null);
        toast.success('Berhasil Ditolak');
    };

    const handleDelete = (record: ResignRecord) => {
        setRecords(saveResignRecords(records.filter((item) => item.id !== record.id)));

        setDeleteRecord(null);
        toast.success('Berhasil Dihapus');
    };

    const handleSubmit = (input: ResignFormInput) => {
        const employee = findEmployee(input.employeeId);

        if (!employee) {
            toast.error('Karyawan tidak ditemukan.');
            return;
        }

        const nextNumber =
            records.reduce((max, record) => Math.max(max, Number(record.id.replace(/\D/g, '')) || 0), 0) + 1;

        const record: ResignRecord = {
            id: `RSG-${String(nextNumber).padStart(3, '0')}`,
            employeeId: input.employeeId,
            name: employee.full_name,
            branch: employee.branch ?? '-',
            organization: employee.organization ?? '-',
            position: employee.position ?? '-',
            submittedAt: toShortDate(input.resignDate),
            reason: input.reason,
            resignDate: toShortDate(input.resignDate),
            doc: input.document?.name,
            // A new request waits for the approver — the employee stays active until then.
            status: 'Menunggu',
        };

        setRecords(saveResignRecords([record, ...records]));
        setResignOpen(false);
        setCurrentPage(1);

        toast.success('Berhasil diajukan resign');
    };


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <AppLayout headerTitle="Resign" headerActions={<NotificationBell count={5} />}>
            <div className="min-h-screen bg-white">
                <div className="space-y-5 p-6">


                    {/* ==================================================
                        SUMMARY
                    ================================================== */}

                    <section className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

                            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                                <div className="text-[17px] font-semibold text-[#111827]">Menunggu Approve</div>
                                <div className="mt-2 text-[36px] font-bold leading-none text-[#C2A51B]">{pendingCount}</div>
                            </div>

                            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                                <div className="text-[17px] font-semibold text-[#111827]">Pengajuan Ditolak</div>
                                <div className="mt-2 text-[36px] font-bold leading-none text-[#EF4938]">{rejectedCount}</div>
                            </div>

                            <div className="rounded-xl border border-[#E5E7EB] bg-white p-5">
                                <div className="text-[17px] font-semibold text-[#111827]">Approved</div>
                                <div className="mt-2 text-[36px] font-bold leading-none text-[#39B52A]">{approvedCount}</div>
                            </div>

                        </div>
                    </section>


                    {/* ==================================================
                        TOOLBAR
                    ================================================== */}

                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

                        <div className="flex flex-1 gap-3">

    {/* BRANCH */}

    <div className="relative">
        <button
            type="button"
            onClick={() => setBranchOpen((value) => !value)}
            className="flex h-10 w-[170px] items-center justify-between rounded-lg border border-[#9CA3AF] bg-white px-3 text-xs text-[#111827]"
        >
            <span className="truncate">{branchFilter === 'all' ? 'Semua Cabang' : `Cabang: ${branchFilter}`}</span>

            <ChevronDown className="h-4 w-4 shrink-0" />
        </button>

        {branchOpen && (
            <div className="absolute left-0 top-11 z-30 w-[170px] rounded-xl border bg-white p-1 shadow-lg">
                <button
                    type="button"
                    className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#F3F4F6]"
                    onClick={() => {
                        setBranchFilter('all');
                        setCurrentPage(1);
                        setBranchOpen(false);
                    }}
                >
                    Semua Cabang
                </button>

                {branches.map((branch) => (
                    <button
                        key={branch}
                        type="button"
                        className="w-full rounded-lg px-3 py-2 text-left text-xs hover:bg-[#F3F4F6]"
                        onClick={() => {
                            setBranchFilter(branch);
                            setCurrentPage(1);
                            setBranchOpen(false);
                        }}
                    >
                        {branch}
                    </button>
                ))}
            </div>
        )}
    </div>

    {/* SEARCH */}

    <div className="relative w-full max-w-[260px]">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#111827]" />

        <input
            value={search}
            onChange={(event) => {
                setSearch(event.target.value);
                setCurrentPage(1);
            }}
            placeholder="Search"
            className="h-10 w-full rounded-lg border border-[#E5E7EB] bg-white pl-9 pr-3 text-xs outline-none placeholder:text-[#C0C4CC] focus:border-[#1980C0] focus:ring-2 focus:ring-[#1980C0]/10"
        />
    </div>


                        </div>

                        {/* ADD */}

                        <Button
                            type="button"
                            onClick={() => setResignOpen(true)}
                            className="h-11 rounded-xl bg-[#1980C0] px-5 text-sm font-semibold hover:bg-[#1673AD]"
                        >
                            <Plus className="mr-2 h-4 w-4" />
                            Resign
                        </Button>

                    </div>


                    {/* ==================================================
                        TABLE
                    ================================================== */}

                    <div className="overflow-visible rounded-xl border border-[#E5E7EB] bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[1100px] border-collapse">
                                <thead>
                                    <tr className="border-b border-[#E5E7EB] bg-[#FCFCFC]">
                                        <th className={TH_CLASS}>ID</th>
                                        <th className={TH_CLASS}>Nama</th>
                                        <th className={TH_CLASS}>Cabang</th>
                                        <th className={TH_CLASS}>Organisasi</th>
                                        <th className={TH_CLASS}>Posisi Jab</th>
                                        <th className={TH_CLASS}>Tgl diajukan</th>
                                        <th className={TH_CLASS}>Alasan Resign</th>
                                        <th className={TH_CLASS}>Status</th>
                                        <th className="w-16 border-l border-[#E5E7EB] px-3 py-4" />
                                    </tr>
                                </thead>

                                <tbody>
                                    {pageRecords.length === 0 ? (
                                        <tr>
                                            <td colSpan={9} className="px-5 py-12 text-center text-sm text-[#6B7280]">
                                                Tidak ada data resign.
                                            </td>
                                        </tr>
                                    ) : (
                                        pageRecords.map((record) => (
                                            <tr
                                                key={record.id}
                                                className="border-b border-[#EEF0F2] last:border-b-0 hover:bg-[#FAFCFE]"
                                            >
                                                <td className="whitespace-nowrap px-5 py-5 text-sm text-[#374151]">{record.employeeId}</td>
                                                <td className="whitespace-nowrap px-5 py-5 text-sm font-medium text-[#374151]">{record.name}</td>
                                                <td className="whitespace-nowrap px-5 py-5 text-sm text-[#4B5563]">{record.branch}</td>
                                                <td className="whitespace-nowrap px-5 py-5 text-sm text-[#4B5563]">{record.organization}</td>
                                                <td className="whitespace-nowrap px-5 py-5 text-sm text-[#4B5563]">{record.position}</td>
                                                <td className="whitespace-nowrap px-5 py-5 text-sm text-[#4B5563]">{record.submittedAt}</td>
                                                <td className="min-w-[220px] max-w-[260px] px-5 py-5 text-sm text-[#4B5563]">{record.reason}</td>

                                                <td className="px-5 py-5">
                                                    <span
                                                        className={`inline-flex whitespace-nowrap rounded-full border px-3 py-1 text-xs font-medium ${STATUS_STYLES[record.status]}`}
                                                    >
                                                        {record.status}
                                                    </span>
                                                </td>

                                                <td className="border-l border-[#E5E7EB] px-3 py-5">
                                                    <DropdownMenu>
                                                        <DropdownMenuTrigger asChild>
                                                            <button
                                                                type="button"
                                                                aria-label={`Aksi ${record.name}`}
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-[#E5E7EB] text-[#374151] hover:bg-[#F9FAFB]"
                                                            >
                                                                <MoreVertical className="h-5 w-5" />
                                                            </button>
                                                        </DropdownMenuTrigger>

                                                        <DropdownMenuContent align="end" className="w-44 rounded-xl border-[#E5E7EB] p-1.5 shadow-xl">
                                                            {record.status === 'Menunggu' && (
                                                                <>
                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer rounded-lg px-3 py-2"
                                                                        onClick={() => setApproveRecord(record)}
                                                                    >
                                                                        Approve
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuSeparator />

                                                                    <DropdownMenuItem
                                                                        className="cursor-pointer rounded-lg px-3 py-2"
                                                                        onClick={() => setRejectRecord(record)}
                                                                    >
                                                                        Tolak
                                                                    </DropdownMenuItem>

                                                                    <DropdownMenuSeparator />
                                                                </>
                                                            )}

                                                            <DropdownMenuItem
                                                                className="cursor-pointer rounded-lg px-3 py-2"
                                                                onClick={() => {
                                                                    // Detail Karyawan renders the full profile — skip if the id has no matching record.
                                                                    if (!findEmployee(record.employeeId)) {
                                                                        toast.error('Data karyawan tidak ditemukan.');
                                                                        return;
                                                                    }

                                                                    setDetailRecord(record);
                                                                }}
                                                            >
                                                                Detail
                                                            </DropdownMenuItem>

                                                            <DropdownMenuSeparator />

                                                            <DropdownMenuItem
                                                                className="cursor-pointer rounded-lg px-3 py-2 text-[#E84A39] focus:text-[#E84A39]"
                                                                onClick={() => setDeleteRecord(record)}
                                                            >
                                                                Hapus
                                                            </DropdownMenuItem>
                                                        </DropdownMenuContent>
                                                    </DropdownMenu>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>


                    {/* ==================================================
                        PAGINATION (di luar kartu tabel, sesuai desain)
                    ================================================== */}

                    <div className="flex w-full items-center justify-between gap-4">

                        {/* Nomor halaman di kiri, teks jumlah data di bawahnya. */}
                        <div className="flex min-w-0 flex-col items-start gap-2">
                            <div className="flex flex-wrap items-center gap-2">
                                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                                    <button
                                        key={page}
                                        type="button"
                                        onClick={() => setCurrentPage(page)}
                                        className={`flex h-10 min-w-10 items-center justify-center rounded-lg border px-2 text-sm transition ${
                                            safePage === page
                                                ? 'border-[#E5E7EB] bg-[#F3F4F6] font-semibold text-[#111827]'
                                                : 'border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F3F4F6]'
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                            </div>

                            <div className="whitespace-nowrap text-sm text-[#6B7280]">
                                Menampilkan{' '}
                                <span className="font-medium text-[#374151]">
                                    {filteredRecords.length === 0 ? 0 : (safePage - 1) * ROWS_PER_PAGE + 1}
                                </span>
                                {' - '}
                                <span className="font-medium text-[#374151]">
                                    {Math.min(safePage * ROWS_PER_PAGE, filteredRecords.length)}
                                </span>
                                {' dari '}
                                <span className="font-medium text-[#374151]">{filteredRecords.length}</span>
                                {' pengajuan'}
                            </div>
                        </div>

                        <div className="flex shrink-0 items-center gap-2">
                            <button
                                type="button"
                                disabled={safePage <= 1}
                                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                                className="flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#374151] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <ChevronLeft className="h-4 w-4" />
                                <span>Prev</span>
                            </button>

                            <button
                                type="button"
                                disabled={safePage >= totalPages}
                                onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
                                className="flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#374151] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
                            >
                                <span>Next</span>
                                <ChevronRight className="h-4 w-4" />
                            </button>
                        </div>

                    </div>

                </div>


                {/* ==================================================
                    ADD RESIGN DIALOG
                ================================================== */}

                <ResignDialog
                    open={resignOpen}
                    onOpenChange={setResignOpen}
                    employees={employeeOptions}
                    onSubmit={handleSubmit}
                />


                {/* ==================================================
                    DECISION DIALOGS
                ================================================== */}

                <ApproveResignDialog
                    open={approveRecord !== null}
                    onOpenChange={(next) => {
                        if (!next) setApproveRecord(null);
                    }}
                    record={approveRecord}
                    onApprove={handleApprove}
                />

                <RejectResignDialog
                    open={rejectRecord !== null}
                    onOpenChange={(next) => {
                        if (!next) setRejectRecord(null);
                    }}
                    record={rejectRecord}
                    onReject={handleReject}
                />

                <DetailResignDialog
                    open={detailRecord !== null}
                    onOpenChange={(next) => {
                        if (!next) setDetailRecord(null);
                    }}
                    record={detailRecord}
                    employee={detailRecord ? findEmployee(detailRecord.employeeId) ?? null : null}
                    onApprove={() => {
                        if (!detailRecord) return;

                        // Leave the profile and hand the pending request to the Approve dialog.
                        setDetailRecord(null);
                        setApproveRecord(detailRecord);
                    }}
                />

                <DeleteResignDialog
                    open={deleteRecord !== null}
                    onOpenChange={(next) => {
                        if (!next) setDeleteRecord(null);
                    }}
                    record={deleteRecord}
                    onDelete={handleDelete}
                />

            </div>
        </AppLayout>
    );
}