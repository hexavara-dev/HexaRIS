import AppLogoIcon from '@/components/icons/app-logo-icon';

interface LoadingOverlayProps {
    show: boolean;
}

export default function LoadingOverlay({ show }: LoadingOverlayProps) {
    if (!show) return null;

    return (
        <div
            aria-hidden="true"
            className="bg-foreground/40 fixed inset-0 z-[100] flex flex-col items-center justify-center gap-5 backdrop-blur-[2px]"
        >
            <AppLogoIcon className="text-primary size-14" />
            <div className="bg-primary/20 h-1.5 w-40 overflow-hidden rounded-full">
                <div className="bg-primary h-full w-0 [animation:progress-fill-once_1.6s_ease-out_1_forwards] rounded-full" />
            </div>
        </div>
    );
}
