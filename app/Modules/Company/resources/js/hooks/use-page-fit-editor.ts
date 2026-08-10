import { type ClipboardEvent, type FormEvent, useEffect, useRef, useState } from 'react';

import { sanitizeHtml } from '../lib/sanitize-html';

/** Formatting commands whose active state the toolbar reflects. */
const TOGGLE_COMMANDS = [
    'bold',
    'italic',
    'underline',
    'strikeThrough',
    'insertUnorderedList',
    'insertOrderedList',
    'justifyLeft',
    'justifyCenter',
    'justifyRight',
] as const;

/** Commands that undo/redo rather than add content, so overflow is allowed through. */
const HISTORY_COMMANDS = new Set(['undo', 'redo']);

export interface EditorFormatState {
    /** Commands currently applied at the caret, e.g. `bold`. */
    active: Set<string>;
    /** The caret's block tag, lowercase — `h2`, `p`, `div`. */
    block: string;
}

/** Deep copies of an element's children, detached so later edits to the live DOM can't mutate them. */
function cloneChildren(el: HTMLElement): Node[] {
    return Array.from(el.childNodes, (node) => node.cloneNode(true));
}

/** Rewriting a contentEditable's children collapses the caret to the start — put it back at the end. */
function placeCaretAtEnd(el: HTMLElement) {
    const range = document.createRange();
    range.selectNodeContents(el);
    range.collapse(false);

    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
}

/**
 * Drives a rich-text `contentEditable` that must not outgrow its box — a sheet of
 * paper with a finite writing area. Once the content fills the available height,
 * anything that would make it taller (typing, Enter, or a formatting command like
 * "Heading 2") is rejected, so whatever sits below it (signature blocks) can never
 * be pushed off the page. Deletions and undo always go through.
 *
 * Formatting runs through `document.execCommand`. It's deprecated, but it's the only
 * way to get selection-aware rich-text editing without pulling in an editor library,
 * and every current browser still implements it.
 *
 * ```tsx
 * const editor = usePageFitEditor(body, onBodyChange);
 * <div contentEditable suppressContentEditableWarning ref={editor.ref} {...editor.handlers} />
 * ```
 */
export function usePageFitEditor(initialHtml: string, onChange: (html: string) => void) {
    const ref = useRef<HTMLDivElement>(null);
    // Snapshot of the last DOM that still fit — what we roll back to when an edit
    // would overflow. Cloned nodes, not a string: line breaks in a contentEditable
    // *are* `<div>`/`<br>` elements, and a string round-trip mangles them.
    const lastFittingNodes = useRef<Node[]>([]);
    const [format, setFormat] = useState<EditorFormatState>({ active: new Set(), block: 'div' });

    // Seed the initial content once on mount. After that the DOM, not the prop, is
    // the source of truth — re-syncing per keystroke would fight the caret.
    useEffect(() => {
        const el = ref.current;
        if (!el) return;
        el.innerHTML = sanitizeHtml(initialHtml);
        lastFittingNodes.current = cloneChildren(el);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Reflect the caret's formatting so the toolbar can show what's active.
    useEffect(() => {
        function readFormatState() {
            const el = ref.current;
            const selection = window.getSelection();
            if (!el || !selection?.anchorNode || !el.contains(selection.anchorNode)) return;

            const active = new Set<string>();
            for (const command of TOGGLE_COMMANDS) {
                if (document.queryCommandState(command)) active.add(command);
            }

            setFormat({ active, block: (document.queryCommandValue('formatBlock') || 'div').toLowerCase() });
        }

        document.addEventListener('selectionchange', readFormatState);
        return () => document.removeEventListener('selectionchange', readFormatState);
    }, []);

    /** Accept the current DOM as the new baseline, or restore the last one that fit. */
    function commitOrRollback(el: HTMLElement, allowOverflow: boolean) {
        if (!allowOverflow && el.scrollHeight > el.clientHeight) {
            el.replaceChildren(...lastFittingNodes.current.map((node) => node.cloneNode(true)));
            placeCaretAtEnd(el);
            return;
        }

        lastFittingNodes.current = cloneChildren(el);
        onChange(el.innerHTML);
    }

    function handleInput(event: FormEvent<HTMLDivElement>) {
        const el = ref.current;
        if (!el) return;

        // Deletions only ever shrink the content, so they're always safe to accept —
        // and must be, or a full page would wedge with no way to edit back out of it.
        const inputType = (event.nativeEvent as InputEvent).inputType ?? '';
        const isShrinking = inputType.startsWith('delete') || inputType === 'historyUndo';

        commitOrRollback(el, isShrinking);
    }

    /** Plain-text paste — formatting is applied deliberately via the toolbar, not smuggled in. */
    function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
        event.preventDefault();
        const text = event.clipboardData.getData('text/plain');
        if (text) document.execCommand('insertText', false, text);
    }

    /** Run a formatting command against the current selection. */
    function exec(command: string, value?: string) {
        const el = ref.current;
        if (!el) return;

        // The command applies to the document's selection, so the editor has to hold
        // focus — toolbar buttons suppress mousedown to keep the selection intact.
        el.focus();
        document.execCommand(command, false, value);
        commitOrRollback(el, HISTORY_COMMANDS.has(command));
    }

    return { ref, handlers: { onInput: handleInput, onPaste: handlePaste }, exec, format };
}
