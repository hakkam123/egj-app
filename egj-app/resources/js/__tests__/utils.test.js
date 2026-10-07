import { formatDate, formatFullDate, formatDateTime, formatShortDateTime } from '@/utils/dateFormat';
import { STATUS_COLORS } from '@/constants/statusColors';
import { canActOnJournal, currentPendingApproval } from '@/utils/approval';
import { csrfHeaders, readXsrfToken } from '@/utils/csrf';
import { users } from './helpers';

describe('dateFormat', () => {
    // Local-time constructor so the result does not depend on the machine's timezone
    const d = new Date(2026, 8, 5, 7, 3, 9); // 5 Sep 2026 07:03:09

    it('formats short, full and date-time values in English with 24-hour time', () => {
        expect(formatDate(d)).toBe('5 Sep 2026');
        expect(formatFullDate(d)).toBe('5 September 2026');
        expect(formatDateTime(d)).toBe('5 Sep 2026, 07:03');
        expect(formatDateTime(d, true)).toBe('5 Sep 2026, 07:03:09');
        expect(formatShortDateTime(d)).toBe('5 Sep, 07:03');
        expect(formatDateTime(new Date(2026, 11, 31, 23, 59))).toBe('31 Dec 2026, 23:59');
    });

    it('uses English month names (no Indonesian)', () => {
        const months = Array.from({ length: 12 }, (_, m) => formatDate(new Date(2026, m, 1)).split(' ')[1]);
        expect(months).toEqual(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']);
        expect(formatFullDate(new Date(2026, 4, 1))).toBe('1 May 2026');
        expect(formatFullDate(new Date(2026, 7, 1))).toBe('1 August 2026');
    });

    it.each([null, undefined, '', 'not-a-date'])('returns "-" for %p', (value) => {
        expect(formatDate(value)).toBe('-');
        expect(formatFullDate(value)).toBe('-');
        expect(formatDateTime(value)).toBe('-');
        expect(formatShortDateTime(value)).toBe('-');
    });

    it('accepts ISO strings from the API', () => {
        expect(formatDate('2026-09-24')).toMatch(/^2[34] Sep 2026$/);
    });
});

describe('STATUS_COLORS', () => {
    it.each(['Draft', 'Waiting Approval', 'Revised', 'Approved', 'Rejected', 'Neutral'])('%s has every style key', (status) => {
        const conf = STATUS_COLORS[status];
        for (const key of ['solid', 'bgSoft', 'border', 'text', 'dotClass', 'badgeClass', 'label', 'shortLabel']) {
            expect(conf[key], `${status}.${key}`).toBeTruthy();
        }
    });
});

describe('canActOnJournal (mirrors server GeneralJournal::canBeActionedBy)', () => {
    const chain = (superior, final) => ({
        status: 'Waiting Approval',
        approvals: [
            { approval_level: 'superior_of_superior', status: final, assigned_user_id: users['Dept/Div Head'].id },
            { approval_level: 'accounting', status: 'Approved', assigned_user_id: users.Staff.id },
            { approval_level: 'superior', status: superior, assigned_user_id: users['Section Head'].id },
        ],
    });

    it('finds the earliest pending level regardless of array order', () => {
        expect(currentPendingApproval(chain('Pending', 'Pending')).approval_level).toBe('superior');
        expect(currentPendingApproval(chain('Approved', 'Pending')).approval_level).toBe('superior_of_superior');
        expect(currentPendingApproval(chain('Approved', 'Approved'))).toBeNull();
    });

    it('only the Section Head may act at the superior stage (Dept Head cannot skip ahead)', () => {
        const j = chain('Pending', 'Pending');
        expect(canActOnJournal(j, users['Section Head'])).toBe(true);
        expect(canActOnJournal(j, users['Dept/Div Head'])).toBe(false);
        expect(canActOnJournal(j, users.Staff)).toBe(false);
        expect(canActOnJournal(j, users.Admin)).toBe(false);
    });

    it('only the Dept/Div Head may act at the final stage', () => {
        const j = chain('Approved', 'Pending');
        expect(canActOnJournal(j, users['Dept/Div Head'])).toBe(true);
        expect(canActOnJournal(j, users['Section Head'])).toBe(false);
    });

    it('nobody can act when the journal is not waiting', () => {
        for (const status of ['Draft', 'Revised', 'Approved', 'Rejected']) {
            expect(canActOnJournal({ ...chain('Pending', 'Pending'), status }, users['Section Head'])).toBe(false);
        }
        expect(canActOnJournal(null, users['Section Head'])).toBe(false);
        expect(canActOnJournal(chain('Pending', 'Pending'), null)).toBe(false);
    });

    it('the assigned user may act even with another role', () => {
        const j = chain('Pending', 'Pending');
        j.approvals[2].assigned_user_id = 'someone-special';
        expect(canActOnJournal(j, { id: 'someone-special', role: 'Staff' })).toBe(true);
    });
});

describe('csrf', () => {
    it('sends the decoded XSRF-TOKEN cookie as X-XSRF-TOKEN', () => {
        document.cookie = 'XSRF-TOKEN=abc%3D%3D123; path=/';
        expect(readXsrfToken()).toBe('abc==123');
        expect(csrfHeaders()).toMatchObject({
            'X-XSRF-TOKEN': 'abc==123',
            'X-Requested-With': 'XMLHttpRequest',
            'Accept': 'application/json',
        });
    });

    it('returns an empty token when the cookie is missing', () => {
        expect(readXsrfToken()).toBe('');
    });
});
