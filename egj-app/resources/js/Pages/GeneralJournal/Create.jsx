import { Head, useForm, Link } from '@inertiajs/react';
import { FileText, Paperclip, UploadCloud, X, File, Image, FileSpreadsheet } from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';
import { useState, useRef } from 'react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        document_number: '',
        journal_date: '',
        reference: '',
        general_journal_file: null,
        supporting_documents: [],
    });

    const [gjFileName, setGjFileName] = useState('');
    const [gjPreviewUrl, setGjPreviewUrl] = useState(null);
    const [sdFiles, setSdFiles] = useState([]);
    const gjInputRef = useRef(null);
    const sdInputRef = useRef(null);

    const handleGjFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('general_journal_file', file);
            setGjFileName(file.name);
            setGjPreviewUrl(URL.createObjectURL(file));
        }
    };

    const removeGjFile = () => {
        setData('general_journal_file', null);
        setGjFileName('');
        setGjPreviewUrl(null);
        if (gjInputRef.current) gjInputRef.current.value = '';
    };

    const handleSdFilesChange = (e) => {
        const files = Array.from(e.target.files);
        const combined = [...sdFiles, ...files];
        setSdFiles(combined);
        setData('supporting_documents', combined);
    };

    const removeSdFile = (index) => {
        const updated = sdFiles.filter((_, i) => i !== index);
        setSdFiles(updated);
        setData('supporting_documents', updated);
        if (sdInputRef.current) sdInputRef.current.value = '';
    };

    const getFileIcon = (name) => {
        const ext = name?.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <Image size={16} className="text-purple-500" />;
        if (['xlsx', 'xls'].includes(ext)) return <FileSpreadsheet size={16} className="text-green-600" />;
        if (ext === 'pdf') return <FileText size={16} className="text-red-500" />;
        return <File size={16} className="text-gray-500" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

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

            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Buat Draft Baru</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Isi data dan unggah dokumen untuk membuat General Journal</p>
                </div>
                <Link href="/monitoring" className="text-sm font-medium text-blue-600 hover:text-blue-800 transition-colors">
                    &larr; Kembali ke Monitoring
                </Link>
            </div>

            <form onSubmit={handleSubmit}>
                <div className="flex flex-col lg:flex-row gap-6">

                    {/* Left Column: Form Inputs */}
                    <div className="lg:w-1/3 flex flex-col gap-6">
                        {/* Document Info Card */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-6">
                            <div className="mb-4 pb-4 border-b-[0.5px] border-[var(--border)]">
                                <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Informasi Dokumen</h3>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Isi detail dokumen General Journal</p>
                            </div>

                            <div className="space-y-5">
                                {/* Document Number */}
                                <div>
                                    <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                        Document Number <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.document_number}
                                        onChange={e => setData('document_number', e.target.value)}
                                        className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="Contoh: GJ-001"
                                        required
                                    />
                                    {errors.document_number && <p className="mt-1 text-[12px] text-red-500">{errors.document_number}</p>}
                                </div>

                                {/* Journal Date */}
                                <div>
                                    <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
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
                                    <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
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
                            </div>

                            {/* Actions */}
                            <div className="flex items-center justify-end gap-3 pt-5 mt-5 border-t-[0.5px] border-[var(--border)]">
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
                                    {processing ? 'Menyimpan...' : 'Submit'}
                                </button>
                            </div>
                        </div>

                        {/* Supporting Documents Card */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)]">
                            <div className="px-6 py-4 border-b-[0.5px] border-[var(--border)]">
                                <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Supporting Documents</h3>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">PDF, JPG/PNG, Excel. Maks 10 MB per file.</p>
                            </div>
                            <div className="p-6">
                                <div
                                    className="border-[0.5px] border-dashed border-gray-400 rounded-[7px] p-6 hover:bg-gray-50 transition-colors bg-[#fafafa] cursor-pointer"
                                    onClick={() => sdInputRef.current?.click()}
                                >
                                    <input
                                        ref={sdInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                                        multiple
                                        onChange={handleSdFilesChange}
                                        className="hidden"
                                    />
                                    <div className="flex flex-col items-center justify-center gap-2">
                                        <UploadCloud className="w-8 h-8 text-[var(--text-muted)]" />
                                        <span className="text-[13px] font-medium text-[var(--text-primary)]">
                                            Klik untuk unggah supporting documents
                                        </span>
                                        <span className="text-[11px] text-[var(--text-secondary)]">Bisa pilih beberapa file sekaligus</span>
                                    </div>
                                </div>
                                {errors['supporting_documents'] && <p className="mt-1 text-[12px] text-red-500">{errors['supporting_documents']}</p>}

                                {sdFiles.length > 0 && (
                                    <div className="mt-4 space-y-2">
                                        {sdFiles.map((file, i) => (
                                            <div key={i} className="flex items-center justify-between p-3 border-[0.5px] border-[var(--border)] bg-gray-50 rounded-lg">
                                                <div className="flex items-center gap-3 overflow-hidden">
                                                    {getFileIcon(file.name)}
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{file.name}</p>
                                                        <p className="text-[11px] text-[var(--text-secondary)]">{formatFileSize(file.size)}</p>
                                                    </div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => removeSdFile(i)}
                                                    className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: File Upload & Preview */}
                    <div className="lg:w-2/3 flex flex-col gap-6">
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] flex flex-col h-full min-h-[500px]">
                            <div className="px-6 py-4 border-b-[0.5px] border-[var(--border)]">
                                <h3 className="text-[14px] font-bold text-[var(--text-primary)]">General Journal (PDF) <span className="text-red-500">*</span></h3>
                                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">Unggah 1 file PDF, maksimal 10 MB</p>
                            </div>

                            <div className="flex-1 p-6 bg-gray-50">
                                {gjPreviewUrl ? (
                                    <div className="flex flex-col h-full">
                                        {/* File info bar */}
                                        <div className="flex items-center justify-between mb-3 p-3 bg-white border-[0.5px] border-[var(--border)] rounded-lg">
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <FileText size={18} className="text-red-500 shrink-0" />
                                                <div className="min-w-0">
                                                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">{gjFileName}</p>
                                                    <p className="text-[11px] text-[var(--text-secondary)]">{data.general_journal_file ? formatFileSize(data.general_journal_file.size) : ''}</p>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                onClick={removeGjFile}
                                                className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-colors"
                                                title="Hapus file"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                        {/* PDF Preview */}
                                        <iframe
                                            src={gjPreviewUrl}
                                            className="w-full flex-1 min-h-[500px] border-[0.5px] border-[var(--border)] rounded-lg bg-white"
                                            title="PDF Preview"
                                        />
                                    </div>
                                ) : (
                                    <div
                                        className="flex flex-col items-center justify-center h-full min-h-[400px] border-[0.5px] border-dashed border-gray-400 rounded-lg bg-white cursor-pointer hover:bg-gray-50 transition-colors"
                                        onClick={() => gjInputRef.current?.click()}
                                    >
                                        <input
                                            ref={gjInputRef}
                                            type="file"
                                            accept=".pdf"
                                            onChange={handleGjFileChange}
                                            className="hidden"
                                        />
                                        <UploadCloud className="w-12 h-12 text-gray-300 mb-4" />
                                        <p className="text-[14px] font-medium text-[var(--text-primary)]">Klik untuk unggah file PDF</p>
                                        <p className="text-[12px] text-[var(--text-secondary)] mt-1">Hanya format PDF, maksimal 10 MB</p>
                                    </div>
                                )}
                            </div>
                            {errors.general_journal_file && (
                                <div className="px-6 py-3 border-t-[0.5px] border-[var(--border)]">
                                    <p className="text-[12px] text-red-500">{errors.general_journal_file}</p>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </form>
        </MainLayout>
    );
}
