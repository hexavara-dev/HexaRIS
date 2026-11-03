import { ChevronLeft, ChevronRight } from 'lucide-react';
import { DayPicker } from 'react-day-picker';

import { buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export type CalendarProps = React.ComponentProps<typeof DayPicker>;

// Selected days are styled on the <td> (range band) and on its inner button (the filled end caps).
const endCap = '[&>button]:bg-[#1980C0] [&>button]:text-white [&>button]:hover:bg-[#1570AA] [&>button]:hover:text-white';

function Calendar({ className, classNames, showOutsideDays = true, ...props }: CalendarProps) {
    return (
        <DayPicker
            showOutsideDays={showOutsideDays}
            className={cn('font-poppins p-4', className)}
            classNames={{
                months: 'relative flex flex-col gap-6 sm:flex-row',
                month: 'space-y-3',
                month_caption: 'flex h-9 items-center justify-center',
                caption_label: 'text-sm font-semibold text-[#111827]',
                nav: 'absolute inset-x-0 top-0 flex items-center justify-between',
                button_previous: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'size-8 rounded-full p-0 text-[#6B7280] hover:bg-[#E8F3FB] hover:text-[#1980C0]',
                ),
                button_next: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'size-8 rounded-full p-0 text-[#6B7280] hover:bg-[#E8F3FB] hover:text-[#1980C0]',
                ),
                month_grid: 'w-full border-collapse',
                weekdays: 'flex',
                weekday: 'w-9 pb-1 text-center text-xs font-normal text-[#6B7280]',
                week: 'mt-1 flex w-full',
                day: 'relative size-9 p-0 text-center text-sm',
                day_button: cn(
                    buttonVariants({ variant: 'ghost' }),
                    'size-9 rounded-full p-0 font-normal text-[#111827] hover:bg-[#E8F3FB] hover:text-[#1980C0]',
                ),
                // Range mode paints its own start/end/middle below; every other mode needs the fill on the selected day itself.
                selected: props.mode === 'range' ? '' : cn('rounded-full', endCap),
                range_start: cn('rounded-l-full bg-[#E8F3FB]', endCap),
                range_end: cn('rounded-r-full bg-[#E8F3FB]', endCap),
                range_middle: 'rounded-none bg-[#E8F3FB] [&>button]:text-[#1980C0] [&>button]:hover:bg-[#D3E8F7]',
                today: '[&>button]:font-semibold [&>button]:underline',
                outside: 'opacity-40',
                disabled: 'opacity-30',
                hidden: 'invisible',
                ...classNames,
            }}
            components={{
                Chevron: ({ orientation }) =>
                    orientation === 'left' ? <ChevronLeft className="size-4" /> : <ChevronRight className="size-4" />,
            }}
            {...props}
        />
    );
}
Calendar.displayName = 'Calendar';

export { Calendar };
