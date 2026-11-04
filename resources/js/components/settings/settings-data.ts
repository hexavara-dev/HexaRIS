import { Building2, UserRound } from 'lucide-react';

export interface Company {
    name: string;
    code: string;
    address: string;
    pic: string;
    updatedAt: string;
}

export interface Account {
    name: string;
    email: string;
}

// Mock until the company API exists.
export const INITIAL_COMPANY: Company = {
    name: 'PT. Abadi Jaya',
    code: 'B1920',
    address: 'Jl. Ahmad Yani 09, Jakarta',
    pic: 'Agung Wijaya',
    updatedAt: '12 Oktober 2023',
};

export const CEO_OPTIONS = ['Agung Wijaya', 'Rizky Pratama', 'Dinda Putri'];

export const MENUS = [
    { value: 'perusahaan', label: 'Perusahaan', icon: Building2 },
    { value: 'akun', label: 'Akun', icon: UserRound },
] as const;

export type MenuValue = (typeof MENUS)[number]['value'];

export const today = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
