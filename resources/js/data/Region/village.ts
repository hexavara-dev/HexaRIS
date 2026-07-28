export interface Village {
    id: string;
    district_id: string;
    name: string;
}

/**
 * Villages are split into one file per province (see ./villages/{provinceId}.ts) because the
 * full dataset is 80,000+ rows (~2.4MB as CSV). Loading all of it eagerly would bloat every
 * page's JS bundle even when only a handful of villages are ever shown at once.
 *
 * Call this with a province id (see province.ts) to fetch just that province's villages —
 * Vite code-splits each province file into its own chunk, so only the requested one downloads.
 */
export async function loadVillagesByProvince(provinceId: string): Promise<Village[]> {
    const modules = import.meta.glob<{ village: Village[] }>('./villages/*.ts');
    const key = `./villages/${provinceId}.ts`;
    const loader = modules[key];
    if (!loader) return [];
    const mod = await loader();
    return mod.village;
}
