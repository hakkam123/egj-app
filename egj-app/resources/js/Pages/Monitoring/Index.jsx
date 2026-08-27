import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { useState } from 'react';
import { Eye, FileText, CheckCircle, Clock, XCircle, Download, Search, RotateCcw } from 'lucide-react';
import FileModal from '../../Components/FileModal';
import HistoryModal from '../../Components/HistoryModal';

export default function MonitoringIndex({ journals, filters, users, stats }) {
    const [localFilters, setLocalFilters] = useState({
        status: filters?.status || '',
        date_from: filters?.date_from || '',
        date_to: filters?.date_to || '',
        requested_by: filters?.requested_by || '',
        search: filters?.search || '',
        per_page: filters?.per_page || '10',
    });
    const [fileModal, setFileModal] = useState({ open: false, journalId: null });
    const [historyModal, setHistoryModal] = useState({ open: false, journalId: null });

    const buildCleanFilters = (overrides = {}) => {
        const merged = { ...localFilters, ...overrides };
        const cleanFilters = {};
        Object.entries(merged).forEach(([key, value]) => {
            if (value && value !== '') cleanFilters[key] = value;
        });
        return cleanFilters;
    };

    const applyFilters = () => {
        router.get('/monitoring', buildCleanFilters(), { preserveState: true });
    };

    const resetFilters = () => {
        const reset = { status: '', date_from: '', date_to: '', requested_by: '', search: '', per_page: '10' };
        setLocalFilters(reset);
        router.get('/monitoring', {}, { preserveState: true });
    };

    const handlePerPageChange = (value) => {
        setLocalFilters(prev => ({ ...prev, per_page: value }));
        router.get('/monitoring', buildCleanFilters({ per_page: value }), { preserveState: true });
    };

    const exportUrl = () => {
        const params = buildCleanFilters();
        delete params.per_page; // Export doesn't need pagination
        const qs = new URLSearchParams(params).toString();
        return `/monitoring/export${qs ? '?' + qs : ''}`;
    };

    const statusBadge = (status) => {
        const styleMap = {
            'Draft': 'bg-[var(--badge-draft-bg)] text-[var(--badge-draft-text)]',
            'Waiting Approval': 'bg-[var(--badge-waiting-bg)] text-[var(--badge-waiting-text)]',
            'Approved': 'bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)]',
            'Rejected': 'bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)]',
        };
        return (
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${styleMap[status] || styleMap['Draft']}`}>
                {status}
            </span>
        );
    };

    return (
        <MainLayout title="Monitoring General Journal">
            <Head title="Monitoring" />

            <div className="space-y-6">
                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase">Total Dokumen</p>
                            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.total || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center text-gray-500">
                            <FileText size={20} />
                        </div>
                    </div>
                    <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase">Menunggu Approval</p>
                            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.waiting || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[var(--badge-waiting-bg)] flex items-center justify-center text-[var(--badge-waiting-text)]">
                            <Clock size={20} />
                        </div>
                    </div>
                    <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase">Disetujui</p>
                            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.approved || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[var(--badge-approved-bg)] flex items-center justify-center text-[var(--badge-approved-text)]">
                            <CheckCircle size={20} />
                        </div>
                    </div>
                    <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)] uppercase">Ditolak</p>
                            <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.rejected || 0}</p>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-[var(--badge-rejected-bg)] flex items-center justify-center text-[var(--badge-rejected-text)]">
                            <XCircle size={20} />
                        </div>
                    </div>
                </div>

                {/* Combined Card: Header + Filters + Table + Pagination */}
                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden">
                    {/* Card Header */}
                    <div className="px-5 py-4 flex items-center justify-between border-b-[0.5px] border-[var(--border)]">
                        <div>
                            <h2 className="text-base font-semibold text-[var(--text-primary)]">Daftar Dokumen</h2>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Pantau seluruh dokumen dan status persetujuan</p>
                        </div>
                        <a
                            href={exportUrl()}
                            className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm font-medium rounded-lg transition-colors shadow-sm"
                        >
                            <Download size={16} />
                            Export Excel
                        </a>
                    </div>

                    {/* Filters */}
                    <div className="px-5 py-4 border-b-[0.5px] border-[var(--border)] bg-[#fafbfc]">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                            <div className="relative lg:col-span-1">
                                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                                <input
                                    type="text"
                                    placeholder="Cari dokumen..."
                                    value={localFilters.search}
                                    onChange={e => setLocalFilters({ ...localFilters, search: e.target.value })}
                                    onKeyDown={e => e.key === 'Enter' && applyFilters()}
                                    className="w-full pl-9 pr-3 py-2 border-[0.5px] border-[var(--border)] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                            </div>
                            <select
                                value={localFilters.status}
                                onChange={e => setLocalFilters({ ...localFilters, status: e.target.value })}
                                className="px-3 py-2 border-[0.5px] border-[var(--border)] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Semua Status</option>
                                <option value="Waiting Approval">Waiting Approval</option>
                                <option value="Approved">Approved</option>
                                <option value="Rejected">Rejected</option>
                            </select>
                            <input
                                type="date"
                                value={localFilters.date_from}
                                onChange={e => setLocalFilters({ ...localFilters, date_from: e.target.value })}
                                className="px-3 py-2 border-[0.5px] border-[var(--border)] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                placeholder="Dari tanggal"
                            />
                            <input
                                type="date"
                                value={localFilters.date_to}
                                onChange={e => setLocalFilters({ ...localFilters, date_to: e.target.value })}
                                className="px-3 py-2 border-[0.5px] border-[var(--border)] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                placeholder="Sampai tanggal"
                            />
                            <select
                                value={localFilters.requested_by}
                                onChange={e => setLocalFilters({ ...localFilters, requested_by: e.target.value })}
                                className="px-3 py-2 border-[0.5px] border-[var(--border)] rounded-lg text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                            >
                                <option value="">Semua User</option>
                                {users?.map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                            <div className="flex gap-2">
                                <button onClick={applyFilters} className="flex-1 px-4 py-2 bg-blue-600 text-white text-[13px] font-medium rounded-lg hover:bg-blue-700 transition-colors">
                                    Filter
                                </button>
                                <button onClick={resetFilters} className="px-3 py-2 bg-white border-[0.5px] border-[var(--border)] text-gray-500 rounded-lg hover:bg-gray-50 transition-colors" title="Reset filter">
                                    <RotateCcw size={14} />
                                </button>
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
                                    <th className="px-5 py-3 whitespace-nowrap">Assign To</th>
                                    <th className="px-5 py-3 text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {journals?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-muted)] text-[13px]">
                                            Tidak ada data ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    journals?.data?.map(journal => (
                                        <tr key={journal.id} className="hover:bg-[#f9fafb] transition-colors">
                                            <td className="px-5 py-3">
                                                <Link href={`/general-journals/${journal.id}`} className="font-mono text-blue-600 hover:underline">
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
                                                    {journal.assignee ? (
                                                        <>
                                                            <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center text-[10px] font-bold text-gray-600">
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
                                                    <button
                                                        onClick={() => setFileModal({ open: true, journalId: journal.id })}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border-[0.5px] border-[var(--border)] rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-gray-50 transition-colors"
                                                    >
                                                        <Eye size={14} /> Lihat
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
                                <span className="text-[12px] text-[var(--text-secondary)]">Tampilkan</span>
                                <select
                                    value={localFilters.per_page}
                                    onChange={e => handlePerPageChange(e.target.value)}
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
                            <div className="flex gap-1">
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

            <FileModal
                open={fileModal.open}
                journalId={fileModal.journalId}
                onClose={() => setFileModal({ open: false, journalId: null })}
            />
            <HistoryModal
                open={historyModal.open}
                journalId={historyModal.journalId}
                onClose={() => setHistoryModal({ open: false, journalId: null })}
            />
        </MainLayout>
    );
}
