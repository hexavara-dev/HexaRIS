/**
 * Minimal allow-list sanitizer for the document body's rich text.
 *
 * The body is persisted as HTML and re-seeded into a `contentEditable` on mount,
 * which makes that seed an injection sink — a tampered localStorage entry (or, once
 * a backend exists, a stored value from another user) could otherwise smuggle in
 * `<img onerror>`. Only the markup `document.execCommand` actually produces is
 * allowed through; everything else is unwrapped or dropped.
 *
 * Runs as three separate passes over the whole tree, deliberately: an earlier
 * version stripped attributes *during* the same recursive walk that unwrapped
 * disallowed elements, so children promoted by an unwrap were never visited and
 * kept their attributes — `<article><b onmouseover=…>` survived intact. Stripping
 * attributes only after all unwrapping is done removes that class of bug entirely.
 *
 * Not a general-purpose sanitizer. If this app ever renders HTML authored by
 * someone other than the current user, use DOMPurify instead of extending this.
 */
const ALLOWED_TAGS = new Set(['B', 'STRONG', 'I', 'EM', 'U', 'S', 'STRIKE', 'UL', 'OL', 'LI', 'P', 'DIV', 'BR', 'H1', 'H2', 'H3', 'SPAN', 'FONT']);

/** `justifyCenter` and friends set inline text-align — the only styling worth keeping. */
const ALLOWED_STYLES = new Set(['text-align']);

/** Elements dropped with their entire subtree, rather than unwrapped. */
const DISCARDED_SELECTOR = [
    'script',
    'style',
    'noscript',
    'template',
    'iframe',
    'frame',
    'frameset',
    'object',
    'embed',
    'applet',
    'link',
    'meta',
    'base',
    'img',
    'picture',
    'source',
    'svg',
    'math',
    'audio',
    'video',
    'track',
    'form',
    'input',
    'button',
    'select',
    'option',
    'textarea',
].join(', ');

function stripAttributes(el: Element) {
    for (const attr of Array.from(el.attributes)) {
        if (attr.name !== 'style') {
            el.removeAttribute(attr.name);
            continue;
        }

        // Keep only allow-listed declarations, drop the attribute if none survive.
        const style = (el as HTMLElement).style;
        for (const property of Array.from(style)) {
            if (!ALLOWED_STYLES.has(property)) style.removeProperty(property);
        }
        if (!style.length) el.removeAttribute('style');
    }
}

export function sanitizeHtml(html: string): string {
    // A template's content is inert — scripts don't run and images don't load while
    // we prune it.
    const template = document.createElement('template');
    template.innerHTML = html;
    const content = template.content;

    // Pass 1: delete anything that could execute, navigate, or fetch, subtree included.
    for (const el of Array.from(content.querySelectorAll(DISCARDED_SELECTOR))) {
        el.remove();
    }

    // Pass 2: unwrap every element not on the allow-list, keeping its text. The
    // NodeList is static and in document order, so descendants promoted by an
    // unwrap are still visited later in this same loop.
    for (const el of Array.from(content.querySelectorAll('*'))) {
        // Skip nodes that left the tree with a discarded ancestor.
        if (!el.parentNode) continue;
        if (!ALLOWED_TAGS.has(el.tagName)) el.replaceWith(...Array.from(el.childNodes));
    }

    // Pass 3: only now strip attributes, so every surviving element is covered no
    // matter how it got here.
    for (const el of Array.from(content.querySelectorAll('*'))) {
        stripAttributes(el);
    }

    return template.innerHTML;
}
