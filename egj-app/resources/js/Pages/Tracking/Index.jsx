import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import { Clock } from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';
import HistoryModal from '../../Components/HistoryModal';

export default function TrackingIndex({ journals, filters }) {
    const [localFilters, setLocalFilters] = useState({
        search: filters.search || '',
        status: filters.status || '',
    });
    const [historyModal, setHistoryModal] = useState({ open: false, journalId: null });

    const applyFilters = () => {
        const cleanFilters = {};
        Object.entries(localFilters).forEach(([key, value]) => {
            if (value) cleanFilters[key] = value;
        });
        router.get('/tracking', cleanFilters, { preserveState: true });
    };

    const statusBadge = (status) => {
        const styles = {
            'Draft': 'bg-gray-100 text-gray-700 border-gray-200',
            'Waiting Approval': 'bg-amber-50 text-amber-700 border-amber-200',
            'Approved': 'bg-emerald-50 text-emerald-700 border-emerald-200',
            'Rejected': 'bg-red-50 text-red-700 border-red-200',
        };
        return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
                {status}
            </span>
        );
    };

    return (
        <MainLayout title="Tracking">
            <Head title="Tracking" />

            <div className="space-y-6">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Tracking General Journal</h2>
                    <p className="text-sm text-gray-500 mt-1">Lihat timeline dan riwayat setiap dokumen</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
                    <div className="flex gap-3">
                        <input
                            type="text"
                            placeholder="Cari dokumen..."
                            value={localFilters.search}
                            onChange={e => setLocalFilters({ ...localFilters, search: e.target.value })}
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                        <select
                            value={localFilters.status}
                            onChange={e => setLocalFilters({ ...localFilters, status: e.target.value })}
                            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Semua Status</option>
                            <option value="Draft">Draft</option>
                            <option value="Waiting Approval">Waiting Approval</option>
                            <option value="Approved">Approved</option>
                            <option value="Rejected">Rejected</option>
                        </select>
                        <button onClick={applyFilters} className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors">
                            Filter
                        </button>
                    </div>
                </div>

                {/* Table */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-200">
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Doc Number</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Tgl Journal</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Reference</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Status</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Person Request</th>
                                    <th className="text-left px-4 py-3 font-semibold text-gray-600">Last Updated</th>
                                    <th className="text-center px-4 py-3 font-semibold text-gray-600">Timeline</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {journals?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={7} className="px-4 py-12 text-center text-gray-400">
                                            Belum ada data.
                                        </td>
                                    </tr>
                                ) : (
                                    journals?.data?.map(journal => (
                                        <tr key={journal.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-4 py-3 font-medium text-gray-900">{journal.document_number}</td>
                                            <td className="px-4 py-3 text-gray-600">{journal.journal_date?.split('T')[0]}</td>
                                            <td className="px-4 py-3 text-gray-600 max-w-xs truncate">{journal.reference || '-'}</td>
                                            <td className="px-4 py-3">{statusBadge(journal.status)}</td>
                                            <td className="px-4 py-3 text-gray-600">{journal.requester?.name || '-'}</td>
                                            <td className="px-4 py-3 text-gray-500 text-xs">
                                                {journal.last_updated_at ? new Date(journal.last_updated_at).toLocaleString('id-ID') : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-center">
                                                <button
                                                    onClick={() => setHistoryModal({ open: true, journalId: journal.id })}
                                                    className="p-1.5 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                                    title="Lihat timeline"
                                                >
                                                    <Clock className="w-5 h-5" />
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {journals?.links && journals.links.length > 3 && (
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                            <p className="text-sm text-gray-500">
                                Menampilkan {journals.from} - {journals.to} dari {journals.total} data
                            </p>
                            <div className="flex gap-1">
                                {journals.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white'
                                                : link.url
                                                    ? 'text-gray-600 hover:bg-gray-100'
                                                    : 'text-gray-300 cursor-not-allowed'
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

            <HistoryModal
                open={historyModal.open}
                journalId={historyModal.journalId}
                onClose={() => setHistoryModal({ open: false, journalId: null })}
            />
        </MainLayout>
    );
}
