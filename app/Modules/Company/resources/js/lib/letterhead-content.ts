/**
 * Static letterhead content for the template preview. Hardcoded for now — the
 * same posture as `CreateStructureDialog`'s `COMPANY_NAME`, since there's no
 * company-profile endpoint yet. This file is the single seam to replace when
 * one exists.
 */
export const LETTERHEAD = {
    companyName: 'PT. Hexaris Indonesia',
    address: 'Jl. Muh Hatta No. 123 Jakarta',
    contact: 'Tlp. 089263718387, Email: hexaris@gmail.com',
    website: 'www.hexaris.com',
} as const;

/** Example document identity shown in the preview — a real template would carry its own. */
export const SAMPLE_DOCUMENT = {
    title: 'Surat Tugas Kerja',
    number: 'Nomor : SPD-2026-00123',
} as const;

export const SIGNATORY_PLACEHOLDER = 'NAMA PENANDATANGAN';
