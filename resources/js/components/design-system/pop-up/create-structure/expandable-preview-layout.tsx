import { type ReactNode } from 'react';

interface ExpandablePreviewLayoutProps {
    expanded: boolean;
    sidebar: ReactNode;
    preview: ReactNode;
}

export function ExpandablePreviewLayout({ expanded, sidebar, preview }: ExpandablePreviewLayoutProps) {
    return (
        <div className={['flex h-full min-h-0 w-full transition-all duration-500 ease-out', expanded ? 'gap-0' : 'gap-6'].join(' ')}>
            <div
                className={[
                    'flex min-h-0 shrink-0 flex-col gap-4 transition-all duration-500 ease-out',
                    expanded
                        ? 'max-w-0 flex-[0_0_0px] -translate-x-3 overflow-hidden opacity-0'
                        : 'w-full max-w-[720px] flex-[1_1_58%] overflow-visible opacity-100',
                ].join(' ')}
                aria-hidden={expanded}
            >
                {sidebar}
            </div>

            <div className={['min-h-0 transition-all duration-500 ease-out', expanded ? 'min-w-0 flex-1' : 'min-w-[460px] flex-[0_1_42%]'].join(' ')}>
                {preview}
            </div>
        </div>
    );
}
