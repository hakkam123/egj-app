import { Head, useForm, router, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { useState } from 'react';
import ConfirmModal from '../../Components/ConfirmModal';
import { Check, X, FileText, Paperclip, Clock, CheckCircle, XCircle } from 'lucide-react';

export default function ApprovalShow({ journal }) {
    const { auth } = usePage().props;
    const user = auth.user;

    const [showRejectForm, setShowRejectForm] = useState(false);
    const { data, setData, post, processing, errors } = useForm({ notes: '' });

    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleApprove = () => {
        setConfirmOpen(true);
    };

    const confirmApprove = () => {
        router.post(`/approval/${journal.id}/approve`);
    };

    const handleReject = (e) => {
        e.preventDefault();
        post(`/approval/${journal.id}/reject`);
    };

    const approvalLevelLabel = (level) => {
        const labels = { 'accounting': 'Accounting', 'superior': 'Superior', 'superior_of_superior': 'Superior of Superior' };
        return labels[level] || level;
    };

    const statusBadge = (status) => {
        const styleMap = {
            'Waiting Approval': 'bg-[var(--badge-waiting-bg)] text-[var(--badge-waiting-text)]',
            'Approved': 'bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)]',
            'Rejected': 'bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)]',
            'Draft': 'bg-[var(--badge-draft-bg)] text-[var(--badge-draft-text)]',
        };
        return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styleMap[status] || styleMap['Draft']}`}>{status}</span>;
    };

    const getTimelineIcon = (status) => {
        if (status === 'Approved') return <CheckCircle size={16} className="text-emerald-500 bg-white" />;
        if (status === 'Rejected') return <XCircle size={16} className="text-red-500 bg-white" />;
        return <Clock size={16} className="text-amber-500 bg-white" />;
    };

    const gjFiles = journal.active_files?.filter(f => f.category === 'general_journal') || [];
    const sdFiles = journal.active_files?.filter(f => f.category === 'supporting_document') || [];

    // Tombol hanya muncul jika user adalah approver saat ini dan dokumen masih menunggu
    const isCurrentApprover = journal.current_assign_to === user.id && journal.status === 'Waiting Approval';

    return (
        <MainLayout title="Detail Approval">
            <Head title={`Approval ${journal.document_number}`} />

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Review Dokumen</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Review dan berikan persetujuan untuk dokumen ini</p>
                </div>
                <Link
                    href="/approval"
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition-colors hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                    {/* Ikon opsional */}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-4 w-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M15 19l-7-7 7-7"
                        />
                    </svg>
                    Kembali
                </Link>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
                
                {/* Left Column: Metadata & Actions */}
                <div className="lg:w-1/3 flex flex-col gap-6">
                    {/* Info Card */}
                    <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-6">
                        <div className="flex items-center justify-between mb-4 pb-4 border-b-[0.5px] border-[var(--border)]">
                            <div>
                                <h2 className="text-lg font-bold text-[var(--text-primary)] font-mono">{journal.document_number}</h2>
                                <p className="text-xs text-[var(--text-secondary)] mt-1">Detail Dokumen</p>
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
                                    <div className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[9px] font-bold text-gray-600">
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

                        {/* Action Buttons at the bottom of info card */}
                        {isCurrentApprover && (
                            <div className="mt-6 pt-6 border-t-[0.5px] border-[var(--border)]">
                                {!showRejectForm ? (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={() => setShowRejectForm(true)}
                                            className="flex-1 px-4 py-2 bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)] text-[13px] font-bold rounded-full hover:brightness-95 transition-all"
                                        >
                                            Tolak
                                        </button>
                                        <button
                                            onClick={handleApprove}
                                            className="flex-1 px-4 py-2 bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)] text-[13px] font-bold rounded-full hover:brightness-95 transition-all"
                                        >
                                            Setujui
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={handleReject} className="space-y-3 bg-red-50 p-4 rounded-lg border border-red-100">
                                        <div>
                                            <label className="block text-[12px] font-medium text-red-800 mb-1">
                                                Alasan Penolakan <span className="text-red-500">*</span>
                                            </label>
                                            <textarea
                                                value={data.notes}
                                                onChange={e => setData('notes', e.target.value)}
                                                className="w-full px-3 py-2 text-[13px] border border-red-200 rounded-md focus:ring-1 focus:ring-red-500 bg-white"
                                                rows="3"
                                                placeholder="Berikan alasan mengapa dokumen ini ditolak..."
                                                required
                                            ></textarea>
                                            {errors.notes && <p className="text-red-600 text-[11px] mt-1">{errors.notes}</p>}
                                        </div>
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setShowRejectForm(false);
                                                    setData('notes', '');
                                                }}
                                                className="px-4 py-1.5 text-[12px] font-medium text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                                                disabled={processing}
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                className="px-4 py-1.5 bg-red-600 text-white text-[12px] font-medium rounded-full hover:bg-red-700 transition-colors disabled:opacity-50"
                                                disabled={processing}
                                            >
                                                {processing ? 'Menyimpan...' : 'Kirim Penolakan'}
                                            </button>
                                        </div>
                                    </form>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Timeline Riwayat Approval */}
                    {journal.approvals?.length > 0 && (
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-6">
                            <h3 className="text-[13px] font-bold text-[var(--text-primary)] mb-5">Riwayat Persetujuan</h3>
                            
                            <div className="relative border-l-[0.5px] border-[var(--border)] ml-3 space-y-6">
                                {journal.approvals.map((a, idx) => (
                                    <div key={a.id} className="relative pl-6">
                                        <div className="absolute -left-[8px] top-1">
                                            {getTimelineIcon(a.status)}
                                        </div>
                                        <div>
                                            <p className="text-[13px] font-semibold text-[var(--text-primary)]">{approvalLevelLabel(a.approval_level)}</p>
                                            <p className="text-[12px] text-[var(--text-secondary)]">{a.assigned_user?.name}</p>
                                            
                                            <div className="mt-1 flex items-center gap-2">
                                                <span className={`text-[11px] font-semibold ${
                                                    a.status === 'Approved' ? 'text-emerald-600' :
                                                    a.status === 'Rejected' ? 'text-red-600' :
                                                    'text-amber-600'
                                                }`}>{a.status}</span>
                                                
                                                {a.approved_at && (
                                                    <span className="text-[11px] text-[var(--text-muted)]">• {new Date(a.approved_at).toLocaleString('id-ID')}</span>
                                                )}
                                            </div>
                                            
                                            {a.notes && (
                                                <div className="mt-2 p-2 bg-gray-50 border-[0.5px] border-[var(--border)] rounded text-[12px] text-[var(--text-secondary)] italic">
                                                    "{a.notes}"
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Column: Files */}
                <div className="lg:w-2/3 flex flex-col gap-6">
                    <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] flex flex-col h-full min-h-[500px]">
                        <div className="px-6 py-4 border-b-[0.5px] border-[var(--border)]">
                            <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Preview File General Journal</h3>
                        </div>
                        
                        <div className="flex-1 p-6 bg-gray-50">
                            {gjFiles.length > 0 ? (
                                <iframe 
                                    src={`/files/${gjFiles[0].id}/preview`} 
                                    className="w-full h-full min-h-[600px] border-[0.5px] border-[var(--border)] rounded-lg bg-white"
                                    title="PDF Preview"
                                ></iframe>
                            ) : (
                                <div className="flex items-center justify-center h-full text-[var(--text-muted)] text-sm">
                                    File General Journal tidak ditemukan
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {sdFiles.length > 0 && (
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)]">
                            <div className="px-6 py-4 border-b-[0.5px] border-[var(--border)]">
                                <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Supporting Documents</h3>
                            </div>
                            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                                {sdFiles.map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-3 border-[0.5px] border-[var(--border)] bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3 overflow-hidden">
                                            <Paperclip className="w-5 h-5 text-[var(--text-muted)] flex-shrink-0" />
                                            <div className="min-w-0">
                                                <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{f.file_name}</p>
                                                <p className="text-[11px] text-[var(--text-secondary)]">{(f.file_size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2 flex-shrink-0">
                                            <a href={`/files/${f.id}/preview`} target="_blank" className="px-3 py-1 text-[11px] font-medium text-blue-700 bg-white border-[0.5px] border-[var(--border)] rounded-md hover:bg-gray-50">Preview</a>
                                            <a href={`/files/${f.id}/download`} className="px-3 py-1 text-[11px] font-medium text-[var(--text-secondary)] bg-white border-[0.5px] border-[var(--border)] rounded-md hover:bg-gray-50">Download</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <ConfirmModal
                isOpen={confirmOpen}
                title="Setujui Dokumen"
                message="Dengan menyetujui dokumen ini, Anda menyatakan bahwa data telah diperiksa dan sesuai. Lanjutkan?"
                onConfirm={confirmApprove}
                onCancel={() => setConfirmOpen(false)}
                type="success"
                confirmText="Ya, Setujui"
            />
        </MainLayout>
    );
}
