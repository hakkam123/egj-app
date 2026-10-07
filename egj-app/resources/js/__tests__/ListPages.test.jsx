import { render, screen, fireEvent, act, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Drafts from '@/Pages/GeneralJournal/Drafts';
import MonitoringIndex from '@/Pages/Monitoring/Index';
import ApprovalIndex from '@/Pages/Approval/Index';
import { journal, lastVisit, loginAs, paginate, visits, mockFetchJson } from './helpers';

const gets = (url) => visits().filter(v => v.method === 'get' && v.url === url);

/** Fake timers only around debounce checks, so userEvent elsewhere keeps working. */
async function withFakeTimers(fn) {
    vi.useFakeTimers();
    try {
        await fn();
    } finally {
        vi.useRealTimers();
    }
}

// ---------------------------------------------------------------- Drafts

describe('Drafts page', () => {
    const ready = journal({ id: 'd1', document_number: 'JOT 1', status: 'Draft' });
    const noPdf = journal({ id: 'd2', document_number: 'JOT 2', status: 'Draft', active_files: [] });
    const withSupport = journal({
        id: 'd3', document_number: 'JOT 3', status: 'Draft',
        active_files: [
            { id: 'f3', category: 'general_journal', file_name: 'gj3.pdf', file_size: 1 },
            { id: 'f4', category: 'supporting_document', file_name: 's.png', file_size: 1 },
            { id: 'f5', category: 'supporting_document', file_name: 't.png', file_size: 1 },
        ],
    });

    const renderDrafts = (list = [ready, noPdf, withSupport], props = {}) => {
        loginAs('Staff');
        return render(<Drafts drafts={paginate(list)} filters={{}} stats={{ total_drafts: list.length }} {...props} />);
    };
    const rowOf = (docNo) => screen.getByText(docNo).closest('tr');

    it('lists drafts with row numbers, file badges and missing-PDF warning', () => {
        renderDrafts();

        expect(within(rowOf('JOT 1')).getByText('1')).toBeInTheDocument();
        expect(within(rowOf('JOT 2')).getByText('Missing PDF')).toBeInTheDocument();
        expect(within(rowOf('JOT 3')).getByText('2 files')).toBeInTheDocument();
        expect(screen.getByText('JOT 1').closest('a')).toHaveAttribute('href', '/general-journals/d1/edit');
    });

    it('row numbers continue across pages', () => {
        loginAs('Staff');
        render(<Drafts drafts={paginate([ready], { current_page: 3, per_page: 10 })} filters={{}} stats={{}} />);
        expect(within(rowOf('JOT 1')).getByText('21')).toBeInTheDocument();
    });

    it('shows the empty state', () => {
        renderDrafts([]);
        expect(screen.getByText('No Drafts Found')).toBeInTheDocument();
        expect(screen.getByText('You do not have any saved draft documents at the moment.')).toBeInTheDocument();
    });

    it('submitting an incomplete draft explains what is missing instead of sending it', async () => {
        const user = userEvent.setup();
        renderDrafts();

        await user.click(within(rowOf('JOT 2')).getByRole('button', { name: 'Submit' }));

        expect(screen.getByText('Cannot Submit Incomplete Draft')).toBeInTheDocument();
        expect(screen.getByText('General Journal PDF document is missing')).toBeInTheDocument();
        expect(screen.getByText(/Edit Draft & Complete/).closest('a')).toHaveAttribute('href', '/general-journals/d2/edit');
        expect(visits()).toHaveLength(0);
    });

    it('submits a single complete draft after confirmation', async () => {
        const user = userEvent.setup();
        renderDrafts();

        await user.click(within(rowOf('JOT 1')).getByRole('button', { name: 'Submit' }));
        expect(screen.getByText(/submit draft document "JOT 1"/)).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Yes, Submit' }));

        expect(lastVisit()).toMatchObject({ url: '/general-journals/d1/submit', method: 'post' });
    });

    it('select all + bulk submit sends only the ready drafts', async () => {
        const user = userEvent.setup();
        renderDrafts();

        await user.click(screen.getByTitle('Select All'));
        expect(screen.getByText('3 draft documents selected')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Submit Selected (3)' }));
        expect(screen.getByText('Bulk Submit Drafts (3 Selected)')).toBeInTheDocument();
        expect(screen.getByText('Missing PDF Document')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Submit 2 Ready Drafts' }));
        expect(lastVisit()).toMatchObject({ url: '/general-journals/bulk-submit', method: 'post', data: { ids: ['d1', 'd3'] } });
    });

    it('bulk submit with nothing ready only offers Close', async () => {
        const user = userEvent.setup();
        renderDrafts([noPdf]);

        await user.click(within(rowOf('JOT 2')).getAllByRole('button')[0]);
        await user.click(screen.getByRole('button', { name: 'Submit Selected (1)' }));

        expect(screen.getByText(/None of the selected drafts are ready/)).toBeInTheDocument();
        expect(screen.queryByRole('button', { name: /Ready Drafts/ })).not.toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Close' }));
        expect(visits()).toHaveLength(0);
    });

    it('deselect clears the selection', async () => {
        const user = userEvent.setup();
        renderDrafts();

        await user.click(within(rowOf('JOT 1')).getAllByRole('button')[0]);
        expect(screen.getByText('1 draft document selected')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: 'Deselect' }));
        expect(screen.queryByText(/selected/)).not.toBeInTheDocument();
    });

    it('deletes a draft after confirmation', async () => {
        const user = userEvent.setup();
        renderDrafts();

        await user.click(within(rowOf('JOT 1')).getByTitle('Delete Draft'));
        await user.click(screen.getByRole('button', { name: 'Yes, Delete Draft' }));

        expect(lastVisit()).toMatchObject({ url: '/general-journals/d1', method: 'delete' });
    });

    it('opens the file modal for a draft', async () => {
        const user = userEvent.setup();
        mockFetchJson({ journal: { active_files: [{ id: 'f1', category: 'general_journal', file_name: 'journal.pdf', file_size: 10 }] } });
        renderDrafts();

        await user.click(within(rowOf('JOT 1')).getByTitle('GJ: journal.pdf'));
        expect(await screen.findByRole('heading', { name: 'Attached Files' })).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith('/tracking/d1', expect.anything());
    });

    it('text filters are debounced and the date filter is sent exactly once', async () => {
        await withFakeTimers(async () => {
            renderDrafts();

            fireEvent.change(screen.getByPlaceholderText('Search Doc...'), { target: { value: 'JOT 1' } });
            fireEvent.change(screen.getByPlaceholderText('Search Reference...'), { target: { value: 'rent' } });
            expect(gets('/drafts')).toHaveLength(0);
            await act(async () => { vi.advanceTimersByTime(400); });
            expect(gets('/drafts')).toHaveLength(1);
            expect(lastVisit().data).toEqual({ doc_number: 'JOT 1', reference: 'rent' });

            // Regression: the date used to trigger an immediate AND a debounced request
            fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-09-24' } });
            await act(async () => { vi.advanceTimersByTime(1000); });
            expect(gets('/drafts')).toHaveLength(2);
            expect(lastVisit().data).toMatchObject({ date: '2026-09-24' });
        });
    });

    it('clear filters resets the query', async () => {
        const user = userEvent.setup();
        loginAs('Staff');
        render(<Drafts drafts={paginate([])} filters={{ doc_number: 'X' }} stats={{}} />);

        expect(screen.getByText('No draft documents match your filter criteria.')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Clear Filters/ }));
        expect(lastVisit()).toMatchObject({ url: '/drafts', method: 'get', data: {} });
    });
});

// ---------------------------------------------------------------- Monitoring

describe('Monitoring page', () => {
    const rows = [
        journal({ id: 'm1', document_number: 'JOT 11', status: 'Waiting Approval' }),
        journal({ id: 'm2', document_number: 'JOT 12', status: 'Draft', assignee: null }),
        journal({ id: 'm3', document_number: 'JOT 13', status: 'Mystery' }),
    ];
    const renderMonitoring = (filters = {}, list = rows) => {
        loginAs('Staff');
        return render(<MonitoringIndex journals={paginate(list)} filters={filters} users={[]} stats={{}} />);
    };

    it('renders rows with status badges, assignee and links', () => {
        renderMonitoring();

        const row = screen.getByText('JOT 11').closest('tr');
        expect(within(row).getByText('1')).toBeInTheDocument();
        expect(within(row).getByText('Waiting Approval')).toBeInTheDocument();
        expect(within(row).getByText('Ahmad Section')).toBeInTheDocument();
        expect(within(row).getByText('Budi Staff')).toBeInTheDocument();
        expect(screen.getByText('JOT 11').closest('a')).toHaveAttribute('href', '/general-journals/m1');

        expect(within(screen.getByText('JOT 12').closest('tr')).getByText('Draft')).toBeInTheDocument();
        // Unknown status falls back to the neutral badge without crashing
        expect(within(screen.getByText('JOT 13').closest('tr')).getByText('Neutral')).toBeInTheDocument();
    });

    it('shows the empty state', () => {
        renderMonitoring({}, []);
        expect(screen.getByText('No Documents Found')).toBeInTheDocument();
    });

    it('in-column filters are debounced into one request', async () => {
        await withFakeTimers(async () => {
            renderMonitoring();

            fireEvent.change(screen.getByPlaceholderText('Search Doc...'), { target: { value: '11' } });
            fireEvent.change(screen.getByPlaceholderText('Search Assignee...'), { target: { value: 'Ahmad' } });
            fireEvent.change(screen.getByPlaceholderText('Search Person Request...'), { target: { value: 'Budi' } });
            await act(async () => { vi.advanceTimersByTime(400); });

            expect(gets('/monitoring')).toHaveLength(1);
            expect(lastVisit().data).toEqual({ doc_number: '11', assign_to: 'Ahmad', requester: 'Budi', per_page: 10 });
        });
    });

    it('status filter and page size apply immediately', async () => {
        const user = userEvent.setup();
        renderMonitoring();

        await user.selectOptions(screen.getByDisplayValue('All Statuses'), 'Revised');
        expect(lastVisit().data).toMatchObject({ status: 'Revised' });

        await user.selectOptions(screen.getByDisplayValue('10'), '50');
        expect(lastVisit().data).toMatchObject({ per_page: '50', status: 'Revised' });
    });

    it('regression: Excel export includes the Reference filter', () => {
        renderMonitoring({ reference: 'Payroll', status: 'Approved', doc_number: 'JOT' });

        const href = screen.getByText('Export to Excel').getAttribute('href');
        const params = new URL(href, 'http://x').searchParams;
        expect(href.startsWith('/monitoring/export?')).toBe(true);
        expect(params.get('reference')).toBe('Payroll');
        expect(params.get('status')).toBe('Approved');
        expect(params.get('doc_number')).toBe('JOT');
    });

    it('regression: the in-row Reset link also appears when only Reference is filtered', async () => {
        const user = userEvent.setup();
        renderMonitoring({ reference: 'Payroll' });

        await user.click(screen.getByRole('button', { name: 'Reset' }));
        expect(lastVisit()).toMatchObject({ url: '/monitoring', data: {} });
        expect(screen.getByPlaceholderText('Search Reference...')).toHaveValue('');
    });

    it('opens the audit timeline modal', async () => {
        const user = userEvent.setup();
        mockFetchJson({ journal: { document_number: 'JOT 11', histories: [] } });
        renderMonitoring();

        await user.click(within(screen.getByText('JOT 11').closest('tr')).getByTitle('View Audit Timeline'));
        expect(await screen.findByText('Document Timeline')).toBeInTheDocument();
        expect(fetch).toHaveBeenCalledWith('/tracking/m1', expect.anything());
    });
});

// ---------------------------------------------------------------- Approval queue

describe('Approval queue page', () => {
    const renderQueue = (filters = {}, list = [journal({ id: 'a1', document_number: 'JOT 21' })]) => {
        loginAs('Section Head');
        return render(<ApprovalIndex journals={paginate(list)} filters={filters} />);
    };

    it('links each document to its review page', () => {
        renderQueue();
        expect(screen.getByText('JOT 21').closest('a')).toHaveAttribute('href', '/approval/a1');
        expect(screen.getByTitle('Review Document')).toHaveAttribute('href', '/approval/a1');
    });

    it('empty state differs with and without filters', () => {
        const { unmount } = renderQueue({}, []);
        expect(screen.getByText('There are no General Journals currently pending your approval.')).toBeInTheDocument();
        unmount();

        renderQueue({ doc_number: 'zzz' }, []);
        expect(screen.getByText('No documents match your filter criteria.')).toBeInTheDocument();
    });

    it('date filter is sent exactly once; text filters are debounced', async () => {
        await withFakeTimers(async () => {
            renderQueue();

            fireEvent.change(document.querySelector('input[type="date"]'), { target: { value: '2026-09-24' } });
            await act(async () => { vi.advanceTimersByTime(1000); });
            expect(gets('/approval')).toHaveLength(1);

            fireEvent.change(screen.getByPlaceholderText('Search Person Request...'), { target: { value: 'Budi' } });
            await act(async () => { vi.advanceTimersByTime(400); });
            expect(gets('/approval')).toHaveLength(2);
            expect(lastVisit().data).toMatchObject({ date: '2026-09-24', requester: 'Budi', per_page: 10 });
        });
    });

    it('reset clears every filter', async () => {
        const user = userEvent.setup();
        renderQueue({ reference: 'abc', status: 'Waiting Approval' });

        await user.click(screen.getByRole('button', { name: /Clear Filters/ }));
        expect(lastVisit()).toMatchObject({ url: '/approval', data: {} });
    });
});
