import { Head, router, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import ConfirmModal from '../../Components/ConfirmModal';
import { useState } from 'react';
import { 
    Check, 
    X, 
    FileText, 
    Paperclip, 
    Clock, 
    CheckCircle, 
    XCircle, 
    ArrowLeft,
    CheckCircle2,
    AlertCircle,
    Download
} from 'lucide-react';
import toast from 'react-hot-toast';
import { STATUS_COLORS } from '../../constants/statusColors';

export default function ApprovalShow({ journal }) {
    const { auth } = usePage().props;
    const user = auth?.user;

    // Modal & processing states
    const [approveModalOpen, setApproveModalOpen] = useState(false);
    const [rejectModalOpen, setRejectModalOpen] = useState(false);
    const [rejectNotes, setRejectNotes] = useState('');
    const [rejectError, setRejectError] = useState('');
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);
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

    const handleApproveClick = () => {
        setApproveModalOpen(true);
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
            onError: (errors) => {
                setIsApproving(false);
                const msg = Object.values(errors)[0] || 'Gagal menyetujui dokumen.';
                toast.error(msg);
            }
        });
    };

    const handleRejectClick = () => {
        setRejectNotes('');
        setRejectError('');
        setRejectModalOpen(true);
    };

    const confirmReject = (e) => {
        if (e) e.preventDefault();
        
        if (!rejectNotes || rejectNotes.trim().length < 5) {
            setRejectError('Alasan penolakan minimal 5 karakter.');
            toast.error('Alasan penolakan minimal 5 karakter.');
            return;
        }

        setIsRejecting(true);
        markNotifRead(journal.id);
        router.post(`/approval/${journal.id}/reject`, { notes: rejectNotes.trim() }, {
            preserveScroll: true,
            onSuccess: () => {
                setRejectModalOpen(false);
                setIsRejecting(false);
            },
            onError: (errors) => {
                setIsRejecting(false);
                const msg = Object.values(errors)[0] || 'Gagal menolak dokumen.';
                toast.error(msg);
            }
        });
    };

    const approvalLevelLabel = (level) => {
        const labels = { 
            'accounting': 'Accounting', 
            'superior': 'Superior', 
            'superior_of_superior': 'Superior of Superior' 
        };
        return labels[level] || level;
    };

    const statusBadge = (status) => {
        const config = STATUS_COLORS[status] || STATUS_COLORS['Draft'];
        return (
            <span
                className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold"
                style={{
                    backgroundColor: config.bgSoft,
                    color: config.solid,
                }}
            >
                {status}
            </span>
        );
    };

    const getTimelineIcon = (status) => {
        if (status === 'Approved') return <CheckCircle size={16} className="text-[#2b6b5c] bg-white" />;
        if (status === 'Rejected') return <XCircle size={16} className="text-[#b8433c] bg-white" />;
        return <Clock size={16} className="text-[#b8791f] bg-white" />;
    };

    const gjFiles = journal.active_files?.filter(f => f.category === 'general_journal') || [];
    const sdFiles = journal.active_files?.filter(f => f.category === 'supporting_document') || [];

    // Tombol hanya muncul jika user adalah approver aktif saat ini dan status dokumen masih Waiting Approval
    const isCurrentApprover = (
        String(journal.current_assign_to) === String(user?.id) ||
        (user?.role === 'Dept/Div Head' && journal.approvals?.some(a => a.approval_level === 'superior_of_superior' && a.status === 'Pending')) ||
        (user?.role === 'Section Head' && journal.approvals?.some(a => a.approval_level === 'superior' && a.status === 'Pending'))
    ) && journal.status === 'Waiting Approval';

    return (
        <MainLayout title="Detail Approval">
            <Head title={`Approval ${journal.document_number}`} />

            <div className="space-y-6">
                <PageHeader
                    title="Review Dokumen"
                    subtitle="Review detail dan berikan persetujuan untuk dokumen General Journal"
                    actions={
                        <Link
                            href="/approval"
                            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border-[0.5px] border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-gray-50 transition-colors shadow-xs"
                        >
                            <ArrowLeft size={14} /> Kembali ke Antrean
                        </Link>
                    }
                />

                <div className="flex flex-col lg:flex-row gap-6">
                    {/* Left Column: Metadata & Actions */}
                    <div className="lg:w-1/3 flex flex-col gap-6">
                        {/* Info Card */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-6 shadow-xs">
                            <div className="flex items-center justify-between mb-4 pb-4 border-b-[0.5px] border-[var(--border)]">
                                <div>
                                    <h3 className="text-base font-bold text-[var(--text-primary)] font-mono">{journal.document_number}</h3>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">Detail Dokumen</p>
                                </div>
                                {statusBadge(journal.status)}
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Tanggal Journal</span>
                                    <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-1">{journal.journal_date?.split('T')[0]}</p>
                                </div>
                                <div>
                                    <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Diajukan oleh</span>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-700">
                                            {journal.requester?.name?.charAt(0).toUpperCase()}
                                        </div>
                                        <p className="text-[13px] font-semibold text-[var(--text-primary)]">{journal.requester?.name}</p>
                                    </div>
                                </div>
                                {journal.reference && (
                                    <div className="pt-3 border-t-[0.5px] border-[var(--border)]">
                                        <span className="text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Reference</span>
                                        <p className="text-[13px] text-[var(--text-secondary)] mt-1">{journal.reference}</p>
                                    </div>
                                )}
                            </div>

                            {/* Action Buttons */}
                            {isCurrentApprover && (
                                <div className="mt-6 pt-6 border-t-[0.5px] border-[var(--border)]">
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={handleRejectClick}
                                            className="flex-1 px-4 py-2.5 bg-[#fbeceb] text-[#b8433c] hover:bg-[#f8dedd] text-[13px] font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
                                        >
                                            Tolak
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleApproveClick}
                                            className="flex-1 px-4 py-2.5 bg-[#e6f2ef] text-[#2b6b5c] hover:bg-[#d8ece7] text-[13px] font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
                                        >
                                            Setujui
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Timeline Riwayat Approval */}
                        {journal.approvals?.length > 0 && (
                            <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-6 shadow-xs">
                                <h4 className="text-[13px] font-bold text-[var(--text-primary)] mb-5">Riwayat Persetujuan</h4>
                                
                                <div className="relative border-l-[0.5px] border-[var(--border)] ml-3 space-y-6">
                                    {journal.approvals.map((a) => (
                                        <div key={a.id} className="relative pl-6">
                                            <div className="absolute -left-[8px] top-1">
                                                {getTimelineIcon(a.status)}
                                            </div>
                                            <div>
                                                <p className="text-[13px] font-semibold text-[var(--text-primary)]">{approvalLevelLabel(a.approval_level)}</p>
                                                <p className="text-[12px] text-[var(--text-secondary)]">{a.assigned_user?.name}</p>
                                                
                                                <div className="mt-1 flex items-center gap-2">
                                                    <span className={`text-[11px] font-semibold ${
                                                        a.status === 'Approved' ? 'text-[#2b6b5c]' :
                                                        a.status === 'Rejected' ? 'text-[#b8433c]' :
                                                        'text-[#b8791f]'
                                                    }`}>{a.status}</span>
                                                    
                                                    {a.approved_at && (
                                                        <span className="text-[11px] text-[var(--text-muted)]">• {new Date(a.approved_at).toLocaleString('id-ID')}</span>
                                                    )}
                                                </div>
                                                
                                                {a.notes && (
                                                    <div className="mt-2 p-2.5 bg-gray-50 border-[0.5px] border-[var(--border)] rounded-lg text-[12px] text-[var(--text-secondary)] italic">
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

                    {/* Right Column: Files Preview */}
                    <div className="lg:w-2/3 flex flex-col gap-6">
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] flex flex-col h-full min-h-[500px] shadow-xs overflow-hidden">
                            <div className="px-6 py-4 border-b-[0.5px] border-[var(--border)] flex items-center justify-between">
                                <h4 className="text-[14px] font-bold text-[var(--text-primary)]">Preview File General Journal</h4>
                                {gjFiles.length > 0 && (
                                    <a 
                                        href={`/files/${gjFiles[0].id}/download`}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[12px] font-medium text-white bg-[#1a2540] hover:bg-[#243355] rounded-md shadow-2xs transition-all"
                                    >
                                        <Download className="w-3.5 h-3.5" />
                                        Download PDF
                                    </a>
                                )}
                            </div>
                            
                            <div className="flex-1 p-6 bg-gray-50">
                                {gjFiles.length > 0 ? (
                                    <div className="relative">
                                        {pdfLoading && (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center rounded-lg"
                                                style={{ background: '#fafafa', border: '0.5px solid var(--border)', minHeight: '400px' }}>
                                                <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin mb-3"
                                                    style={{ borderColor: '#1a2540', borderTopColor: 'transparent' }} />
                                                <p className="text-[13px]" style={{ color: 'var(--text-secondary)' }}>Memuat preview PDF...</p>
                                            </div>
                                        )}
                                        <iframe 
                                            src={`/files/${gjFiles[0].id}/preview`} 
                                            className="w-full rounded-lg"
                                            style={{ height: '600px', border: '0.5px solid var(--border)', display: pdfLoading ? 'none' : 'block' }}
                                            title="PDF Preview"
                                            onLoad={() => setPdfLoading(false)}
                                        />
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                                        File General Journal tidak ditemukan
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {sdFiles.length > 0 && (
                            <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] shadow-xs">
                                <div className="px-6 py-4 border-b-[0.5px] border-[var(--border)]">
                                    <h4 className="text-[14px] font-bold text-[var(--text-primary)]">Supporting Documents</h4>
                                </div>
                                <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {sdFiles.map(f => (
                                        <div key={f.id} className="flex items-center justify-between p-3.5 border-[0.5px] border-[var(--border)] bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <Paperclip className="w-5 h-5 text-[var(--text-muted)] shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{f.file_name}</p>
                                                    <p className="text-[11px] text-[var(--text-secondary)]">{(f.file_size / 1024).toFixed(1)} KB</p>
                                                </div>
                                            </div>
                                            <div className="flex gap-2 shrink-0">
                                                <a href={`/files/${f.id}/preview?v=${f.file_size}`} target="_blank" rel="noreferrer" className="px-3 py-1 text-[11px] font-medium text-blue-700 bg-white border-[0.5px] border-[var(--border)] rounded-md hover:bg-gray-50 shadow-2xs">Preview</a>
                                                <a href={`/files/${f.id}/download`} className="px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)] bg-white border-[0.5px] border-[var(--border)] rounded-md hover:bg-gray-50 shadow-2xs">Download</a>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Modal Setujui */}
            <ConfirmModal
                open={approveModalOpen}
                title="Setujui Dokumen"
                message="Dengan menyetujui dokumen ini, Anda menyatakan bahwa data telah diperiksa dan sesuai. Lanjutkan?"
                onConfirm={confirmApprove}
                onClose={() => setApproveModalOpen(false)}
                type="success"
                confirmText="Ya, Setujui"
                loading={isApproving}
            />

            {/* Modal Tolak / Reject */}
            {rejectModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={() => !isRejecting && setRejectModalOpen(false)}>
                    <div 
                        className="bg-white rounded-xl max-w-md w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                               Tolak Dokumen
                            </h3>
                            <button
                                type="button"
                                onClick={() => !isRejecting && setRejectModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={confirmReject} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1.5">
                                    Alasan Penolakan <span className="text-red-500">* (Min 5 karakter)</span>
                                </label>
                                <textarea
                                    value={rejectNotes}
                                    onChange={(e) => {
                                        setRejectNotes(e.target.value);
                                        if (rejectError && e.target.value.trim().length >= 5) {
                                            setRejectError('');
                                        }
                                    }}
                                    rows={4}
                                    placeholder="Tuliskan alasan mengapa dokumen General Journal ini ditolak..."
                                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white"
                                    required
                                />
                                <p className="mt-1 text-right text-[11px]" style={{ color: (rejectNotes?.length || 0) < 5 ? '#e05c5c' : 'var(--text-muted)' }}>
                                    {rejectNotes?.length || 0} / 5 karakter minimum
                                </p>
                                {rejectError && (
                                    <p className="text-xs text-red-600 mt-1">{rejectError}</p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setRejectModalOpen(false)}
                                    disabled={isRejecting}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isRejecting}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs"
                                >
                                    {isRejecting ? 'Menyimpan...' : 'Kirim Penolakan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
