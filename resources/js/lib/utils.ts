import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/** Options from `catalog` that are either the currently-selected value or not yet taken by a sibling. */
export function filterAvailable(catalog: string[], current: string, taken: Set<string>): string[] {
    return catalog.filter((name) => name === current || !taken.has(name));
}
