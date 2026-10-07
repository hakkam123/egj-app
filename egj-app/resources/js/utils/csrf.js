/**
 * Headers for fetch() POST requests to Laravel.
 *
 * Laravel sets an XSRF-TOKEN cookie on every response and accepts it back in the
 * X-XSRF-TOKEN header. The page has no <meta name="csrf-token">, and the browser's
 * Sec-Fetch-Site fallback is only sent over HTTPS/localhost, so on a plain-HTTP intranet
 * a fetch() without this header is rejected with 419.
 */
export function readXsrfToken() {
    const match = document.cookie.match(/(?:^|;\s*)XSRF-TOKEN=([^;]*)/);
    return match ? decodeURIComponent(match[1]) : '';
}

export function csrfHeaders(extra = {}) {
    return {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-XSRF-TOKEN': readXsrfToken(),
        ...extra,
    };
}
