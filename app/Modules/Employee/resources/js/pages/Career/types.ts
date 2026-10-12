export type CareerStatus = 'Menunggu' | 'Ditolak' | 'Approved';

export interface CareerContractDocument {
    name: string;
    size: number;
    type: string;
    lastModified: number;
    dataUrl: string;
}

export interface CareerHistoryRow {
    id: string;
    employeeId: string;
    name: string;
    changeType: string;
    submittedAt: string;
    currentBranch: string;
    currentOrganization: string;
    currentPosition: string;
    targetBranch?: string;
    targetOrganization?: string;
    targetPosition?: string;
    newLevel?: string;
    directSupervisor?: string;
    hasContractChange?: boolean;
    contractType?: string;
    contractDocument?: CareerContractDocument;
    hasCompensationChange?: boolean;
    status: CareerStatus;
    effectiveDate?: string;
    reason?: string;
    salary?: string;
    allowance?: string;
    bpjsNumber?: string;
    rejectionReason?: string;
}

export interface CareerRequestInput {
    employeeId?: string;
    name: string;
    changeType: string;
    currentBranch: string;
    currentOrganization: string;
    currentPosition: string;
    targetBranch?: string;
    targetOrganization?: string;
    targetPosition?: string;
    newLevel?: string;
    directSupervisor?: string;
    hasContractChange?: boolean;
    contractType?: string;
    contractDocument?: CareerContractDocument;
    hasCompensationChange?: boolean;
    effectiveDate?: string;
    reason?: string;
    salary?: string;
    allowance?: string;
    bpjsNumber?: string;
}

export interface CareerDecisionInput {
    effectiveDate?: string;
    contractDocument?: CareerContractDocument;
    rejectionReason?: string;
}

export interface CareerChartItem {
    month: string;
    positionChanges: number;
    mutations: number;
}

export interface CareerMetricItem {
    label: string;
    value: number;
}
