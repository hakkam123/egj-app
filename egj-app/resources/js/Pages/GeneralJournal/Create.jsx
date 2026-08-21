import { Head, useForm, Link } from '@inertiajs/react';
import { FileText, Paperclip, UploadCloud } from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';
import { useState } from 'react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        document_number: '',
        journal_date: '',
        reference: '',
        general_journal_file: null,
        supporting_documents: [],
    });

    const [gjFileName, setGjFileName] = useState('');
    const [sdFileNames, setSdFileNames] = useState([]);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/general-journals', {
            forceFormData: true,
            preserveScroll: true,
        });
    };

    return (
        <MainLayout title="Buat Draft Jurnal">
            <Head title="Buat Draft" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Buat Draft Baru</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Isi data dan unggah dokumen untuk membuat draft General Journal</p>
                </div>

                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-sm">
                    <form onSubmit={handleSubmit} className="p-6 space-y-6">
                        {/* Document Number */}
                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Document Number <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={data.document_number}
                                onChange={e => setData('document_number', e.target.value)}
                                className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Masukkan nomor dokumen (contoh: GJ-001)"
                                required
                            />
                            {errors.document_number && <p className="mt-1 text-[12px] text-red-500">{errors.document_number}</p>}
                        </div>

                        {/* Journal Date */}
                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Tanggal Journal <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={data.journal_date}
                                onChange={e => setData('journal_date', e.target.value)}
                                className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                required
                            />
                            {errors.journal_date && <p className="mt-1 text-[12px] text-red-500">{errors.journal_date}</p>}
                        </div>

                        {/* Reference */}
                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Reference (Description)
                            </label>
                            <textarea
                                value={data.reference}
                                onChange={e => setData('reference', e.target.value)}
                                className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500 resize-y min-h-[80px]"
                                placeholder="Deskripsi atau keterangan journal"
                            />
                            {errors.reference && <p className="mt-1 text-[12px] text-red-500">{errors.reference}</p>}
                        </div>

                        {/* General Journal File */}
                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                General Journal (PDF) <span className="text-red-500">*</span>
                            </label>
                            <div className="border-[0.5px] border-dashed border-gray-400 rounded-[7px] p-6 hover:bg-gray-50 transition-colors bg-[#fafafa]">
                                <input
                                    type="file"
                                    accept=".pdf"
                                    onChange={e => {
                                        const file = e.target.files[0];
                                        setData('general_journal_file', file);
                                        setGjFileName(file?.name || '');
                                    }}
                                    className="hidden"
                                    id="gj-file"
                                />
                                <label htmlFor="gj-file" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <UploadCloud className="w-8 h-8 text-[var(--text-muted)]" />
                                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                                        {gjFileName || 'Klik untuk unggah file PDF'}
                                    </span>
                                    <span className="text-[11px] text-[var(--text-secondary)]">Maksimal 10 MB, hanya format PDF</span>
                                </label>
                            </div>
                            {errors.general_journal_file && <p className="mt-1 text-[12px] text-red-500">{errors.general_journal_file}</p>}
                        </div>

                        {/* Supporting Documents */}
                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Supporting Documents
                            </label>
                            <div className="border-[0.5px] border-dashed border-gray-400 rounded-[7px] p-6 hover:bg-gray-50 transition-colors bg-[#fafafa]">
                                <input
                                    type="file"
                                    accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                                    multiple
                                    onChange={e => {
                                        const files = Array.from(e.target.files);
                                        setData('supporting_documents', files);
                                        setSdFileNames(files.map(f => f.name));
                                    }}
                                    className="hidden"
                                    id="sd-files"
                                />
                                <label htmlFor="sd-files" className="cursor-pointer flex flex-col items-center justify-center gap-2">
                                    <UploadCloud className="w-8 h-8 text-[var(--text-muted)]" />
                                    <span className="text-[13px] font-medium text-[var(--text-primary)]">
                                        {sdFileNames.length > 0 ? `${sdFileNames.length} file dipilih` : 'Klik untuk unggah supporting documents'}
                                    </span>
                                    <span className="text-[11px] text-[var(--text-secondary)]">PDF, JPG/PNG, Excel. Maks 10 MB per file.</span>
                                </label>
                            </div>
                            {sdFileNames.length > 0 && (
                                <div className="mt-3 space-y-1.5 bg-gray-50 p-3 rounded-[7px] border-[0.5px] border-[var(--border)]">
                                    {sdFileNames.map((name, i) => (
                                        <div key={i} className="flex items-center gap-2 text-[12px] text-[var(--text-primary)]">
                                            <Paperclip size={14} className="text-[var(--text-muted)] flex-shrink-0" /> 
                                            <span className="truncate">{name}</span>
                                        </div>
                                    ))}
                                </div>
                            )}
                            {errors['supporting_documents'] && <p className="mt-1 text-[12px] text-red-500">{errors['supporting_documents']}</p>}
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-6 mt-4 border-t-[0.5px] border-[var(--border)]">
                            <Link
                                href="/monitoring"
                                className="px-5 py-2 text-[13px] font-semibold text-[var(--text-secondary)] hover:bg-gray-100 rounded-full transition-colors"
                            >
                                Batal
                            </Link>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-6 py-2 bg-blue-600 text-white text-[13px] font-bold rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                {processing ? 'Menyimpan...' : 'Submit Dokumen'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
