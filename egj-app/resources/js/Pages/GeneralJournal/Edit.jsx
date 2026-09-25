import { Head, useForm, Link, router } from '@inertiajs/react';
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
    AlertTriangle,
    XCircle,
    CheckCircle2,
    Clock,
    History,
    Loader2
} from 'lucide-react';
import MainLayout from '@/Layouts/MainLayout';
import ConfirmModal from '@/Components/ConfirmModal';
import { useState, useRef } from 'react';
import toast from 'react-hot-toast';

export default function Edit({ journal }) {
    const isRevised = journal.status === 'Revised';
    const isDraft = journal.status === 'Draft';

    const latestRevision = journal.approvals?.filter(a => a.status === 'Revised' || a.status === 'Rejected').pop()
        || journal.histories?.filter(h => h.action === 'revise' || h.action === 'reject').pop();

    const [docSuffix, setDocSuffix] = useState(
        journal.document_number.replace(/^JOT\s*[-_]?\s*/i, '')
    );
    const [actionType, setActionType] = useState('update');
    const [isSubmittingDraft, setIsSubmittingDraft] = useState(false);

    const { data, setData, post, processing, errors } = useForm({
        document_number: journal.document_number,
        journal_date: journal.journal_date ? journal.journal_date.split('T')[0] : '',
        reference: journal.reference || '',
        general_journal_file: null,
        supporting_documents: [],
        notes: '',
    });

    const [gjFileName, setGjFileName] = useState('');
    const [gjPreviewUrl, setGjPreviewUrl] = useState(null);
    const [sdFiles, setSdFiles] = useState([]);
    const gjInputRef = useRef(null);
    const sdInputRef = useRef(null);

    const [selfRejectModalOpen, setSelfRejectModalOpen] = useState(false);
    const [resubmitModalOpen, setResubmitModalOpen] = useState(false);

    const existingGjFile = journal.active_files?.find(f => f.category === 'general_journal');
    const existingSupFiles = journal.active_files?.filter(f => f.category === 'supporting_document') || [];

    const handleDocSuffixChange = (e) => {
        const val = e.target.value;
        const cleanVal = val.replace(/^JOT\s*[-_]?\s*/i, '');
        setDocSuffix(cleanVal);
        setData('document_number', cleanVal ? `JOT ${cleanVal}` : '');
    };

    const handleGjFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setData('general_journal_file', file);
            setGjFileName(file.name);
            setGjPreviewUrl(URL.createObjectURL(file));
        }
        if (gjInputRef.current) gjInputRef.current.value = '';
    };

    const removeNewGjFile = () => {
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
        if (!bytes) return '';
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / 1048576).toFixed(1)} MB`;
    };

    const [clientErrors, setClientErrors] = useState({});

    // Save draft update
    const handleUpdateDraft = () => {
        const newErrs = {};
        if (!docSuffix.trim()) newErrs.document_number = 'Document Number is required.';
        if (!data.journal_date) newErrs.journal_date = 'Journal Date is required.';
        if (!data.reference.trim()) newErrs.reference = 'Reference / Description is required.';

        if (Object.keys(newErrs).length > 0) {
            setClientErrors(newErrs);
            toast.error(Object.values(newErrs)[0]);
            return;
        }

        setClientErrors({});
        setActionType('update');
        post(`/general-journals/${journal.id}/update`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => toast.success('Draft updated successfully.'),
            onError: (errs) => {
                const first = Object.values(errs)[0];
                if (first) toast.error(first);
            }
        });
    };

    // Submit draft for approval
    const handleSubmitDraft = () => {
        const newErrs = {};
        if (!docSuffix.trim()) newErrs.document_number = 'Document Number is required.';
        if (!data.journal_date) newErrs.journal_date = 'Journal Date is required.';
        if (!data.reference.trim()) newErrs.reference = 'Reference / Description is required.';
        if (!existingGjFile && !data.general_journal_file) {
            newErrs.general_journal_file = 'General Journal PDF document is required before submitting for approval.';
        }

        if (Object.keys(newErrs).length > 0) {
            setClientErrors(newErrs);
            toast.error(Object.values(newErrs)[0]);
            return;
        }

        setClientErrors({});
        setIsSubmittingDraft(true);
        router.post(`/general-journals/${journal.id}/submit`, {}, {
            onSuccess: () => {
                setIsSubmittingDraft(false);
                toast.success('Draft submitted for approval.');
            },
            onError: (errs) => {
                setIsSubmittingDraft(false);
                const first = Object.values(errs)[0];
                if (first) toast.error(first);
            },
            onFinish: () => setIsSubmittingDraft(false)
        });
    };

    // Resubmit revised document
    const handleConfirmResubmit = () => {
        const newErrs = {};
        if (!data.reference.trim()) newErrs.reference = 'Reference / Description is required.';
        if (!existingGjFile && !data.general_journal_file) {
            newErrs.general_journal_file = 'General Journal PDF document is required to resubmit.';
        }

        if (Object.keys(newErrs).length > 0) {
            setClientErrors(newErrs);
            toast.error(Object.values(newErrs)[0]);
            return;
        }

        setClientErrors({});
        post(`/general-journals/${journal.id}/resubmit`, {
            forceFormData: true,
            preserveScroll: true,
            onSuccess: () => {
                setResubmitModalOpen(false);
                toast.success('Document resubmitted successfully for approval.');
            },
            onError: (errs) => {
                const first = Object.values(errs)[0];
                if (first) toast.error(first);
            }
        });
    };

    // Self-reject revised document
    const handleConfirmSelfReject = () => {
        post(`/general-journals/${journal.id}/self-reject`, {
            notes: data.notes || 'Document rejected and closed by requester.',
            onSuccess: () => {
                setSelfRejectModalOpen(false);
                toast.success('Document has been rejected and closed.');
            },
        });
    };

    const mergedErrors = { ...errors, ...clientErrors };
    const hasAnyError = Object.values(mergedErrors).some(Boolean);

    return (
        <MainLayout title={isRevised ? "Revise & Resubmit Document" : "Edit Draft"}>
            <Head title={isRevised ? "Revise Document - JAGO" : "Edit Draft - JAGO"} />

            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header Navigation */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <Link
                            href={isDraft ? "/drafts" : "/monitoring"}
                            className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors mb-2"
                        >
                            <ArrowLeft size={14} /> Back to {isDraft ? "Drafts" : "Monitoring"}
                        </Link>
                        <h1 className="text-2xl font-black text-slate-900 tracking-tight">
                            {isRevised ? `Revise Document: ${journal.document_number}` : `Edit Draft: ${journal.document_number}`}
                        </h1>
                        <p className="text-xs text-slate-500 mt-0.5">
                            {isRevised
                                ? "Update your documents based on the auditor notes and resubmit for approval review."
                                : "Modify draft information and attachments before submitting into workflow."
                            }
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {isRevised && (
                            <button
                                type="button"
                                onClick={() => setSelfRejectModalOpen(true)}
                                className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl transition-colors cursor-pointer"
                            >
                                <XCircle size={14} />
                                Self-Reject (Cancel Document)
                            </button>
                        )}
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

                {/* Revision Notes Alert Banner */}
                {isRevised && (
                    <div className="bg-amber-50 border border-amber-200/90 rounded-2xl p-4.5 shadow-xs">
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                                <AlertTriangle size={18} />
                            </div>
                            <div className="flex-1">
                                <h4 className="text-sm font-bold text-amber-900">
                                    Revision Requested by Approver
                                </h4>
                                <p className="text-xs text-amber-800/90 mt-1 font-medium leading-relaxed bg-amber-100/60 p-3 rounded-xl border border-amber-200/60">
                                    {latestRevision?.notes || "Please revise the journal details and upload updated files."}
                                </p>
                                <p className="text-[11px] text-amber-700/80 mt-2">
                                    💡 <em>Uploading new files below will automatically replace the old files. You can also self-reject this document if you wish to cancel it permanently.</em>
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                <form onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

                        {/* LEFT COLUMN: Document Information (7 Cols) */}
                        <div className="lg:col-span-7 space-y-6">
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="px-5 py-4 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                                    <div>
                                        <h3 className="text-sm font-bold text-slate-900">Document Details</h3>
                                        <p className="text-[11px] text-slate-500">Document identification and reference remarks</p>
                                    </div>
                                </div>

                                <div className="p-5 space-y-4.5">
                                    {/* Document Number */}
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
                                                disabled={isRevised}
                                                value={docSuffix}
                                                onChange={handleDocSuffixChange}
                                                className={`w-full px-3.5 py-2.5 text-xs text-slate-800 ${isRevised ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                                                    } focus:outline-none font-medium`}
                                                required
                                            />
                                        </div>
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
                                        <input
                                            type="date"
                                            disabled={isRevised}
                                            value={data.journal_date}
                                            onChange={e => {
                                                setData('journal_date', e.target.value);
                                                if (e.target.value) setClientErrors(prev => ({ ...prev, journal_date: null }));
                                            }}
                                            className={`w-full px-3.5 py-2.5 text-xs text-slate-800 ${isRevised ? 'bg-slate-50 cursor-not-allowed' : 'bg-white'
                                                } border ${mergedErrors.journal_date ? 'border-red-400 ring-2 ring-red-400/20' : 'border-slate-200 focus:border-blue-600 focus:ring-2 focus:ring-blue-500/20'
                                                } rounded-xl focus:outline-none`}
                                            required
                                        />
                                        <p className="text-[11px] text-blue-600/90 mt-1 flex items-center gap-1">
                                            <CheckCircle2 size={12} className="shrink-0" />
                                            Official Accounting approval stamp date: <strong className="font-mono">{data.journal_date}</strong>
                                        </p>
                                        {mergedErrors.journal_date && (
                                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                                                <AlertCircle size={12} /> {mergedErrors.journal_date}
                                            </p>
                                        )}
                                    </div>

                                    {/* Reference / Remarks */}
                                    <div>
                                        <label className="block text-xs font-bold text-slate-700 uppercase tracking-wide mb-1.5">
                                            Reference / Description <span className="text-red-500">*</span>
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
                                            placeholder="Provide updated notes or journal description (Required)..."
                                            required
                                        />
                                        {mergedErrors.reference && (
                                            <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                                                <AlertCircle size={12} /> {mergedErrors.reference}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {/* Bottom Form Action Buttons */}
                                <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
                                    {isDraft ? (
                                        <>
                                            <button
                                                type="button"
                                                disabled={processing || isSubmittingDraft}
                                                onClick={handleUpdateDraft}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors disabled:opacity-50 cursor-pointer"
                                            >
                                                {processing && actionType === 'update' ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        Saving Draft...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save size={15} />
                                                        Save Draft Changes
                                                    </>
                                                )}
                                            </button>

                                            <button
                                                type="button"
                                                disabled={processing || isSubmittingDraft}
                                                onClick={handleSubmitDraft}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                {isSubmittingDraft ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    'Submit for Approval'
                                                )}
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <button
                                                type="button"
                                                disabled={processing}
                                                onClick={() => setSelfRejectModalOpen(true)}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 text-xs font-semibold transition-colors cursor-pointer"
                                            >
                                                <XCircle size={15} />
                                                Self-Reject
                                            </button>

                                            <button
                                                type="button"
                                                disabled={processing}
                                                onClick={() => {
                                                    if (!existingGjFile && !data.general_journal_file) {
                                                        setClientErrors(prev => ({ ...prev, general_journal_file: 'General Journal PDF document is required to resubmit.' }));
                                                        toast.error('General Journal PDF document is required to resubmit.');
                                                        return;
                                                    }
                                                    if (!data.reference.trim()) {
                                                        setClientErrors(prev => ({ ...prev, reference: 'Reference / Description is required.' }));
                                                        toast.error('Reference / Description is required.');
                                                        return;
                                                    }
                                                    setResubmitModalOpen(true);
                                                }}
                                                className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                Resubmit for Approval
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN: File Attachments (5 Cols) */}
                        <div className="lg:col-span-5 space-y-6">

                            {/* General Journal PDF */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                            General Journal (PDF) <span className="text-red-500">*</span>
                                        </h3>
                                        <p className="text-[10px] text-slate-500">1 PDF file, max 10 MB</p>
                                    </div>
                                    {existingGjFile && !gjFileName && (
                                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                                            Current Active File
                                        </span>
                                    )}
                                </div>

                                <div className="p-4 space-y-3">
                                    {/* Existing Active File Info */}
                                    {existingGjFile && !gjFileName && (
                                        <div className="p-3 rounded-xl border border-slate-200 bg-slate-50/80 flex items-center justify-between">
                                            <div className="flex items-center gap-2.5 overflow-hidden">
                                                <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-700 shrink-0">
                                                    <FileText size={16} />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-slate-800 truncate">{existingGjFile.file_name}</p>
                                                    <p className="text-[10px] text-slate-500">
                                                        {formatFileSize(existingGjFile.file_size)} &bull; v{existingGjFile.version || 1}
                                                    </p>
                                                </div>
                                            </div>
                                            <a
                                                href={`/files/${existingGjFile.id}/preview`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="px-2.5 py-1 text-[11px] font-bold text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            >
                                                View
                                            </a>
                                        </div>
                                    )}

                                    {/* New Upload Selector */}
                                    <input
                                        ref={gjInputRef}
                                        type="file"
                                        accept=".pdf"
                                        onChange={handleGjFileChange}
                                        className="hidden"
                                    />

                                    {gjPreviewUrl ? (
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between p-3 rounded-xl border border-blue-200 bg-blue-50/50">
                                                <div className="flex items-center gap-2.5 overflow-hidden">
                                                    <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shrink-0">
                                                        <FileText size={16} />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-blue-950 truncate">{gjFileName}</p>
                                                        <p className="text-[10px] text-blue-600 font-semibold">New Replacement File</p>
                                                    </div>
                                                </div>

                                                <button
                                                    type="button"
                                                    onClick={removeNewGjFile}
                                                    className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                                                >
                                                    <X size={15} />
                                                </button>
                                            </div>

                                            <iframe
                                                src={gjPreviewUrl}
                                                className="w-full rounded-xl border border-slate-200 h-64 bg-slate-100"
                                                title="New PDF Preview"
                                            />
                                        </div>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => gjInputRef.current?.click()}
                                            className={`w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed ${mergedErrors.general_journal_file ? 'border-red-400 bg-red-50/30' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/30'
                                                } rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer`}
                                        >
                                            <UploadCloud size={16} className={mergedErrors.general_journal_file ? 'text-red-600' : 'text-blue-600'} />
                                            {existingGjFile ? "Upload Replacement PDF" : "Upload General Journal PDF"}
                                        </button>
                                    )}

                                    {mergedErrors.general_journal_file && (
                                        <p className="mt-1 text-xs text-red-500 font-medium flex items-center gap-1">
                                            <AlertCircle size={12} /> {mergedErrors.general_journal_file}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Supporting Documents */}
                            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                                <div className="px-5 py-3.5 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                                    <div>
                                        <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                                            Supporting Documents <span className="text-slate-400 font-normal lowercase">(optional)</span>
                                        </h3>
                                        <p className="text-[10px] text-slate-500">PDF, JPG/PNG, Excel</p>
                                    </div>
                                    <span className="text-xs font-bold text-slate-500">
                                        {existingSupFiles.length + sdFiles.length} file(s)
                                    </span>
                                </div>

                                <div className="p-4 space-y-3">
                                    {/* Existing Active Supporting Files */}
                                    {existingSupFiles.length > 0 && sdFiles.length === 0 && (
                                        <div className="space-y-1.5 max-h-44 overflow-y-auto">
                                            {existingSupFiles.map(file => (
                                                <div key={file.id} className="flex items-center justify-between p-2.5 rounded-xl border border-slate-100 bg-slate-50">
                                                    <div className="flex items-center gap-2 overflow-hidden">
                                                        {getFileIcon(file.file_name)}
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-medium text-slate-800 truncate">{file.file_name}</p>
                                                            <p className="text-[10px] text-slate-400">{formatFileSize(file.file_size)}</p>
                                                        </div>
                                                    </div>
                                                    <a
                                                        href={`/files/${file.id}/download`}
                                                        className="text-[11px] text-blue-600 font-bold hover:underline"
                                                    >
                                                        Download
                                                    </a>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Upload Replacement Files */}
                                    <input
                                        ref={sdInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls"
                                        multiple
                                        onChange={handleSdFilesChange}
                                        className="hidden"
                                    />

                                    <button
                                        type="button"
                                        onClick={() => sdInputRef.current?.click()}
                                        className="w-full flex items-center justify-center gap-2 py-3 px-4 border border-dashed border-slate-300 hover:border-blue-500 hover:bg-blue-50/30 rounded-xl text-xs font-bold text-slate-700 transition-all cursor-pointer"
                                    >
                                        <UploadCloud size={16} className="text-blue-600" />
                                        {existingSupFiles.length > 0 ? "Replace All Supporting Files" : "Attach Supporting Files"}
                                    </button>

                                    {/* New Selected Files List */}
                                    {sdFiles.length > 0 && (
                                        <div className="space-y-1.5 max-h-48 overflow-y-auto pt-2 border-t border-slate-100">
                                            <p className="text-[11px] font-bold text-blue-900">New Files to Upload:</p>
                                            {sdFiles.map((file, i) => (
                                                <div key={i} className="flex items-center justify-between p-2.5 rounded-xl border border-blue-100 bg-blue-50/40">
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
                                                        className="p-1 text-slate-400 hover:text-red-600 transition-colors"
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
                    </div>
                </form>
            </div>

            {/* Confirm Resubmit Modal */}
            <ConfirmModal
                isOpen={resubmitModalOpen}
                title="Resubmit General Journal"
                message="Are you sure you want to resubmit this document for approval review? The approval chain will be restarted and notifications will be sent to the approver."
                confirmText="Yes, Resubmit"
                cancelText="Cancel"
                type="primary"
                loading={processing}
                onConfirm={handleConfirmResubmit}
                onCancel={() => !processing && setResubmitModalOpen(false)}
            />

            {/* Confirm Self-Reject Modal */}
            <ConfirmModal
                isOpen={selfRejectModalOpen}
                title="Self-Reject & Cancel Document"
                message="Are you sure you want to cancel and reject this document permanently? Once rejected, this document will be closed and cannot be edited or resubmitted again."
                confirmText="Yes, Reject Permanently"
                cancelText="Keep Document"
                type="danger"
                loading={processing}
                onConfirm={handleConfirmSelfReject}
                onCancel={() => !processing && setSelfRejectModalOpen(false)}
            />
        </MainLayout>
    );
}
