import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Show from '@/Pages/GeneralJournal/Show';
import ApprovalShow from '@/Pages/Approval/Show';
import { journal, lastVisit, loginAs, users, visits } from './helpers';

const approvals = (superior, final) => [
    { id: 'a0', approval_level: 'accounting', status: 'Approved', assigned_user_id: users.Staff.id, assigned_user: users.Staff, approved_at: '2026-09-24T03:00:00Z', notes: 'Approved 2026-09-24 Budi Staff' },
    { id: 'a1', approval_level: 'superior', status: superior, assigned_user_id: users['Section Head'].id, assigned_user: users['Section Head'] },
    { id: 'a2', approval_level: 'superior_of_superior', status: final, assigned_user_id: users['Dept/Div Head'].id, assigned_user: users['Dept/Div Head'] },
];
const atSectionHead = () => journal({ approvals: approvals('Pending', 'Pending') });
const atDeptHead = () => journal({ current_assign_to: users['Dept/Div Head'].id, approvals: approvals('Approved', 'Pending') });

describe.each([
    ['GeneralJournal/Show', Show, { approve: 'Approve', revise: 'Revision', confirm: 'Yes, Approve Document', send: 'Send Revision' }],
    ['Approval/Show', ApprovalShow, { approve: 'Approve Document', revise: 'Request Revision', confirm: 'Yes, Approve', send: 'Send Revision Request' }],
])('%s approver actions', (_, Page, label) => {
    it('Section Head can act while the journal waits for the Section Head', () => {
        loginAs('Section Head');
        render(<Page journal={atSectionHead()} />);
        expect(screen.getByRole('button', { name: label.approve })).toBeInTheDocument();
    });

    it('regression: Dept Head does NOT see approve/revise before the Section Head approved', () => {
        loginAs('Dept/Div Head');
        render(<Page journal={atSectionHead()} />);
        expect(screen.queryByRole('button', { name: label.approve })).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: label.revise })).not.toBeInTheDocument();
    });

    it('Dept Head can act at the final stage, Section Head no longer can', () => {
        loginAs('Dept/Div Head');
        const { unmount } = render(<Page journal={atDeptHead()} />);
        expect(screen.getByRole('button', { name: label.approve })).toBeInTheDocument();
        unmount();

        loginAs('Section Head');
        render(<Page journal={atDeptHead()} />);
        expect(screen.queryByRole('button', { name: label.approve })).not.toBeInTheDocument();
    });

    it('approve asks for confirmation, marks notifications read with the CSRF header, then posts', async () => {
        const user = userEvent.setup();
        document.cookie = 'XSRF-TOKEN=tok9; path=/';
        loginAs('Section Head');
        render(<Page journal={atSectionHead()} />);

        await user.click(screen.getByRole('button', { name: label.approve }));
        await user.click(screen.getByRole('button', { name: label.confirm }));

        expect(lastVisit()).toMatchObject({ url: '/approval/j1/approve', method: 'post' });
        const [url, init] = fetch.mock.calls.find(([u]) => u === '/notifications/mark-read-by-journal/j1');
        expect(url).toBeTruthy();
        expect(init.headers['X-XSRF-TOKEN']).toBe('tok9');
    });

    it('revision needs at least 5 non-space characters and sends trimmed notes', async () => {
        const user = userEvent.setup();
        loginAs('Section Head');
        render(<Page journal={atSectionHead()} />);

        await user.click(screen.getByRole('button', { name: label.revise }));
        const textarea = screen.getByRole('textbox');
        const send = screen.getByRole('button', { name: label.send });

        await user.type(textarea, '   ab   ');
        expect(send).toBeDisabled();

        await user.clear(textarea);
        await user.type(textarea, '  Wrong amount  ');
        expect(send).toBeEnabled();
        await user.click(send);

        expect(lastVisit()).toMatchObject({ url: '/approval/j1/revise', method: 'post', data: { notes: 'Wrong amount' } });
    });

    it('shows the approval chain with notes and the stamped PDF preview', () => {
        loginAs('Staff');
        render(<Page journal={atDeptHead()} />);

        expect(screen.getByText('Accounting')).toBeInTheDocument();
        expect(screen.getByText('Superior (Section Head)')).toBeInTheDocument();
        expect(screen.getByText('Superior of Superior (Dept/Div Head)')).toBeInTheDocument();
        expect(screen.getByText(/Approved 2026-09-24 Budi Staff/)).toBeInTheDocument();
        expect(screen.getByTitle('PDF Preview')).toHaveAttribute('src', '/files/f1/preview');
        expect(screen.getByText('Download PDF').closest('a')).toHaveAttribute('href', '/files/f1/download');
    });

    it('status pill uses real colour classes (no "undefined" class)', () => {
        loginAs('Staff');
        const { container } = render(<Page journal={atSectionHead()} />);
        expect(container.innerHTML).not.toContain('undefined');
    });
});

describe('GeneralJournal/Show requester actions', () => {
    it('draft owner can edit and submit', async () => {
        const user = userEvent.setup();
        loginAs('Staff');
        render(<Show journal={journal({ status: 'Draft', approvals: [] })} />);

        expect(screen.getByText('Edit Draft').closest('a')).toHaveAttribute('href', '/general-journals/j1/edit');
        await user.click(screen.getByRole('button', { name: /Submit Draft/ }));
        await user.click(screen.getByRole('button', { name: 'Yes, Submit Document' }));
        expect(lastVisit()).toMatchObject({ url: '/general-journals/j1/submit', method: 'post' });
    });

    it('revised document: banner, Revise link and self-reject', async () => {
        const user = userEvent.setup();
        loginAs('Staff');
        render(<Show journal={journal({ status: 'Revised', approvals: approvals('Revised', 'Pending') })} />);

        expect(screen.getByText('Revision Requested by Approver')).toBeInTheDocument();
        expect(screen.getByText('Revise').closest('a')).toHaveAttribute('href', '/general-journals/j1/edit');

        await user.click(screen.getByRole('button', { name: 'Reject' }));
        await user.click(screen.getByRole('button', { name: 'Yes, Reject Permanently' }));
        expect(lastVisit()).toMatchObject({ url: '/general-journals/j1/self-reject', method: 'post' });
    });

    it('other users do not get requester actions', () => {
        loginAs('Section Head');
        render(<Show journal={journal({ status: 'Revised', approvals: [] })} />);

        expect(screen.queryByText('Revise')).not.toBeInTheDocument();
        expect(screen.queryByRole('button', { name: 'Reject' })).not.toBeInTheDocument();
        expect(visits()).toHaveLength(0);
    });

    it('closed journals show no assignee and no actions', () => {
        loginAs('Staff');
        render(<Show journal={journal({ status: 'Approved', assignee: null, current_assign_to: null, approvals: approvals('Approved', 'Approved') })} />);

        expect(screen.getByText('None (Completed / Closed)')).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Approve|Revision|Reject|Submit/ })).not.toBeInTheDocument();
    });

    it('lists supporting documents', () => {
        loginAs('Staff');
        render(<Show journal={journal({ active_files: [
            { id: 'f1', category: 'general_journal', file_name: 'gj.pdf', file_size: 1024 },
            { id: 's1', category: 'supporting_document', file_name: 'invoice.png', file_size: 3072 },
        ] })} />);

        expect(screen.getByText('Supporting Documents (1)')).toBeInTheDocument();
        expect(screen.getByText('invoice.png')).toBeInTheDocument();
        expect(screen.getByText('3.0 KB')).toBeInTheDocument();
    });

    it('missing PDF message', () => {
        loginAs('Staff');
        render(<Show journal={journal({ active_files: [] })} />);
        expect(screen.getByText('No General Journal PDF file attached.')).toBeInTheDocument();
    });
});
