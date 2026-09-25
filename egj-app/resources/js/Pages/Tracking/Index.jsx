import { Head, Link, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import { Clock, Search, RotateCcw } from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import HistoryModal from '../../Components/HistoryModal';

export default function TrackingIndex({ journals, filters, users }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');
    const [requestedBy, setRequestedBy] = useState(filters?.requested_by || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const [historyModal, setHistoryModal] = useState({ open: false, journalId: null });
    const isInitialMount = useRef(true);

    const updateFilters = (overrides = {}) => {
        const queryParams = {
            search: searchQuery,
            status,
            date_from: dateFrom,
            date_to: dateTo,
            requested_by: requestedBy,
            per_page: perPage,
            ...overrides,
        };

        const cleaned = {};
        Object.entries(queryParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                cleaned[k] = v;
            }
        });

        router.get('/tracking', cleaned, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounce search input
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                updateFilters({ search: searchQuery });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleStatusChange = (e) => {
        const val = e.target.value;
        setStatus(val);
        updateFilters({ status: val });
    };

    const handleDateFromChange = (e) => {
        const val = e.target.value;
        setDateFrom(val);
        updateFilters({ date_from: val });
    };

    const handleDateToChange = (e) => {
        const val = e.target.value;
        setDateTo(val);
        updateFilters({ date_to: val });
    };

    const handleRequestedByChange = (e) => {
        const val = e.target.value;
        setRequestedBy(val);
        updateFilters({ requested_by: val });
    };

    const handlePerPageChange = (e) => {
        const val = e.target.value;
        setPerPage(val);
        updateFilters({ per_page: val });
    };

    const handleReset = () => {
        setSearchQuery('');
        setStatus('');
        setDateFrom('');
        setDateTo('');
        setRequestedBy('');
        setPerPage(10);
        router.get('/tracking', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const statusBadge = (s) => {
        const styleMap = {
            'Waiting Approval': 'bg-[var(--badge-waiting-bg)] text-[var(--badge-waiting-text)]',
            'Approved': 'bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)]',
            'Revised': 'bg-amber-100 text-amber-800 border border-amber-300',
            'Rejected': 'bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)]',
            'Draft': 'bg-[var(--badge-draft-bg)] text-[var(--badge-draft-text)]',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${styleMap[s] || styleMap['Draft']}`}>
                {s}
            </span>
        );
    };

    return (
        <MainLayout title="Document Tracking">
            <Head title="Tracking" />

            <div className="space-y-6">
                <PageHeader
                    title="Document Tracking"
                    subtitle="Track document approval progress and lifecycle history in real-time"
                />

                {/* Combined Card: Header + Filters + Table + Pagination */}
                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-xs">
                    {/* Card Header */}
                    <div className="px-5 py-4 border-b-[0.5px] border-[var(--border)]">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">Document Movement History</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">List of documents with active approval step and tracking timeline</p>
                    </div>

                    {/* Filters */}
                    <div className="p-5 border-b-[0.5px] border-[var(--border)] bg-gray-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                            <div className="lg:col-span-2">
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search Document No. / Reference..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    />
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Status</label>
                                <select
                                    value={status}
                                    onChange={handleStatusChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="Waiting Approval">Waiting Approval</option>
                                    <option value="Revised">Revised</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                    <option value="Draft">Draft</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={handleDateFromChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={handleDateToChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Person Request</label>
                                <div className="flex gap-2">
                                    <select
                                        value={requestedBy}
                                        onChange={handleRequestedByChange}
                                        className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">All Users</option>
                                        {users?.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-3 py-2 bg-white border-[0.5px] border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-semibold rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center shrink-0"
                                        title="Reset Filters"
                                    >
                                        <RotateCcw size={16} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[var(--text-primary)]">
                            <thead className="bg-[#fafafa] border-b-[0.5px] border-[var(--border)] text-[11px] uppercase text-[var(--text-muted)] font-semibold">
                                <tr>
                                    <th className="px-4 py-3 text-center w-12">#</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Document Number</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Journal Date</th>
                                    <th className="px-5 py-3">Reference</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Person Request</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Last Approval</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Last Updated</th>
                                    <th className="px-5 py-3 text-center whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {journals?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="px-5 py-12 text-center text-[var(--text-muted)] text-[13px]">
                                            No tracking records found.
                                        </td>
                                    </tr>
                                ) : (
                                    journals?.data?.map((journal, index) => (
                                        <tr key={journal.id} className="hover:bg-[#f9fafb] transition-colors">
                                            <td className="px-4 py-3 text-center text-xs text-[var(--text-muted)] font-mono">
                                                {(journals?.from || 1) + index}
                                            </td>
                                            <td className="px-5 py-3">
                                                <span className="font-mono text-[var(--text-primary)] font-medium">
                                                    {journal.document_number}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 text-[13px] whitespace-nowrap">
                                                {journal.journal_date?.split('T')[0]}
                                            </td>
                                            <td className="px-5 py-3 text-[13px] max-w-[200px] truncate">
                                                {journal.reference || '-'}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                {statusBadge(journal.status)}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {journal.requester ? (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold text-slate-700">
                                                                {journal.requester.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-[13px]">{journal.requester.name}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-[13px] text-[var(--text-muted)]">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {journal.last_approve_history?.actor ? (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                                                {journal.last_approve_history.actor.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-[13px]">{journal.last_approve_history.actor.name}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-[13px] text-[var(--text-muted)]">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-[12px] text-[var(--text-secondary)] whitespace-nowrap">
                                                {journal.last_updated_at ? new Date(journal.last_updated_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : '-'}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-center">
                                                    <button
                                                        onClick={() => setHistoryModal({ open: true, journalId: journal.id })}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border-[0.5px] border-[var(--border)] rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-gray-50 transition-colors"
                                                        title="View History Timeline"
                                                    >
                                                        <Clock size={14} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-5 py-3 border-t-[0.5px] border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] text-[var(--text-secondary)]">Show</span>
                                <select
                                    value={perPage}
                                    onChange={handlePerPageChange}
                                    className="px-2 py-1 border-[0.5px] border-[var(--border)] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span className="text-[12px] text-[var(--text-secondary)]">entries</span>
                            </div>
                            {journals?.from && (
                                <p className="text-[12px] text-[var(--text-secondary)]">
                                    Showing <span className="font-medium text-[var(--text-primary)]">{journals.from}</span> to <span className="font-medium text-[var(--text-primary)]">{journals.to}</span> of <span className="font-medium text-[var(--text-primary)]">{journals.total}</span> entries
                                </p>
                            )}
                        </div>
                        {journals?.links && journals.links.length > 3 && (
                            <div className="flex gap-1 flex-wrap">
                                {journals.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white font-medium'
                                                : link.url
                                                    ? 'text-[var(--text-secondary)] hover:bg-gray-100'
                                                    : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <HistoryModal
                open={historyModal.open}
                journalId={historyModal.journalId}
                onClose={() => setHistoryModal({ open: false, journalId: null })}
            />
        </MainLayout>
    );
}
