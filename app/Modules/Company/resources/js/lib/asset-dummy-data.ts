import { BRANCH_OPTIONS } from './asset-catalog';

export interface Asset {
    id: string;
    category: string;
    name: string;
    totalUnits: number;
    loanedUnits: number;
    availableUnits: number;
    procurementDate: string;
    branch: string;
}

const CATEGORIES = ['Laptop', 'Monitor', 'Keyboard', 'Mouse', 'Printer'];
const NAMES: Record<string, string[]> = {
    Laptop: ['Macbook Air M4', 'Macbook Pro M3', 'ThinkPad X1 Carbon', 'Dell XPS 13'],
    Monitor: ['LG UltraFine 27"', 'Dell UltraSharp 24"'],
    Keyboard: ['Keychron K8', 'Logitech MX Keys'],
    Mouse: ['Logitech MX Master 3', 'Apple Magic Mouse'],
    Printer: ['Epson L3210', 'HP LaserJet Pro'],
};
const PROCUREMENT_DATES = ['12/09/26', '03/04/26', '21/11/25', '08/01/26', '17/06/26'];

/** Deterministic — no Math.random()/Date.now(), so the list renders identically on every load. */
export function generateDummyAssets(): Asset[] {
    const rows: Asset[] = [];
    for (let i = 0; i < 25; i++) {
        const category = CATEGORIES[i % CATEGORIES.length];
        const names = NAMES[category];
        const name = names[i % names.length];
        const branch = BRANCH_OPTIONS[i % BRANCH_OPTIONS.length].value;
        const totalUnits = 10 + (i % 5) * 2;
        const loanedUnits = i % 5;
        const availableUnits = totalUnits - loanedUnits;

        rows.push({
            id: `EM${87 + i}`,
            category,
            name,
            totalUnits,
            loanedUnits,
            availableUnits,
            procurementDate: PROCUREMENT_DATES[i % PROCUREMENT_DATES.length],
            branch,
        });
    }
    return rows;
}
