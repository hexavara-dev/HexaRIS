import { type ReactNode } from 'react';

interface ExpandablePreviewLayoutProps {
    expanded: boolean;
    sidebar: ReactNode;
    preview: ReactNode;
}

export function ExpandablePreviewLayout({ expanded, sidebar, preview }: ExpandablePreviewLayoutProps) {
    return (
        <div
            className={[
                'flex h-full min-h-0 w-full flex-col transition-all duration-500 ease-out xl:flex-row',
                expanded ? 'gap-0' : 'gap-5 xl:gap-6',
            ].join(' ')}
        >
            <div
                className={[
                    'flex min-h-0 flex-col gap-4 transition-all duration-500 ease-out',
                    expanded
                        ? 'max-h-0 w-full -translate-y-3 overflow-hidden opacity-0 xl:max-h-none xl:max-w-0 xl:flex-[0_0_0px] xl:-translate-x-3 xl:translate-y-0'
                        : 'w-full flex-none overflow-visible opacity-100 xl:max-w-[520px] xl:flex-[1_1_50%]',
                ].join(' ')}
                aria-hidden={expanded}
            >
                {sidebar}
            </div>

            <div
                className={[
                    'min-h-[280px] w-full min-w-0 transition-all duration-500 ease-out xl:min-h-0',
                    expanded ? 'flex-1' : 'flex-none xl:flex-[1_1_50%]',
                ].join(' ')}
            >
                {preview}
            </div>
        </div>
    );
}
