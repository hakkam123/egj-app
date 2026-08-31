import { Head, useForm, Link } from '@inertiajs/react';
import {
    FileText,
    UploadCloud,
    X,
    File,
    Image as ImageIcon,
    FileSpreadsheet,
    Save,
    ArrowLeft,
} from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
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
        if (gjInputRef.current) gjInputRef.current.value = '';
    };

    const removeGjFile = () => {
        setData('general_journal_file', null);
        setGjFileName('');
        setGjPreviewUrl(null);
        if (gjInputRef.current) gjInputRef.current.value = '';
    };

    const handleSdFilesChange = (e) => {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            const combined = [...sdFiles, ...files];
            setSdFiles(combined);
            setData('supporting_documents', combined);
        }
        if (sdInputRef.current) sdInputRef.current.value = '';
    };

    const removeSdFile = (index) => {
        const updated = sdFiles.filter((_, i) => i !== index);
        setSdFiles(updated);
        setData('supporting_documents', updated);
    };

    const getFileIcon = (name) => {
        const ext = name?.split('.').pop()?.toLowerCase();
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon size={15} style={{ color: '#7c3aed' }} />;
        if (['xlsx', 'xls'].includes(ext)) return <FileSpreadsheet size={15} style={{ color: '#1a6e35' }} />;
        if (ext === 'pdf') return <FileText size={15} style={{ color: '#8b1f1f' }} />;
        return <File size={15} style={{ color: 'var(--text-muted)' }} />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/general-journals', { forceFormData: true, preserveScroll: true });
    };

    const inputClass = "w-full px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white rounded-[7px]";
    const inputStyle = { border: '0.5px solid var(--border)', color: 'var(--text-primary)' };
    const labelClass = "block text-[11px] font-medium uppercase tracking-wide mb-1.5";
    const labelStyle = { color: 'var(--text-muted)' };
    const cardStyle = { background: 'var(--card-bg)', border: '0.5px solid var(--border)', borderRadius: '10px' };

    const CardHeader = ({ label, sub }) => (
        <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: '0.5px solid var(--border)' }}>
            <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: '#1a2540' }}>
                <FileText size={15} color="#ffffff" />
            </div>
            <div>
                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{label}</p>
                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>{sub}</p>
            </div>
        </div>
    );

    return (
        <MainLayout title="Buat Draft Jurnal">
            <Head title="Buat Draft" />

            <div className="max-w-6xl mx-auto space-y-6">
                <PageHeader
                    title="Buat Draft General Journal"
                    subtitle="Isi formulir pengajuan dan unggah dokumen pendukung General Journal"
                    
                />

                <form onSubmit={handleSubmit}>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

                        {/* KIRI: Informasi Dokumen */}
                        <div style={cardStyle}>
                            <CardHeader label="Informasi Dokumen" sub="Isi detail General Journal" />

                            <div className="p-5 space-y-4">
                                <div>
                                    <label className={labelClass} style={labelStyle}>
                                        Document Number <span style={{ color: '#e05c5c' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={data.document_number}
                                        onChange={e => setData('document_number', e.target.value)}
                                        className={inputClass} style={inputStyle}
                                        placeholder="Contoh: GJ-001" required
                                    />
                                    {errors.document_number && <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{errors.document_number}</p>}
                                </div>

                                <div>
                                    <label className={labelClass} style={labelStyle}>
                                        Tanggal Journal <span style={{ color: '#e05c5c' }}>*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={data.journal_date}
                                        onChange={e => setData('journal_date', e.target.value)}
                                        className={inputClass} style={inputStyle} required
                                    />
                                    {errors.journal_date && <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{errors.journal_date}</p>}
                                </div>

                                <div>
                                    <label className={labelClass} style={labelStyle}>Reference (Description)</label>
                                    <textarea
                                        value={data.reference}
                                        onChange={e => setData('reference', e.target.value)}
                                        className={`${inputClass} resize-y`}
                                        style={{ ...inputStyle, minHeight: '90px' }}
                                        placeholder="Deskripsi atau keterangan journal"
                                    />
                                    {errors.reference && <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{errors.reference}</p>}
                                </div>
                            </div>

                            <div className="flex justify-end px-5 pb-5">
                                <button
                                    type="submit"
                                    disabled={processing}
                                    className="inline-flex items-center gap-2 px-5 py-2 text-[13px] rounded-lg transition-colors disabled:opacity-50"
                                    style={{ background: '#1a2540', color: '#ffffff' }}
                                    onMouseEnter={e => !processing && (e.currentTarget.style.background = '#243355')}
                                    onMouseLeave={e => e.currentTarget.style.background = '#1a2540'}
                                >
                                    {processing ? 'Menyimpan...' : 'Submit'}
                                </button>
                            </div>
                        </div>

                        {/* KANAN: GJ di atas, Supporting di bawah */}
                        <div className="flex flex-col gap-4">

                            {/* General Journal PDF */}
                            <div style={cardStyle}>
                                <CardHeader
                                    label={<>General Journal (PDF) <span style={{ color: '#e05c5c' }}>*</span></>}
                                    sub="Unggah 1 file PDF, maks 10 MB"
                                />
                                <div className="p-5">
                                    <input ref={gjInputRef} type="file" accept=".pdf" onChange={handleGjFileChange} className="hidden" />
                                    {gjPreviewUrl ? (
                                        <div className="flex flex-col gap-3">
                                            <div className="flex items-center justify-between p-3 rounded-lg" style={{ border: '0.5px solid var(--border)', background: '#fafafa' }}>
                                                <div className="flex items-center gap-2 overflow-hidden">
                                                    <FileText size={15} style={{ color: '#8b1f1f', flexShrink: 0 }} />
                                                    <div className="min-w-0">
                                                        <p className="text-[13px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{gjFileName}</p>
                                                        <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                                                            {data.general_journal_file ? formatFileSize(data.general_journal_file.size) : ''}
                                                        </p>
                                                    </div>
                                                </div>
                                                <button type="button" onClick={removeGjFile}
                                                    className="p-1.5 rounded transition-colors"
                                                    style={{ color: 'var(--text-muted)' }}
                                                    onMouseEnter={e => e.currentTarget.style.color = '#e05c5c'}
                                                    onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                >
                                                    <X size={14} />
                                                </button>
                                            </div>
                                            <iframe
                                                src={gjPreviewUrl}
                                                className="w-full rounded-lg"
                                                style={{ height: '300px', border: '0.5px solid var(--border)' }}
                                                title="PDF Preview"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            className="flex flex-col items-center justify-center rounded-lg bg-white cursor-pointer transition-colors"
                                            style={{ border: '1px dashed var(--border)', minHeight: '160px', padding: '32px 20px' }}
                                            onClick={() => gjInputRef.current?.click()}
                                            onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                            onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                                        >
                                            <UploadCloud size={30} style={{ color: 'var(--text-muted)', marginBottom: '10px' }} />
                                            <p className="text-[13px] font-medium" style={{ color: 'var(--text-primary)' }}>Klik untuk unggah file PDF</p>
                                            <p className="text-[12px] mt-1" style={{ color: 'var(--text-secondary)' }}>Hanya format PDF, maksimal 10 MB</p>
                                        </div>
                                    )}
                                    {errors.general_journal_file && (
                                        <p className="mt-2 text-[12px]" style={{ color: '#e05c5c' }}>{errors.general_journal_file}</p>
                                    )}
                                </div>
                            </div>

                            {/* Supporting Documents */}
                            <div style={cardStyle}>
                                <CardHeader label="Supporting Documents" sub="PDF, JPG/PNG, Excel. Maks 10 MB per file." />
                                <div className="p-5 space-y-3">
                                    <input ref={sdInputRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls" multiple onChange={handleSdFilesChange} className="hidden" />
                                    <div
                                        className="flex flex-col items-center justify-center rounded-lg bg-white cursor-pointer transition-colors"
                                        style={{ border: '1px dashed var(--border)', padding: '20px' }}
                                        onClick={() => sdInputRef.current?.click()}
                                        onMouseEnter={e => e.currentTarget.style.background = '#f9fafb'}
                                        onMouseLeave={e => e.currentTarget.style.background = '#ffffff'}
                                    >
                                        <UploadCloud size={22} style={{ color: 'var(--text-muted)', marginBottom: '8px' }} />
                                        <p className="text-[12px] font-medium" style={{ color: 'var(--text-primary)' }}>Klik untuk unggah / tambah file</p>
                                        <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-secondary)' }}>Bisa pilih beberapa file sekaligus</p>
                                    </div>

                                    {errors.supporting_documents && (
                                        <p className="text-[12px]" style={{ color: '#e05c5c' }}>{errors.supporting_documents}</p>
                                    )}

                                    {sdFiles.length > 0 ? (
                                        <div className="space-y-2">
                                            {sdFiles.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-3 rounded-lg"
                                                    style={{ border: '0.5px solid var(--border)', background: '#fafafa' }}>
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {getFileIcon(file.name)}
                                                        <div className="min-w-0">
                                                            <p className="text-[12px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>{file.name}</p>
                                                            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>
                                                    <button type="button" onClick={() => removeSdFile(i)}
                                                        className="p-1 rounded transition-colors"
                                                        style={{ color: 'var(--text-muted)' }}
                                                        onMouseEnter={e => e.currentTarget.style.color = '#e05c5c'}
                                                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                                                    >
                                                        <X size={13} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-[11px] py-1" style={{ color: 'var(--text-muted)' }}>
                                            Belum ada file yang diunggah
                                        </p>
                                    )}
                                </div>
                            </div>

                        </div>
                        {/* end KANAN */}

                    </div>
                </form>
            </div>
        </MainLayout>
    );
}