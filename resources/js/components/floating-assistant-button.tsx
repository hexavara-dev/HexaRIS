import iconHalloHris from '@/assets/icons/icon-hallo-hris.png';
import { RECENT_CONVERSATIONS, SUGGESTED_PROMPTS, assistantReply, type AssistantMessage, type RecentConversation } from '@/data/hris-assistant';
import { cn } from '@/lib/utils';
import { Copy, History, MessageSquarePlus, Minus, Plus, Search, Send, ThumbsDown, ThumbsUp, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';

let messageSeq = 0;
const nextMessageId = () => `assistant-msg-${++messageSeq}`;

type PanelView = 'chat' | 'history';

/**
 * Floating "HRIS Assistant" launcher, mounted once in AppLayout so it follows
 * the user across every authenticated page.
 *
 * Collapsed, it is the pill in the bottom-right corner. Expanded, it goes
 * straight to the conversation; the home view (new conversation + recent
 * threads + suggested prompts) only opens from the header's History button.
 * All replies come from the dummy `assistantReply` table — see
 * data/hris-assistant.ts.
 */
export function FloatingAssistantButton() {
    const [open, setOpen] = useState(false);
    const [minimized, setMinimized] = useState(false);
    const [view, setView] = useState<PanelView>('chat');
    const [messages, setMessages] = useState<AssistantMessage[]>([]);
    const [input, setInput] = useState('');
    const [search, setSearch] = useState('');
    const [typing, setTyping] = useState(false);

    const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const transcriptRef = useRef<HTMLDivElement>(null);

    // Timers outlive a route change otherwise, and setState after unmount warns.
    useEffect(() => {
        return () => {
            if (replyTimer.current) clearTimeout(replyTimer.current);
        };
    }, []);

    useEffect(() => {
        const el = transcriptRef.current;
        if (el) el.scrollTop = el.scrollHeight;
    }, [messages, typing, open, minimized]);

    const showHistory = view === 'history';

    const send = (raw: string) => {
        const question = raw.trim();
        if (!question || typing) return;

        setView('chat');
        setMessages((current) => [...current, { id: nextMessageId(), role: 'user', text: question }]);
        setInput('');
        setTyping(true);

        replyTimer.current = setTimeout(() => {
            setMessages((current) => [...current, { id: nextMessageId(), role: 'assistant', text: assistantReply(question) }]);
            setTyping(false);
        }, 700);
    };

    const openConversation = (conversation: RecentConversation) => {
        send(conversation.question);
    };

    const newConversation = () => {
        if (replyTimer.current) clearTimeout(replyTimer.current);
        setMessages([]);
        setSearch('');
        setInput('');
        setTyping(false);
        setView('chat');
    };

    const closePanel = () => {
        setOpen(false);
        setMinimized(false);
        newConversation();
    };

    const onSubmit = (event: FormEvent) => {
        event.preventDefault();
        send(input);
    };

    if (!open || minimized) {
        return (
            <button
                type="button"
                onClick={() => {
                    setOpen(true);
                    setMinimized(false);
                    setView('chat');
                }}
                className="fixed right-6 bottom-24 z-40 flex w-56 items-center justify-start rounded-xl bg-white px-6 py-4 text-sm font-bold text-nowrap text-[#0F172A] shadow-[0px_4px_16px_0px_rgba(15,23,42,0.12)] transition hover:shadow-[0px_6px_20px_0px_rgba(15,23,42,0.18)]"
            >
                HRIS Assistant
            </button>
        );
    }

    const recentConversations = RECENT_CONVERSATIONS.filter((conversation) => conversation.title.toLowerCase().includes(search.trim().toLowerCase()));

    return (
        <aside
            aria-label="HRIS Assistant"
            className="fixed top-6 right-6 bottom-24 z-40 flex w-[min(380px,calc(100vw-3rem))] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0px_12px_40px_0px_rgba(15,23,42,0.18)]"
        >
            {/* HEADER */}
            <header className="flex h-14 shrink-0 items-center justify-between px-5">
                <span className="text-sm font-semibold text-[#0F172A]">HRIS Assistant</span>

                <div className="flex items-center gap-1">
                    <button
                        type="button"
                        aria-label="Minimalkan"
                        onClick={() => setMinimized(true)}
                        className="flex size-8 items-center justify-center rounded-lg text-[#0F172A] transition hover:bg-[#F3F4F6]"
                    >
                        <Minus className="size-4" />
                    </button>

                    <button
                        type="button"
                        aria-label="Riwayat percakapan"
                        onClick={() => setView((current) => (current === 'history' ? 'chat' : 'history'))}
                        className={cn(
                            'flex size-8 items-center justify-center rounded-lg text-[#0F172A] transition hover:bg-[#F3F4F6]',
                            showHistory && 'bg-[#F3F4F6]',
                        )}
                    >
                        <History className="size-4" />
                    </button>

                    <button
                        type="button"
                        aria-label="Tutup"
                        onClick={closePanel}
                        className="flex size-8 items-center justify-center rounded-lg text-[#0F172A] transition hover:bg-[#F3F4F6]"
                    >
                        <X className="size-4" />
                    </button>
                </div>
            </header>

            {/* BODY */}
            <div ref={transcriptRef} className="min-h-0 flex-1 overflow-y-auto">
                {showHistory ? (
                    <div className="flex h-full items-center justify-center p-4">
                        <div className="w-full rounded-2xl border border-[#EEF1F5] bg-white p-4 shadow-[0px_4px_24px_0px_rgba(15,23,42,0.08)]">
                            <button
                                type="button"
                                onClick={newConversation}
                                className="flex w-full items-center gap-2 rounded-xl bg-[#F1F3F7] px-4 py-3 text-left text-sm font-semibold text-[#0F172A] transition hover:bg-[#E7EBF2]"
                            >
                                <MessageSquarePlus className="size-4" />
                                New Conversations
                            </button>

                            <p className="mt-5 text-sm text-[#9CA3AF]">Recent Conversational</p>

                            <div className="relative mt-2">
                                <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-[#9CA3AF]" />
                                <input
                                    value={search}
                                    onChange={(event) => setSearch(event.target.value)}
                                    placeholder="Search"
                                    className="h-10 w-full rounded-xl border border-[#E5E7EB] pr-3 pl-9 text-sm outline-none focus:border-[#1980C0]"
                                />
                            </div>

                            <ul className="mt-3 max-h-56 space-y-1 overflow-y-auto">
                                {recentConversations.map((conversation) => (
                                    <li key={conversation.id}>
                                        <button
                                            type="button"
                                            onClick={() => openConversation(conversation)}
                                            className="w-full truncate rounded-lg px-2 py-2 text-left text-sm text-[#374151] transition hover:bg-[#F3F4F6]"
                                        >
                                            {conversation.title}
                                        </button>
                                    </li>
                                ))}

                                {recentConversations.length === 0 && (
                                    <li className="px-2 py-2 text-sm text-[#9CA3AF]">Tidak ada percakapan cocok.</li>
                                )}
                            </ul>

                            <p className="mt-4 text-sm text-[#9CA3AF]">Saran untuk dicoba</p>

                            <div className="mt-2 flex flex-wrap gap-2">
                                {SUGGESTED_PROMPTS.map((prompt) => (
                                    <button
                                        key={prompt}
                                        type="button"
                                        onClick={() => send(prompt)}
                                        className="rounded-full border border-[#E5E7EB] px-3 py-1.5 text-xs text-[#374151] transition hover:border-[#1980C0] hover:text-[#1980C0]"
                                    >
                                        {prompt}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
                        <img src={iconHalloHris} alt="" className="size-10 object-contain" />

                        <p className="text-xs text-[#ACACAC]">What can I do for you?</p>
                    </div>
                ) : (
                    <div className="flex flex-col gap-5 px-4 py-4">
                        {messages.map((message) =>
                            message.role === 'user' ? (
                                <div key={message.id} className="flex justify-end">
                                    <div className="max-w-[85%] rounded-2xl rounded-br-md bg-[#1E3A8A] px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap text-white">
                                        {message.text}
                                    </div>
                                </div>
                            ) : (
                                <div key={message.id} className="flex flex-col items-start gap-1.5">
                                    <div className="flex items-start gap-2.5">
                                        <img src={iconHalloHris} alt="" className="mt-1 size-6 shrink-0 object-contain" />

                                        <div className="max-w-[90%] rounded-2xl rounded-tl-md bg-[#F3F4F6] px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap text-[#111827]">
                                            {message.text}
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pl-9 text-[#9CA3AF]">
                                        <button
                                            type="button"
                                            aria-label="Salin jawaban"
                                            className="rounded p-1 transition hover:bg-[#E5E7EB] hover:text-[#374151]"
                                        >
                                            <Copy className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Jawaban tidak membantu"
                                            className="rounded p-1 transition hover:bg-[#E5E7EB] hover:text-[#374151]"
                                        >
                                            <ThumbsDown className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            aria-label="Jawaban membantu"
                                            className="rounded p-1 transition hover:bg-[#E5E7EB] hover:text-[#374151]"
                                        >
                                            <ThumbsUp className="size-3.5" />
                                        </button>
                                    </div>
                                </div>
                            ),
                        )}

                        {typing && (
                            <div className="flex items-center gap-2.5">
                                <img src={iconHalloHris} alt="" className="size-6 shrink-0 object-contain" />

                                <div className="flex items-center gap-1.5 rounded-2xl rounded-tl-md bg-[#F3F4F6] px-4 py-3.5">
                                    <span className="size-1.5 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:0ms]" />
                                    <span className="size-1.5 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:150ms]" />
                                    <span className="size-1.5 animate-bounce rounded-full bg-[#9CA3AF] [animation-delay:300ms]" />
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* INPUT */}
            <form onSubmit={onSubmit} className="shrink-0 p-4">
                <div className="flex items-center gap-2 rounded-full border border-[#9CA3AF] bg-white py-1.5 pr-1.5 pl-3">
                    <button
                        type="button"
                        aria-label="Lampirkan"
                        className="flex size-6 shrink-0 items-center justify-center text-[#1E3A8A] transition hover:opacity-70"
                    >
                        <Plus className="size-4" />
                    </button>

                    <input
                        value={input}
                        onChange={(event) => setInput(event.target.value)}
                        placeholder="Ask Anything"
                        className="h-8 min-w-0 flex-1 bg-transparent text-xs outline-none placeholder:text-[#ACACAC]"
                    />

                    <button
                        type="submit"
                        aria-label="Kirim"
                        disabled={typing || input.trim().length === 0}
                        className={cn(
                            'flex size-8 shrink-0 items-center justify-center rounded-lg bg-[#1980C0] text-white transition',
                            'hover:bg-[#1668a0] disabled:cursor-not-allowed disabled:opacity-40',
                        )}
                    >
                        <Send className="size-4" />
                    </button>
                </div>
            </form>
        </aside>
    );
}
