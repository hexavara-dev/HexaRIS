import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface OrgMember {
    name: string;
    role: string;
    avatarUrl?: string;
}

export interface OrgDivision {
    name: string;
    members: OrgMember[];
}

export interface OrgDepartment {
    name: string;
    /** Full-width "Kepala Departemen" card shown directly under the header (used by departments that own divisions). */
    head?: OrgMember;
    /** Stacked member cards shown directly under the header (used by departments without divisions). */
    members?: OrgMember[];
    /** Division sub-columns, each with its own sub-header and member cards. */
    divisions?: OrgDivision[];
}

export interface OrgTree {
    ceo: OrgMember;
    departments: OrgDepartment[];
}

function initials(name: string) {
    return name
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join('');
}

function MemberCard({ member }: { member: OrgMember }) {
    return (
        <div className="flex w-full items-center gap-2 rounded-lg border border-[#E2E8F0] bg-white p-3">
            <Avatar className="h-8 w-8 shrink-0">
                <AvatarImage src={member.avatarUrl} alt={member.name} />
                <AvatarFallback className="text-[10px]">{initials(member.name)}</AvatarFallback>
            </Avatar>
            <div className="flex min-w-0 flex-col">
                <p className="font-poppins truncate text-[10px] font-semibold text-black">{member.name}</p>
                <p className="truncate text-[10px] text-[#4F4F4F]">{member.role}</p>
            </div>
        </div>
    );
}

function DivisionColumn({
    division,
    departmentName,
    onDivisionClick,
}: {
    division: OrgDivision;
    departmentName: string;
    onDivisionClick?: (division: OrgDivision, departmentName: string) => void;
}) {
    return (
        <button
            type="button"
            onClick={() => onDivisionClick?.(division, departmentName)}
            className="flex w-[220px] flex-col gap-2 text-left transition-opacity hover:opacity-80"
        >
            <div className="w-full rounded bg-[#E9F5FE] p-1.5">
                <p className="font-poppins text-center text-[11px] font-semibold text-[#1980C0]">{division.name}</p>
            </div>
            <div className="flex w-full flex-col gap-2">
                {division.members.map((member) => (
                    <MemberCard key={`${member.name}-${member.role}`} member={member} />
                ))}
            </div>
        </button>
    );
}

function DepartmentColumn({
    department,
    onDivisionClick,
    onDepartmentClick,
}: {
    department: OrgDepartment;
    onDivisionClick?: (division: OrgDivision, departmentName: string) => void;
    onDepartmentClick?: (department: OrgDepartment) => void;
}) {
    return (
        <div className="inline-flex w-fit flex-col items-stretch gap-4">
            {onDepartmentClick ? (
                <button
                    type="button"
                    onClick={() => onDepartmentClick(department)}
                    className="w-full rounded-lg border border-[#1980C0] bg-[#EEF8FF] p-3 transition-opacity hover:opacity-80"
                >
                    <p className="font-poppins text-center text-sm font-semibold text-[#1E293B]">{department.name}</p>
                </button>
            ) : (
                <div className="w-full rounded-lg border border-[#1980C0] bg-[#EEF8FF] p-3">
                    <p className="font-poppins text-center text-sm font-semibold text-[#1E293B]">{department.name}</p>
                </div>
            )}

            {department.head && <MemberCard member={department.head} />}

            {department.members && (
                <div className="flex w-[220px] flex-col gap-2">
                    {department.members.map((member) => (
                        <MemberCard key={`${member.name}-${member.role}`} member={member} />
                    ))}
                </div>
            )}

            {department.divisions && (
                <div className="flex w-fit gap-5">
                    {department.divisions.map((division) => (
                        <DivisionColumn key={division.name} division={division} departmentName={department.name} onDivisionClick={onDivisionClick} />
                    ))}
                </div>
            )}
        </div>
    );
}

interface OrgChartProps {
    tree: OrgTree;
    /** 1 = 100%. The chart is scaled from the top-center. */
    zoom?: number;
    onDivisionClick?: (division: OrgDivision, departmentName: string) => void;
    onDepartmentClick?: (department: OrgDepartment) => void;
}

export function OrgChart({ tree, zoom = 1, onDivisionClick, onDepartmentClick }: OrgChartProps) {
    return (
        <div className="w-full overflow-auto">
            <div
                className="flex min-w-max origin-top justify-center px-10 py-10"
                style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
                <div className="flex flex-col items-center">
                    {/* CEO node */}
                    <div className="flex w-[220px] items-center gap-3 rounded-xl border-2 border-[#1980C0] bg-[#E9F5FE] p-4">
                        <Avatar className="h-9 w-9 shrink-0">
                            <AvatarImage src={tree.ceo.avatarUrl} alt={tree.ceo.name} />
                            <AvatarFallback className="text-xs">{initials(tree.ceo.name)}</AvatarFallback>
                        </Avatar>
                        <div className="flex min-w-0 flex-col gap-0.5">
                            <p className="font-poppins truncate text-[13px] font-semibold text-[#1E293B]">{tree.ceo.name}</p>
                            <p className="font-poppins text-[10px] font-semibold tracking-wide text-[#1980C0] uppercase">{tree.ceo.role}</p>
                        </div>
                    </div>

                    {/* Departments row with CSS connector lines drawn via before/after borders. */}
                    <ul className="relative flex justify-center pt-6 before:absolute before:top-0 before:left-1/2 before:h-6 before:border-l-2 before:border-[#1980C0] before:content-['']">
                        {tree.departments.map((department) => (
                            <li
                                key={department.name}
                                className="relative flex flex-col items-center px-3 pt-6 before:absolute before:top-0 before:right-1/2 before:h-6 before:w-1/2 before:border-t-2 before:border-r-2 before:border-[#1980C0] before:content-[''] after:absolute after:top-0 after:left-1/2 after:h-6 after:w-1/2 after:border-t-2 after:border-l-2 after:border-[#1980C0] after:content-[''] first:before:hidden last:after:hidden"
                            >
                                <DepartmentColumn department={department} onDivisionClick={onDivisionClick} onDepartmentClick={onDepartmentClick} />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function avatarFor(seed: string) {
    return `https://i.pravatar.cc/150?u=${encodeURIComponent(seed)}`;
}

export const ORG_CHART_DEMO: OrgTree = {
    ceo: { name: 'Nikolas Raharjo', role: 'Direktur Utama', avatarUrl: avatarFor('Nikolas Raharjo') },
    departments: [
        {
            name: 'Dept. Human Resource',
            members: [
                { name: 'Ayu Anindita', role: 'Kepala Departemen HR', avatarUrl: avatarFor('HR Head') },
                { name: 'Ayu Anindita', role: 'HR General', avatarUrl: avatarFor('HR General') },
                { name: 'Ayu Anindita', role: 'HR Administrasi', avatarUrl: avatarFor('HR Admin') },
            ],
        },
        {
            name: 'Dept. Information Technology',
            head: { name: 'M Zainudin', role: 'Kepala Departemen IT', avatarUrl: avatarFor('M Zainudin') },
            divisions: [
                {
                    name: 'Divisi Developer',
                    members: [
                        { name: 'Sarah Amelia', role: 'Kepala Divisi Developer', avatarUrl: avatarFor('Sarah Amelia Dev Lead') },
                        { name: 'Aini Rahma', role: 'Fullstack Developer', avatarUrl: avatarFor('Aini Rahma') },
                        { name: 'Sarah Amelia', role: 'Fullstack Developer', avatarUrl: avatarFor('Sarah Amelia Dev') },
                    ],
                },
                {
                    name: 'Divisi UI/UX Design',
                    members: [
                        { name: 'Andi Kurniawan', role: 'Kepala Divisi UI/UX', avatarUrl: avatarFor('Andi Kurniawan') },
                        { name: 'Rizky Pratama', role: 'UI/UX Designer', avatarUrl: avatarFor('Rizky Pratama') },
                        { name: 'Maya Safitri', role: 'UX Researcher', avatarUrl: avatarFor('Maya Safitri Research') },
                    ],
                },
                {
                    name: 'Divisi QA',
                    members: [
                        { name: 'Maya Safitri', role: 'Kepala Divisi QA', avatarUrl: avatarFor('Maya Safitri QA Lead') },
                        { name: 'Ajeng Nafisa', role: 'QA Tester', avatarUrl: avatarFor('Ajeng Nafisa') },
                    ],
                },
            ],
        },
        {
            name: 'Dept. Kreatif',
            head: { name: 'Ayu Anindita', role: 'Kepala Departemen Creative', avatarUrl: avatarFor('Creative Head') },
            divisions: [
                {
                    name: 'Design',
                    members: [
                        { name: 'Ayu Anindita', role: 'Kepala Divisi Design', avatarUrl: avatarFor('Design Lead') },
                        { name: 'Ayu Anindita', role: 'Graphich Designer', avatarUrl: avatarFor('Graphic 1') },
                        { name: 'Ayu Anindita', role: 'Graphich Designer', avatarUrl: avatarFor('Graphic 2') },
                    ],
                },
                {
                    name: 'Marketing',
                    members: [
                        { name: 'Ayu Anindita', role: 'Kepala Divisi Design', avatarUrl: avatarFor('Marketing Lead') },
                        { name: 'Ayu Anindita', role: 'Talent', avatarUrl: avatarFor('Talent') },
                    ],
                },
            ],
        },
        {
            name: 'Dept. Finance',
            members: [
                { name: 'Ayu Anindita', role: 'Kepala Departemen Finance', avatarUrl: avatarFor('Finance Head') },
                { name: 'Ayu Anindita', role: 'Payroll', avatarUrl: avatarFor('Payroll') },
            ],
        },
        {
            name: 'Dept. Operasional',
            members: [
                { name: 'Ayu Anindita', role: 'Kepala Departemen Ops', avatarUrl: avatarFor('Ops Head') },
                { name: 'Staff Operasional 2', role: 'Logistics', avatarUrl: avatarFor('Logistics') },
            ],
        },
    ],
};
