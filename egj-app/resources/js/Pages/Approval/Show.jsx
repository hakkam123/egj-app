import { Head, router, Link, usePage } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import PageHeader from '@/Components/PageHeader';
import ConfirmModal from '@/Components/ConfirmModal';
import { useState } from 'react';
import {
    Check,
    X,
    FileText,
    Paperclip,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    AlertTriangle,
    Download,
    Loader2,
    Calendar,
    User as UserIcon,
    History as HistoryIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import { STATUS_COLORS } from '@/constants/statusColors';

export default function ApprovalShow({ journal }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    // Modal & processing states
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [reviseModalOpen, setReviseModalOpen] = useState(false);
    const [reviseNotes, setReviseNotes] = useState('');
    const [reviseError, setReviseError] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [isRevising, setIsRevising] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(true);

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
        setIsApproving(true);
        markNotifRead(journal.id);
        router.post(`/approval/${journal.id}/approve`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setApproveModalOpen(false);
                setIsApproving(false);
                toast.success('General Journal approved successfully.');
            },
            onError: (errors) => {
                setIsApproving(false);
                toast.error(Object.values(errors)[0] || 'Failed to approve document.');
            }
        });
    };

    const confirmRevise = (e) => {
        if (e) e.preventDefault();

        if (!reviseNotes || reviseNotes.trim().length < 5) {
            setReviseError('Revision notes must be at least 5 characters.');
            toast.error('Revision notes must be at least 5 characters.');
            return;
        }

        setIsRevising(true);
        markNotifRead(journal.id);
        router.post(`/approval/${journal.id}/revise`, { notes: reviseNotes.trim() }, {
            preserveScroll: true,
            onSuccess: () => {
                setReviseModalOpen(false);
                setIsRevising(false);
                toast.success('Revision request sent to requester.');
            },
            onError: (errors) => {
                setIsRevising(false);
                toast.error(Object.values(errors)[0] || 'Failed to request revision.');
            }
        });
    };

    const approvalLevelLabel = (level) => {
        const labels = {
            'accounting': 'Accounting',
            'superior': 'Superior (Section Head)',
            'superior_of_superior': 'Superior of Superior (Dept/Div Head)'
        };
        return labels[level] || level;
    };

    const renderStatusBadge = (status) => {
        const config = STATUS_COLORS[status] || STATUS_COLORS['Neutral'];
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-normal shadow-2xs ${config.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${config.dotClass || 'bg-slate-400'}`}></span>
                <span>{config.label || status}</span>
            </span>
        );
    };

    const getTimelineIcon = (status) => {
        if (status === 'Approved') return <CheckCircle2 size={16} className="text-emerald-600 bg-white" />;
        if (status === 'Revised') return <AlertTriangle size={16} className="text-amber-600 bg-white" />;
        if (status === 'Rejected') return <XCircle size={16} className="text-red-600 bg-white" />;
        return <Clock size={16} className="text-blue-600 bg-white" />;
    };

    const gjFiles = journal.active_files?.filter(f => f.category === 'general_journal') || [];
    const sdFiles = journal.active_files?.filter(f => f.category === 'supporting_document') || [];

    const isCurrentApprover = (
        String(journal.current_assign_to) === String(user?.id) ||
        (user?.role === 'Dept/Div Head' && journal.approvals?.some(a => a.approval_level === 'superior_of_superior' && a.status === 'Pending')) ||
        (user?.role === 'Section Head' && journal.approvals?.some(a => a.approval_level === 'superior' && a.status === 'Pending'))
    ) && journal.status === 'Waiting Approval';

    return (
        <MainLayout title={`Approval Review: ${journal.document_number}`}>
            <Head title={`Review ${journal.document_number} - JAGO`} />

            <div className="space-y-6">
                <PageHeader
                    title="Approval Document Review"
                    subtitle="Review General Journal information, audit attachments, and perform verification"
                    actions={
                        <Link
                            href="/approval"
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
                        >
                            <ArrowLeft size={14} /> Back to Queue
                        </Link>
                    }
                />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Metadata & Approver Action Panel (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Info Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
                            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
                                <div>
                                    <h3 className="text-base font-black text-slate-900 font-mono tracking-tight">{journal.document_number}</h3>
                                    <p className="text-xs text-slate-400">Document Overview</p>
                                </div>
                                {renderStatusBadge(journal.status)}
                            </div>

                            <div className="space-y-3.5 text-xs">
                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Journal Date</span>
                                    <p className="font-bold text-slate-800 mt-0.5">
                                        {journal.journal_date ? new Date(journal.journal_date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : '-'}
                                    </p>
                                </div>

                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Person Request / Requester</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <p className="font-semibold text-slate-800">{journal.requester?.name}</p>
                                    </div>
                                </div>

                                {journal.reference && (
                                    <div className="pt-3 border-t border-slate-100">
                                        <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Reference / Description</span>
                                        <p className="text-slate-600 mt-1 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-100">
                                            {journal.reference}
                                        </p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {isCurrentApprover && (
                                <div className="mt-5 pt-4 border-t border-[var(--border)] space-y-2">
                                    <p className="text-[11px] font-medium text-[var(--text-secondary)]">
                                        Your Approval Decision
                                    </p>

                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReviseNotes('');
                                                setReviseError('');
                                                setReviseModalOpen(true);
                                            }}
                                            disabled={isApproving || isRevising}
                                            className="flex-1 px-4 py-2.5 bg-[var(--card-bg)] hover:bg-[var(--surface-muted)] text-[var(--text-primary)] border border-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                        >
                                            Request Revision
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setApproveModalOpen(true)}
                                            disabled={isApproving || isRevising}
                                            className="flex-1 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white disabled:opacity-50 disabled:cursor-not-allowed text-xs font-semibold rounded-lg transition-colors cursor-pointer"
                                        >
                                            Approve Document
                                        </button>
                                    </div>
                                </div>

                            )}
                        </div>

                        {/* Timeline Workflow Chain */}
                        {journal.approvals?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
                                <h4 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                    Approval Workflow Progress
                                </h4>

                                <div className="relative border-l border-slate-200 ml-3 space-y-5 pl-5 pt-1">
                                    {journal.approvals.map((a) => (
                                        <div key={a.id} className="relative">
                                            <div className="absolute -left-[27px] top-0.5">
                                                {getTimelineIcon(a.status)}
                                            </div>
                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-slate-900">{approvalLevelLabel(a.approval_level)}</p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${a.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                        a.status === 'Revised' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                            a.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                                'bg-blue-50 text-blue-700 border border-blue-200'
                                                        }`}>{a.status}</span>
                                                </div>

                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Assigned to: <strong className="text-slate-700">{a.assigned_user?.name || '-'}</strong>
                                                </p>

                                                {a.approved_at && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {new Date(a.approved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}

                                                {a.notes && (
                                                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 italic">
                                                        &ldquo;{a.notes}&rdquo;
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Files & Live Stamped PDF (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                        General Journal PDF
                                    </h4>
                                    <p className="text-[10px] text-slate-400">Dynamic digital stamp overlay verification</p>
                                </div>

                                {gjFiles.length > 0 && (
                                    <a
                                        href={`/files/${gjFiles[0].id}/download`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-2xs transition-all"
                                    >
                                        <Download size={13} />
                                        Download PDF
                                    </a>
                                )}
                            </div>

                            <div className="p-4 bg-slate-100/60">
                                {gjFiles.length > 0 ? (
                                    <div className="relative">
                                        {pdfLoading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-50 rounded-xl min-h-[400px]">
                                                <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mb-3" />
                                                <p className="text-xs text-slate-500 font-medium">Loading stamped PDF preview...</p>
                                            </div>
                                        )}
                                        <iframe
                                            src={`/files/${gjFiles[0].id}/preview`}
                                            className="w-full rounded-xl border border-slate-200 h-[600px] bg-white"
                                            title="PDF Preview"
                                            onLoad={() => setPdfLoading(false)}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-xs text-slate-400">
                                        General Journal file not found.
                                    </div>
                                )}
                            </div>
                        </div>

                        {sdFiles.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-3">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                    Supporting Documents ({sdFiles.length})
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {sdFiles.map(f => (
                                        <div key={f.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <Paperclip size={16} className="text-slate-400 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-slate-800 truncate">{f.file_name}</p>
                                                    <p className="text-[10px] text-slate-400">{(f.file_size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <a
                                                    href={`/files/${f.id}/preview?v=${f.file_size}`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    Preview
                                                </a>
                                                <a
                                                    href={`/files/${f.id}/download`}
                                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
                                                >
                                                    <Download size={14} />
                                                </a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Approve */}
            <ConfirmModal
                isOpen={approveModalOpen}
                title="Approve General Journal"
                message="By approving this document, you certify that the journal details and supporting documents have been verified and approved. Proceed?"
                confirmText="Yes, Approve"
                cancelText="Cancel"
                type="success"
                loading={isApproving}
                onConfirm={confirmApprove}
                onCancel={() => !isApproving && setApproveModalOpen(false)}
            />

            {/* Modal Revise */}
            {reviseModalOpen && (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/40"
                    onClick={() => !isRevising && setReviseModalOpen(false)}
                >
                    <div
                        className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg max-w-md w-full p-5 shadow-xl relative"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
                            <h3 className="text-sm font-semibold text-[var(--text-primary)]">
                                Request Document Revision
                            </h3>

                            <button
                                type="button"
                                onClick={() => !isRevising && setReviseModalOpen(false)}
                                className="p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-colors"
                            >
                                <X size={17} strokeWidth={1.8} />
                            </button>
                        </div>

                        <form onSubmit={confirmRevise} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">
                                    Revision Notes
                                    <span className="text-[var(--text-secondary)] ml-1">
                                        * (Min 5 characters)
                                    </span>
                                </label>

                                <textarea
                                    value={reviseNotes}
                                    onChange={(e) => {
                                        setReviseNotes(e.target.value);

                                        if (
                                            reviseError &&
                                            e.target.value.trim().length >= 5
                                        ) {
                                            setReviseError('');
                                        }
                                    }}
                                    rows={4}
                                    placeholder="Explain clearly what corrections are needed from the requester..."
                                    className="w-full px-3 py-2.5 text-xs text-[var(--text-primary)] bg-[var(--card-bg)] border border-[var(--border)] rounded-lg focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-200 placeholder:text-[var(--text-secondary)]"
                                    required
                                />

                                <div className="flex justify-between items-center mt-1.5 text-[11px]">
                                    <span className="text-red-500">
                                        {reviseError}
                                    </span>

                                    <span
                                        className={
                                            reviseNotes.length < 5
                                                ? 'text-red-500 font-medium'
                                                : 'text-[var(--text-secondary)]'
                                        }
                                    >
                                        {reviseNotes.length} / 5 min characters
                                    </span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-[var(--border)] flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setReviseModalOpen(false)}
                                    disabled={isRevising}
                                    className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    disabled={isRevising || reviseNotes.trim().length < 5}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors cursor-pointer"
                                >
                                    {isRevising ? (
                                        <>
                                            <Loader2 size={14} className="animate-spin" />
                                            Sending...
                                        </>
                                    ) : (
                                        'Send Revision Request'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

        </MainLayout>
    );
}
