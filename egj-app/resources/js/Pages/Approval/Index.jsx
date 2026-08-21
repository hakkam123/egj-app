import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { CheckCircle, XCircle, Search, Eye } from 'lucide-react';

export default function ApprovalIndex({ journals }) {
    const handleApprove = (id) => {
        if (confirm('Apakah Anda yakin ingin menyetujui dokumen ini?')) {
            router.post(`/approval/${id}/approve`, { notes: 'Approved from list' }, { preserveScroll: true });
        }
    };

    const handleReject = (id) => {
        const notes = prompt('Masukkan alasan penolakan (minimal 5 karakter):');
        if (notes === null) return; // cancelled
        if (notes.length < 5) {
            alert('Alasan penolakan harus minimal 5 karakter.');
            return;
        }
        router.post(`/approval/${id}/reject`, { notes }, { preserveScroll: true });
    };

    const statusBadge = (status) => {
        const styleMap = {
            'Waiting Approval': 'bg-[var(--badge-waiting-bg)] text-[var(--badge-waiting-text)]',
            'Approved': 'bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)]',
            'Rejected': 'bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)]',
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styleMap[status] || 'bg-gray-100 text-gray-700'}`}>
                {status}
            </span>
        );
    };

    return (
        <MainLayout title="Approval General Journal">
            <Head title="Approval" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Approval Dokumen</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Antrean dokumen yang menunggu persetujuan Anda</p>
                </div>

                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[var(--text-primary)]">
                            <thead className="bg-[#fafafa] border-b-[0.5px] border-[var(--border)] text-[11px] uppercase text-[var(--text-muted)] font-semibold">
                                <tr>
                                    <th className="px-5 py-3 whitespace-nowrap">No. Dokumen</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Tanggal</th>
                                    <th className="px-5 py-3">Reference</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Person Request</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3 text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {journals?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-muted)] text-[13px]">
                                            <div className="flex flex-col items-center">
                                                <CheckCircle className="w-10 h-10 text-gray-300 mb-3" />
                                                Tidak ada dokumen yang menunggu approval.
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
                                                {statusBadge(journal.status)}
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
                                                    <button
                                                        onClick={() => handleApprove(journal.id)}
                                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)] rounded-full text-[12px] font-semibold hover:brightness-95 transition-all"
                                                    >
                                                        Approve
                                                    </button>
                                                    <button
                                                        onClick={() => handleReject(journal.id)}
                                                        className="flex items-center gap-1.5 px-4 py-1.5 bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)] rounded-full text-[12px] font-semibold hover:brightness-95 transition-all"
                                                    >
                                                        Reject
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {journals?.links && journals.links.length > 3 && (
                        <div className="px-5 py-3 border-t-[0.5px] border-[var(--border)] flex items-center justify-between">
                            <p className="text-[12px] text-[var(--text-secondary)]">
                                Menampilkan <span className="font-medium text-[var(--text-primary)]">{journals.from}</span> - <span className="font-medium text-[var(--text-primary)]">{journals.to}</span> dari <span className="font-medium text-[var(--text-primary)]">{journals.total}</span> data
                            </p>
                            <div className="flex gap-1">
                                {journals.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
                                            link.active ? 'bg-blue-600 text-white font-medium' : link.url ? 'text-[var(--text-secondary)] hover:bg-gray-100' : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
