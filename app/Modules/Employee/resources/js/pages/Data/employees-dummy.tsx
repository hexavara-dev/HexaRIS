import {
    employee as seedEmployees,
    type Employee,
} from '@/data/Employee/employee';

const STORAGE_KEY = 'hexaris_employee_dummy_v2';

export type DummyEmployee = Employee & {
    employee_id: string;
    branch: string;
    organization: string;
    position: string;
    approval_status: 'approved' | 'pending';
    employment_status:
        | 'Tetap'
        | 'PKWT'
        | 'Probation'
        | 'Freelance';
    resign_date: string | null;
};

const branches = [
    'Jakarta',
    'Surabaya',
    'Bandung',
    'Malang',
];

const organizations = [
    'HR',
    'IT',
    'Finance',
    'Produksi',
    'Creatif',
    'Designer',
];

const positions = [
    'Kepala Bagian',
    'Staff',
    'Senior Staff',
    'Supervisor',
    'Manager',
];

const employmentStatuses: DummyEmployee['employment_status'][] = [
    'Tetap',
    'PKWT',
    'Probation',
    'Freelance',
];

const firstNames = [
    'Saskya',
    'Andi',
    'Budi',
    'Citra',
    'Dinda',
    'Fajar',
    'Gilang',
    'Hana',
    'Intan',
    'Joko',
    'Kevin',
    'Laras',
    'Maya',
    'Nadia',
    'Putri',
    'Raka',
    'Sinta',
    'Tania',
    'Vina',
    'Wahyu',
    'Yuni',
    'Zaki',
];

const lastNames = [
    'Ayu',
    'Pratama',
    'Saputra',
    'Wijaya',
    'Permata',
    'Lestari',
    'Nugraha',
    'Ramadhan',
    'Kusuma',
    'Wibowo',
    'Santoso',
    'Hidayat',
];

function generateDummyEmployees(): DummyEmployee[] {
    const template = seedEmployees[0];

    if (!template) {
        return [];
    }

    return Array.from(
        { length: 128 },
        (_, index) => {
            const employeeNumber = index + 187;

            const firstName =
                firstNames[
                    index % firstNames.length
                ];

            const lastName =
                lastNames[
                    Math.floor(
                        index /
                            firstNames.length,
                    ) %
                        lastNames.length
                ];

            const month =
                (index % 12) + 1;

            const day =
                (index % 27) + 1;

            const joinDate =
                `2026-${String(month).padStart(
                    2,
                    '0',
                )}-${String(day).padStart(
                    2,
                    '0',
                )}`;

            /*
             * 115 aktif
             * 13 nonaktif
             */
            const isActive = index < 115;

            /*
             * 6 karyawan menunggu approval.
             *
             * Status ini dibuat terpisah dari
             * status aktif/nonaktif.
             */
            const approvalStatus =
                index < 6
                    ? 'pending'
                    : 'approved';

            /*
             * Distribusi status kepegawaian.
             */
            const employmentStatus =
                employmentStatuses[
                    index %
                        employmentStatuses.length
                ];

            /*
             * Untuk karyawan nonaktif,
             * kita buat tanggal resign.
             */
            const resignDate = isActive
                ? null
                : `2026-${String(
                      ((index + 3) %
                          12) +
                          1,
                  ).padStart(2, '0')}-${String(
                      ((index + 8) %
                          25) +
                          1,
                  ).padStart(2, '0')}`;

            return {
                ...template,

                /*
                 * ID internal.
                 */
                id: `EM${String(
                    employeeNumber,
                ).padStart(3, '0')}`,

                /*
                 * ID yang ditampilkan di tabel.
                 */
                employee_id: `EM${String(
                    employeeNumber,
                ).padStart(3, '0')}`,

                full_name:
                    `${firstName} ${lastName}`,

                email_self:
                    `${firstName.toLowerCase()}.${lastName.toLowerCase()}${employeeNumber}@hexaris.test`,

                join_date: joinDate,

                is_active: isActive,

                is_archived: false,

                employment_type:
                    index % 4 === 0
                        ? 'part-time'
                        : 'full-time',

                branch:
                    branches[
                        index %
                            branches.length
                    ],

                organization:
                    organizations[
                        index %
                            organizations.length
                    ],

                position:
                    positions[
                        index %
                            positions.length
                    ],

                approval_status:
                    approvalStatus,

                employment_status:
                    employmentStatus,

                resign_date:
                    resignDate,
            } as DummyEmployee;
        },
    );
}

export function loadDummyEmployees(): DummyEmployee[] {
    if (
        typeof window ===
        'undefined'
    ) {
        return generateDummyEmployees();
    }

    try {
        const stored =
            window.localStorage.getItem(
                STORAGE_KEY,
            );

        if (!stored) {
            const generated =
                generateDummyEmployees();

            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    generated,
                ),
            );

            return generated;
        }

        const parsed =
            JSON.parse(stored);

        if (
            !Array.isArray(parsed)
        ) {
            const generated =
                generateDummyEmployees();

            window.localStorage.setItem(
                STORAGE_KEY,
                JSON.stringify(
                    generated,
                ),
            );

            return generated;
        }

        return parsed as DummyEmployee[];
    } catch {
        const generated =
            generateDummyEmployees();

        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                generated,
            ),
        );

        return generated;
    }
}

export function saveDummyEmployees(
    employees: DummyEmployee[],
): DummyEmployee[] {
    if (
        typeof window !==
        'undefined'
    ) {
        window.localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(
                employees,
            ),
        );
    }

    return employees;
}

export function addDummyEmployee(
    employeeData: DummyEmployee,
): DummyEmployee[] {
    const current =
        loadDummyEmployees();

    return saveDummyEmployees([
        employeeData,
        ...current,
    ]);
}

export function updateDummyEmployee(
    id: string | number,
    changes: Partial<DummyEmployee>,
): DummyEmployee[] {
    const current =
        loadDummyEmployees();

    const updated =
        current.map((item) =>
            String(item.id) ===
            String(id)
                ? {
                      ...item,
                      ...changes,
                  }
                : item,
        );

    return saveDummyEmployees(
        updated,
    );
}

export function archiveDummyEmployee(
    id: string | number,
): DummyEmployee[] {
    return updateDummyEmployee(
        id,
        {
            is_archived: true,
        },
    );
}

export function resetDummyEmployees(): DummyEmployee[] {
    const generated =
        generateDummyEmployees();

    return saveDummyEmployees(
        generated,
    );
}