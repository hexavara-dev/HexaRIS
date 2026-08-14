import { type Asset, parseDateDMY } from './asset-dummy-data';

export type PeriodFilter = '7d' | '30d' | 'custom' | null;

export interface AssetFilterValue {
    /** Empty array = no category narrowing (all categories match). */
    categories: string[];
    period: PeriodFilter;
    /** ISO "YYYY-MM-DD" — only read when period === 'custom'. */
    dateFrom: string;
    dateTo: string;
}

export const EMPTY_ASSET_FILTER: AssetFilterValue = { categories: [], period: null, dateFrom: '', dateTo: '' };

export function isAssetFilterActive(filter: AssetFilterValue): boolean {
    return filter.categories.length > 0 || filter.period !== null;
}

export function matchesAssetFilter(asset: Asset, filter: AssetFilterValue): boolean {
    if (filter.categories.length > 0 && !filter.categories.includes(asset.category)) {
        return false;
    }

    if (filter.period === null) {
        return true;
    }

    const procurementDate = parseDateDMY(asset.procurementDate);
    if (!procurementDate) {
        return true;
    }

    if (filter.period === '7d' || filter.period === '30d') {
        const days = filter.period === '7d' ? 7 : 30;
        const now = new Date();
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - days);
        return procurementDate >= cutoff && procurementDate <= now;
    }

    // filter.period === 'custom'
    if (!filter.dateFrom || !filter.dateTo) {
        return true;
    }
    return procurementDate >= new Date(filter.dateFrom) && procurementDate <= new Date(filter.dateTo);
}
