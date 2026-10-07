import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ConfirmModal from '@/Components/ConfirmModal';
import PageHeader from '@/Components/PageHeader';
import FileModal from '@/Components/FileModal';
import HistoryModal from '@/Components/HistoryModal';
import { mockFetchJson } from './helpers';

describe('ConfirmModal', () => {
    it('renders nothing when closed', () => {
        const { container } = render(<ConfirmModal open={false} />);
        expect(container).toBeEmptyDOMElement();
    });

    it('supports both open/isOpen and onClose/onCancel prop names', async () => {
        const user = userEvent.setup();
        const onCancel = vi.fn();
        render(<ConfirmModal isOpen title="Delete?" message="Really?" onCancel={onCancel} />);

        expect(screen.getByText('Delete?')).toBeInTheDocument();
        expect(screen.getByText('Really?')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Cancel' }));
        expect(onCancel).toHaveBeenCalledTimes(1);
    });

    it('calls onConfirm and closes on backdrop click but not on dialog click', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        const onClose = vi.fn();
        render(<ConfirmModal open confirmText="Yes, Delete" onConfirm={onConfirm} onClose={onClose} />);

        await user.click(screen.getByRole('button', { name: 'Yes, Delete' }));
        expect(onConfirm).toHaveBeenCalledTimes(1);

        await user.click(screen.getByText('Are you sure you want to proceed?'));
        expect(onClose).not.toHaveBeenCalled();

        fireEvent.click(document.querySelector('.fixed.inset-0'));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    it('is not confirmable twice while loading', async () => {
        const user = userEvent.setup();
        const onConfirm = vi.fn();
        render(<ConfirmModal open loading onConfirm={onConfirm} />);

        expect(screen.getByText('Processing...')).toBeInTheDocument();
        const buttons = screen.getAllByRole('button');
        buttons.forEach(b => expect(b).toBeDisabled());
        await user.click(screen.getByText('Processing...'));
        expect(onConfirm).not.toHaveBeenCalled();
    });
});

describe('PageHeader', () => {
    it('renders title, optional subtitle and actions', () => {
        const { rerender } = render(<PageHeader title="Users" />);
        expect(screen.getByRole('heading', { name: 'Users' })).toBeInTheDocument();
        expect(screen.queryByRole('button')).not.toBeInTheDocument();

        rerender(<PageHeader title="Users" subtitle="Manage" actions={<button>Add</button>} />);
        expect(screen.getByText('Manage')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });
});

describe('FileModal', () => {
    it('loads files from the JSON endpoint (not an Inertia request) and groups them', async () => {
        mockFetchJson({
            journal: {
                active_files: [
                    { id: 'g1', category: 'general_journal', file_name: 'gj.pdf', file_size: 2048 },
                    { id: 's1', category: 'supporting_document', file_name: 'invoice.png', file_size: 1024 },
                ],
            },
        });
        render(<FileModal open journalId="j9" onClose={() => {}} />);

        expect(await screen.findByText('gj.pdf')).toBeInTheDocument();
        expect(screen.getByText('invoice.png')).toBeInTheDocument();
        expect(screen.getByText('General Journal')).toBeInTheDocument();
        expect(screen.getByText('Supporting Documents')).toBeInTheDocument();
        expect(screen.getByText('2.0 KB')).toBeInTheDocument();

        const [url, init] = fetch.mock.calls[0];
        expect(url).toBe('/tracking/j9');
        expect(init.headers).not.toHaveProperty('X-Inertia');

        const links = screen.getAllByRole('link');
        expect(links.map(a => a.getAttribute('href'))).toEqual([
            '/files/g1/preview?v=2048', '/files/g1/download', '/files/s1/preview?v=1024', '/files/s1/download',
        ]);
    });

    it('shows "No files attached." when the request fails (e.g. 409/403)', async () => {
        fetch.mockImplementation(() => Promise.resolve({ ok: false, status: 409, json: () => Promise.reject(new Error('no body')) }));
        render(<FileModal open journalId="j9" onClose={() => {}} />);

        expect(await screen.findByText('No files attached.')).toBeInTheDocument();
    });

    it('does not fetch while closed and closes via the X button', async () => {
        const user = userEvent.setup();
        const onClose = vi.fn();
        const { rerender } = render(<FileModal open={false} journalId="j9" onClose={onClose} />);
        expect(fetch).not.toHaveBeenCalled();

        mockFetchJson({ journal: { active_files: [] } });
        rerender(<FileModal open journalId="j9" onClose={onClose} />);
        await screen.findByText('No files attached.');
        await user.click(screen.getByRole('button'));
        expect(onClose).toHaveBeenCalled();
    });
});

describe('HistoryModal', () => {
    it('renders the timeline with English labels', async () => {
        mockFetchJson({
            journal: {
                document_number: 'JOT 77',
                histories: [
                    { id: 'h1', action: 'submit', actor: { name: 'Budi' }, target_level: 'superior', created_at: '2026-09-24T03:00:00Z', notes: 'Initial submission' },
                    { id: 'h2', action: 'revise', actor: { name: 'Ahmad' }, target_level: 'superior', created_at: '2026-09-25T03:00:00Z', notes: 'Wrong amount' },
                    { id: 'h3', action: 'approve', actor: { name: 'Alisa' }, target_level: 'superior_of_superior', created_at: '2026-09-26T03:00:00Z' },
                ],
            },
        });
        render(<HistoryModal open journalId="j1" onClose={() => {}} />);

        expect(await screen.findByText('Doc No: JOT 77')).toBeInTheDocument();
        expect(screen.getByText('Submitted')).toBeInTheDocument();
        expect(screen.getByText('Revision Requested')).toBeInTheDocument();
        expect(screen.getByText('Approved')).toBeInTheDocument();
        expect(screen.getByText('Target: Superior of Superior')).toBeInTheDocument();
        expect(screen.getByText(/Wrong amount/)).toBeInTheDocument();
        expect(fetch.mock.calls[0][0]).toBe('/tracking/j1');
    });

    it('shows the empty state', async () => {
        mockFetchJson({ journal: { document_number: 'JOT 1', histories: [] } });
        render(<HistoryModal open journalId="j1" onClose={() => {}} />);

        expect(await screen.findByText('No activity history recorded yet.')).toBeInTheDocument();
    });

    it('stops loading if the request fails', async () => {
        fetch.mockImplementation(() => Promise.reject(new Error('offline')));
        render(<HistoryModal open journalId="j1" onClose={() => {}} />);

        await waitFor(() => expect(screen.getByText('No activity history recorded yet.')).toBeInTheDocument());
    });
});
