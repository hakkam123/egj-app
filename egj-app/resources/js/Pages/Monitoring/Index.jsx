import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import { useState, useEffect, useRef } from 'react';
import {
    Eye,
    FileText,
    CheckCircle2,
    Clock,
    XCircle,
    Search,
    RotateCcw,
    FileEdit,
    AlertTriangle,
    Paperclip,
    History,
    Calendar
} from 'lucide-react';
import FileModal from '@/Components/FileModal';
import HistoryModal from '@/Components/HistoryModal';
import { STATUS_COLORS } from '@/constants/statusColors';
import { formatDate, formatDateTime } from '@/utils/dateFormat';

export default function MonitoringIndex({ journals, filters, users, stats }) {
    // In-column filter states
    const [docNumber, setDocNumber] = useState(filters?.doc_number || '');
    const [reference, setReference] = useState(filters?.reference || '');
    const [requester, setRequester] = useState(filters?.requester || '');
    const [assignTo, setAssignTo] = useState(filters?.assign_to || '');
    const [date, setDate] = useState(filters?.date || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const [fileModal, setFileModal] = useState({ open: false, journalId: null });
    const [historyModal, setHistoryModal] = useState({ open: false, journalId: null });

    const isInitialMount = useRef(true);

    const updateFilters = (overrides = {}) => {
        const queryParams = {
            doc_number: docNumber,
            reference,
            requester,
            assign_to: assignTo,
            date,
            status,
            per_page: perPage,
            ...overrides,
        };

        const cleaned = {};
        Object.entries(queryParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                cleaned[k] = v;
            }
        });

        router.get('/monitoring', cleaned, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounce for in-column search inputs
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            updateFilters();
        }, 400);

        return () => clearTimeout(timer);
    }, [docNumber, reference, requester, assignTo, date]);

    const handleStatusFilterChange = (newStatus) => {
        const val = status === newStatus ? '' : newStatus;
        setStatus(val);
        updateFilters({ status: val });
    };

    const handleReset = () => {
        setDocNumber('');
        setReference('');
        setRequester('');
        setAssignTo('');
        setDate('');
        setStatus('');
        setPerPage(10);
        router.get('/monitoring', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const exportUrl = () => {
        const params = {
            doc_number: docNumber,
            requester,
            assign_to: assignTo,
            date,
            status,
        };
        const cleaned = {};
        Object.entries(params).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                cleaned[k] = v;
            }
        });
        const qs = new URLSearchParams(cleaned).toString();
        return `/monitoring/export${qs ? '?' + qs : ''}`;
    };

    const renderStatusBadge = (s) => {
        const conf = STATUS_COLORS[s] || STATUS_COLORS['Neutral'];

        return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dotClass || 'bg-slate-500'
                        }`}
                />
                <span className={conf.text || 'text-slate-500'}>
                    {conf.label || s}
                </span>
            </span>
        );
    };


    const journalList = journals?.data || [];

    return (
        <MainLayout title="General Journal Monitoring">
            <Head title="Monitoring - JAGO" />

            <div className="space-y-6">
                {/* Page Title & Export Action */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2.5">
                            General Journal Monitoring
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Track the approval workflow status, review documents, and audit histories across all journals.
                        </p>
                    </div>

                    <div className="flex items-center gap-2.5">
                        {(docNumber || reference || requester || assignTo || date || status) && (
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <RotateCcw size={14} /> Clear Filters
                            </button>
                        )}

                        <a
                            href={exportUrl()}
                            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 hover:scale-[1.02] active:scale-[0.98]"
                        >
                            Export to Excel
                        </a>
                    </div>
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
                                    <th className="py-3 px-3 min-w-[150px]">Assign To</th>
                                    <th className="py-3 px-3 min-w-[150px]">Created by</th>
                                    <th className="py-3 px-3 min-w-[120px]">Last Updated</th>
                                    <th className="py-3 px-3 text-center min-w-[100px]">Actions</th>
                                </tr>

                                {/* In-Column Search Row */}
                                <tr className="bg-slate-100/70 border-b border-slate-200/80">
                                    {/* # Column */}
                                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                                        -
                                    </td>

                                    {/* In Search: No Document */}
                                    <td className="py-1.5 px-2.5">
                                        <div className="relative">
                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
                                            value={date}
                                            onChange={(e) => setDate(e.target.value)}
                                            className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-700"
                                        />
                                    </td>

                                    {/* In Search: Reference */}
                                    <td className="py-1.5 px-2.5">
                                        <div className="relative">
                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
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
                                            <option value="Draft">Draft</option>
                                            <option value="Waiting Approval">Waiting</option>
                                            <option value="Revised">Revised</option>
                                            <option value="Approved">Approved</option>
                                            <option value="Rejected">Rejected</option>
                                        </select>
                                    </td>

                                    {/* In Search: Assign To */}
                                    <td className="py-1.5 px-2.5">
                                        <div className="relative">
                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search Assignee..."
                                                value={assignTo}
                                                onChange={(e) => setAssignTo(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </td>

                                    {/* In Search: Requester / Person Request */}
                                    <td className="py-1.5 px-2.5">
                                        <div className="relative">
                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search Requester..."
                                                value={requester}
                                                onChange={(e) => setRequester(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400"
                                            />
                                        </div>
                                    </td>

                                    {/* Last Updated */}
                                    <td className="py-1.5 px-2.5 text-slate-400 text-[10px]">
                                        -
                                    </td>

                                    {/* Actions */}
                                    <td className="py-1.5 px-2.5 text-center">
                                        {(docNumber || requester || assignTo || date || status) && (
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
                                {journalList.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-16 text-center text-slate-400">
                                            <div className="max-w-sm mx-auto flex flex-col items-center">
                                                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-2.5">
                                                    <FileText size={24} />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">No Documents Found</p>
                                                <p className="text-xs text-slate-400 mt-0.5">
                                                    Try adjusting your in-column search filters.
                                                </p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    journalList.map((journal, index) => {
                                        const rowNum = (journals.current_page - 1) * journals.per_page + index + 1;

                                        return (
                                            <tr key={journal.id} className="hover:bg-slate-50/80 transition-colors">
                                                {/* # Row Number */}
                                                <td className="py-3 px-3 text-center text-slate-400 font-mono font-bold text-xs">
                                                    {rowNum}
                                                </td>

                                                {/* No Document */}
                                                <td className="py-3 px-3">
                                                    <Link
                                                        href={`/general-journals/${journal.id}`}
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
                                                <td className="py-3 px-3 max-w-[200px] truncate text-slate-600" title={journal.reference}>
                                                    {journal.reference || '-'}
                                                </td>

                                                {/* Status */}
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    {renderStatusBadge(journal.status)}
                                                </td>

                                                {/* Assign To */}
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    {journal.assignee ? (
                                                        <div className="flex items-center gap-1.5">

                                                            <span className="font-medium text-slate-800">{journal.assignee.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-slate-400">-</span>
                                                    )}
                                                </td>

                                                {/* Person Request / Requester */}
                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <span className="font-semibold text-slate-800">
                                                            {journal.requester?.name || '-'}
                                                        </span>
                                                    </div>
                                                </td>

                                                {/* Last Updated */}
                                                <td className="py-3 px-3 text-slate-500 text-[11px] whitespace-nowrap font-medium">
                                                    {formatDateTime(journal.last_updated_at)}
                                                </td>

                                                {/* Actions */}
                                                <td className="py-3 px-3 text-center">
                                                    <div className="flex items-center justify-center gap-1">
                                                        <Link
                                                            href={`/general-journals/${journal.id}`}
                                                            title="View Document Details"
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                                                        >
                                                            <Eye size={15} />
                                                        </Link>

                                                        <button
                                                            type="button"
                                                            onClick={() => setFileModal({ open: true, journalId: journal.id })}
                                                            title="View Attachments"
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                                                        >
                                                            <Paperclip size={15} />
                                                        </button>

                                                        <button
                                                            type="button"
                                                            onClick={() => setHistoryModal({ open: true, journalId: journal.id })}
                                                            title="View Audit Timeline"
                                                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                                                        >
                                                            <History size={15} />
                                                        </button>
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
                                                : 'text-slate-600 hover:bg-slate-200/70'
                                            }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal for viewing files */}
            <FileModal
                open={fileModal.open}
                journalId={fileModal.journalId}
                onClose={() => setFileModal({ open: false, journalId: null })}
            />

            {/* Modal for viewing timeline */}
            <HistoryModal
                open={historyModal.open}
                journalId={historyModal.journalId}
                onClose={() => setHistoryModal({ open: false, journalId: null })}
            />
        </MainLayout>
    );
}
