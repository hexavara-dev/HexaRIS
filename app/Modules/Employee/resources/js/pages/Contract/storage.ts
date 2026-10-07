import { type ContractAction, type EmployeeContractRow } from './column';

const CONTRACT_ACTION_STORAGE_KEY = 'employee_contract_actions';

interface UploadedFileMetadata {
    name: string;
    size: number;
    type: string;
    lastModified: number;
}

export interface SavedContractAction {
    id: string;
    action: ContractAction;
    contract: EmployeeContractRow;
    values: {
        contractType: string | null;
        startDate: string | null;
        endDate: string | null;
        uploadedFile: UploadedFileMetadata | null;
    };
    savedAt: number;
}

interface SaveContractActionDraftInput {
    action: ContractAction;
    contract: EmployeeContractRow;
    values: {
        contractType: string | null;
        startDate: string | null;
        endDate: string | null;
        uploadedFile: File | null;
    };
}

function loadSavedContractActions(): SavedContractAction[] {
    const rawValue = window.localStorage.getItem(CONTRACT_ACTION_STORAGE_KEY);
    if (!rawValue) return [];

    try {
        const parsedValue = JSON.parse(rawValue);
        return Array.isArray(parsedValue) ? parsedValue : [];
    } catch {
        return [];
    }
}

function createUploadedFileMetadata(file: File | null): UploadedFileMetadata | null {
    if (!file) return null;

    return {
        name: file.name,
        size: file.size,
        type: file.type,
        lastModified: file.lastModified,
    };
}

function saveContractActionToLocalStorage(action: Omit<SavedContractAction, 'id' | 'savedAt'>) {
    const savedAction: SavedContractAction = {
        ...action,
        id: `contract-action-${Date.now()}`,
        savedAt: Date.now(),
    };

    const actions = loadSavedContractActions();
    window.localStorage.setItem(CONTRACT_ACTION_STORAGE_KEY, JSON.stringify([...actions, savedAction]));

    return savedAction;
}

export function saveContractActionDraft({
    action,
    contract,
    values,
}: SaveContractActionDraftInput) {
    return saveContractActionToLocalStorage({
        action,
        contract,
        values: {
            contractType: values.contractType,
            startDate: values.startDate,
            endDate: values.endDate,
            uploadedFile: createUploadedFileMetadata(values.uploadedFile),
        },
    });
}
