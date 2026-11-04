/** Today's date in Indonesian long form, e.g. "27 Oktober 2026". */
export function todayLabel(date: Date = new Date()): string {
    return new Intl.DateTimeFormat('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }).format(date);
}
