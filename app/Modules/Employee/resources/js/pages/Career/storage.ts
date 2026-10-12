import { careerHistory } from './data';
import { type CareerDecisionInput, type CareerHistoryRow, type CareerRequestInput, type CareerStatus } from './types';

const STORAGE_KEY = 'hexaris.employee.career-requests-v1';
const validStatuses: CareerStatus[] = ['Menunggu', 'Ditolak', 'Approved'];
const allowedContractExtensions = ['pdf', 'doc', 'docx'];
const allowedContractTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
const maxContractBytes = 2 * 1024 * 1024;

export function isValidCareerContractFile(file: File): boolean {
    const extension = file.name.toLowerCase().split('.').pop() ?? '';
    const hasValidExtension = allowedContractExtensions.includes(extension);
    const hasValidType = file.type === '' || allowedContractTypes.includes(file.type);

    return hasValidExtension && hasValidType;
}

function isValidStoredContract(document: NonNullable<CareerRequestInput['contractDocument']>): boolean {
    const extension = document.name.toLowerCase().split('.').pop() ?? '';
    const hasValidType = document.type === '' || allowedContractTypes.includes(document.type);

    return allowedContractExtensions.includes(extension) && hasValidType && document.size <= maxContractBytes && document.dataUrl.startsWith('data:');
}

function assertValidRequest(input: CareerRequestInput): void {
    const requiredValues = [input.name, input.changeType, input.currentBranch, input.currentOrganization, input.currentPosition];

    if (requiredValues.some((value) => !value.trim())) {
        throw new Error('Career request is incomplete.');
    }

    if (input.contractDocument && !isValidStoredContract(input.contractDocument)) throw new Error('Contract document is invalid.');
}

function cloneSeedRows(): CareerHistoryRow[] {
    return careerHistory.map((row) => ({ ...row }));
}

function isCareerRow(value: unknown): value is CareerHistoryRow {
    if (typeof value !== 'object' || value === null) return false;

    const row = value as Partial<CareerHistoryRow>;

    return Boolean(
        typeof row.id === 'string' &&
            typeof row.employeeId === 'string' &&
            typeof row.name === 'string' &&
            typeof row.changeType === 'string' &&
            typeof row.submittedAt === 'string' &&
            typeof row.currentBranch === 'string' &&
            typeof row.currentOrganization === 'string' &&
            typeof row.currentPosition === 'string' &&
            row.status &&
            validStatuses.includes(row.status),
    );
}

function saveRows(rows: CareerHistoryRow[]): CareerHistoryRow[] {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rows));
    }

    return rows;
}

export function loadCareerRequests(): CareerHistoryRow[] {
    if (typeof window === 'undefined') return cloneSeedRows();

    try {
        const stored = window.localStorage.getItem(STORAGE_KEY);

        if (!stored) return saveRows(cloneSeedRows());

        const parsed: unknown = JSON.parse(stored);

        if (!Array.isArray(parsed) || !parsed.every(isCareerRow)) {
            return saveRows(cloneSeedRows());
        }

        return parsed;
    } catch {
        return cloneSeedRows();
    }
}

export function createCareerRequest(input: CareerRequestInput): CareerHistoryRow[] {
    assertValidRequest(input);
    const current = loadCareerRequests();
    const now = new Date();
    const submittedAt = [
        String(now.getDate()).padStart(2, '0'),
        String(now.getMonth() + 1).padStart(2, '0'),
        String(now.getFullYear()).slice(-2),
    ].join('-');

    const row: CareerHistoryRow = {
        ...input,
        id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? `career-${crypto.randomUUID()}` : `career-${Date.now()}`,
        employeeId: input.employeeId ?? `EM${String(current.length + 188).padStart(3, '0')}`,
        submittedAt,
        status: 'Menunggu',
    };

    return saveRows([row, ...current]);
}

export function updateCareerRequest(id: string, input: CareerRequestInput): CareerHistoryRow[] {
    assertValidRequest(input);
    return saveRows(loadCareerRequests().map((row) => (row.id === id ? { ...row, ...input } : row)));
}

export function updateCareerDecision(
    id: string,
    status: Extract<CareerStatus, 'Approved' | 'Ditolak'>,
    input: CareerDecisionInput = {},
): CareerHistoryRow[] {
    if (input.contractDocument && !isValidStoredContract(input.contractDocument)) {
        throw new Error('Contract document is invalid.');
    }

    return saveRows(
        loadCareerRequests().map((row) =>
            row.id === id
                ? {
                      ...row,
                      status,
                      ...input,
                      rejectionReason: status === 'Ditolak' ? input.rejectionReason : undefined,
                  }
                : row,
        ),
    );
}

export function deleteCareerRequest(id: string): CareerHistoryRow[] {
    return saveRows(loadCareerRequests().filter((row) => row.id !== id));
}
