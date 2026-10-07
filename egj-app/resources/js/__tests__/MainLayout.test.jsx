import { render, screen, waitFor, within, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import MainLayout from '@/Layouts/MainLayout';
import { lastVisit, loginAs } from './helpers';

const navLinks = () => within(document.querySelector('header nav')).getAllByRole('link').map(a => a.textContent);

function respond(routes) {
    fetch.mockImplementation((url, init = {}) => {
        const key = `${init.method || 'GET'} ${url}`;
        const body = routes[key] ?? {};
        const status = body.__status ?? 200;
        return Promise.resolve({ ok: status < 400, status, json: () => Promise.resolve(body) });
    });
}

describe('MainLayout navigation', () => {
    it.each([
        ['Staff', ['Dashboard', 'Monitoring', 'Draft Documents']],
        ['Section Head', ['Dashboard', 'Monitoring', 'Approval', 'Draft Documents']],
        ['Dept/Div Head', ['Dashboard', 'Monitoring', 'Approval']],
        ['Admin', ['Dashboard', 'Monitoring', 'Error Monitoring', 'User Management']],
    ])('%s sees only their menu items', (role, expected) => {
        loginAs(role);
        render(<MainLayout><p>content</p></MainLayout>);

        expect(navLinks()).toEqual(expected);
        expect(screen.getByText('content')).toBeInTheDocument();
    });

    it('highlights the active page', () => {
        loginAs('Staff');
        window.history.replaceState({}, '', '/monitoring?status=Draft');
        render(<MainLayout />);

        const monitoring = within(document.querySelector('header nav')).getByText('Monitoring').closest('a');
        expect(monitoring.className).toContain('bg-white/15');
    });

    it('mobile menu shows "+ New Draft" only for Staff and Section Head', async () => {
        const user = userEvent.setup();
        for (const [role, visible] of [['Staff', true], ['Section Head', true], ['Dept/Div Head', false], ['Admin', false]]) {
            loginAs(role);
            const { unmount } = render(<MainLayout />);
            await user.click(document.querySelector('button.md\\:hidden'));
            expect(!!screen.queryByText('+ New Draft')).toBe(visible);
            unmount();
        }
    });

    it('user menu links to profile, manual and logout (POST)', async () => {
        const user = userEvent.setup();
        loginAs('Staff');
        render(<MainLayout />);

        await user.click(screen.getByText('Budi Staff'));
        expect(screen.getByText('Account Settings').closest('a')).toHaveAttribute('href', '/profile');
        expect(screen.getByText('User Manual').closest('a')).toHaveAttribute('href', '/tutorial');

        await user.click(screen.getByText('Logout'));
        expect(lastVisit()).toMatchObject({ url: '/logout', method: 'post' });
    });
});

describe('MainLayout notifications', () => {
    it('shows the unread badge and caps it at 99+', async () => {
        loginAs('Staff');
        respond({ 'GET /notifications/unread-count': { unread_count: 150 } });
        render(<MainLayout />);

        expect(await screen.findByText('99+')).toBeInTheDocument();
    });

    it('polls the unread count every 30 seconds', async () => {
        vi.useFakeTimers();
        try {
            loginAs('Staff');
            respond({ 'GET /notifications/unread-count': { unread_count: 1 } });
            render(<MainLayout />);
            const countCalls = () => fetch.mock.calls.filter(([u]) => u === '/notifications/unread-count').length;

            expect(countCalls()).toBe(1);
            await act(async () => { vi.advanceTimersByTime(30000); });
            expect(countCalls()).toBe(2);
        } finally {
            vi.useRealTimers();
        }
    });

    it('lists notifications and opens the journal for approvers on click', async () => {
        const user = userEvent.setup();
        loginAs('Section Head');
        document.cookie = 'XSRF-TOKEN=tok123; path=/';
        respond({
            'GET /notifications/unread-count': { unread_count: 1 },
            'GET /notifications': { notifications: [{ id: 'n1', message: 'Document JOT 5 requires your approval review.', is_read: false, general_journal_id: 'j5', created_at: '2026-09-24T03:00:00Z' }] },
        });
        render(<MainLayout />);

        await user.click(screen.getByTitle('Notifications'));
        await user.click(await screen.findByText('Document JOT 5 requires your approval review.'));

        const markRead = fetch.mock.calls.find(([u]) => u === '/notifications/n1/read');
        expect(markRead[1].method).toBe('POST');
        // Regression: header used to come from a <meta name="csrf-token"> the page never had
        expect(markRead[1].headers['X-XSRF-TOKEN']).toBe('tok123');
        expect(lastVisit()).toMatchObject({ url: '/approval/j5', method: 'get' });
    });

    it('staff are taken to the journal detail page', async () => {
        const user = userEvent.setup();
        loginAs('Staff');
        respond({ 'GET /notifications': { notifications: [{ id: 'n2', message: 'Approved!', is_read: false, general_journal_id: 'j7' }] } });
        render(<MainLayout />);

        await user.click(screen.getByTitle('Notifications'));
        await user.click(await screen.findByText('Approved!'));
        expect(lastVisit().url).toBe('/general-journals/j7');
    });

    it('mark all read clears the badge only when the server accepted it', async () => {
        const user = userEvent.setup();
        loginAs('Staff');
        respond({
            'GET /notifications/unread-count': { unread_count: 3 },
            'GET /notifications': { notifications: [] },
            'POST /notifications/read-all': { __status: 419 },
        });
        render(<MainLayout />);

        await user.click(screen.getByTitle('Notifications'));
        await user.click(await screen.findByText(/Mark all read/));
        await waitFor(() => expect(fetch.mock.calls.some(([u]) => u === '/notifications/read-all')).toBe(true));
        expect(screen.getByText('3')).toBeInTheDocument();

        respond({ 'POST /notifications/read-all': {} });
        await user.click(screen.getByText(/Mark all read/));
        await waitFor(() => expect(screen.queryByText('3')).not.toBeInTheDocument());
    });

    it('shows the empty state', async () => {
        const user = userEvent.setup();
        loginAs('Staff');
        respond({ 'GET /notifications': { notifications: [] } });
        render(<MainLayout />);

        await user.click(screen.getByTitle('Notifications'));
        expect(await screen.findByText('No notifications yet.')).toBeInTheDocument();
    });
});

describe('MainLayout flash messages', () => {
    it('turns server flash messages into toasts', () => {
        const success = vi.spyOn(toast, 'success');
        const error = vi.spyOn(toast, 'error');
        loginAs('Staff', { flash: { success: 'Saved!', error: 'Oops' } });
        render(<MainLayout />);

        expect(success).toHaveBeenCalledWith('Saved!', expect.anything());
        expect(error).toHaveBeenCalledWith('Oops', expect.anything());
    });
});
