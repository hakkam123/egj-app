import { render, screen, fireEvent, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import DashboardIndex from '@/Pages/Dashboard/Index';
import UsersIndex from '@/Pages/Users/Index';
import EditProfile from '@/Pages/Profile/Edit';
import TutorialIndex from '@/Pages/Tutorial/Index';
import ErrorMonitoringIndex from '@/Pages/ErrorMonitoring/Index';
import TrackingIndex from '@/Pages/Tracking/Index';
import { journal, lastVisit, loginAs, paginate, users, visits } from './helpers';

// ---------------------------------------------------------------- Dashboard

describe('Dashboard', () => {
    it('Staff sees their counters and recent documents (with assignee)', () => {
        loginAs('Staff');
        render(<DashboardIndex role="Staff" stats={{ draft: 1, waiting: 2, revised: 0, approved: 3, rejected: 0 }}
            recentData={[journal({ id: 'r1', document_number: 'JOT 31' })]} />);

        expect(screen.getByText('Drafts').nextSibling).toHaveTextContent('1');
        expect(screen.getAllByText('Waiting Approval')[0].nextSibling).toHaveTextContent('2');
        expect(screen.getByText('JOT 31').closest('a')).toHaveAttribute('href', '/general-journals/r1');
        expect(screen.getByRole('columnheader', { name: 'Assign To' })).toBeInTheDocument();
        expect(screen.queryByText('Documents Requiring Action')).not.toBeInTheDocument();
    });

    it('approvers see overdue documents linking to the review page', () => {
        loginAs('Section Head');
        render(<DashboardIndex role="Section Head" stats={{ pending_approval: 1 }} recentData={[]}
            actionRequiredDocs={[{ id: 'o1', document_number: 'JOT 41', days_waiting: 6, requester: { name: 'Budi' }, submitted_at: '2026-09-20 08:00' }]} />);

        expect(screen.getByText('1 Documents')).toBeInTheDocument();
        expect(screen.getByText('JOT 41').closest('a')).toHaveAttribute('href', '/approval/o1');
        expect(screen.getByText('6 Days')).toBeInTheDocument();
        expect(screen.getByText('Recent Approval Queue')).toBeInTheDocument();
    });

    it('admin sees system counters and the "all up to date" state', () => {
        loginAs('Admin');
        render(<DashboardIndex role="Admin" stats={{ total_users: 5, total_journals: 9 }} recentData={[]} actionRequiredDocs={[]} />);

        expect(screen.getByText('Total Users').nextSibling).toHaveTextContent('5');
        expect(screen.getByText('All documents are up to date')).toBeInTheDocument();
        expect(screen.getByText('No recent documents found.')).toBeInTheDocument();
    });

    it('chart never divides by zero', () => {
        loginAs('Staff');
        render(<DashboardIndex role="Staff" stats={{}} recentData={[]} />);
        expect(screen.queryByText('NaN%')).not.toBeInTheDocument();
        expect(screen.getAllByText('0%').length).toBeGreaterThan(0);
    });
});

// ---------------------------------------------------------------- Users

describe('User management', () => {
    const list = [
        { id: 'u1', name: 'Budi Staff', email: 'budi@x.com', npk: '1002', role: 'Staff', is_active: true, is_default_approver: false },
        { id: 'u2', name: 'Ahmad Section', email: 'ahmad@x.com', npk: '1004', role: 'Section Head', is_active: true, is_default_approver: true },
        { id: 'u3', name: 'Old Person', email: 'old@x.com', npk: null, role: 'Staff', is_active: false, is_default_approver: false },
    ];
    const renderUsers = (filters = {}) => {
        loginAs('Admin');
        return render(<UsersIndex users={paginate(list)} filters={filters} />);
    };

    it('lists users with role, default-approver mark and status', () => {
        renderUsers();
        expect(screen.getByText('★ Default Approver')).toBeInTheDocument();
        expect(within(screen.getByText('Old Person').closest('tr')).getByText('Inactive')).toBeInTheDocument();
        // Inactive users cannot be deactivated again
        expect(within(screen.getByText('Old Person').closest('tr')).queryByTitle('Deactivate User')).not.toBeInTheDocument();
    });

    it('creates a user; default-approver option only for Section Head', async () => {
        const user = userEvent.setup();
        renderUsers();

        await user.click(screen.getByRole('button', { name: /Add User/ }));
        expect(screen.queryByLabelText('Default Section Head Approver')).not.toBeInTheDocument();

        const fill = (placeholder, value) => fireEvent.change(screen.getByPlaceholderText(placeholder), { target: { value } });
        fill('Full name', 'New Head');
        fill('name@astra-visteon.com', 'new@x.com');
        fill('e.g. 12345 (Optional)', '3003');
        await user.selectOptions(screen.getAllByRole('combobox').find(s => s.value === 'Staff' && s.closest('form')), 'Section Head');
        await user.click(screen.getByLabelText('Default Section Head Approver'));
        fill('Min. 8 characters', 'password123');
        fill('Re-enter password', 'password123');
        const form = screen.getByPlaceholderText('Full name').closest('form');
        await user.click(within(form).getByRole('button', { name: 'Add User' }));

        expect(lastVisit()).toMatchObject({ url: '/users', method: 'post' });
        expect(lastVisit().data).toMatchObject({
            name: 'New Head', email: 'new@x.com', npk: '3003', role: 'Section Head',
            is_default_approver: true, is_active: true, password: 'password123', password_confirmation: 'password123',
        });
    });

    it('edits a user with the form prefilled and password optional', async () => {
        const user = userEvent.setup();
        renderUsers();

        await user.click(within(screen.getByText('Ahmad Section').closest('tr')).getByTitle('Edit User'));
        expect(screen.getByDisplayValue('ahmad@x.com')).toBeInTheDocument();
        expect(screen.getByPlaceholderText('Leave empty if unchanged')).toHaveValue('');

        await user.click(screen.getByRole('button', { name: 'Save Changes' }));
        expect(lastVisit()).toMatchObject({ url: '/users/u2', method: 'put' });
        expect(lastVisit().data).toMatchObject({ role: 'Section Head', is_default_approver: true, password: '' });
    });

    it('deactivates after confirmation', async () => {
        const user = userEvent.setup();
        renderUsers();

        await user.click(within(screen.getByText('Budi Staff').closest('tr')).getByTitle('Deactivate User'));
        expect(screen.getByText('Deactivate User?')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Yes, Deactivate' }));
        expect(lastVisit()).toMatchObject({ url: '/users/u1', method: 'delete' });
    });

    it('filters: search is debounced, role/status apply immediately', async () => {
        vi.useFakeTimers();
        try {
            renderUsers();
            fireEvent.change(screen.getByPlaceholderText('Search by name, email, or NPK...'), { target: { value: 'budi' } });
            expect(visits()).toHaveLength(0);
            await act(async () => { vi.advanceTimersByTime(400); });
            expect(lastVisit()).toMatchObject({ url: '/users', data: { search: 'budi', per_page: 10 } });

            fireEvent.change(screen.getByDisplayValue('All Roles'), { target: { value: 'Admin' } });
            expect(lastVisit().data).toMatchObject({ role: 'Admin' });
        } finally {
            vi.useRealTimers();
        }
    });

    it('no duplicate success toast (server flash message is shown by the layout)', async () => {
        const user = userEvent.setup();
        const success = vi.spyOn(toast, 'success');
        renderUsers();

        await user.click(within(screen.getByText('Budi Staff').closest('tr')).getByTitle('Deactivate User'));
        await user.click(screen.getByRole('button', { name: 'Yes, Deactivate' }));
        lastVisit().options.onSuccess({ props: {} });

        expect(success).not.toHaveBeenCalled();
    });
});

// ---------------------------------------------------------------- Profile

describe('Profile page', () => {
    const me = { id: 'u-staff', name: 'Budi Staff', email: 'budi@example.com', npk: '1002', role: 'Staff' };

    it('updates profile data', async () => {
        const user = userEvent.setup();
        loginAs('Staff');
        render(<EditProfile user={me} />);

        const name = screen.getByDisplayValue('Budi Staff');
        await user.clear(name);
        await user.type(name, 'Budi S.');
        await user.click(screen.getByRole('button', { name: /Save Profile/ }));

        expect(lastVisit()).toMatchObject({ url: '/profile', method: 'put', data: { name: 'Budi S.', email: 'budi@example.com', npk: '1002' } });
    });

    it('changes the password and clears the form on success', async () => {
        const user = userEvent.setup();
        loginAs('Staff');
        render(<EditProfile user={me} />);

        const passwordInputs = document.querySelectorAll('input[type="password"]');
        await user.type(passwordInputs[0], 'oldpass');
        await user.type(passwordInputs[1], 'newpass123');
        await user.type(passwordInputs[2], 'newpass123');
        await user.click(screen.getAllByRole('button', { name: /Change Password/ }).pop());

        expect(lastVisit()).toMatchObject({
            url: '/profile/password', method: 'put',
            data: { current_password: 'oldpass', new_password: 'newpass123', new_password_confirmation: 'newpass123' },
        });

        await act(async () => { lastVisit().options.onSuccess({ props: {} }); });
        expect(document.querySelectorAll('input[type="password"]')[0]).toHaveValue('');
    });
});

// ---------------------------------------------------------------- Tutorials

describe('Tutorial page', () => {
    const tutorials = [{ id: 't1', title: 'Submission Guide', file_name: 'guide.pdf', file_size: 1024, description: 'How to' }];

    it('everyone can download; only admins can add or delete', () => {
        loginAs('Staff');
        const { unmount } = render(<TutorialIndex tutorials={tutorials} manualExists />);
        expect(screen.getByText('Submission Guide')).toBeInTheDocument();
        expect(screen.getByTitle('Download PDF')).toHaveAttribute('href', '/tutorial/download/t1');
        expect(screen.queryByRole('button', { name: /Add Tutorial/ })).not.toBeInTheDocument();
        unmount();

        loginAs('Admin');
        render(<TutorialIndex tutorials={tutorials} manualExists />);
        expect(screen.getByRole('button', { name: /Add Tutorial/ })).toBeInTheDocument();
    });

    it('shows a notice when nothing has been uploaded', () => {
        loginAs('Staff');
        render(<TutorialIndex tutorials={[]} manualExists={false} />);
        expect(screen.getByText(/No tutorial files or PDF manual books have been uploaded yet/)).toBeInTheDocument();
    });

    it('admin upload requires a file, then posts it', async () => {
        const user = userEvent.setup();
        const error = vi.spyOn(toast, 'error');
        loginAs('Admin');
        render(<TutorialIndex tutorials={[]} manualExists={false} />);

        await user.click(screen.getByRole('button', { name: /Add Tutorial/ }));
        await user.type(screen.getByPlaceholderText('e.g. General Journal Submission Guidelines'), 'Guide');
        fireEvent.submit(screen.getByPlaceholderText('e.g. General Journal Submission Guidelines').closest('form'));
        expect(error).toHaveBeenCalledWith('Please select a PDF file first.');
        expect(visits()).toHaveLength(0);

        await user.upload(document.querySelector('input[type="file"]'), new File(['%PDF'], 'g.pdf', { type: 'application/pdf' }));
        fireEvent.submit(screen.getByPlaceholderText('e.g. General Journal Submission Guidelines').closest('form'));
        expect(lastVisit()).toMatchObject({ url: '/tutorial', method: 'post' });
        expect(lastVisit().data.file.name).toBe('g.pdf');
    });

    it('admin delete asks for confirmation', async () => {
        const user = userEvent.setup();
        loginAs('Admin');
        render(<TutorialIndex tutorials={tutorials} manualExists />);

        await user.click(screen.getByTitle(/Delete/));
        const buttons = screen.getAllByRole('button').filter(b => /Delete/i.test(b.textContent));
        await user.click(buttons[buttons.length - 1]);
        expect(lastVisit()).toMatchObject({ url: '/tutorial/t1', method: 'delete' });
    });
});

// ---------------------------------------------------------------- Error monitoring

describe('Error monitoring page', () => {
    const log = { id: 'e1', message: 'SQLSTATE timeout', exception_class: 'PDOException', file: '/app/x.php', line: 10, status: 'New', url: '/monitoring', method: 'GET', stack_trace: '#0 trace', created_at: '2026-09-24T03:00:00Z', user: { name: 'Budi' } };
    const renderLogs = () => {
        loginAs('Admin');
        return render(<ErrorMonitoringIndex logs={paginate([log])} filters={{}} stats={{ total: 1, new: 1, resolved: 0, ignored: 0 }} />);
    };

    it('lists logs and resolves one', async () => {
        const user = userEvent.setup();
        renderLogs();

        expect(screen.getByText('SQLSTATE timeout')).toBeInTheDocument();
        await user.click(screen.getByTitle('Mark as Resolved'));
        expect(lastVisit()).toMatchObject({ url: '/error-monitoring/e1/status', method: 'patch', data: { status: 'Resolved' } });
    });

    it('stack trace detail: copy works without the Clipboard API (plain HTTP intranet)', async () => {
        const user = userEvent.setup();
        const originalClipboard = Object.getOwnPropertyDescriptor(navigator, 'clipboard');
        Object.defineProperty(navigator, 'clipboard', { value: undefined, configurable: true });
        document.execCommand = vi.fn(() => true);
        const success = vi.spyOn(toast, 'success');
        try {
            renderLogs();
            await user.click(screen.getByTitle('View Stack Trace'));
            await user.click(screen.getByRole('button', { name: /Copy/ }));

            expect(document.execCommand).toHaveBeenCalledWith('copy');
            expect(success).toHaveBeenCalledWith('Stack trace copied to clipboard');
        } finally {
            if (originalClipboard) Object.defineProperty(navigator, 'clipboard', originalClipboard);
        }
    });

    it('stack trace detail: uses the Clipboard API when available', async () => {
        const user = userEvent.setup();
        const writeText = vi.fn(() => Promise.resolve());
        Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
        renderLogs();

        await user.click(screen.getByTitle('View Stack Trace'));
        await user.click(screen.getByRole('button', { name: /Copy/ }));
        expect(writeText).toHaveBeenCalledWith('#0 trace');
    });

    it('can ignore and delete from the detail view', async () => {
        const user = userEvent.setup();
        renderLogs();

        await user.click(screen.getByTitle('View Stack Trace'));
        await user.click(screen.getByRole('button', { name: /Ignore/ }));
        expect(lastVisit()).toMatchObject({ url: '/error-monitoring/e1/status', data: { status: 'Ignored' } });

        await user.click(screen.getByRole('button', { name: /Delete/ }));
        expect(lastVisit()).toMatchObject({ url: '/error-monitoring/e1', method: 'delete' });
    });
});

// ---------------------------------------------------------------- Tracking (legacy page, route now redirects to Monitoring)

describe('Tracking page (legacy)', () => {
    it('still renders without crashing', () => {
        loginAs('Staff');
        render(<TrackingIndex journals={paginate([journal()])} filters={{}} users={[users.Staff]} />);
        expect(screen.getByText('JOT 1001')).toBeInTheDocument();
    });
});
