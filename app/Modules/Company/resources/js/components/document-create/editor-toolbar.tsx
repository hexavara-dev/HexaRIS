import {
    AlignCenter,
    AlignLeft,
    AlignRight,
    Bold,
    ChevronDown,
    Italic,
    List,
    ListOrdered,
    type LucideIcon,
    Redo2,
    Strikethrough,
    Underline,
    Undo2,
} from 'lucide-react';

import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

import { type EditorFormatState } from '../../hooks/use-page-fit-editor';
import { ZoomControl } from '../zoom-control';

/** `execCommand` names — see `usePageFitEditor.exec`. */
type ToolbarItem = { type: 'action'; icon: LucideIcon; label: string; command: string } | { type: 'divider' };

const TOOLBAR_ITEMS: ToolbarItem[] = [
    { type: 'action', icon: Undo2, label: 'Urungkan', command: 'undo' },
    { type: 'action', icon: Redo2, label: 'Ulangi', command: 'redo' },
    { type: 'divider' },
    { type: 'action', icon: Bold, label: 'Tebal', command: 'bold' },
    { type: 'action', icon: Italic, label: 'Miring', command: 'italic' },
    { type: 'action', icon: Underline, label: 'Garis Bawah', command: 'underline' },
    { type: 'action', icon: Strikethrough, label: 'Coret', command: 'strikeThrough' },
    { type: 'divider' },
    { type: 'action', icon: List, label: 'Daftar', command: 'insertUnorderedList' },
    { type: 'action', icon: ListOrdered, label: 'Daftar Bernomor', command: 'insertOrderedList' },
    { type: 'action', icon: AlignLeft, label: 'Rata Kiri', command: 'justifyLeft' },
    { type: 'action', icon: AlignCenter, label: 'Rata Tengah', command: 'justifyCenter' },
    { type: 'action', icon: AlignRight, label: 'Rata Kanan', command: 'justifyRight' },
    { type: 'divider' },
];

const BLOCK_OPTIONS = [
    { value: 'h1', label: 'Heading 1' },
    { value: 'h2', label: 'Heading 2' },
    { value: 'h3', label: 'Heading 3' },
    { value: 'p', label: 'Paragraf' },
];

interface EditorToolbarProps {
    format: EditorFormatState;
    onCommand: (command: string, value?: string) => void;
    percentage: number;
    canZoomIn: boolean;
    canZoomOut: boolean;
    onZoomIn: () => void;
    onZoomOut: () => void;
}

export function EditorToolbar({ format, onCommand, percentage, canZoomIn, canZoomOut, onZoomIn, onZoomOut }: EditorToolbarProps) {
    const currentBlock = BLOCK_OPTIONS.find((option) => option.value === format.block);

    // Clicking a toolbar button would otherwise blur the editor and collapse the
    // selection before the command could apply to it.
    const keepSelection = (event: React.MouseEvent) => event.preventDefault();

    return (
        <div className="flex flex-wrap items-center gap-1 border-b border-[#E2E8F0] p-3">
            {TOOLBAR_ITEMS.map((item, index) =>
                item.type === 'divider' ? (
                    <div key={index} className="mx-1 h-5 w-px bg-[#E2E8F0]" />
                ) : (
                    <button
                        key={index}
                        type="button"
                        aria-label={item.label}
                        title={item.label}
                        aria-pressed={format.active.has(item.command)}
                        onMouseDown={keepSelection}
                        onClick={() => onCommand(item.command)}
                        className={cn(
                            'flex cursor-pointer items-center rounded p-1.5 transition-colors hover:bg-[#F1F5F9]',
                            format.active.has(item.command) ? 'bg-[#EEF8FF] text-[#1980C0]' : 'text-[#64748B]',
                        )}
                    >
                        <item.icon className="size-4" />
                    </button>
                ),
            )}

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button
                        type="button"
                        onMouseDown={keepSelection}
                        className="flex cursor-pointer items-center gap-1 rounded border border-[#E2E8F0] px-2 py-1 text-xs text-[#64748B] hover:bg-[#F1F5F9]"
                    >
                        {currentBlock?.label ?? 'Paragraf'} <ChevronDown className="size-3" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start">
                    {BLOCK_OPTIONS.map((option) => (
                        <DropdownMenuItem
                            key={option.value}
                            onMouseDown={keepSelection}
                            onSelect={() => onCommand('formatBlock', option.value)}
                            className={cn(option.value === format.block && 'text-[#1980C0]')}
                        >
                            {option.label}
                        </DropdownMenuItem>
                    ))}
                </DropdownMenuContent>
            </DropdownMenu>

            <div className="ml-auto">
                <ZoomControl percentage={percentage} canZoomIn={canZoomIn} canZoomOut={canZoomOut} onZoomIn={onZoomIn} onZoomOut={onZoomOut} />
            </div>
        </div>
    );
}
