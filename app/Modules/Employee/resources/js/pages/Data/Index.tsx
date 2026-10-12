import AppLayout from '@/layouts/app-layout';

import { NotificationBell } from '@/components/notification-bell';

import {
    Archive,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Eye,
    MoreVertical,
    Pencil,
    Plus,
    Search,
    SlidersHorizontal,
} from 'lucide-react';

import {
    useCallback,
    useMemo,
    useRef,
    useState,
} from 'react';

import { toast } from 'sonner';

import {
    Dialog,
    DialogContent,
    DialogDescription,
} from '@/components/ui/dialog';

import { Button } from '@/components/ui/button';

import {
    type Employee,
} from '@/data/Employee/employee';

import {
    loadDummyEmployees,
    saveDummyEmployees,
    type DummyEmployee,
} from './employees-dummy';

import { DetailDialog } from '../../components/detail/detail-dialog';

import { EmployeeFormDialog } from '../../components/employee-form-dialog';

import { TableHScrollBar } from '@/components/table-h-scrollbar';

import { displayEmployeeId, withWizardDisplayFields } from '../../lib/employee-display';

import { saveFormOverlay } from '../../lib/employee-form-overlay';

import {
    applyFormDataToEmployee,
    loadEmployeeOverrides,
    loadLocalEmployees,
    saveEmployeeOverride,
    saveLocalEmployee,
    updateLocalEmployee,
    wizardEditableFields,
} from '../../lib/employee-storage';

import {
    type EmployeeFormData,
    type FileFieldFlags,
} from '../../types/employee-form';

import { ArchiveConfirmDialog } from '../../components/archive-confirm-dialog';

import { ApprovePengajuanDialog } from '../../components/approve/approve-pengajuan-dialog';

import { PENGAJUAN_DUMMY, type PengajuanPerubahan } from './pengajuan-dummy';

import {
    loadPengajuanDecisions,
    savePengajuanDecision,
    type PengajuanDecision,
} from '../../lib/pengajuan-storage';

import { ArsipKaryawanDialog } from '../../components/arsip-karyawan-dialog';

import {
    EMPTY_LIST_FILTER,
    FilterPanel,
    type EmployeeListFilter,
} from './filter-panel';


// ============================================================
// TYPES
// ============================================================

type EmployeeRow =
    | DummyEmployee
    | Employee;

type StatusFilter =
    | 'all'
    | 'active'
    | 'inactive';

type PaginationItem =
    | number
    | 'ellipsis';


// ============================================================
// HELPER
// ============================================================

function formatDate(value?: string | null) {
    if (!value) {
        return '-';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
        return value;
    }

    return date
        .toLocaleDateString('id-ID', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
        })
        .replace(/\//g, '-');
}


// ============================================================
// GROWTH CHART DATA
// ============================================================

/** Bars are grouped per month in this fixed order — the design shows Jan-Jun only. */
const GROWTH_MONTH_LABELS = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'Mei',
    'Jun',
];

/**
 * Dummy "karyawan baru / karyawan resign" series behind the Pertumbuhan chart.
 * Static because the design charts fabricated numbers rather than anything
 * derived from the rows, and the year selector runs through 2028.
 */
const GROWTH_BY_YEAR: Record<string, { newEmployees: number; resignEmployees: number }[]> = {
    2026: [
        { newEmployees: 15, resignEmployees: 8 },
        { newEmployees: 19, resignEmployees: 5 },
        { newEmployees: 12, resignEmployees: 12 },
        { newEmployees: 23, resignEmployees: 7 },
        { newEmployees: 18, resignEmployees: 10 },
        { newEmployees: 27, resignEmployees: 4 },
    ],
    2027: [
        { newEmployees: 21, resignEmployees: 6 },
        { newEmployees: 17, resignEmployees: 9 },
        { newEmployees: 24, resignEmployees: 5 },
        { newEmployees: 20, resignEmployees: 11 },
        { newEmployees: 26, resignEmployees: 7 },
        { newEmployees: 22, resignEmployees: 8 },
    ],
    2028: [
        { newEmployees: 24, resignEmployees: 7 },
        { newEmployees: 28, resignEmployees: 5 },
        { newEmployees: 22, resignEmployees: 10 },
        { newEmployees: 30, resignEmployees: 6 },
        { newEmployees: 25, resignEmployees: 9 },
        { newEmployees: 31, resignEmployees: 5 },
    ],
};


// ============================================================
// PAGE
// ============================================================

export default function Index() {

    // ========================================================
    // DATA
    // ========================================================

    const [
        dummyEmployees,
        setDummyEmployees,
    ] = useState<DummyEmployee[]>(
        () => loadDummyEmployees(),
    );

    const [
        localEmployees,
        setLocalEmployees,
    ] = useState(
        loadLocalEmployees,
    );

    const [
        overrides,
        setOverrides,
    ] = useState(
        loadEmployeeOverrides,
    );


    // ========================================================
    // TABLE STATE
    // ========================================================

    // Horizontal-scroll container of the table; TableHScrollBar under the card mirrors it.
    const tableRef = useRef<HTMLDivElement>(null);

    const [
        search,
        setSearch,
    ] = useState('');

    const [
        branchFilter,
        setBranchFilter,
    ] = useState('all');

    const [
        statusFilter,
        setStatusFilter,
    ] = useState<StatusFilter>(
        'all',
    );

    // Departemen / Kontrak / Level — owned by the right-hand Filter panel;
    // `statusFilter` above stays separate because the stats card sets it too.
    const [
        listFilter,
        setListFilter,
    ] = useState<EmployeeListFilter>(
        EMPTY_LIST_FILTER,
    );

    const [
        filterOpen,
        setFilterOpen,
    ] = useState(false);

    const [
        approveOpen,
        setApproveOpen,
    ] = useState(false);

    const [
        branchOpen,
        setBranchOpen,
    ] = useState(false);

    const [
        actionOpen,
        setActionOpen,
    ] = useState<
        string | number | null
    >(null);

    /** Row menus near the viewport bottom flip upward so they are never clipped. */
    const [actionOpensUp, setActionOpensUp] = useState(false);

    const [arsipOpen, setArsipOpen] = useState(false);

    /**
     * Decisions taken on the approval queue — drives both the queue's visible
     * rows and the "Menunggu Approval" summary, and survives a refresh.
     */
    const [pengajuanDecisions, setPengajuanDecisions] = useState(
        loadPengajuanDecisions,
    );

    const [
        currentPage,
        setCurrentPage,
    ] = useState(1);

    const rowsPerPage = 10;


    // ========================================================
    // FORM STATE
    // ========================================================

    const [
        open,
        setOpen,
    ] = useState(false);

    const [
        editingEmployee,
        setEditingEmployee,
    ] = useState<Employee | null>(
        null,
    );

    const [
        archiveTarget,
        setArchiveTarget,
    ] = useState<Employee | null>(
        null,
    );

    const [
        detailEmployee,
        setDetailEmployee,
    ] = useState<Employee | null>(
        null,
    );


    // ========================================================
    // GABUNG DATA
    // ========================================================

    const mergedEmployees =
        useMemo<EmployeeRow[]>(() => {

            const mergedDummy =
                dummyEmployees.map(
                    (employee) => ({
                        ...employee,
                        ...overrides[
                            employee.id
                        ],
                    }),
                );

            // Rows created in the wizard sit on top of the seed list, newest
            // first, so a fresh "Tambah Karyawan" is visible without paging.
            return [
                ...localEmployees
                    .slice()
                    .reverse()
                    .map(withWizardDisplayFields),
                ...mergedDummy,
            ];

        }, [
            dummyEmployees,
            localEmployees,
            overrides,
        ]);

    // The table only ever shows live rows; the Arsip dialog reads the
    // archived half of the very same merge.
    const allEmployees =
        useMemo<EmployeeRow[]>(
            () =>
                mergedEmployees.filter(
                    (employee) =>
                        !employee.is_archived,
                ),
            [
                mergedEmployees,
            ],
        );


    // ========================================================
    // STATISTICS
    // ========================================================

    const totalEmployees =
        allEmployees.length;

    const activeEmployees =
        allEmployees.filter(
            (employee) =>
                employee.is_active,
        ).length;

    const inactiveEmployees =
        allEmployees.filter(
            (employee) =>
                !employee.is_active,
        ).length;

    // The summary follows the approval queue: every undecided pengajuan
    // counts, so Approve/Tolak moves the number immediately — and because the
    // decisions are stored, the new number survives a refresh.
    const pendingEmployees =
        PENGAJUAN_DUMMY.filter(
            (item) =>
                !pengajuanDecisions[item.id],
        ).length;


    // ========================================================
    // ARCHIVED (arsip dialog)
    // ========================================================

    const archivedEmployees =
        useMemo(
            () =>
                mergedEmployees.filter(
                    (employee) =>
                        employee.is_archived,
                ),
            [
                mergedEmployees,
            ],
        );


    // ========================================================
    // BRANCHES
    // ========================================================

    const branches =
        useMemo(() => {

            const values =
                allEmployees
                    .map(
                        (employee) =>
                            'branch' in
                            employee
                                ? employee.branch
                                : '',
                    )
                    .filter(
                        (value) =>
                            value && value !== '-',
                    );

            return Array.from(
                new Set(values),
            );

        }, [
            allEmployees,
        ]);


    // ========================================================
    // ORGANIZATIONS (DEPARTMENT FILTER OPTIONS)
    // ========================================================

    const organizationOptions =
        useMemo(() => {

            const values =
                allEmployees
                    .map(
                        (employee) =>
                            'organization' in
                            employee
                                ? employee.organization
                                : '',
                    )
                    .filter(Boolean);

            return Array.from(
                new Set(values),
            );

        }, [
            allEmployees,
        ]);


    // ========================================================
    // FILTER DATA
    // ========================================================

    const filteredEmployees =
        useMemo(() => {

            const keyword =
                search
                    .trim()
                    .toLowerCase();

            return allEmployees.filter(
                (employee) => {

                    const name =
                        employee.full_name ?? '';

                    const email =
                        employee.email_self ?? '';

                    const id = displayEmployeeId(employee);

                    const branch =
                        'branch' in
                        employee
                            ? employee.branch
                            : '';

                    const matchesBranch =
                        branchFilter ===
                            'all' ||
                        branch ===
                            branchFilter;

                    const matchesStatus =
                        statusFilter ===
                            'all' ||
                        (statusFilter ===
                            'active' &&
                            employee.is_active) ||
                        (statusFilter ===
                            'inactive' &&
                            !employee.is_active);

                    const organization =
                        'organization' in
                        employee
                            ? employee.organization
                            : '';

                    const employmentStatus =
                        'employment_status' in
                        employee
                            ? employee.employment_status
                            : '';

                    const position =
                        'position' in
                        employee
                            ? employee.position
                            : '';

                    // One keyword matches id, contact and org placement, so
                    // searching "EM127", "jakarta" or "manager" all narrow the
                    // list instead of returning nothing.
                    const matchesSearch =
                        !keyword ||
                        name
                            .toLowerCase()
                            .includes(
                                keyword,
                            ) ||
                        email
                            .toLowerCase()
                            .includes(
                                keyword,
                            ) ||
                        id
                            .toLowerCase()
                            .includes(
                                keyword,
                            ) ||
                        branch
                            .toLowerCase()
                            .includes(
                                keyword,
                            ) ||
                        organization
                            .toLowerCase()
                            .includes(
                                keyword,
                            ) ||
                        employmentStatus
                            .toLowerCase()
                            .includes(
                                keyword,
                            ) ||
                        position
                            .toLowerCase()
                            .includes(
                                keyword,
                            );

                    const matchesOrganization =
                        listFilter.organization ===
                            'all' ||
                        organization ===
                            listFilter.organization;

                    const matchesContract =
                        listFilter.contracts
                            .length === 0 ||
                        listFilter.contracts.includes(
                            employmentStatus,
                        );

                    const matchesLevel =
                        listFilter.levels
                            .length === 0 ||
                        listFilter.levels.includes(
                            position,
                        );

                    return (
                        matchesSearch &&
                        matchesBranch &&
                        matchesStatus &&
                        matchesOrganization &&
                        matchesContract &&
                        matchesLevel
                    );
                },
            );

        }, [
            allEmployees,
            search,
            branchFilter,
            statusFilter,
            listFilter,
        ]);


    // ========================================================
    // PAGINATION
    // ========================================================

    const totalPages =
        Math.max(
            1,
            Math.ceil(
                filteredEmployees.length /
                    rowsPerPage,
            ),
        );

    const safePage =
        Math.min(
            currentPage,
            totalPages,
        );

    const paginatedEmployees =
        filteredEmployees.slice(
            (safePage - 1) *
                rowsPerPage,
            safePage *
                rowsPerPage,
        );


    // ========================================================
    // PAGINATION BUTTONS
    // ========================================================

    const paginationItems =
        useMemo<PaginationItem[]>(() => {

            if (totalPages <= 7) {
                return Array.from(
                    {
                        length: totalPages,
                    },
                    (_, index) =>
                        index + 1,
                );
            }

            if (safePage <= 4) {
                return [
                    1,
                    2,
                    3,
                    4,
                    'ellipsis',
                    totalPages,
                ];
            }

            if (
                safePage >=
                totalPages - 3
            ) {
                return [
                    1,
                    'ellipsis',
                    totalPages - 3,
                    totalPages - 2,
                    totalPages - 1,
                    totalPages,
                ];
            }

            return [
                1,
                'ellipsis',
                safePage - 1,
                safePage,
                safePage + 1,
                'ellipsis',
                totalPages,
            ];

        }, [
            safePage,
            totalPages,
        ]);


    // ========================================================
    // MONTHLY CHART
    // ========================================================

    const [growthYear, setGrowthYear] = useState('2026');

    const monthlyGrowth = GROWTH_BY_YEAR[growthYear] ?? GROWTH_BY_YEAR['2026'];


    // ========================================================
    // EMPLOYMENT STATUS
    // ========================================================

    const employmentStats =
        useMemo(() => {

            const labels:
                DummyEmployee['employment_status'][] =
                [
                    'Tetap',
                    'PKWT',
                    'Probation',
                    'Freelance',
                ];

            return labels.map(
                (label) => ({
                    label,
                    value:
                        allEmployees.filter(
                            (employee) =>
                                'employment_status' in
                                    employee &&
                                employee.employment_status ===
                                    label,
                        ).length,
                }),
            );

        }, [
            allEmployees,
        ]);


    // ========================================================
    // ORGANIZATION
    // ========================================================

    const organizationStats =
        useMemo(() => {

            const counts =
                new Map<
                    string,
                    number
                >();

            allEmployees.forEach(
                (employee) => {

                    const organization =
                        'organization' in
                        employee
                            ? employee.organization
                            : 'Lainnya';

                    counts.set(
                        organization,
                        (counts.get(
                            organization,
                        ) ?? 0) + 1,
                    );
                },
            );

            return Array.from(
                counts.entries(),
            )
                .map(
                    ([
                        label,
                        value,
                    ]) => ({
                        label,
                        value,
                    }),
                )
                .sort(
                    (a, b) =>
                        b.value -
                        a.value,
                )
                .slice(0, 4);

        }, [
            allEmployees,
        ]);


    // ========================================================
    // OPEN CREATE
    // ========================================================

    const openCreate =
        () => {

            setEditingEmployee(
                null,
            );

            setOpen(true);
        };


    // ========================================================
    // EDIT
    // ========================================================

    const openEdit =
        useCallback(
            (row: EmployeeRow) => {

                setEditingEmployee(
                    row as Employee,
                );

                setOpen(true);

                setActionOpen(
                    null,
                );
            },
            [],
        );


    // ========================================================
    // DETAIL
    // ========================================================

    const openDetail =
        useCallback(
            (row: EmployeeRow) => {

                setDetailEmployee(
                    row as Employee,
                );

                setActionOpen(
                    null,
                );
            },
            [],
        );


    // ========================================================
    // ARCHIVE
    // ========================================================

    const openArchive =
        useCallback(
            (row: EmployeeRow) => {

                setArchiveTarget(
                    row as Employee,
                );

                setActionOpen(
                    null,
                );
            },
            [],
        );


    // ========================================================
    // CONFIRM ARCHIVE
    // ========================================================

    const confirmArchive =
        () => {

            if (
                !archiveTarget
            ) {
                return;
            }

            const isLocal =
                localEmployees.some(
                    (employee) =>
                        String(
                            employee.id,
                        ) ===
                        String(
                            archiveTarget.id,
                        ),
                );

            if (isLocal) {

                setLocalEmployees(
                    updateLocalEmployee(
                        archiveTarget.id,
                        {
                            ...archiveTarget,
                            is_archived:
                                true,
                        },
                    ),
                );

            } else {

                const updated =
                    dummyEmployees.map(
                        (employee) =>
                            String(
                                employee.id,
                            ) ===
                            String(
                                archiveTarget.id,
                            )
                                ? {
                                      ...employee,
                                      is_archived:
                                          true,
                                  }
                                : employee,
                    );

                setDummyEmployees(
                    saveDummyEmployees(
                        updated,
                    ),
                );

                setOverrides(
                    saveEmployeeOverride(
                        archiveTarget.id,
                        {
                            is_archived:
                                true,
                        },
                    ),
                );
            }

            toast.success(
                'Berhasil Diarsipkan',
            );

            setArchiveTarget(
                null,
            );
        };


    // ========================================================
    // RESTORE (from the Arsip Karyawan dialog)
    // ========================================================

    const handleRestore =
        (
            row: EmployeeRow,
        ) => {

            const employee =
                row as Employee;

            const isLocal =
                localEmployees.some(
                    (item) =>
                        String(
                            item.id,
                        ) ===
                        String(
                            employee.id,
                        ),
                );

            if (isLocal) {

                setLocalEmployees(
                    updateLocalEmployee(
                        employee.id,
                        {
                            ...employee,
                            is_archived:
                                false,
                        },
                    ),
                );

            } else {

                const updated =
                    dummyEmployees.map(
                        (item) =>
                            String(
                                item.id,
                            ) ===
                            String(
                                employee.id,
                            )
                                ? {
                                      ...item,
                                      is_archived:
                                          false,
                                  }
                                : item,
                    );

                setDummyEmployees(
                    saveDummyEmployees(
                        updated,
                    ),
                );

                setOverrides(
                    saveEmployeeOverride(
                        employee.id,
                        {
                            is_archived:
                                false,
                        },
                    ),
                );
            }

            toast.success(
                'Berhasil Direstore',
            );
        };


    // ========================================================
    // PENGAJUAN DECISIONS (queue → summary)
    // ========================================================

    const handlePengajuanDecide =
        useCallback(
            (
                item: PengajuanPerubahan,
                decision: PengajuanDecision,
            ) => {
                setPengajuanDecisions(
                    savePengajuanDecision(
                        item.id,
                        decision,
                    ),
                );
            },
            [],
        );


    // ========================================================
    // SAVE HANDLERS
    // EmployeeFormDialog owns validation, form state, and the
    // steps — these two only persist what the dialog submits.
    // ========================================================

    const handleCreate =
        useCallback(
            async (
                formData: EmployeeFormData,
                fileFlags: FileFieldFlags,
            ) => {

                const {
                    employees,
                    created,
                } =
                    saveLocalEmployee(
                        formData,
                    );

                // Overlay must land in localStorage BEFORE setLocalEmployees
                // re-renders the table: the Cabang/Departemen/Divisi columns
                // read it synchronously per row, and once this async write
                // finishes nothing re-renders again — the row would show "-"
                // until a manual page refresh.
                await saveFormOverlay(
                    created.id,
                    formData,
                    fileFlags,
                );

                setLocalEmployees(
                    employees,
                );

            },
            [],
        );


    const handleUpdate =
        useCallback(
            async (
                target: Employee,
                formData: EmployeeFormData,
                fileFlags: FileFieldFlags,
            ) => {

                // Same ordering rule as handleCreate: persist the overlay
                // first so the re-render triggered below reads fresh
                // Cabang/Departemen/Divisi values on its very first paint.
                await saveFormOverlay(
                    target.id,
                    formData,
                    fileFlags,
                );

                const isLocal =
                    localEmployees.some(
                        (employee) =>
                            String(
                                employee.id,
                            ) ===
                            String(
                                target.id,
                            ),
                    );

                if (isLocal) {

                    setLocalEmployees(
                        updateLocalEmployee(
                            target.id,
                            applyFormDataToEmployee(
                                target,
                                formData,
                            ),
                        ),
                    );

                } else {

                    const updated =
                        dummyEmployees.map(
                            (employee) =>
                                String(
                                    employee.id,
                                ) ===
                                String(
                                    target.id,
                                )
                                    ? {
                                          ...employee,
                                          ...applyFormDataToEmployee(
                                              employee,
                                              formData,
                                          ),
                                      }
                                    : employee,
                        );

                    setDummyEmployees(
                        saveDummyEmployees(
                            updated,
                        ),
                    );

                    setOverrides(
                        saveEmployeeOverride(
                            target.id,
                            wizardEditableFields(
                                formData,
                            ),
                        ),
                    );

                }

            },
            [
                localEmployees,
                dummyEmployees,
            ],
        );


    // ========================================================
    // RENDER
    // ========================================================

    return (
        <AppLayout
            headerTitle="Data Karyawan"
            headerActions={<NotificationBell count={5} />}
        >

            <div className="min-h-screen bg-white">


                {/* ==================================================
                    CONTENT
                ================================================== */}

                <div className="space-y-5 p-4 sm:p-6">


                    {/* ==================================================
                        OVERVIEW
                    ================================================== */}

                    <section className="rounded-2xl border border-[#E5E7EB] bg-[#FAFAFA] p-4">

                        <div className="grid grid-cols-1 gap-4 xl:grid-cols-[520px_minmax(0,1fr)]">


                            {/* LEFT STATISTICS */}

                            <div className="grid grid-cols-2 gap-4">

                                {/* TOTAL */}

                                <div className="rounded-xl border bg-white p-5">

                                    <div className="text-[16px] font-semibold text-[#111827]">
                                        Semua Karyawan
                                    </div>

                                    <div className="mt-2 text-[34px] font-bold leading-none text-[#111827]">
                                        {totalEmployees}
                                    </div>

                                </div>


                                {/* ACTIVE */}

                                <div className="rounded-xl border bg-white p-5">

                                    <div className="text-[16px] font-semibold text-[#111827]">
                                        Karyawan Aktif
                                    </div>

                                    <div className="mt-2 text-[34px] font-bold leading-none text-[#39B52A]">
                                        {activeEmployees}
                                    </div>

                                </div>


                                {/* INACTIVE */}

                                <div className="rounded-xl border bg-white p-5">

                                    <div className="text-[16px] font-semibold text-[#111827]">
                                        Karyawan Non Aktif
                                    </div>

                                    <div className="mt-2 text-[34px] font-bold leading-none text-[#EF4938]">
                                        {inactiveEmployees}
                                    </div>

                                </div>


                                {/* PENDING — opens the approval queue popup. */}

                                <button
                                    type="button"
                                    className="rounded-xl border-2 border-[#C7E4F8] bg-white p-5 text-left transition hover:bg-[#F8FCFF]"
                                    onClick={() =>
                                        setApproveOpen(
                                            true,
                                        )
                                    }
                                >

                                    <div className="flex items-center justify-between">

                                        <div>

                                            <div className="text-[16px] font-semibold text-[#111827]">
                                                Menunggu Approval
                                            </div>

                                            <div className="mt-2 text-[34px] font-bold leading-none text-[#C2A51B]">
                                                {pendingEmployees}
                                            </div>

                                        </div>

                                        <span className="text-2xl text-[#111827]">
                                            →
                                        </span>

                                    </div>

                                </button>


                                {/* EMPLOYMENT */}

                                <div className="rounded-xl border bg-white p-5">

                                    <h3 className="text-[16px] font-semibold text-[#1F2937]">
                                        Status Kepegawaian
                                    </h3>

                                    <div className="mt-4 space-y-3">

                                        {employmentStats.map(
                                            (
                                                item,
                                            ) => (
                                                <div
                                                    key={
                                                        item.label
                                                    }
                                                    className="flex items-center justify-between text-sm"
                                                >

                                                    <span className="text-[#6B7280]">
                                                        {
                                                            item.label
                                                        }
                                                    </span>

                                                    <span className="font-semibold text-[#374151]">
                                                        {
                                                            item.value
                                                        }
                                                    </span>

                                                </div>
                                            ),
                                        )}

                                    </div>

                                </div>


                                {/* ORGANIZATION */}

                                <div className="rounded-xl border bg-white p-5">

                                    <h3 className="text-[16px] font-semibold text-[#1F2937]">
                                        Karyawan Organisasi
                                    </h3>

                                    <div className="mt-4 space-y-3">

                                        {organizationStats.map(
                                            (
                                                item,
                                            ) => (
                                                <div
                                                    key={
                                                        item.label
                                                    }
                                                    className="flex items-center justify-between text-sm"
                                                >

                                                    <span className="text-[#6B7280]">
                                                        {
                                                            item.label
                                                        }
                                                    </span>

                                                    <span className="font-semibold text-[#374151]">
                                                        {
                                                            item.value
                                                        }
                                                    </span>

                                                </div>
                                            ),
                                        )}

                                    </div>

                                </div>

                            </div>


                            {/* CHART */}

                            <div className="rounded-xl border bg-white p-5">

                                <div className="flex flex-wrap items-center justify-between gap-2">

                                    <h2 className="text-[17px] font-semibold text-[#111827]">
                                        Karyawan Pertumbuhan Karyawan
                                    </h2>

                                    <select
                                        className="cursor-pointer rounded-xl border border-[#D1D5DB] bg-white px-4 py-2 text-sm outline-none"
                                        value={growthYear}
                                        onChange={(event) =>
                                            setGrowthYear(event.target.value)
                                        }
                                    >

                                        {Object.keys(GROWTH_BY_YEAR).map((year) => (
                                            <option key={year} value={year}>
                                                {year}
                                            </option>
                                        ))}

                                    </select>

                                </div>


                                <div className="mt-6 flex gap-3">

                                    {/* Y AXIS — fixed 0-100 scale, matching the design. */}

                                    <div className="relative h-[240px] w-7">

                                        {[100, 80, 60, 40, 20, 0].map((tick) => (
                                            <span
                                                key={tick}
                                                className="absolute right-0 -translate-y-1/2 text-xs leading-none text-[#9CA3AF]"
                                                style={{ top: `${100 - tick}%` }}
                                            >
                                                {tick}
                                            </span>
                                        ))}

                                    </div>

                                    {/* PLOT AREA */}

                                    <div className="min-w-0 flex-1">

                                        <div className="relative h-[240px] rounded-lg border border-[#E5E7EB]">

                                            {[100, 80, 60, 40, 20, 0].map((tick) => (
                                                <div
                                                    key={tick}
                                                    className="absolute inset-x-0 border-t border-[#F1F3F5]"
                                                    style={{ top: `${100 - tick}%` }}
                                                />
                                            ))}

                                            <div className="absolute inset-0 flex items-end justify-around px-2 sm:px-8">

                                                {monthlyGrowth.map((item, index) => (
                                                    <div
                                                        key={GROWTH_MONTH_LABELS[index]}
                                                        className="flex h-full min-w-0 flex-1 items-end justify-center gap-1 sm:gap-1.5"
                                                    >

                                                        <div
                                                            title={`Karyawan resign: ${item.resignEmployees}`}
                                                            className="flex-1 rounded-t-md bg-[#EF4938] sm:w-4 sm:flex-none md:w-6"
                                                            style={{
                                                                height: `${item.resignEmployees}%`,
                                                            }}
                                                        />

                                                        <div
                                                            title={`Karyawan baru: ${item.newEmployees}`}
                                                            className="flex-1 rounded-t-md bg-[#3DB52A] sm:w-4 sm:flex-none md:w-6"
                                                            style={{
                                                                height: `${item.newEmployees}%`,
                                                            }}
                                                        />

                                                    </div>
                                                ))}

                                            </div>

                                        </div>

                                        <div className="mt-2 flex justify-around">

                                            {monthlyGrowth.map((item, index) => (
                                                <span
                                                    key={GROWTH_MONTH_LABELS[index]}
                                                    className="flex-1 text-center text-[10px] text-[#6B7280] sm:text-xs"
                                                >
                                                    {GROWTH_MONTH_LABELS[index]}
                                                </span>
                                            ))}

                                        </div>

                                    </div>

                                </div>


                                <div className="mt-6 flex flex-wrap gap-4 text-sm sm:gap-6">

                                    <div className="flex items-center gap-2">

                                        <span className="h-3 w-3 rounded bg-[#3DB52A]" />

                                        <span className="text-[#374151]">
                                            Karyawan baru
                                        </span>

                                    </div>

                                    <div className="flex items-center gap-2">

                                        <span className="h-3 w-3 rounded bg-[#EF4938]" />

                                        <span className="text-[#374151]">
                                            Karyawan resign
                                        </span>

                                    </div>

                                </div>

                            </div>

                        </div>

                    </section>


                    {/* ==================================================
                        TOOLBAR
                    ================================================== */}

                    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">

                        <div className="flex flex-1 flex-wrap items-center gap-3">

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

    <div className="relative w-full sm:max-w-[260px]">
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


                        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto">

                            {/* FILTER */}

                            <button
                                type="button"
                                onClick={() =>
                                    setFilterOpen(
                                        true,
                                    )
                                }
                                aria-label="Buka filter"
                                className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#D1D5DB] bg-white"
                            >
                                <SlidersHorizontal className="h-5 w-5 text-[#374151]" />
                            </button>


                            {/* ARCHIVE */}

                            <button
                                type="button"
                                onClick={() =>
                                    setArsipOpen(
                                        true,
                                    )
                                }
                                className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl border border-[#1980C0] bg-white px-4 text-sm font-medium text-[#1980C0] transition hover:bg-[#1980C0]/5 sm:flex-none"
                            >
                                <Archive className="h-4 w-4" />
                                Arsip
                            </button>


                            {/* ADD */}

                            <Button
                                type="button"
                                onClick={
                                    openCreate
                                }
                                className="h-11 flex-1 rounded-xl bg-[#1980C0] px-5 text-sm font-semibold hover:bg-[#1673AD] sm:flex-none"
                            >
                                <Plus className="mr-2 h-4 w-4" />
                                Karyawan
                            </Button>

                        </div>

                    </div>


                    <FilterPanel
                        open={filterOpen}
                        onClose={() =>
                            setFilterOpen(false)
                        }
                        value={{
                            ...listFilter,
                            status: statusFilter,
                        }}
                        organizationOptions={
                            organizationOptions
                        }
                        onApply={(next) => {
                            setListFilter(next);
                            setStatusFilter(
                                next.status,
                            );
                            setCurrentPage(1);
                        }}
                    />


                    <ApprovePengajuanDialog
                        open={approveOpen}
                        onOpenChange={setApproveOpen}
                        decisions={pengajuanDecisions}
                        onDecide={handlePengajuanDecide}
                    />


                    {/* ==================================================
                        TABLE
                    ================================================== */}

                    <p className="text-xs text-[#9CA3AF] sm:hidden">
                        Geser tabel ke samping untuk melihat kolom lainnya →
                    </p>

                    <div className="overflow-visible rounded-xl border border-[#E5E7EB] bg-white">

                        <div ref={tableRef} className="table-scroll overflow-x-auto">

                            <table className="w-full min-w-[1050px] border-collapse">

                                <thead>

                                    <tr className="border-b bg-[#FCFCFC]">

                                        <th className="px-5 py-4 text-left text-sm font-medium text-[#374151]">
                                            ID
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-medium text-[#374151]">
                                            Nama
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-medium text-[#374151]">
                                            Tgl Bergabung
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-medium text-[#374151]">
                                            Cabang
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-medium text-[#374151]">
                                            Departemen
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-medium text-[#374151]">
                                            Divisi
                                        </th>

                                        <th className="px-5 py-4 text-left text-sm font-medium text-[#374151]">
                                            Status
                                        </th>

                                        <th className="w-16 px-3 py-4" />

                                    </tr>

                                </thead>


                                <tbody>

                                    {paginatedEmployees.length ===
                                    0 ? (
                                        <tr>

                                            <td
                                                colSpan={
                                                    8
                                                }
                                                className="px-5 py-12 text-center text-sm text-[#6B7280]"
                                            >
                                                Tidak ada data karyawan.
                                            </td>

                                        </tr>
                                    ) : (
                                        paginatedEmployees.map(
                                            (
                                                employee,
                                            ) => {

                                                const id = displayEmployeeId(employee);

                                                const branch =
                                                    'branch' in
                                                    employee
                                                        ? employee.branch
                                                        : '-';

                                                const organization =
                                                    'organization' in
                                                    employee
                                                        ? employee.organization
                                                        : '-';

                                                const position =
                                                    'position' in
                                                    employee
                                                        ? employee.position
                                                        : '-';

                                                const rowId =
                                                    String(
                                                        employee.id,
                                                    );

                                                return (
                                                    <tr
                                                        key={
                                                            rowId
                                                        }
                                                        className="border-b last:border-b-0 hover:bg-[#FAFCFE]"
                                                    >

                                                        <td className="px-5 py-5 text-sm text-[#374151]">
                                                            {
                                                                id
                                                            }
                                                        </td>

                                                        <td className="px-5 py-5 text-sm font-medium text-[#374151]">
                                                            {
                                                                employee.full_name
                                                            }
                                                        </td>

                                                        <td className="px-5 py-5 text-sm text-[#4B5563]">
                                                            {formatDate(
                                                                employee.join_date,
                                                            )}
                                                        </td>

                                                        <td className="px-5 py-5 text-sm text-[#4B5563]">
                                                            {
                                                                branch
                                                            }
                                                        </td>

                                                        <td className="px-5 py-5 text-sm text-[#4B5563]">
                                                            {
                                                                organization
                                                            }
                                                        </td>

                                                        <td className="px-5 py-5 text-sm text-[#4B5563]">
                                                            {
                                                                position
                                                            }
                                                        </td>

                                                        <td className="px-5 py-5">

                                                            {employee.is_active ? (
                                                                <span className="inline-flex rounded-full border border-[#45C33A] px-3 py-1 text-xs font-medium text-[#39B52A]">
                                                                    Aktif
                                                                </span>
                                                            ) : (
                                                                <span className="inline-flex rounded-full border border-[#EF4938] px-3 py-1 text-xs font-medium text-[#EF4938]">
                                                                    Non Aktif
                                                                </span>
                                                            )}

                                                        </td>


                                                        <td className="relative px-3 py-5">

                                                            <button
                                                                type="button"
                                                                onClick={(
                                                                    event,
                                                                ) => {
                                                                    if (
                                                                        actionOpen ===
                                                                        rowId
                                                                    ) {
                                                                        setActionOpen(
                                                                            null,
                                                                        );
                                                                        return;
                                                                    }

                                                                    // Flip upward when the row sits near the
                                                                    // viewport bottom, otherwise the menu would
                                                                    // render under the pagination and be clipped.
                                                                    const rect =
                                                                        event.currentTarget.getBoundingClientRect();

                                                                    setActionOpensUp(
                                                                        window.innerHeight -
                                                                            rect.bottom <
                                                                            220,
                                                                    );

                                                                    setActionOpen(
                                                                        rowId,
                                                                    );
                                                                }}
                                                                className="flex h-8 w-8 items-center justify-center rounded-lg border border-transparent text-[#374151] hover:border-[#E5E7EB] hover:bg-[#F9FAFB]"
                                                            >
                                                                <MoreVertical className="h-5 w-5" />
                                                            </button>


                                                            {actionOpen ===
                                                                rowId && (
                                                                <div
                                                                    className={`absolute right-3 z-40 w-40 rounded-xl border bg-white p-1 shadow-xl ${
                                                                        actionOpensUp
                                                                            ? 'bottom-[52px]'
                                                                            : 'top-12'
                                                                    }`}
                                                                >

                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openDetail(
                                                                                employee,
                                                                            )
                                                                        }
                                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F3F4F6]"
                                                                    >
                                                                        <Eye className="h-4 w-4" />
                                                                        Detail
                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openEdit(
                                                                                employee,
                                                                            )
                                                                        }
                                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm hover:bg-[#F3F4F6]"
                                                                    >
                                                                        <Pencil className="h-4 w-4" />
                                                                        Edit
                                                                    </button>


                                                                    <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                            openArchive(
                                                                                employee,
                                                                            )
                                                                        }
                                                                        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm text-[#EF4938] hover:bg-[#FEF2F2]"
                                                                    >
                                                                        <Archive className="h-4 w-4" />
                                                                        Arsipkan
                                                                    </button>

                                                                </div>
                                                            )}

                                                        </td>

                                                    </tr>
                                                );
                                            },
                                        )
                                    )}

                                </tbody>

                            </table>

                        </div>

                        <div className="px-4 pt-1 pb-3">
                            <TableHScrollBar targetRef={tableRef} />
                        </div>

                    </div>


                    {/* ==================================================
                        PAGINATION
                    ================================================== */}

                    <div className="flex w-full flex-wrap items-center justify-between gap-4">

                        {/* ==================================================
                            KIRI:
                            NOMOR HALAMAN DI POJOK KIRI,
                            TEKS JUMLAH DATA DI BAWAHNYA
                        ================================================== */}

                        <div className="flex min-w-0 flex-col items-start gap-2">

                            {/* NOMOR HALAMAN */}

                            <div className="flex flex-wrap items-center gap-1">

                                {paginationItems.map(
                                    (
                                        item,
                                        index,
                                    ) => {

                                        if (
                                            item ===
                                            'ellipsis'
                                        ) {
                                            return (
                                                <span
                                                    key={`ellipsis-${index}`}
                                                    className="flex h-9 min-w-9 items-center justify-center px-1 text-sm text-[#6B7280]"
                                                >
                                                    ...
                                                </span>
                                            );
                                        }

                                        const page =
                                            item;

                                        return (
                                            <button
                                                key={
                                                    page
                                                }
                                                type="button"
                                                onClick={() =>
                                                    setCurrentPage(
                                                        page,
                                                    )
                                                }
                                                className={`flex h-9 min-w-9 items-center justify-center rounded-lg border px-2 text-sm transition ${
                                                    safePage ===
                                                    page
                                                        ? 'border-[#1980C0] bg-[#1980C0] text-white'
                                                        : 'border-[#E5E7EB] bg-white text-[#374151] hover:bg-[#F3F4F6]'
                                                }`}
                                            >
                                                {
                                                    page
                                                }
                                            </button>
                                        );
                                    },
                                )}

                            </div>


                            {/* TEXT JUMLAH DATA */}

                            <div className="text-sm text-[#6B7280]">

                                Menampilkan{' '}

                                <span className="font-medium text-[#374151]">
                                    {filteredEmployees.length ===
                                    0
                                        ? 0
                                        : (safePage -
                                              1) *
                                                rowsPerPage +
                                            1}
                                </span>

                                {' - '}

                                <span className="font-medium text-[#374151]">
                                    {Math.min(
                                        safePage *
                                            rowsPerPage,
                                        filteredEmployees.length,
                                    )}
                                </span>

                                {' dari '}

                                <span className="font-medium text-[#374151]">
                                    {
                                        filteredEmployees.length
                                    }
                                </span>

                                {' karyawan'}

                            </div>

                        </div>


                        {/* ==================================================
                            KANAN:
                            PREV + NEXT
                        ================================================== */}

                        <div className="flex shrink-0 items-center gap-2">

                            {/* PREV */}

                            <button
                                type="button"
                                disabled={
                                    safePage <=
                                    1
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        (
                                            page,
                                        ) =>
                                            Math.max(
                                                1,
                                                page -
                                                    1,
                                            ),
                                    )
                                }
                                className="flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#374151] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
                            >

                                <ChevronLeft className="h-4 w-4" />

                                <span>
                                    Prev
                                </span>

                            </button>


                            {/* NEXT */}

                            <button
                                type="button"
                                disabled={
                                    safePage >=
                                    totalPages
                                }
                                onClick={() =>
                                    setCurrentPage(
                                        (
                                            page,
                                        ) =>
                                            Math.min(
                                                totalPages,
                                                page +
                                                    1,
                                            ),
                                    )
                                }
                                className="flex h-10 items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 text-sm text-[#374151] transition hover:bg-[#F3F4F6] disabled:cursor-not-allowed disabled:opacity-40"
                            >

                                <span>
                                    Next
                                </span>

                                <ChevronRight className="h-4 w-4" />

                            </button>

                        </div>

                    </div>

                </div>


                {/* ==================================================
                    ARCHIVE DIALOG
                ================================================== */}

                <ArchiveConfirmDialog
                    employeeName={
                        archiveTarget?.full_name ??
                        ''
                    }
                    open={
                        archiveTarget !==
                        null
                    }
                    onOpenChange={(
                        isOpen,
                    ) => {

                        if (!isOpen) {
                            setArchiveTarget(
                                null,
                            );
                        }

                    }}
                    onConfirm={
                        confirmArchive
                    }
                />


                {/* ==================================================
                    ARSIP KARYAWAN DIALOG (toolbar "Arsip")
                ================================================== */}

                <ArsipKaryawanDialog
                    open={
                        arsipOpen
                    }
                    onOpenChange={
                        setArsipOpen
                    }
                    employees={
                        archivedEmployees
                    }
                    onDetail={(
                        employee,
                    ) => {
                        setArsipOpen(
                            false,
                        );
                        openDetail(
                            employee,
                        );
                    }}
                    onRestore={
                        handleRestore
                    }
                />


                {/* ==================================================
                    DETAIL DIALOG
                ================================================== */}

                <Dialog
                    open={detailEmployee !== null}
                    onOpenChange={(isOpen) => {
                        if (!isOpen) {
                            setDetailEmployee(null);
                        }
                    }}
                >
                   <DialogContent
                        className="w-full grid-cols-[minmax(0,1fr)] gap-0 overflow-hidden p-0 sm:max-w-3xl"
                        onInteractOutside={(event) => event.preventDefault()}
                    >
                        <DialogDescription className="sr-only">
                            Detail data karyawan {detailEmployee?.full_name}
                        </DialogDescription>

                        {detailEmployee && <DetailDialog employee={detailEmployee} />}
                    </DialogContent>
                </Dialog>


                {/* ==================================================
                    ADD / EDIT FORM
                ================================================== */}

                <EmployeeFormDialog
                    open={open}
                    employee={
                        editingEmployee
                    }
                    onClose={() =>
                        setOpen(
                            false,
                        )
                    }
                    onCreate={
                        handleCreate
                    }
                    onUpdate={
                        handleUpdate
                    }
                />

            </div>

        </AppLayout>
    );
}