import { Head, useForm, Link, usePage } from '@inertiajs/react';
import {
    FileText,
    UploadCloud,
    X,
    File,
    Image as ImageIcon,
    FileSpreadsheet,
    Save,
    Send,
    ArrowLeft,
    Calendar,
    HelpCircle,
    CheckCircle2,
    AlertTriangle,
    AlertCircle,
    Loader2
} from 'lucide-react';
import MainLayout from '@/Layouts/MainLayout';
import { useState, useRef, useEffect } from 'react';
import toast from 'react-hot-toast';

export default function Create() {
    const { auth } = usePage().props;
    // Default today's date formatted YYYY-MM-DD
    const today = new Date().toISOString().split('T')[0];

    const [docSuffix, setDocSuffix] = useState('');
    const [actionType, setActionType] = useState('submit');
    const [clientErrors, setClientErrors] = useState({});

    const { data, setData, post, processing, errors } = useForm({
        document_number: '',
        journal_date: today,
        reference: '',
        general_journal_file: null,
        supporting_documents: [],
        action: 'submit',
    });

    const [gjFileName, setGjFileName] = useState('');
    const [gjPreviewUrl, setGjPreviewUrl] = useState(null);
    const [sdFiles, setSdFiles] = useState([]);
    const gjInputRef = useRef(null);
    const sdInputRef = useRef(null);

    // Sync JOT prefix with suffix input
    const handleDocSuffixChange = (e) => {
        const val = e.target.value;
        // If user pasted something starting with JOT, strip it for suffix
        const cleanVal = val.replace(/^JOT\s*[-_]?\s*/i, '');
        setDocSuffix(cleanVal);
        setData('document_number', cleanVal ? `JOT ${cleanVal}` : '');
        if (cleanVal) {
            setClientErrors(prev => ({ ...prev, document_number: null }));
        }
    };

    const handleGjFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('general_journal_file', file);
            setGjFileName(file.name);
            setGjPreviewUrl(URL.createObjectURL(file));
            setClientErrors(prev => ({ ...prev, general_journal_file: null }));
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
        if (['jpg', 'jpeg', 'png', 'gif'].includes(ext)) return <ImageIcon size={15} className="text-purple-600" />;
        if (['xlsx', 'xls'].includes(ext)) return <FileSpreadsheet size={15} className="text-emerald-600" />;
        if (ext === 'pdf') return <FileText size={15} className="text-red-600" />;
        return <File size={15} className="text-slate-400" />;
    };

    const formatFileSize = (bytes) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const handleFormSubmit = (type) => {
        setActionType(type);
        data.action = type;

        const newErrors = {};

        if (!docSuffix.trim()) {
            newErrors.document_number = 'Document Number is required.';
        }

        if (!data.journal_date) {
            newErrors.journal_date = 'Journal Date is required.';
        }

        if (!data.reference.trim()) {
            newErrors.reference = 'Reference is required.';
        }

        if (type === 'submit' && !data.general_journal_file) {
            newErrors.general_journal_file = 'General Journal PDF document is required to submit for approval.';
        }

        if (Object.keys(newErrors).length > 0) {
            setClientErrors(newErrors);
            const firstError = Object.values(newErrors)[0];
            toast.error(firstError);
            return;
        }

        setClientErrors({});
        post('/general-journals', {
            forceFormData: true,
            preserveScroll: true,
            onError: (errs) => {
                const first = Object.values(errs)[0];
                if (first) toast.error(first);
            }
        });
    };

    const mergedErrors = { ...errors, ...clientErrors };
    const hasAnyError = Object.values(mergedErrors).some(Boolean);

    return (
        <MainLayout title="Create General Journal Draft">
            <Head title="Create Draft - JAGO" />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Back navigation & Page Title */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Link
                            href="/drafts"
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
                        >
                            <ArrowLeft size={14} /> Back to Drafts
                        </Link>
                        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                            Create General Journal
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            Fill in all required details (*), attach the journal PDF, and optional supporting documents.
                        </p>
                    </div>
                </div>

                {/* Validation Error Banner */}
                {hasAnyError && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-4 shadow-xs animate-in fade-in duration-150">
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-xl bg-red-600 text-white flex items-center justify-center shrink-0">
                                <AlertTriangle size={16} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-xs font-bold text-red-900">
                                    Please correct the following required fields:
                                </h4>
                                <ul className="mt-1.5 list-disc list-inside space-y-0.5 text-xs text-red-700">
                                    {Object.entries(mergedErrors).map(([key, msg]) => msg && (
                                        <li key={key}>{msg}</li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* LEFT COLUMN: Document Information Form (7 Cols) */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Document Information</h3>
                                        <p className="text-[11px] text-slate-500">Provide document number, journal date, and reference description</p>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4.5">
                                    {/* Document Number with JOT Prefix */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                            Document Number <span className="text-red-500">*</span>
                                        </label>
                                        <div className={`flex rounded-xl shadow-xs overflow-hidden border ${mergedErrors.document_number ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-500/20'
                                            } transition-all`}>
                                            <span className="inline-flex items-center px-3.5 bg-slate-100 border-r border-slate-200 text-slate-800 font-extrabold text-xs tracking-wider">
                                                JOT
                                            </span>
                                            <input
                                                type="text"
                                                value={docSuffix}
                                                onChange={handleDocSuffixChange}
                                                className="w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white focus:outline-none placeholder:text-slate-400 font-medium"
                                                placeholder="e.g. 12345 or 2026-001"
                                                required
                                            />
                                        </div>
                                        <p className="text-[11px] text-slate-400 mt-1 flex items-center gap-1">
                                            Full Document Number: <strong className="text-slate-700 font-mono">{data.document_number || 'JOT ...'}</strong>
                                        </p>
                                        {mergedErrors.document_number && (
                                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                                                <AlertCircle size={12} /> {mergedErrors.document_number}
                                            </p>
                                        )}
                                    </div>

                                    {/* Journal Date */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                            Journal Date <span className="text-red-500">*</span>
                                        </label>
                                        <div className="relative">
                                            <input
                                                type="date"
                                                value={data.journal_date}
                                                onChange={e => {
                                                    setData('journal_date', e.target.value);
                                                    if (e.target.value) setClientErrors(prev => ({ ...prev, journal_date: null }));
                                                }}
                                                className={`w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border ${mergedErrors.journal_date ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                                                    } rounded-xl focus:outline-none transition-all`}
                                                required
                                            />
                                        </div>
                                        <p className="text-[11px] text-blue-600/90 mt-1 flex items-center gap-1">
                                            <CheckCircle2 size={12} className="shrink-0" />
                                            This date will automatically be registered as the official approval date on the {auth?.user?.role === 'Section Head' ? 'Accounting & Superior' : 'Accounting'} stamp.
                                        </p>
                                        {mergedErrors.journal_date && (
                                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                                                <AlertCircle size={12} /> {mergedErrors.journal_date}
                                            </p>
                                        )}
                                    </div>

                                    {/* Reference */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                            Reference <span className="text-red-500">*</span>
                                        </label>
                                        <textarea
                                            value={data.reference}
                                            onChange={e => {
                                                setData('reference', e.target.value);
                                                if (e.target.value.trim()) setClientErrors(prev => ({ ...prev, reference: null }));
                                            }}
                                            rows={4}
                                            className={`w-full px-3.5 py-2.5 text-xs text-slate-800 bg-white border ${mergedErrors.reference ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                                                } rounded-xl focus:outline-none transition-all placeholder:text-slate-400 resize-y`}
                                            placeholder="Provide transaction details, reason, or journal remarks (Required)..."
                                            required
                                        />
                                        {mergedErrors.reference && (
                                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                                                <AlertCircle size={12} /> {mergedErrors.reference}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Form Action Buttons */}
                                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => handleFormSubmit('draft')}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                                    >
                                        {processing && actionType === 'draft' ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Saving Draft...
                                            </>
                                        ) : (
                                            <>
                                                <Save size={15} />
                                                Save as Draft
                                            </>
                                        )}
                                    </button>

                                    <button
                                        type="button"
                                        disabled={processing}
                                        onClick={() => handleFormSubmit('submit')}
                                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                    >
                                        {processing && actionType === 'submit' ? (
                                            <>
                                                <Loader2 size={14} className="animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            'Submit for Approval'
                                        )}
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: File Attachments (5 Cols) */}
                        <div className="lg:col-span-5 space-y-6">

                            {/* General Journal PDF Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                            General Journal (PDF) <span className="text-red-500">*</span>
                                        </h3>
                                        <p className="text-[10px] text-slate-500">1 PDF document, max 10 MB</p>
                                    </div>
                                </div>

                                <div className="p-4">
                                    <input
                                        ref={gjInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleGjFileChange}
                                        className="hidden"
                                    />

                                    {gjPreviewUrl ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 bg-slate-50">
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-slate-800 truncate">{gjFileName}</p>
                                                        <p className="text-[10px] text-slate-500">
                                                            {data.general_journal_file ? formatFileSize(data.general_journal_file.size) : ''}
                                                        </p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={removeGjFile}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    title="Remove PDF"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>

                                            <iframe
                                                src={gjPreviewUrl}
                                                className="w-full rounded-xl border border-slate-200 h-64 bg-slate-100"
                                                title="PDF Preview"
                                            />
                                        </div>
                                    ) : (
                                        <div
                                            onClick={() => gjInputRef.current?.click()}
                                            className={`flex flex-col items-center justify-center p-6 border-2 border-dashed ${mergedErrors.general_journal_file
                                                ? 'border-red-400 bg-red-50/30'
                                                : 'border-slate-200 hover:border-blue-500/50 hover:bg-blue-50/20'
                                                } rounded-2xl cursor-pointer transition-all text-center`}
                                        >
                                            <div className={`w-12 h-12 rounded-2xl ${mergedErrors.general_journal_file ? 'bg-red-100 text-red-600' : 'bg-blue-50 text-blue-600'
                                                } flex items-center justify-center mb-2.5`}>
                                                <UploadCloud size={24} />
                                            </div>
                                            <p className="text-xs font-bold text-slate-800">Click to upload General Journal PDF</p>
                                            <p className="text-[11px] text-slate-400 mt-0.5">PDF only, maximum size 10 MB</p>
                                        </div>
                                    )}

                                    {mergedErrors.general_journal_file && (
                                        <p className="mt-2 text-xs text-red-500 font-medium flex items-center gap-1">
                                            <AlertCircle size={12} /> {mergedErrors.general_journal_file}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Supporting Documents Card */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                            Supporting Documents <span className="text-slate-400 font-normal lowercase">(optional)</span>
                                        </h3>
                                        <p className="text-[10px] text-slate-500">PDF, JPG/PNG, Excel (max 10 MB each)</p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">
                                        {sdFiles.length} file(s)
                                    </span>
                                </div>

                                <div className="p-4 space-y-3">
                                    <input
                                        ref={sdInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                                        multiple
                                        onChange={handleSdFilesChange}
                                        className="hidden"
                                    />

                                    <div
                                        onClick={() => sdInputRef.current?.click()}
                                        className="flex flex-col items-center justify-center p-4 border border-dashed border-slate-200 hover:border-blue-500/50 hover:bg-blue-50/20 rounded-xl cursor-pointer transition-all text-center"
                                    >
                                        <UploadCloud size={18} className="text-slate-400 mb-1" />
                                        <p className="text-xs font-semibold text-slate-700">Click to attach supporting files</p>
                                        <p className="text-[10px] text-slate-400">Multiple files allowed</p>
                                    </div>

                                    {errors.supporting_documents && (
                                        <p className="text-xs text-red-500 font-medium">{errors.supporting_documents}</p>
                                    )}

                                    {sdFiles.length > 0 ? (
                                        <div className="space-y-1.5 max-h-56 overflow-y-auto">
                                            {sdFiles.map((file, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50/70"
                                                >
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {getFileIcon(file.name)}
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-slate-800 truncate">{file.name}</p>
                                                            <p className="text-[10px] text-slate-400">{formatFileSize(file.size)}</p>
                                                        </div>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => removeSdFile(i)}
                                                        className="p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-center text-[11px] text-slate-400 py-1">
                                            No supporting files attached yet
                                        </p>
                                    )}
                                </div>
                            </div>

                        </div>
                    </div>
                </form>
            </div>
        </MainLayout>
    );
}