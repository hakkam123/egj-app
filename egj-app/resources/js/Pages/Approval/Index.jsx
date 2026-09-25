import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import PageHeader from '@/Components/PageHeader';
import { useState, useEffect, useRef } from 'react';
import { Eye, Search, RotateCcw, X, Loader2, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';
import toast from 'react-hot-toast';
import { STATUS_COLORS } from '@/constants/statusColors';

export default function ApprovalIndex({ journals, filters, users, stats }) {
    // In-column filter states
    const [docNumber, setDocNumber] = useState(filters?.doc_number || '');
    const [journalDate, setJournalDate] = useState(filters?.date || '');
    const [reference, setReference] = useState(filters?.reference || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [requester, setRequester] = useState(filters?.requester || filters?.requested_by || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Modals
    const [approveModal, setApproveModal] = useState({ open: false, journalId: null });
    const [reviseModal, setReviseModal] = useState({ open: false, journalId: null, notes: '', error: '' });
    const [isApproving, setIsApproving] = useState(false);
    const [isRevising, setIsRevising] = useState(false);

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
        Object.entries(queryParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                cleaned[k] = v;
            }
        });

        router.get('/approval', cleaned, {
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
    }, [docNumber, journalDate, reference, requester]);

    const handleReset = () => {
        setDocNumber('');
        setJournalDate('');
        setReference('');
        setStatus('');
        setRequester('');
        setPerPage(10);
        router.get('/approval', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const markNotifRead = (journalId) => {
        const csrf = document.querySelector('meta[name="csrf-token"]')?.content;
        fetch(`/notifications/mark-read-by-journal/${journalId}`, {
            method: 'POST',
            headers: {
                'X-CSRF-TOKEN': csrf || '',
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            }
        });
    };

    const confirmApprove = () => {
        if (!approveModal.journalId || isApproving) return;
        setIsApproving(true);
        markNotifRead(approveModal.journalId);
        router.post(`/approval/${approveModal.journalId}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setApproveModal({ open: false, journalId: null });
                toast.success('Document approved successfully.');
            },
            onFinish: () => setIsApproving(false),
            onError: (errors) => {
                const msg = Object.values(errors)[0] || 'Failed to approve document.';
                toast.error(msg);
            }
        });
    };

    const confirmRevise = () => {
        if (!reviseModal.journalId || isRevising) return;
        if (!reviseModal.notes || reviseModal.notes.trim().length < 5) {
            setReviseModal(prev => ({ ...prev, error: 'Revision notes must be at least 5 characters.' }));
            toast.error('Revision notes must be at least 5 characters.');
            return;
        }

        setIsRevising(true);
        markNotifRead(reviseModal.journalId);
        router.post(`/approval/${reviseModal.journalId}/revise`, { notes: reviseModal.notes.trim() }, {
            preserveScroll: true,
            onSuccess: () => {
                setReviseModal({ open: false, journalId: null, notes: '', error: '' });
                toast.success('Revision request sent to requester.');
            },
            onFinish: () => setIsRevising(false),
            onError: (errors) => {
                const msg = Object.values(errors)[0] || 'Failed to request revision.';
                toast.error(msg);
            }
        });
    };

    const renderStatusBadge = (s) => {
        const conf = STATUS_COLORS[s] || STATUS_COLORS['Neutral'];
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold tracking-normal shadow-2xs ${conf.badgeClass}`}>
                <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dotClass || 'bg-slate-400'}`}></span>
                <span>{conf.label || s}</span>
            </span>
        );
    };

    const journalList = journals?.data || [];
    const hasActiveFilters = docNumber || journalDate || reference || status || requester;

    return (
        <MainLayout title="Approval Queue">
            <Head title="Approval Queue - JAGO" />

            <div className="space-y-6">
                {/* Page Title Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            General Journal Approval Queue
                        </h1>
                        <p className="text-xs text-slate-500 mt-1">
                            Review and process documents requiring your verification and approval.
                        </p>
                    </div>

                    {hasActiveFilters && (
                        <div className="flex items-center gap-2.5">
                            <button
                                type="button"
                                onClick={handleReset}
                                className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <RotateCcw size={14} /> Clear Filters
                            </button>
                        </div>
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
                                    <th className="py-3 px-3 min-w-[170px]">Document Number</th>
                                    <th className="py-3 px-3 min-w-[130px]">Journal Date</th>
                                    <th className="py-3 px-3 min-w-[180px]">Reference</th>
                                    <th className="py-3 px-3 min-w-[140px]">Status</th>
                                    <th className="py-3 px-3 min-w-[160px]">Person Request</th>
                                    <th className="py-3 px-4 text-right min-w-[160px]">Actions</th>
                                </tr>

                                {/* In-Column Search Row */}
                                <tr className="bg-slate-100/70 border-b border-slate-200/80">
                                    {/* # Column */}
                                    <td className="py-2 px-3 text-center text-slate-400 font-mono text-[10px]">
                                        -
                                    </td>

                                    {/* In Search: Document Number */}
                                    <td className="py-1.5 px-2.5">
                                        <div className="relative">
                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search Doc..."
                                                value={docNumber}
                                                onChange={(e) => setDocNumber(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400 font-medium text-slate-700"
                                            />
                                        </div>
                                    </td>

                                    {/* In Search: Journal Date */}
                                    <td className="py-1.5 px-2.5">
                                        <input
                                            type="date"
                                            value={journalDate}
                                            onChange={(e) => {
                                                setJournalDate(e.target.value);
                                                updateFilters({ date: e.target.value });
                                            }}
                                            className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-700 font-medium"
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

                                    {/* In Search: Status Filter */}
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

                                    {/* In Search: Person Request / Requester */}
                                    <td className="py-1.5 px-2.5">
                                        <div className="relative">
                                            <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                            <input
                                                type="text"
                                                placeholder="Search Requester..."
                                                value={requester}
                                                onChange={(e) => setRequester(e.target.value)}
                                                className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400 font-medium text-slate-700"
                                            />
                                        </div>
                                    </td>

                                    {/* Clear Button Cell */}
                                    <td className="py-1.5 px-4 text-right">
                                        {hasActiveFilters && (
                                            <button
                                                type="button"
                                                onClick={handleReset}
                                                className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                                                title="Clear filters"
                                            >
                                                <RotateCcw size={13} />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {journalList.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="py-16 text-center text-slate-400">
                                            <div className="max-w-sm mx-auto flex flex-col items-center">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                                    <Clock size={28} />
                                                </div>
                                                <p className="text-sm font-bold text-slate-700">No Review Documents Found</p>
                                                <p className="text-xs text-slate-400 mt-1 mb-4">
                                                    {hasActiveFilters ? 'No documents match your filter criteria.' : 'There are no General Journals currently pending your approval.'}
                                                </p>
                                                {hasActiveFilters && (
                                                    <button
                                                        type="button"
                                                        onClick={handleReset}
                                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
                                                    >
                                                        <RotateCcw size={13} /> Reset Filters
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    journalList.map((journal, idx) => {
                                        const rowNum = (journals.current_page - 1) * journals.per_page + idx + 1;

                                        return (
                                            <tr key={journal.id} className="hover:bg-slate-50/80 transition-colors">
                                                <td className="py-3 px-3 text-center text-slate-400 font-mono text-xs">
                                                    {rowNum}
                                                </td>

                                                <td className="py-3 px-3 font-mono font-extrabold text-blue-600">
                                                    <Link href={`/approval/${journal.id}`} className="hover:underline tracking-tight">
                                                        {journal.document_number}
                                                    </Link>
                                                </td>

                                                <td className="py-3 px-3 whitespace-nowrap font-medium text-slate-700">
                                                    {journal.journal_date ? new Date(journal.journal_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-'}
                                                </td>

                                                <td className="py-3 px-3 max-w-[200px] truncate text-slate-600 font-normal" title={journal.reference}>
                                                    {journal.reference || '-'}
                                                </td>

                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    {renderStatusBadge(journal.status)}
                                                </td>

                                                <td className="py-3 px-3 whitespace-nowrap">
                                                    <div className="flex items-center gap-1.5">
                                                        <div className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-[10px]">
                                                            {journal.requester?.name ? journal.requester.name.charAt(0).toUpperCase() : '?'}
                                                        </div>
                                                        <span className="font-semibold text-slate-800">
                                                            {journal.requester?.name || '-'}
                                                        </span>
                                                    </div>
                                                </td>

                                                <td className="py-3 px-4 text-right whitespace-nowrap">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <Link
                                                            href={`/approval/${journal.id}`}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-2xs transition-colors"
                                                        >
                                                            <Eye size={13} /> Review
                                                        </Link>

                                                        {journal.status === 'Waiting Approval' && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setReviseModal({ open: true, journalId: journal.id, notes: '', error: '' })}
                                                                    className="px-2.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs transition-colors cursor-pointer"
                                                                >
                                                                    Revise
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    onClick={() => setApproveModal({ open: true, journalId: journal.id })}
                                                                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-sm transition-colors cursor-pointer"
                                                                >
                                                                    Approve
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {journals?.links && journals.links.length > 3 && (
                        <div className="px-5 py-3.5 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-xs text-slate-500 bg-slate-50/60">
                            <div>
                                Showing <strong className="text-slate-700">{journals.from}</strong> - <strong className="text-slate-700">{journals.to}</strong> of <strong className="text-slate-700">{journals.total}</strong> documents
                            </div>
                            <div className="flex items-center gap-1 flex-wrap">
                                {journals.links.map((link, idx) => (
                                    <Link
                                        key={idx}
                                        href={link.url || '#'}
                                        preserveScroll
                                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white font-bold'
                                                : !link.url
                                                ? 'text-slate-300 cursor-not-allowed'
                                                : 'text-slate-600 hover:bg-slate-200/70'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Approve Modal Confirmation */}
            {approveModal.open && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
                        <button
                            onClick={() => !isApproving && setApproveModal({ open: false, journalId: null })}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                            <CheckCircle2 className="text-emerald-600" size={20} />
                            Approve Document
                        </h3>
                        <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                            Are you sure you want to approve this General Journal document? Your official approval stamp and timestamp will be registered.
                        </p>
                        <div className="flex justify-end gap-2.5">
                            <button
                                onClick={() => !isApproving && setApproveModal({ open: false, journalId: null })}
                                disabled={isApproving}
                                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmApprove}
                                disabled={isApproving}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-xs font-bold rounded-xl hover:bg-emerald-700 shadow-sm transition-colors cursor-pointer"
                            >
                                {isApproving ? <Loader2 size={14} className="animate-spin" /> : 'Yes, Approve'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Revise Modal */}
            {reviseModal.open && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
                        <button
                            onClick={() => !isRevising && setReviseModal({ open: false, journalId: null, notes: '', error: '' })}
                            className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
                        >
                            <X size={18} />
                        </button>
                        <h3 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-2">
                            <AlertTriangle className="text-amber-500" size={20} />
                            Request Document Revision
                        </h3>
                        <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                            Please provide detailed notes explaining the necessary corrections for the requester:
                        </p>
                        <textarea
                            value={reviseModal.notes}
                            onChange={e => setReviseModal(prev => ({ ...prev, notes: e.target.value, error: '' }))}
                            disabled={isRevising}
                            placeholder="Explain what needs to be revised (min. 5 characters)..."
                            rows={3}
                            className="w-full px-3 py-2.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 mb-2 resize-none"
                        />
                        {reviseModal.error && (
                            <p className="text-xs text-red-500 mb-3 font-medium">{reviseModal.error}</p>
                        )}
                        <div className="flex justify-end gap-2.5">
                            <button
                                onClick={() => !isRevising && setReviseModal({ open: false, journalId: null, notes: '', error: '' })}
                                disabled={isRevising}
                                className="px-4 py-2 border border-slate-200 text-slate-600 text-xs font-semibold rounded-xl hover:bg-slate-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmRevise}
                                disabled={isRevising}
                                className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl shadow-sm transition-colors cursor-pointer"
                            >
                                {isRevising ? <Loader2 size={14} className="animate-spin" /> : 'Send Revision Request'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
