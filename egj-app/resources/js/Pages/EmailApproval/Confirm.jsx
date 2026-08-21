import { Head, router } from '@inertiajs/react';

export default function Confirm({ journal, token }) {
    const handleApprove = () => {
        router.post(`/approve-email/${token}`);
    };

    return (
        <>
            <Head title="Konfirmasi Approval" />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 p-4">
                <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-8 py-6 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 bg-white/20 rounded-2xl mb-3">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <h1 className="text-xl font-bold text-white">Konfirmasi Approval</h1>
                        <p className="text-sm text-emerald-100 mt-1">General Journal Approval System</p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        <p className="text-sm text-gray-600 mb-6">
                            Anda akan menyetujui General Journal berikut:
                        </p>

                        <div className="bg-gray-50 rounded-xl p-4 space-y-3 mb-6">
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Document Number</span>
                                <span className="text-sm font-semibold text-gray-800">{journal.document_number}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Tanggal Journal</span>
                                <span className="text-sm text-gray-800">{journal.journal_date?.split('T')[0]}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Reference</span>
                                <span className="text-sm text-gray-800">{journal.reference || '-'}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-sm text-gray-500">Diajukan oleh</span>
                                <span className="text-sm text-gray-800">{journal.requester?.name}</span>
                            </div>
                        </div>

                        <button
                            onClick={handleApprove}
                            className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition-all duration-200 hover:shadow-emerald-500/40 hover:scale-[1.01] active:scale-[0.99]"
                        >
                            ✓ Approve Sekarang
                        </button>

                        <p className="text-xs text-gray-400 text-center mt-4">
                            Dengan menekan tombol di atas, Anda menyetujui General Journal ini.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
