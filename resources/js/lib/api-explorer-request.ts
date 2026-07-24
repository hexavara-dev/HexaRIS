export interface ApiRequestInput {
    method: string;
    /** Resolved path with path-params substituted, e.g. "/users/3". */
    url: string;
    query: Record<string, string>;
    body?: unknown;
    inertiaVersion: string;
}

export interface ApiResponseResult {
    status: number;
    durationMs: number;
    headers: Record<string, string>;
    /** Parsed JSON when possible, otherwise the raw text. */
    data: unknown;
    raw: string;
}

const SAFE_METHODS = ['GET', 'HEAD'];

function readXsrfToken(): string | null {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]+)/);

    return match ? decodeURIComponent(match[1]) : null;
}

export async function sendApiRequest(input: ApiRequestInput): Promise<ApiResponseResult> {
    const method = input.method.toUpperCase();
    const isMutation = !SAFE_METHODS.includes(method);

    const queryString = new URLSearchParams(input.query).toString();
    const url = queryString ? `${input.url}?${queryString}` : input.url;

    const headers: Record<string, string> = {
        Accept: 'application/json, text/html',
        'X-Requested-With': 'XMLHttpRequest',
        'X-Inertia': 'true',
        'X-Inertia-Version': input.inertiaVersion,
    };

    const token = readXsrfToken();
    if (isMutation && token) {
        headers['X-XSRF-TOKEN'] = token;
    }

    const hasBody = isMutation && input.body !== undefined;
    if (hasBody) {
        headers['Content-Type'] = 'application/json';
    }

    const start = performance.now();
    const response = await fetch(url, {
        method,
        headers,
        credentials: 'same-origin',
        body: hasBody ? JSON.stringify(input.body) : undefined,
    });
    const durationMs = Math.round(performance.now() - start);

    const raw = await response.text();
    let data: unknown = raw;
    try {
        data = JSON.parse(raw);
    } catch {
        // not JSON (e.g. HTML) — keep the raw text
    }

    const responseHeaders: Record<string, string> = {};
    response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
    });

    return { status: response.status, durationMs, headers: responseHeaders, data, raw };
}
