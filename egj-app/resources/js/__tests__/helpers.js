import { router } from '@inertiajs/core';

const users = {
    Staff: { id: 'u-staff', name: 'Budi Staff', email: 'budi@example.com', role: 'Staff', pending_count: 0 },
    'Section Head': { id: 'u-sh', name: 'Ahmad Section', email: 'ahmad@example.com', role: 'Section Head', pending_count: 2 },
    'Dept/Div Head': { id: 'u-dh', name: 'Alisa Dept', email: 'alisa@example.com', role: 'Dept/Div Head', pending_count: 1 },
    Admin: { id: 'u-admin', name: 'Admin JAGO', email: 'admin@example.com', role: 'Admin', pending_count: 0 },
};

let page = { props: {}, url: '/dashboard', component: 'Test' };

export function setPageProps(props) {
    page = { ...page, props: { auth: { user: null }, flash: {}, errors: {}, ...props } };
}

export function currentPage() {
    return page;
}

/** Sets the logged-in user for MainLayout / usePage() by role name. */
export function loginAs(role, extraProps = {}) {
    setPageProps({ auth: { user: users[role] }, ...extraProps });
    return users[role];
}

/** All router.visit calls as { url, method, data, options }. */
export function visits() {
    return router.visit.mock.calls.map(([url, options = {}]) => ({
        url: typeof url === 'string' ? url : url?.toString(),
        method: options.method ?? 'get',
        data: options.data,
        options,
    }));
}

export function lastVisit() {
    const all = visits();
    return all[all.length - 1];
}

/** Paginator shape returned by Laravel's ->paginate(). */
export function paginate(data, overrides = {}) {
    return {
        data,
        current_page: 1,
        last_page: 1,
        per_page: 10,
        total: data.length,
        from: data.length ? 1 : null,
        to: data.length || null,
        links: [
            { url: null, label: '&laquo; Previous', active: false },
            { url: '/x?page=1', label: '1', active: true },
            { url: null, label: 'Next &raquo;', active: false },
        ],
        ...overrides,
    };
}

export function journal(overrides = {}) {
    return {
        id: 'j1',
        document_number: 'JOT 1001',
        journal_date: '2026-09-24T00:00:00.000000Z',
        reference: 'Accrual September',
        status: 'Waiting Approval',
        requested_by: users.Staff.id,
        current_assign_to: users['Section Head'].id,
        resubmit_count: 0,
        submitted_at: '2026-09-24T03:00:00.000000Z',
        last_updated_at: '2026-09-24T03:00:00.000000Z',
        created_at: '2026-09-24T03:00:00.000000Z',
        requester: users.Staff,
        assignee: users['Section Head'],
        active_files: [
            { id: 'f1', category: 'general_journal', file_name: 'journal.pdf', file_size: 20480, mime_type: 'application/pdf' },
        ],
        approvals: [],
        histories: [],
        ...overrides,
    };
}

export function mockFetchJson(body, { ok = true, status = 200 } = {}) {
    globalThis.fetch.mockImplementation(() => Promise.resolve({ ok, status, json: () => Promise.resolve(body) }));
}

export { users };
