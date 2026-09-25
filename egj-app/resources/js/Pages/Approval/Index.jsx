import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useState, useEffect, useRef } from 'react';
import { Eye, Search, RotateCcw, FileText } from 'lucide-react';
import { STATUS_COLORS } from '@/constants/statusColors';
import { formatDate, formatDateTime } from '@/utils/dateFormat';

export default function ApprovalIndex({ journals, filters }) {
    // In-column filter states
    const [docNumber, setDocNumber] = useState(filters?.doc_number || '');
    const [journalDate, setJournalDate] = useState(filters?.date || '');
    const [reference, setReference] = useState(filters?.reference || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [requester, setRequester] = useState(
        filters?.requester || filters?.requested_by || ''
    );
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const isInitialMount = useRef(true);

    const updateFilters = (overrides = {}) => {
        const queryParams = {
            doc_number: docNumber,
            date: journalDate,
            reference,
            status,
            requester,
            per_page: perPage,
            ...overrides,
        };

        const cleaned = {};

        Object.entries(queryParams).forEach(([key, value]) => {
            if (
                value !== undefined &&
                value !== null &&
                value !== ''
            ) {
                cleaned[key] = value;
            }
        });

        router.get('/approval', cleaned, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounce for text search inputs
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            updateFilters();
        }, 400);

        return () => clearTimeout(timer);
    }, [docNumber, journalDate, reference, requester]);

    const handleReset = () => {
        setDocNumber('');
        setJournalDate('');
        setReference('');
        setStatus('');
        setRequester('');
        setPerPage(10);

        router.get(
            '/approval',
            {},
            {
                preserveState: true,
                preserveScroll: true,
                replace: true,
            }
        );
    };

    const renderStatusBadge = (s) => {
        const conf = STATUS_COLORS[s] || STATUS_COLORS['Neutral'];

        return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dotClass || 'bg-slate-500'}`}
                />
                <span className={conf.text || 'text-slate-500'}>
                    {conf.label || s}
                </span>
            </span>
        );
    };

    const journalList = journals?.data || [];

    const hasActiveFilters =
        docNumber ||
        journalDate ||
        reference ||
        status ||
        requester;

    return (
        <MainLayout title="Approval Queue">
            <Head title="Approval Queue - JAGO" />

            <div className="space-y-6">

                {/* Page Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                            General Journal Approval Queue
                        </h1>

                        <p className="text-xs text-slate-500 mt-1">
                            Review documents requiring your verification and approval.
                        </p>
                    </div>

                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleReset}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                            <RotateCcw size={14} /> Clear Filters
                        </button>
                    )}
                </div>

                {/* Table Container */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-xs text-slate-600 border-collapse">

                            <thead>
                                {/* Top Header Row */}
                                <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                                    <th className="py-3 px-3 w-12 text-center">#</th>
                                    <th className="py-3 px-3 min-w-[170px]">No Document</th>
                                    <th className="py-3 px-3 min-w-[130px]">Date</th>
                                    <th className="py-3 px-3 min-w-[160px]">Reference</th>
                                    <th className="py-3 px-3 min-w-[130px]">Status</th>
                                    <th className="py-3 px-3 min-w-[150px]">Person Request</th>
                                    <th className="py-3 px-3 min-w-[150px]">Created At</th>
                                    <th className="py-3 px-3 text-center min-w-[100px]">Actions</th>
                                </tr>

                                {/* In-Column Search Row */}
                                <tr className="bg-slate-100/70 border-b border-slate-200/80">
                                    {/* # */}
                                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                                        -
                                    </td>

                                    {/* In Search: No Document */}
                                    <td className="py-1.5 px-2.5">
                                        <div className="relative">
                                            <Search
                                                size={12}
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Search Doc..."
                                                value={docNumber}
                                                onChange={(e) => setDocNumber(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </td>

                                    {/* In Search: Date */}
                                    <td className="py-1.5 px-2.5">
                                        <input
                                            type="date"
                                            value={journalDate}
                                            onChange={(e) => {
                                                setJournalDate(e.target.value);
                                                updateFilters({ date: e.target.value });
                                            }}
                                            className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-700"
                                        />
                                    </td>

                                    {/* In Search: Reference */}
                                    <td className="py-1.5 px-2.5">
                                        <div className="relative">
                                            <Search
                                                size={12}
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Search Reference..."
                                                value={reference}
                                                onChange={(e) => setReference(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400 text-slate-700 font-medium"
                                            />
                                        </div>
                                    </td>

                                    {/* Status Filter */}
                                    <td className="py-1.5 px-2.5">
                                        <select
                                            value={status}
                                            onChange={(e) => {
                                                setStatus(e.target.value);
                                                updateFilters({ status: e.target.value });
                                            }}
                                            className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-700 font-medium"
                                        >
                                            <option value="">All Statuses</option>
                                            <option value="Waiting Approval">Waiting</option>
                                            <option value="Revised">Revised</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </td>

                                    {/* In Search: Created by */}
                                    <td className="py-1.5 px-2.5">
                                        <div className="relative">
                                            <Search
                                                size={12}
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                                            />
                                            <input
                                                type="text"
                                                placeholder="Search Person Request..."
                                                value={requester}
                                                onChange={(e) => setRequester(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </td>

                                    {/* Created At Placeholder */}
                                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                                        -
                                    </td>

                                    {/* Actions Reset */}
                                    <td className="py-1.5 px-2.5 text-center">
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="text-[10px] text-blue-600 hover:underline font-bold"
                                            >
                                                Reset
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            </thead>

                            <tbody className="divide-y divide-slate-100">
                                {/* Empty State */}
                                {journalList.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={8}
                                            className="py-16 text-center text-slate-400"
                                        >
                                            <div className="max-w-sm mx-auto flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                                                    <FileText size={24} />
                                                </div>

                                                <p className="text-sm font-bold text-slate-700">
                                                    No Review Documents Found
                                                </p>

                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    {hasActiveFilters
                                                        ? 'No documents match your filter criteria.'
                                                        : 'There are no General Journals currently pending your approval.'
                                                    }
                                                </p>

                                                {hasActiveFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={handleReset}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 mt-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                                    >
                                                        <RotateCcw size={13} />
                                                        Reset Filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    /* Documents */
                                    journalList.map((journal, idx) => {
                                        const rowNum =
                                            (journals.current_page - 1) *
                                            journals.per_page +
                                            idx +
                                            1;

                                        return (
                                            <tr
                                                key={journal.id}
                                                className="hover:bg-slate-50/80 transition-colors"
                                            >
                                                {/* # Row Number */}
                                                <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold text-xs">
                                                    {rowNum}
                                                </td>

                                                {/* No Document */}
                                                <td className="py-3 px-3">
                                                    <Link
                                                        href={`/approval/${journal.id}`}
                                                        className="font-extrabold text-blue-600 hover:text-blue-800 hover:underline tracking-tight"
                                                    >
                                                        {journal.document_number}
                                                    </Link>
                                                </td>

                                                {/* Date */}
                                                <td className="py-3 px-3 font-medium text-slate-700 whitespace-nowrap">
                                                    {formatDate(journal.journal_date)}
                                                </td>

                                                {/* Reference */}
                                                <td
                                                    className="py-3 px-3 max-w-[200px] truncate text-slate-600"
                                                    title={journal.reference}
                                                >
                                                    {journal.reference || '-'}
                                                </td>

                                                {/* Status */}
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    {renderStatusBadge(
                                                        journal.status
                                                    )}
                                                </td>

                                                {/* Created by */}
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-semibold text-slate-800">
                                                            {journal.requester?.name || '-'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Created At */}
                                                <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap font-medium">
                                                    {formatDateTime(journal.submitted_at || journal.created_at)}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Link
                                                            href={`/approval/${journal.id}`}
                                                            title="Review Document"
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        >
                                                            <Eye size={15} />
                                                        </Link>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-4 py-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 bg-slate-50/60">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5">
                                <span>Show</span>
                                <select
                                    value={perPage}
                                    onChange={(e) => {
                                        setPerPage(e.target.value);
                                        updateFilters({ per_page: e.target.value });
                                    }}
                                    className="px-2 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold focus:outline-none"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span>rows</span>
                            </div>

                            {journals?.total > 0 && (
                                <p>
                                    Showing <strong className="text-slate-700">{journals.from}</strong> - <strong className="text-slate-700">{journals.to}</strong> of <strong className="text-slate-700">{journals.total}</strong> documents
                                </p>
                            )}
                        </div>

                        {journals?.links && journals.links.length > 3 && (
                            <div className="flex items-center gap-1 flex-wrap">
                                {journals.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${link.active
                                            ? 'bg-blue-600 text-white font-bold'
                                            : !link.url
                                                ? 'text-slate-300 cursor-not-allowed'
                                                : 'text-slate-600 hover:bg-slate-100'
                                            }`}
                                        dangerouslySetInnerHTML={{
                                            __html: link.label,
                                        }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
