import { type PersonOption } from '@/components/design-system/pop-up/people-picker';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

/**
 * Single shared mock pool for both the "Atur Struktur" wizard and the single-department edit
 * dialog — union of what used to be two separate lists (`STAFF_POOL` id `p-*`, `MOCK_EMPLOYEE_POOL`
 * id `emp-*`) so no name that was pickable in either dialog disappears.
 */
export const STAFF_POOL: PersonOption[] = [
    { id: 'p-1', name: 'Dimas Prasetyo', role: 'Backend Developer' },
    { id: 'p-2', name: 'Nadia Kusuma', role: 'Frontend Developer' },
    { id: 'p-3', name: 'Fajar Nugroho', role: 'QA Engineer' },
    { id: 'p-4', name: 'Putri Wulandari', role: 'UI/UX Designer' },
    { id: 'p-5', name: 'Bagas Saputra', role: 'DevOps Engineer' },
    { id: 'p-6', name: 'Ayu Anindita', role: 'HR Generalist' },
    { id: 'p-7', name: 'Bagas Randy', role: 'HR Administrasi' },
    { id: 'p-8', name: 'Andro Dandy', role: 'Mobile Developer' },
    { id: 'p-9', name: 'Sarah Amelia', role: 'Business Analyst' },
    { id: 'p-10', name: 'Aini Rahma', role: 'Data Analyst' },
    { id: 'p-11', name: 'Rizky Pratama', role: 'Marketing' },
    { id: 'p-12', name: 'Maya Safitri', role: 'Sales' },
    { id: 'p-13', name: 'Andi Kurniawan', role: 'Finance' },
    { id: 'p-14', name: 'Ajeng Nafisa', role: 'Customer Service' },
    { id: 'p-15', name: 'Rhayu Dwi', role: 'Content Writer' },
    { id: 'p-16', name: 'Bastian Ari', role: 'Staff' },
    { id: 'p-17', name: 'Anggoro Putra', role: 'Staff' },
];

export function avatarFor(seed: string) {
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
}

function defaultInitials(name: string) {
    return name.slice(0, 2).toUpperCase();
}

export interface PersonSelectProps {
    value: string | null;
    onChange: (person: PersonOption) => void;
    placeholder: string;
    taken: Set<string>;
    /** What identifies a person for `value`/`taken` comparisons — defaults to `person.id`. */
    getKey?: (person: PersonOption) => string;
    /** Avatar fallback text for the selected person — defaults to the first two characters of the name. */
    initials?: (name: string) => string;
    pool?: PersonOption[];
}

export function PersonSelect({
    value,
    onChange,
    placeholder,
    taken,
    getKey = (person) => person.id,
    initials = defaultInitials,
    pool = STAFF_POOL,
}: PersonSelectProps) {
    const options = pool.filter((person) => getKey(person) === value || !taken.has(getKey(person)));
    const selected = pool.find((person) => getKey(person) === value) ?? null;

    return (
        <div className="flex w-full items-center gap-2">
            {selected && (
                <Avatar className="size-8 shrink-0">
                    <AvatarImage src={avatarFor(selected.name)} alt={selected.name} />
                    <AvatarFallback className="text-xs">{initials(selected.name)}</AvatarFallback>
                </Avatar>
            )}
            <Select
                value={selected?.id ?? undefined}
                onValueChange={(id) => {
                    const person = pool.find((candidate) => candidate.id === id);
                    if (person) onChange(person);
                }}
            >
                <SelectTrigger className="h-11 flex-1 rounded-xl focus:ring-0 focus:ring-offset-0">
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((person) => (
                        <SelectItem key={person.id} value={person.id}>
                            {person.name}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
