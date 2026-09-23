import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import { useState, useEffect, useRef } from 'react';
import { Eye, Search, RotateCcw, X, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function ApprovalIndex({ journals, filters, users }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');
    const [requestedBy, setRequestedBy] = useState(filters?.requested_by || filters?.requester_id || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Modal state for Approve & Reject without using window.confirm/prompt/alert
    const [approveModal, setApproveModal] = useState({ open: false, journalId: null });
    const [rejectModal, setRejectModal] = useState({ open: false, journalId: null, notes: '', error: '' });
    const [isApproving, setIsApproving] = useState(false);
    const [isRejecting, setIsRejecting] = useState(false);

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

        router.get('/approval', cleaned, {
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
        router.post(`/approval/${approveModal.journalId}/approve`, { notes: 'Approved from list' }, {
            preserveScroll: true,
            onSuccess: () => setApproveModal({ open: false, journalId: null }),
            onFinish: () => setIsApproving(false),
            onError: (errors) => {
                const msg = Object.values(errors)[0] || 'Gagal menyetujui dokumen.';
                toast.error(msg);
            }
        });
    };

    const confirmReject = () => {
        if (!rejectModal.journalId || isRejecting) return;
        if (!rejectModal.notes || rejectModal.notes.trim().length < 5) {
            setRejectModal(prev => ({ ...prev, error: 'Alasan penolakan minimal 5 karakter.' }));
            toast.error('Alasan penolakan minimal 5 karakter.');
            return;
        }

        setIsRejecting(true);
        markNotifRead(rejectModal.journalId);
        router.post(`/approval/${rejectModal.journalId}/reject`, { notes: rejectModal.notes }, {
            preserveScroll: true,
            onSuccess: () => setRejectModal({ open: false, journalId: null, notes: '', error: '' }),
            onFinish: () => setIsRejecting(false),
            onError: (errors) => {
                const msg = Object.values(errors)[0] || 'Gagal menolak dokumen.';
                toast.error(msg);
            }
        });
    };

    const statusBadge = (s) => {
        const styleMap = {
            'Waiting Approval': 'bg-[var(--badge-waiting-bg)] text-[var(--badge-waiting-text)]',
            'Approved': 'bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)]',
            'Rejected': 'bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)]',
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styleMap[s] || 'bg-gray-100 text-gray-700'}`}>
                {s}
            </span>
        );
    };

    return (
        <MainLayout title="Approval General Journal">
            <Head title="Approval" />

            <div className="space-y-6">
                <PageHeader
                    title="Approval General Journal"
                    subtitle="Tinjau dan proses persetujuan dokumen General Journal yang memerlukan tindakan Anda"
                />

                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-xs">
                    {/* Header */}
                    <div className="px-5 py-4 border-b-[0.5px] border-[var(--border)]">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">Antrean Dokumen Approval</h3>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">Daftar pengajuan dokumen yang menunggu persetujuan Anda</p>
                    </div>

                    {/* Filters */}
                    <div className="p-5 border-b-[0.5px] border-[var(--border)] bg-gray-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                            <div className="lg:col-span-2">
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Pencarian</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Cari No. Dokumen / Reference..."
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
                                    <option value="">Semua Status</option>
                                    <option value="Waiting Approval">Waiting Approval</option>
                                    <option value="Approved">Approved</option>
                                    <option value="Rejected">Rejected</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Dari Tanggal</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={handleDateFromChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Sampai Tanggal</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={handleDateToChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">User / Requester</label>
                                <div className="flex gap-2">
                                    <select
                                        value={requestedBy}
                                        onChange={handleRequestedByChange}
                                        className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    >
                                        <option value="">Semua User</option>
                                        {users?.map(u => (
                                            <option key={u.id} value={u.id}>{u.name}</option>
                                        ))}
                                    </select>
                                    <button
                                        type="button"
                                        onClick={handleReset}
                                        className="px-3 py-2 bg-white border-[0.5px] border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-semibold rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center shrink-0"
                                        title="Reset Filter"
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
                                    <th className="px-5 py-3 whitespace-nowrap">No. Dokumen</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Tanggal</th>
                                    <th className="px-5 py-3">Reference</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Person Request</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Assign To</th>
                                    <th className="px-5 py-3 text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {journals?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-5 py-12 text-center text-[var(--text-muted)] text-[13px]">
                                            <div className="flex flex-col items-center">
                                                Tidak ada dokumen yang ditemukan.
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    journals?.data?.map(journal => (
                                        <tr key={journal.id} className="hover:bg-[#f9fafb] transition-colors">
                                            <td className="px-5 py-3">
                                                <Link href={`/approval/${journal.id}`} className="font-mono text-blue-600 hover:underline">
                                                    {journal.document_number}
                                                </Link>
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
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600">
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
                                                    {journal.assignee ? (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center text-[10px] font-bold text-blue-600">
                                                                {journal.assignee.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <span className="text-[13px]">{journal.assignee.name}</span>
                                                        </>
                                                    ) : (
                                                        <span className="text-[13px] text-[var(--text-muted)]">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/approval/${journal.id}`}
                                                        title="Lihat Detail"
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border-[0.5px] border-[var(--border)] rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Eye size={14} /> Lihat
                                                    </Link>
                                                    {journal.status === 'Waiting Approval' && (
                                                        <>
                                                            <button
                                                                onClick={() => setApproveModal({ open: true, journalId: journal.id })}
                                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)] rounded-full text-[12px] font-semibold hover:brightness-95 transition-all"
                                                            >
                                                                Approve
                                                            </button>
                                                            <button
                                                                onClick={() => setRejectModal({ open: true, journalId: journal.id, notes: '', error: '' })}
                                                                className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)] rounded-full text-[12px] font-semibold hover:brightness-95 transition-all"
                                                            >
                                                                Reject
                                                            </button>
                                                        </>
                                                    )}
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
                                <span className="text-[12px] text-[var(--text-secondary)]">Tampilkan</span>
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
                                <span className="text-[12px] text-[var(--text-secondary)]">data</span>
                            </div>
                            {journals?.from && (
                                <p className="text-[12px] text-[var(--text-secondary)]">
                                    Menampilkan <span className="font-medium text-[var(--text-primary)]">{journals.from}</span> - <span className="font-medium text-[var(--text-primary)]">{journals.to}</span> dari <span className="font-medium text-[var(--text-primary)]">{journals.total}</span> data
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

            {/* Approve Modal Confirmation */}
            {approveModal.open && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
                        <button
                            onClick={() => setApproveModal({ open: false, journalId: null })}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3 text-green-600 mb-3">
                            <h3 className="text-lg font-bold text-gray-800">Konfirmasi Approval</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-6">
                            Apakah Anda yakin ingin menyetujui dokumen General Journal ini?
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                onClick={() => !isApproving && setApproveModal({ open: false, journalId: null })}
                                disabled={isApproving}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmApprove}
                                disabled={isApproving}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                            >
                                {isApproving ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Memproses...</span>
                                    </>
                                ) : (
                                    'Ya, Disetujui'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Reject Modal */}
            {rejectModal.open && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
                        <button
                            onClick={() => !isRejecting && setRejectModal({ open: false, journalId: null, notes: '', error: '' })}
                            disabled={isRejecting}
                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
                        >
                            <X size={18} />
                        </button>
                        <div className="flex items-center gap-3 text-red-600 mb-3">
                            <h3 className="text-lg font-bold text-gray-800">Penolakan Dokumen</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-4">
                            Masukkan alasan penolakan untuk dokumen ini (minimal 5 karakter):
                        </p>
                        <textarea
                            value={rejectModal.notes}
                            onChange={e => setRejectModal(prev => ({ ...prev, notes: e.target.value, error: '' }))}
                            disabled={isRejecting}
                            placeholder="Alasan penolakan..."
                            rows={3}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500 mb-1 disabled:bg-gray-100 disabled:cursor-not-allowed"
                        />
                        <p className="mb-2 text-right text-[11px]" style={{ color: (rejectModal.notes?.length || 0) < 5 ? '#e05c5c' : 'var(--text-muted)' }}>
                            {rejectModal.notes?.length || 0} / 5 karakter minimum
                        </p>
                        {rejectModal.error && (
                            <p className="text-xs text-red-600 mb-4 font-medium">{rejectModal.error}</p>
                        )}
                        <div className="flex justify-end gap-3 mt-4">
                            <button
                                onClick={() => !isRejecting && setRejectModal({ open: false, journalId: null, notes: '', error: '' })}
                                disabled={isRejecting}
                                className="px-4 py-2 border border-gray-300 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={confirmReject}
                                disabled={isRejecting}
                                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-red-600 text-white text-sm font-semibold rounded-lg hover:bg-red-700 disabled:opacity-75 disabled:cursor-not-allowed transition-colors"
                            >
                                {isRejecting ? (
                                    <>
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                        <span>Menyimpan...</span>
                                    </>
                                ) : (
                                    'Reject Dokumen'
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}
