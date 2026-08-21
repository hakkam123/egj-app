import { Head } from '@inertiajs/react';
import { FileText, Paperclip } from 'lucide-react';

export default function PreviewShow({ journal, token }) {
    const gjFiles = journal.active_files?.filter(f => f.category === 'general_journal') || [];
    const sdFiles = journal.active_files?.filter(f => f.category === 'supporting_document') || [];

    return (
        <>
            <Head title={`Preview ${journal.document_number}`} />
            <div className="min-h-screen bg-gray-100">
                {/* Header */}
                <div className="bg-white border-b border-gray-200 shadow-sm">
                    <div className="max-w-5xl mx-auto px-6 py-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <h1 className="text-lg font-bold text-gray-800">Preview Dokumen</h1>
                                <p className="text-sm text-gray-500">{journal.document_number}</p>
                            </div>
                            <span className="px-3 py-1 bg-blue-50 text-blue-700 text-xs font-semibold rounded-full">
                                Preview Mode
                            </span>
                        </div>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto p-6 space-y-6">
                    {/* Info */}
                    <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Document Number</span>
                                <p className="font-semibold text-gray-800">{journal.document_number}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Tanggal Journal</span>
                                <p className="font-semibold text-gray-800">{journal.journal_date?.split('T')[0]}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Diajukan oleh</span>
                                <p className="font-semibold text-gray-800">{journal.requester?.name}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Status</span>
                                <p className="font-semibold text-gray-800">{journal.status}</p>
                            </div>
                        </div>
                        {journal.reference && (
                            <div className="mt-4 pt-4 border-t border-gray-100">
                                <span className="text-gray-500 text-sm">Reference</span>
                                <p className="text-sm text-gray-700 mt-1">{journal.reference}</p>
                            </div>
                        )}
                    </div>

                    {/* General Journal PDF */}
                    {gjFiles.map(f => (
                        <div key={f.id} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-6 py-3 border-b border-gray-200 flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2"><FileText className="w-4 h-4 text-blue-500" /> {f.file_name}</h3>
                            </div>
                            <div className="h-[600px]">
                                <iframe
                                    src={`/files/${f.id}/preview`}
                                    className="w-full h-full"
                                    title={f.file_name}
                                />
                            </div>
                        </div>
                    ))}

                    {/* Supporting Documents */}
                    {sdFiles.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700">Supporting Documents</h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {sdFiles.map(f => (
                                    <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <Paperclip className="w-5 h-5 text-gray-500 flex-shrink-0" />
                                            <div>
                                                <p className="text-sm font-medium text-gray-800">{f.file_name}</p>
                                                <p className="text-xs text-gray-500">{f.mime_type} • {(f.file_size / 1024).toFixed(1)} KB</p>
                                            </div>
                                        </div>
                                        {f.mime_type?.startsWith('image/') && (
                                            <img src={`/files/${f.id}/preview`} alt={f.file_name} className="w-20 h-20 object-cover rounded-lg" />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Approval Status */}
                    {journal.approvals?.length > 0 && (
                        <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-sm font-semibold text-gray-700">Status Approval</h3>
                            </div>
                            <div className="p-6 space-y-3">
                                {journal.approvals.map(a => (
                                    <div key={a.id} className={`flex items-center justify-between p-3 rounded-lg ${
                                        a.status === 'Approved' ? 'bg-emerald-50' : a.status === 'Rejected' ? 'bg-red-50' : 'bg-gray-50'
                                    }`}>
                                        <span className="text-sm text-gray-700">{a.assigned_user?.name}</span>
                                        <span className={`text-xs font-semibold ${
                                            a.status === 'Approved' ? 'text-emerald-700' : a.status === 'Rejected' ? 'text-red-700' : 'text-gray-500'
                                        }`}>{a.status}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}
