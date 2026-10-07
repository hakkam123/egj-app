import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import toast from 'react-hot-toast';
import Create from '@/Pages/GeneralJournal/Create';
import Edit from '@/Pages/GeneralJournal/Edit';
import { journal, lastVisit, loginAs, visits } from './helpers';

const pdf = (name = 'gj.pdf') => new File(['%PDF-1.4'], name, { type: 'application/pdf' });
const fileInputs = () => document.querySelectorAll('input[type="file"]');

describe('Create journal page', () => {
    beforeEach(() => loginAs('Staff'));

    it('shows the JOT prefix live while typing (and strips a pasted prefix)', async () => {
        const user = userEvent.setup();
        render(<Create />);
        const docInput = screen.getByPlaceholderText(/e\.g\. 12345/);

        await user.type(docInput, '555');
        expect(screen.getByText('JOT 555')).toBeInTheDocument();

        await user.clear(docInput);
        await user.paste('jot-777');
        expect(docInput).toHaveValue('777');
        expect(screen.getByText('JOT 777')).toBeInTheDocument();
    });

    it('validates required fields before sending anything', async () => {
        const user = userEvent.setup();
        const error = vi.spyOn(toast, 'error');
        render(<Create />);

        await user.click(screen.getByRole('button', { name: 'Submit for Approval' }));

        expect(screen.getByText('Please correct the following required fields:')).toBeInTheDocument();
        expect(screen.getAllByText('Document Number is required.').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Reference is required.').length).toBeGreaterThan(0);
        expect(screen.getAllByText('General Journal PDF document is required to submit for approval.').length).toBeGreaterThan(0);
        expect(error).toHaveBeenCalledWith('Document Number is required.');
        expect(visits()).toHaveLength(0);
    });

    it('a draft can be saved without a PDF', async () => {
        const user = userEvent.setup();
        render(<Create />);

        await user.type(screen.getByPlaceholderText(/e\.g\. 12345/), '100');
        await user.type(screen.getByPlaceholderText(/Provide transaction details/), 'Payroll accrual');
        await user.click(screen.getByRole('button', { name: /Save as Draft/ }));

        expect(lastVisit()).toMatchObject({ url: '/general-journals', method: 'post' });
        expect(lastVisit().data).toMatchObject({ action: 'draft', document_number: 'JOT 100', reference: 'Payroll accrual', general_journal_file: null });
        expect(lastVisit().options.forceFormData).toBe(true);
    });

    it('submits with the PDF and supporting documents', async () => {
        const user = userEvent.setup();
        render(<Create />);

        await user.type(screen.getByPlaceholderText(/e\.g\. 12345/), '200');
        fireEvent.change(screen.getByDisplayValue(new Date().toISOString().split('T')[0]), { target: { value: '2026-09-24' } });
        await user.type(screen.getByPlaceholderText(/Provide transaction details/), 'Rent');
        await user.upload(fileInputs()[0], pdf());
        await user.upload(fileInputs()[1], [new File(['x'], 'invoice.png', { type: 'image/png' }), new File(['y'], 'calc.xlsx')]);

        expect(screen.getByText('gj.pdf')).toBeInTheDocument();
        expect(screen.getByTitle('PDF Preview')).toHaveAttribute('src', 'blob:preview');
        expect(screen.getByText('2 file(s)')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Submit for Approval' }));

        const { data } = lastVisit();
        expect(data.action).toBe('submit');
        expect(data.journal_date).toBe('2026-09-24');
        expect(data.general_journal_file.name).toBe('gj.pdf');
        expect(data.supporting_documents.map(f => f.name)).toEqual(['invoice.png', 'calc.xlsx']);
    });

    it('removing files updates what will be sent', async () => {
        const user = userEvent.setup();
        render(<Create />);

        await user.upload(fileInputs()[0], pdf());
        await user.click(screen.getByTitle('Remove PDF'));
        expect(screen.getByText('Click to upload General Journal PDF')).toBeInTheDocument();

        await user.upload(fileInputs()[1], [new File(['a'], 'a.pdf'), new File(['b'], 'b.pdf')]);
        const removeButtons = screen.getByText('a.pdf').closest('div.flex.items-center.justify-between').querySelectorAll('button');
        await user.click(removeButtons[0]);
        expect(screen.queryByText('a.pdf')).not.toBeInTheDocument();
        expect(screen.getByText('1 file(s)')).toBeInTheDocument();
    });

    it('explains which stamp uses the journal date for Section Heads', () => {
        loginAs('Section Head');
        render(<Create />);
        expect(screen.getByText(/Accounting & Superior stamp/)).toBeInTheDocument();
    });

    it('shows the first server validation error as a toast', async () => {
        const user = userEvent.setup();
        const error = vi.spyOn(toast, 'error');
        render(<Create />);

        await user.type(screen.getByPlaceholderText(/e\.g\. 12345/), '100');
        await user.type(screen.getByPlaceholderText(/Provide transaction details/), 'x');
        await user.click(screen.getByRole('button', { name: /Save as Draft/ }));
        lastVisit().options.onError({ document_number: 'This Document Number has already been used.' });

        expect(error).toHaveBeenCalledWith('This Document Number has already been used.');
    });
});

describe('Edit journal page', () => {
    beforeEach(() => loginAs('Staff'));

    const draft = (overrides = {}) => journal({ status: 'Draft', ...overrides });

    it('prefills the form from the draft', () => {
        render(<Edit journal={draft()} />);

        expect(screen.getByDisplayValue('1001')).toBeInTheDocument();
        expect(screen.getByDisplayValue('2026-09-24')).toBeInTheDocument();
        expect(screen.getByDisplayValue('Accrual September')).toBeInTheDocument();
        expect(screen.getByText('journal.pdf')).toBeInTheDocument();
        expect(screen.getByText('Current Active File')).toBeInTheDocument();
    });

    it('regression: a validation error no longer crashes the page (missing AlertCircle import)', async () => {
        const user = userEvent.setup();
        render(<Edit journal={draft()} />);

        await user.clear(screen.getByDisplayValue('Accrual September'));
        await user.click(screen.getByRole('button', { name: /Save Draft Changes/ }));

        expect(screen.getAllByText('Reference is required.').length).toBeGreaterThan(0);
        expect(visits()).toHaveLength(0);
    });

    it('saves draft changes', async () => {
        const user = userEvent.setup();
        render(<Edit journal={draft()} />);

        // Typing a pasted prefix is normalised to a single "JOT "
        fireEvent.change(screen.getByDisplayValue('1001'), { target: { value: 'JOT 2002' } });
        expect(screen.getByDisplayValue('2002')).toBeInTheDocument();
        await user.click(screen.getByRole('button', { name: /Save Draft Changes/ }));

        expect(lastVisit()).toMatchObject({ url: '/general-journals/j1/update', method: 'post' });
        expect(lastVisit().data.document_number).toBe('JOT 2002');
    });

    it('regression: "Submit for Approval" saves the form first, then submits', async () => {
        const user = userEvent.setup();
        render(<Edit journal={draft({ active_files: [] })} />);

        // Draft has no PDF yet; user attaches one on this page
        await user.upload(fileInputs()[0], pdf('new.pdf'));
        await user.click(screen.getByRole('button', { name: 'Submit for Approval' }));

        const save = lastVisit();
        expect(save).toMatchObject({ url: '/general-journals/j1/update', method: 'post' });
        expect(save.data.general_journal_file.name).toBe('new.pdf');
        expect(visits().some(v => v.url.endsWith('/submit'))).toBe(false);

        // When the save succeeds the submit request follows
        save.options.onSuccess({});
        expect(lastVisit()).toMatchObject({ url: '/general-journals/j1/submit', method: 'post' });
    });

    it('does not submit when saving fails', async () => {
        const user = userEvent.setup();
        render(<Edit journal={draft()} />);

        await user.click(screen.getByRole('button', { name: 'Submit for Approval' }));
        lastVisit().options.onError({ document_number: 'This Document Number has already been used.' });

        expect(visits().filter(v => v.url.endsWith('/submit'))).toHaveLength(0);
    });

    it('requires a PDF before submitting a draft', async () => {
        const user = userEvent.setup();
        render(<Edit journal={draft({ active_files: [] })} />);

        await user.click(screen.getByRole('button', { name: 'Submit for Approval' }));

        expect(screen.getAllByText('General Journal PDF document is required before submitting for approval.').length).toBeGreaterThan(0);
        expect(visits()).toHaveLength(0);
    });

    describe('revised document', () => {
        const revised = () => journal({
            status: 'Revised',
            histories: [{ id: 'h1', action: 'revise', notes: 'Attach the signed invoice' }],
        });

        it('shows the approver notes and locks number/date', () => {
            render(<Edit journal={revised()} />);

            expect(screen.getByText('Attach the signed invoice')).toBeInTheDocument();
            expect(screen.getByDisplayValue('1001')).toBeDisabled();
            expect(screen.getByDisplayValue('2026-09-24')).toBeDisabled();
        });

        it('resubmits with replacement files after confirmation', async () => {
            const user = userEvent.setup();
            render(<Edit journal={revised()} />);

            await user.upload(fileInputs()[0], pdf('fixed.pdf'));
            await user.click(screen.getByRole('button', { name: 'Resubmit for Approval' }));
            await user.click(screen.getByRole('button', { name: 'Yes, Resubmit' }));

            expect(lastVisit()).toMatchObject({ url: '/general-journals/j1/resubmit', method: 'post' });
            expect(lastVisit().data.general_journal_file.name).toBe('fixed.pdf');
        });

        it('self-reject sends notes as data (not mixed into the options)', async () => {
            const user = userEvent.setup();
            render(<Edit journal={revised()} />);

            await user.click(screen.getByRole('button', { name: 'Reject' }));
            await user.click(screen.getByRole('button', { name: 'Yes, Reject Permanently' }));

            expect(lastVisit()).toMatchObject({ url: '/general-journals/j1/self-reject', method: 'post' });
            expect(lastVisit().data).toEqual({ notes: 'Document rejected and closed by requester.' });
        });
    });
});
