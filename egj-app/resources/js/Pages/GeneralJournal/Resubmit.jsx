import { Head, router } from '@inertiajs/react';
import { FileText } from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';
import { useState } from 'react';

export default function Resubmit({ journal }) {
    const [gjFile, setGjFile] = useState(null);
    const [sdFiles, setSdFiles] = useState([]);
    const [processing, setProcessing] = useState(false);
    const [errors, setErrors] = useState({});

    const handleSubmit = (e) => {
        e.preventDefault();
        setProcessing(true);

        const formData = new FormData();
        if (gjFile) {
            formData.append('general_journal_file', gjFile);
        }
        sdFiles.forEach((file, i) => {
            formData.append(`supporting_documents[${i}]`, file);
        });

        router.post(`/general-journals/${journal.id}/resubmit`, formData, {
            forceFormData: true,
            onFinish: () => setProcessing(false),
            onError: (errs) => setErrors(errs),
        });
    };

    return (
        <MainLayout title="Resubmit">
            <Head title="Resubmit General Journal" />

            <div className="max-w-3xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-amber-500 to-amber-600 px-6 py-4">
                        <h2 className="text-lg font-semibold text-white">Resubmit General Journal</h2>
                        <p className="text-sm text-amber-100 mt-0.5">Unggah ulang dokumen yang telah direvisi</p>
                    </div>

                    {/* Journal Info (read-only) */}
                    <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                        <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                                <span className="text-gray-500">Document Number</span>
                                <p className="font-semibold text-gray-800">{journal.document_number}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Tanggal Journal</span>
                                <p className="font-semibold text-gray-800">{journal.journal_date?.split('T')[0]}</p>
                            </div>
                            <div>
                                <span className="text-gray-500">Resubmit ke-</span>
                                <p className="font-semibold text-gray-800">{journal.resubmit_count + 1}</p>
                            </div>
                        </div>
                        {journal.reference && (
                            <div className="mt-3 text-sm">
                                <span className="text-gray-500">Reference</span>
                                <p className="text-gray-800">{journal.reference}</p>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* General Journal File (required) */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                General Journal (PDF) <span className="text-red-500">* Wajib upload ulang</span>
                            </label>
                            <div className="border-2 border-dashed border-amber-300 rounded-lg p-4 hover:border-amber-400 transition-colors bg-amber-50/50">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setGjFile(e.target.files[0])}
                                    className="hidden"
                                    id="gj-resubmit"
                                    required
                                />
                                <label htmlFor="gj-resubmit" className="cursor-pointer flex flex-col items-center">
                                    <svg className="w-8 h-8 text-amber-500 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                                    </svg>
                                    <span className="text-sm text-gray-600">
                                        {gjFile ? gjFile.name : 'Klik untuk upload file PDF (versi revisi)'}
                                    </span>
                                </label>
                            </div>
                            {errors.general_journal_file && <p className="mt-1 text-sm text-red-500">{errors.general_journal_file}</p>}
                        </div>

                        {/* Supporting Documents */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Supporting Documents (opsional)
                            </label>
                            <input
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                                multiple
                                onChange={e => setSdFiles(Array.from(e.target.files))}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-amber-50 file:text-amber-700 hover:file:bg-amber-100"
                            />
                            {sdFiles.length > 0 && (
                                <div className="mt-2 space-y-1">
                                    {sdFiles.map((f, i) => (
                                        <div key={i} className="text-sm text-gray-600 flex items-center gap-2">
                                            <FileText className="w-4 h-4 text-gray-500 inline mr-1" /> {f.name}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                            <a href="/monitoring" className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors">
                                Batal
                            </a>
                            <button
                                type="submit"
                                disabled={processing || !gjFile}
                                className="px-6 py-2.5 text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 rounded-lg shadow-sm transition-colors"
                            >
                                {processing ? 'Mengirim...' : 'Resubmit'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
