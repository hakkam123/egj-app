import { Head } from '@inertiajs/react';

export default function Success({ journal }) {
    return (
        <>
            <Head title="Approval Berhasil" />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 p-4">
                <div className="w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-emerald-500 rounded-full mb-6 shadow-lg shadow-emerald-500/40">
                        <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Approval Berhasil!</h1>
                    <p className="text-emerald-200 text-lg mb-4">
                        General Journal <span className="font-semibold text-white">{journal?.document_number}</span>
                    </p>
                    <p className="text-emerald-300 text-sm">
                        Telah berhasil disetujui. Notifikasi telah dikirim ke requester.
                    </p>
                    <div className="mt-8">
                        <p className="text-xs text-emerald-400">Anda dapat menutup halaman ini.</p>
                    </div>
                </div>
            </div>
        </>
    );
}
