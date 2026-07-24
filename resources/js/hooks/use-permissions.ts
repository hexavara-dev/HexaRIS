import { type SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage<SharedData>().props;

    const can = (permission: string): boolean => auth.isSuperAdmin || auth.permissions.includes(permission);

    return { can, isSuperAdmin: auth.isSuperAdmin, permissions: auth.permissions };
}
