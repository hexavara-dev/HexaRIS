import AppLogoIcon from './icons/app-logo-icon';

export default function AppLogo() {
    return (
        <>
            <AppLogoIcon className="text-primary size-[18px] shrink-0" />
            <div className="ml-2 grid flex-1 text-left text-sm group-data-[collapsible=icon]:hidden">
                <span className="font-poppins truncate text-base leading-none font-semibold">
                    <span className="text-primary">Hexa</span>
                    <span className="text-black">RIS</span>
                </span>
            </div>
        </>
    );
}
