/**
 * Indonesian Date and Time Formatting Utilities
 * Provides 24-hour time format and standardized Indonesian date formatting.
 */

const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTHS_FULL = [
    'Januari',
    'Februari',
    'Maret',
    'April',
    'Mei',
    'Juni',
    'Juli',
    'Agustus',
    'September',
    'Oktober',
    'November',
    'Desember'
];

/**
 * Format date to standard Indonesian date (e.g., "21 Sep 2026")
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatDate(dateString) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';
        const day = d.getDate();
        const month = MONTHS_SHORT[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    } catch {
        return '-';
    }
}

/**
 * Format date to full Indonesian date (e.g., "21 September 2026")
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatFullDate(dateString) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';
        const day = d.getDate();
        const month = MONTHS_FULL[d.getMonth()];
        const year = d.getFullYear();
        return `${day} ${month} ${year}`;
    } catch {
        return '-';
    }
}

/**
 * Format date and time to Indonesian 24-hour format (e.g., "25 Sep 2026, 13:45")
 * @param {string|Date} dateString
 * @param {boolean} includeSeconds
 * @returns {string}
 */
export function formatDateTime(dateString, includeSeconds = false) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';
        const day = d.getDate();
        const month = MONTHS_SHORT[d.getMonth()];
        const year = d.getFullYear();
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');

        if (includeSeconds) {
            const seconds = String(d.getSeconds()).padStart(2, '0');
            return `${day} ${month} ${year}, ${hours}:${minutes}:${seconds}`;
        }
        return `${day} ${month} ${year}, ${hours}:${minutes}`;
    } catch {
        return '-';
    }
}

/**
 * Format short date and 24-hour time (e.g., "25 Sep, 13:45")
 * @param {string|Date} dateString
 * @returns {string}
 */
export function formatShortDateTime(dateString) {
    if (!dateString) return '-';
    try {
        const d = new Date(dateString);
        if (isNaN(d.getTime())) return '-';
        const day = d.getDate();
        const month = MONTHS_SHORT[d.getMonth()];
        const hours = String(d.getHours()).padStart(2, '0');
        const minutes = String(d.getMinutes()).padStart(2, '0');
        return `${day} ${month}, ${hours}:${minutes}`;
    } catch {
        return '-';
    }
}
