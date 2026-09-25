import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    FileText,
    Paperclip,
    Clock,
    CheckCircle2,
    XCircle,
    ArrowLeft,
    AlertTriangle,
    Download,
    X,
    FileEdit,
    Send,
    History as HistoryIcon,
    Calendar,
    User as UserIcon,
    RefreshCw,
    Loader2
} from 'lucide-react';
import MainLayout from '@/Layouts/MainLayout';
import ConfirmModal from '@/Components/ConfirmModal';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { STATUS_COLORS } from '@/constants/statusColors';

export default function Show({ journal }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    const isRequester = String(journal.requested_by) === String(user?.id);
    const isDraft = journal.status === 'Draft';
    const isRevised = journal.status === 'Revised';
    const isRejected = journal.status === 'Rejected';
    const isApproved = journal.status === 'Approved';

    // Approver permission check
    const isCurrentApprover = (
        String(journal.current_assign_to) === String(user?.id) ||
        (user?.role === 'Dept/Div Head' && journal.approvals?.some(a => a.approval_level === 'superior_of_superior' && a.status === 'Pending')) ||
        (user?.role === 'Section Head' && journal.approvals?.some(a => a.approval_level === 'superior' && a.status === 'Pending'))
    ) && journal.status === 'Waiting Approval';

    // Modals
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [reviseModalOpen, setReviseModalOpen] = useState(false);
    const [selfRejectModalOpen, setSelfRejectModalOpen] = useState(false);
    const [singleSubmitModalOpen, setSingleSubmitModalOpen] = useState(false);

    const [reviseNotes, setReviseNotes] = useState('');
    const [reviseError, setReviseError] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [isRevising, setIsRevising] = useState(false);
    const [isSelfRejecting, setIsSelfRejecting] = useState(false);
    const [isSubmittingSingle, setIsSubmittingSingle] = useState(false);
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
            },
            onError: (errs) => {
                setIsApproving(false);
                toast.error(Object.values(errs)[0] || 'Failed to approve document.');
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
            },
            onError: (errs) => {
                setIsRevising(false);
                toast.error(Object.values(errs)[0] || 'Failed to request revision.');
            }
        });
    };

    const confirmSelfReject = () => {
        setIsSelfRejecting(true);
        router.post(`/general-journals/${journal.id}/self-reject`, {
            notes: 'Document cancelled and rejected by requester.'
        }, {
            preserveScroll: true,
            onSuccess: () => {
                setSelfRejectModalOpen(false);
                setIsSelfRejecting(false);
            },
            onError: (errs) => {
                setIsSelfRejecting(false);
                toast.error(Object.values(errs)[0] || 'Failed to cancel document.');
            }
        });
    };

    const confirmSingleSubmit = () => {
        setIsSubmittingSingle(true);
        router.post(`/general-journals/${journal.id}/submit`, {}, {
            preserveScroll: true,
            onSuccess: () => {
                setSingleSubmitModalOpen(false);
                setIsSubmittingSingle(false);
                toast.success('Draft submitted for approval.');
            },
            onError: (errs) => {
                setIsSubmittingSingle(false);
                toast.error(Object.values(errs)[0] || 'Failed to submit draft.');
            }
        });
    };

    const renderStatusBadge = (s) => {
        const conf = STATUS_COLORS[s] || STATUS_COLORS['Neutral'];
        return (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold tracking-normal shadow-2xs ${conf.badgeClass}`}>
                <span className={`w-2 h-2 rounded-full shrink-0 ${conf.dotClass || 'bg-slate-400'}`}></span>
                <span>{conf.label || s}</span>
            </span>
        );
    };

    const approvalLevelLabel = (level) => {
        const labels = {
            'accounting': 'Accounting',
            'superior': 'Superior (Section Head)',
            'superior_of_superior': 'Superior of Superior (Dept/Div Head)'
        };
        return labels[level] || level;
    };

    const getTimelineIcon = (status) => {
        if (status === 'Approved') return <CheckCircle2 size={16} className="text-emerald-600 bg-white" />;
        if (status === 'Revised') return <AlertTriangle size={16} className="text-amber-600 bg-white" />;
        if (status === 'Rejected') return <XCircle size={16} className="text-red-600 bg-white" />;
        return <Clock size={16} className="text-blue-600 bg-white" />;
    };

    const gjFiles = journal.active_files?.filter(f => f.category === 'general_journal') || [];
    const supFiles = journal.active_files?.filter(f => f.category === 'supporting_document') || [];

    return (
        <MainLayout title={`General Journal Details: ${journal.document_number}`}>
            <Head title={`Details ${journal.document_number} - JAGO`} />

            <div className="space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Link
                            href="/monitoring"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
                        >
                            <ArrowLeft size={14} /> Back to Monitoring
                        </Link>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold text-slate-900 tracking-tight font-mono">
                                {journal.document_number}
                            </h1>
                            {renderStatusBadge(journal.status)}
                        </div>
                        <p className="text-xs text-slate-500 mt-1">
                            General Journal document details, approval chain, and live stamped PDF preview.
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Draft actions */}
                        {isDraft && isRequester && (
                            <>
                                <Link
                                    href={`/general-journals/${journal.id}/edit`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-700 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl shadow-2xs transition-colors"
                                >
                                    <FileEdit size={14} /> Edit Draft
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSingleSubmitModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                                >
                                    <Send size={14} /> Submit Draft
                                </button>
                            </>
                        )}

                        {/* Revised actions */}
                        {isRevised && isRequester && (
                            <>
                                <Link
                                    href={`/general-journals/${journal.id}/edit`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-sm transition-all"
                                >
                                    <RefreshCw size={14} /> Revise & Resubmit
                                </Link>
                                <button
                                    type="button"
                                    onClick={() => setSelfRejectModalOpen(true)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-red-700 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                                >
                                    <XCircle size={14} /> Self-Reject (Cancel)
                                </button>
                            </>
                        )}
                    </div>
                </div>

                {/* Revision Alert Banner if Revised */}
                {isRevised && (
                    <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4 flex items-start gap-3 shadow-xs">
                        <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={20} />
                        <div className="flex-1">
                            <h4 className="text-sm font-bold text-amber-900">Revision Requested by Approver</h4>
                            <p className="text-xs text-amber-800/90 mt-1">
                                This document requires revision before it can proceed in the approval chain. Click &quot;Revise & Resubmit&quot; to upload updated files.
                            </p>
                        </div>
                    </div>
                )}

                {/* Main Content Split: Left (Details & Approvals), Right (PDF & Files) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                    {/* Left Column: Metadata & Approvals (5 Cols) */}
                    <div className="lg:col-span-5 space-y-6">
                        {/* Document Overview Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
                            <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                Document Information
                            </h3>

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
                                        <span className="font-semibold text-slate-800">{journal.requester?.name || '-'}</span>
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Current Assign To</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        {journal.assignee ? (
                                            <>
                                                <span className="font-semibold text-slate-800">{journal.assignee.name}</span>
                                            </>
                                        ) : (
                                            <span className="text-slate-400 font-medium">None (Completed / Closed)</span>
                                        )}
                                    </div>
                                </div>

                                <div>
                                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wide">Resubmit Count</span>
                                    <p className="font-bold text-slate-800 mt-0.5">{journal.resubmit_count || 0}</p>
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

                            {/* Approver Actions Panel */}
                            {isCurrentApprover && (
                                <div className="pt-4 border-t border-slate-100 space-y-2">
                                    <p className="text-[11px] font-bold uppercase tracking-wider text-slate-500">Your Approval Action</p>
                                    <div className="flex gap-2.5">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setReviseNotes('');
                                                setReviseError('');
                                                setReviseModalOpen(true);
                                            }}
                                            className="flex-1 px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 text-xs font-bold rounded-xl transition-all shadow-2xs cursor-pointer"
                                        >
                                            Request Revision
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setApproveModalOpen(true)}
                                            className="flex-1 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                                        >
                                            Approve Document
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Approval Chain Timeline Card */}
                        {journal.approvals?.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-4">
                                <h3 className="text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
                                    Approval Workflow Chain
                                </h3>

                                <div className="relative border-l border-slate-200 ml-3 space-y-5 pl-5 pt-1">
                                    {journal.approvals.map((app) => (
                                        <div key={app.id} className="relative">
                                            <div className="absolute -left-[27px] top-0.5">
                                                {getTimelineIcon(app.status)}
                                            </div>

                                            <div>
                                                <div className="flex items-center justify-between">
                                                    <p className="text-xs font-bold text-slate-900">
                                                        {approvalLevelLabel(app.approval_level)}
                                                    </p>
                                                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${app.status === 'Approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                                                        app.status === 'Revised' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                                                            app.status === 'Rejected' ? 'bg-red-50 text-red-700 border border-red-200' :
                                                                'bg-blue-50 text-blue-700 border border-blue-200'
                                                        }`}>
                                                        {app.status}
                                                    </span>
                                                </div>

                                                <p className="text-[11px] text-slate-500 mt-0.5">
                                                    Assigned to: <strong className="text-slate-700">{app.assigned_user?.name || '-'}</strong>
                                                </p>

                                                {app.approved_at && (
                                                    <p className="text-[10px] text-slate-400 mt-0.5 flex items-center gap-1">
                                                        <Calendar size={11} />
                                                        {new Date(app.approved_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                )}

                                                {app.notes && (
                                                    <div className="mt-2 p-2.5 bg-slate-50 border border-slate-100 rounded-xl text-[11px] text-slate-600 italic">
                                                        &ldquo;{app.notes}&rdquo;
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Column: Files & Live Stamped PDF Preview (7 Cols) */}
                    <div className="lg:col-span-7 space-y-6">
                        {/* General Journal Stamped PDF Card */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                            <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
                                <div>
                                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                        General Journal PDF
                                    </h4>
                                    <p className="text-[10px] text-slate-400">Preview with dynamically applied digital approval stamps</p>
                                </div>

                                {gjFiles.length > 0 && (
                                    <a
                                        href={`/files/${gjFiles[0].id}/download`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-2xs transition-colors"
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
                                                <p className="text-xs text-slate-500 font-medium">Rendering stamped PDF preview...</p>
                                            </div>
                                        )}
                                        <iframe
                                            src={`/files/${gjFiles[0].id}/preview`}
                                            className="w-full rounded-xl border border-slate-200 h-[580px] bg-white"
                                            title="PDF Preview"
                                            onLoad={() => setPdfLoading(false)}
                                        />
                                    </div>
                                ) : (
                                    <div className="p-12 text-center text-xs text-slate-400">
                                        No General Journal PDF file attached.
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Supporting Documents List */}
                        {supFiles.length > 0 && (
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-5 space-y-3">
                                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-2">
                                    <Paperclip size={14} className="text-slate-500" />
                                    Supporting Documents ({supFiles.length})
                                </h4>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    {supFiles.map(file => (
                                        <div key={file.id} className="p-3 rounded-xl border border-slate-200 bg-slate-50/60 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <Paperclip size={16} className="text-slate-400 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-xs font-medium text-slate-800 truncate">{file.file_name}</p>
                                                    <p className="text-[10px] text-slate-400">{(file.file_size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-1.5 shrink-0">
                                                <a
                                                    href={`/files/${file.id}/preview`}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                >
                                                    View
                                                </a>
                                                <a
                                                    href={`/files/${file.id}/download`}
                                                    className="p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-200/70 rounded-lg transition-colors"
                                                    title="Download file"
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

            {/* Confirm Approve Modal */}
            <ConfirmModal
                isOpen={approveModalOpen}
                title="Approve General Journal"
                message="By approving this document, you certify that you have reviewed the contents and confirmed their validity. Proceed?"
                confirmText="Yes, Approve Document"
                cancelText="Cancel"
                confirmVariant="primary"
                loading={isApproving}
                onConfirm={confirmApprove}
                onCancel={() => !isApproving && setApproveModalOpen(false)}
            />

            {/* Confirm Single Submit Modal (for Draft) */}
            <ConfirmModal
                isOpen={singleSubmitModalOpen}
                title="Submit General Journal"
                message="Are you sure you want to submit this draft document into the approval workflow?"
                confirmText="Yes, Submit Document"
                cancelText="Cancel"
                confirmVariant="primary"
                loading={isSubmittingSingle}
                onConfirm={confirmSingleSubmit}
                onCancel={() => !isSubmittingSingle && setSingleSubmitModalOpen(false)}
            />

            {/* Confirm Self-Reject Modal */}
            <ConfirmModal
                isOpen={selfRejectModalOpen}
                title="Self-Reject Document"
                message="Are you sure you want to cancel and reject this document permanently? Once closed, it cannot be edited or resubmitted."
                confirmText="Yes, Reject Permanently"
                cancelText="Keep Document"
                confirmVariant="danger"
                loading={isSelfRejecting}
                onConfirm={confirmSelfReject}
                onCancel={() => !isSelfRejecting && setSelfRejectModalOpen(false)}
            />

            {/* Request Revision Modal */}
            {reviseModalOpen && (
                <div
                    className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
                    onClick={() => !isRevising && setReviseModalOpen(false)}
                >
                    <div
                        className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                                <AlertTriangle className="text-amber-500" size={20} />
                                Request Revision
                            </h3>
                            <button
                                type="button"
                                onClick={() => !isRevising && setReviseModalOpen(false)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={confirmRevise} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wide text-slate-700 mb-1.5">
                                    Revision Notes <span className="text-red-500">* (Min 5 characters)</span>
                                </label>
                                <textarea
                                    value={reviseNotes}
                                    onChange={(e) => {
                                        setReviseNotes(e.target.value);
                                        if (reviseError && e.target.value.trim().length >= 5) {
                                            setReviseError('');
                                        }
                                    }}
                                    rows={4}
                                    placeholder="Explain clearly what corrections or missing documents are required from the requester..."
                                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 bg-white"
                                    required
                                />
                                <div className="flex justify-between items-center mt-1 text-[11px]">
                                    <span className="text-red-500">{reviseError}</span>
                                    <span className={reviseNotes.length < 5 ? "text-red-500 font-semibold" : "text-slate-400"}>
                                        {reviseNotes.length} / 5 min characters
                                    </span>
                                </div>
                            </div>

                            <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setReviseModalOpen(false)}
                                    disabled={isRevising}
                                    className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRevising || reviseNotes.trim().length < 5}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-xl transition-colors shadow-sm cursor-pointer"
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
