import { Sparkles } from 'lucide-react';

export function FloatingAssistantButton() {
    return (
        <button
            type="button"
            className="fixed right-6 bottom-6 flex items-center gap-2 rounded-full border border-[#E2E8F0] bg-white px-4 py-3 text-sm font-medium text-[#0F172A] shadow-[0px_4px_16px_0px_rgba(15,23,42,0.12)]"
        >
            <Sparkles className="size-4 text-[#1980C0]" />
            HRIS Assistant
        </button>
    );
}
