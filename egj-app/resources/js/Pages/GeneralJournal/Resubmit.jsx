import { Head, router, Link } from '@inertiajs/react';
import { FileText, Paperclip, UploadCloud } from 'lucide-react';
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
        <MainLayout title="Resubmit Jurnal">
            <Head title="Resubmit General Journal" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Resubmit Dokumen</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Unggah ulang dokumen General Journal yang telah direvisi</p>
                </div>

                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-sm">
                    {/* Journal Info (read-only) */}
                    <div className="px-6 py-5 bg-gray-50 border-b-[0.5px] border-[var(--border)]">
                        <div className="grid grid-cols-3 gap-6">
                            <div>
                                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Document Number</span>
                                <p className="text-[13px] font-bold text-[var(--text-primary)] mt-1 font-mono">{journal.document_number}</p>
                            </div>
                            <div>
                                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Tanggal Journal</span>
                                <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-1">{journal.journal_date?.split('T')[0]}</p>
                            </div>
                            <div>
                                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Resubmit ke-</span>
                                <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-1">{journal.resubmit_count + 1}</p>
                            </div>
                        </div>
                        {journal.reference && (
                            <div className="mt-4 pt-4 border-t-[0.5px] border-[var(--border)]">
                                <span className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide">Reference</span>
                                <p className="text-[13px] text-[var(--text-secondary)] mt-1">{journal.reference}</p>
                            </div>
                        )}
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* General Journal File (required) */}
                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                General Journal (PDF) <span className="text-red-500">* Wajib</span>
                            </label>
                            <div className="border-[0.5px] border-dashed border-gray-400 rounded-[7px] p-6 hover:bg-gray-50 transition-colors bg-[#fafafa]">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => setGjFile(e.target.files[0])}
                                    className="hidden"
                                    id="gj-resubmit"
                                    required
                                />
                                <label htmlFor="gj-resubmit" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <UploadCloud className="w-8 h-8 text-amber-500" />
                                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                                        {gjFile ? gjFile.name : 'Klik untuk unggah file PDF (versi revisi)'}
                                    </span>
                                    <span className="text-[11px] text-[var(--text-secondary)]">Maksimal 10 MB, format PDF.</span>
                                </label>
                            </div>
                            {errors.general_journal_file && <p className="mt-1 text-[12px] text-red-500">{errors.general_journal_file}</p>}
                        </div>

                        {/* Supporting Documents */}
                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Supporting Documents (Opsional)
                            </label>
                            <div className="border-[0.5px] border-dashed border-gray-400 rounded-[7px] p-6 hover:bg-gray-50 transition-colors bg-[#fafafa]">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                                    multiple
                                    onChange={e => setSdFiles(Array.from(e.target.files))}
                                    className="hidden"
                                    id="sd-resubmit"
                                />
                                <label htmlFor="sd-resubmit" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <UploadCloud className="w-8 h-8 text-[var(--text-muted)]" />
                                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                                        {sdFiles.length > 0 ? `${sdFiles.length} file dipilih` : 'Klik untuk unggah lampiran pendukung'}
                                    </span>
                                    <span className="text-[11px] text-[var(--text-secondary)]">PDF, JPG/PNG, Excel. Maks 10 MB per file.</span>
                                </label>
                            </div>
                            {sdFiles.length > 0 && (
                                <div className="mt-3 space-y-1.5 bg-gray-50 p-3 rounded-[7px] border-[0.5px] border-[var(--border)]">
                                    {sdFiles.map((f, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]">
                                            <Paperclip size={14} className="text-[var(--text-muted)] flex-shrink-0" />
                                            <span className="truncate">{f.name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t-[0.5px] border-[var(--border)]">
                            <Link 
                                href={`/general-journals/${journal.id}`} 
                                className="px-5 py-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-gray-100 rounded-full transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing || !gjFile}
                                className="px-6 py-2 bg-amber-600 text-white text-[13px] font-bold rounded-full hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {processing ? 'Mengirim...' : 'Resubmit Dokumen'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
