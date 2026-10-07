import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Confirm from '@/Pages/EmailApproval/Confirm';
import Reject from '@/Pages/EmailApproval/Reject';
import Success from '@/Pages/EmailApproval/Success';
import EmailInvalid from '@/Pages/EmailApproval/Invalid';
import PreviewShow from '@/Pages/Preview/Show';
import PreviewInvalid from '@/Pages/Preview/Invalid';
import { journal, lastVisit, visits } from './helpers';

describe('Email approval (no login)', () => {
    it('confirm page posts the approval once', async () => {
        const user = userEvent.setup();
        render(<Confirm journal={journal()} token="tok-1" />);

        expect(screen.getByText('JOT 1001')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Approve/ }));

        expect(lastVisit()).toMatchObject({ url: '/approve-email/tok-1', method: 'post' });
    });

    it('confirm page switches to the success view and closes the tab', async () => {
        vi.useFakeTimers();
        const close = vi.spyOn(window, 'close').mockImplementation(() => {});
        try {
            render(<Confirm journal={journal()} token="tok-1" />);
            act(() => { screen.getByRole('button', { name: /Approve/ }).click(); });
            await act(async () => { lastVisit().options.onSuccess({ props: {} }); });

            expect(screen.getByText('Document Approved Successfully')).toBeInTheDocument();
            await act(async () => { vi.advanceTimersByTime(2500); });
            expect(close).toHaveBeenCalled();
        } finally {
            vi.useRealTimers();
        }
    });

    it('revise page requires 5 real characters (spaces do not count)', async () => {
        const user = userEvent.setup();
        render(<Reject journal={journal()} token="tok-2" />);
        const textarea = screen.getByPlaceholderText(/Provide detailed feedback/);
        const send = screen.getByRole('button', { name: /Revision/ });

        await user.type(textarea, '  ab   ');
        expect(screen.getByText('2 / 5 minimum characters')).toBeInTheDocument();
        expect(send).toBeDisabled();

        await user.type(textarea, 'cdefg');
        expect(send).toBeEnabled();
        await user.click(send);
        expect(lastVisit()).toMatchObject({ url: '/revise-email/tok-2', method: 'post' });
        // Sent as typed; the server trims it
        expect(lastVisit().data.notes).toBe('  ab   cdefg');
    });

    it('revise page shows server validation errors', async () => {
        const user = userEvent.setup();
        render(<Reject journal={journal()} token="tok-2" />);

        await user.type(screen.getByPlaceholderText(/Provide detailed feedback/), 'valid notes');
        await user.click(screen.getByRole('button', { name: /Revision/ }));
        await act(async () => { lastVisit().options.onError({ notes: 'Revision notes are required.' }); });

        expect(screen.getByText('Revision notes are required.')).toBeInTheDocument();
    });

    it.each([
        ['approved', 'Document Approved Successfully', null],
        ['revised', 'Revision Requested Successfully', 'Attach invoice'],
    ])('success page for %s', (action, text, notes) => {
        render(<Success journal={journal()} action={action} notes={notes} />);
        expect(screen.getByText(text)).toBeInTheDocument();
        expect(screen.getByText('General Journal JOT 1001')).toBeInTheDocument();
        if (notes) expect(screen.getByText(notes)).toBeInTheDocument();
    });

    it('invalid link page shows the server message', () => {
        render(<EmailInvalid message="This approval link has expired." />);
        expect(screen.getByText('This approval link has expired.')).toBeInTheDocument();
        expect(visits()).toHaveLength(0);
    });
});

describe('Preview link (no login)', () => {
    it('shows journal info in English with the files', () => {
        render(<PreviewShow token="p1" journal={journal({
            approvals: [{ id: 'a1', status: 'Approved', assigned_user: { name: 'Budi Staff' } }],
            active_files: [
                { id: 'f1', category: 'general_journal', file_name: 'gj.pdf', file_size: 2048 },
                { id: 's1', category: 'supporting_document', file_name: 'scan.png', file_size: 2048, mime_type: 'image/png' },
            ],
        })} />);

        expect(screen.getByText('Document Preview')).toBeInTheDocument();
        expect(screen.getByText('Journal Date')).toBeInTheDocument();
        expect(screen.getByText('Person Request')).toBeInTheDocument();
        expect(screen.getByText('Approval Status')).toBeInTheDocument();
        expect(screen.getByTitle('gj.pdf')).toHaveAttribute('src', '/files/f1/preview?v=2048');
        expect(screen.getByAltText('scan.png')).toBeInTheDocument();
        expect(document.body.textContent).not.toMatch(/Dokumen|Tanggal|Diajukan/);
    });

    it('invalid preview page', () => {
        render(<PreviewInvalid message="This preview link has expired." />);
        expect(screen.getByText('Preview Not Available')).toBeInTheDocument();
        expect(screen.getByText('This preview link has expired.')).toBeInTheDocument();
    });
});
