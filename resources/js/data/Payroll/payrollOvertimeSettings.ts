// payrollEntry.ts's generator computes overtime as `100_000 + (0..7) * 50_000` — every possible
// value is a whole multiple of 50_000 (the fixed offset is 2 * 50_000, the step is exactly
// 50_000), so this rate divides every seed overtime value into a whole "assumed hours" count with
// no remainder. If payrollEntry.ts's overtime formula ever changes, re-derive this constant so it
// still divides the new formula cleanly.
export const DEFAULT_LEMBUR_RATE = 50_000;

export interface PayrollOvertimeSettings {
    hitungan: 'jam';
    nominal_per_jam: number;
}

export const payrollOvertimeSettings: PayrollOvertimeSettings = {
    hitungan: 'jam',
    nominal_per_jam: DEFAULT_LEMBUR_RATE,
};
