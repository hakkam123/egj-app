import React, { useState, useEffect, useRef } from 'react';
import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '@/Layouts/MainLayout';
import ConfirmModal from '@/Components/ConfirmModal';
import FileModal from '@/Components/FileModal';
import {
    FileEdit,
    Plus,
    Send,
    Trash2,
    Search,
    FileText,
    Paperclip,
    Calendar,
    CheckSquare,
    Square,
    AlertCircle,
    AlertTriangle,
    RotateCcw,
    Eye,
    Download,
    X,
    CheckCircle2
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function Drafts({ drafts, filters, stats }) {
    const [selectedIds, setSelectedIds] = useState([]);
    
    // Filters & in-column search states
    const [search, setSearch] = useState(filters?.search || '');
    const [docNumber, setDocNumber] = useState(filters?.doc_number || '');
    const [journalDate, setJournalDate] = useState(filters?.date || filters?.journal_date || '');
    const [reference, setReference] = useState(filters?.reference || '');
    const [fileName, setFileName] = useState(filters?.file_name || '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');

    // Modals
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [deleteTargetId, setDeleteTargetId] = useState(null);
    const [bulkSubmitModalOpen, setBulkSubmitModalOpen] = useState(false);
    const [singleSubmitModalOpen, setSingleSubmitModalOpen] = useState(false);
    const [singleSubmitTarget, setSingleSubmitTarget] = useState(null);
    const [incompleteModalOpen, setIncompleteModalOpen] = useState(false);
    const [incompleteTarget, setIncompleteTarget] = useState(null);
    const [fileModal, setFileModal] = useState({ open: false, journalId: null });

    const isInitialMount = useRef(true);
    const draftList = drafts?.data || [];
    const allSelected = draftList.length > 0 && draftList.every(d => selectedIds.includes(d.id));

    // Calculate ready vs incomplete drafts for selected IDs
    const selectedDrafts = draftList.filter(d => selectedIds.includes(d.id));
    const readySelectedDrafts = selectedDrafts.filter(d => 
        d.active_files?.some(f => f.category === 'general_journal') && d.reference && d.journal_date
    );
    const incompleteSelectedDrafts = selectedDrafts.filter(d => 
        !d.active_files?.some(f => f.category === 'general_journal') || !d.reference || !d.journal_date
    );

    const updateFilters = (overrides = {}) => {
        const queryParams = {
            search,
            doc_number: docNumber,
            date: journalDate,
            reference,
            file_name: fileName,
            date_from: dateFrom,
            date_to: dateTo,
            ...overrides,
        };

        const cleaned = {};
        Object.entries(queryParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                cleaned[k] = v;
            }
        });

        router.get('/drafts', cleaned, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounce for in-column search inputs
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            updateFilters();
        }, 400);

        return () => clearTimeout(timer);
    }, [docNumber, journalDate, reference, fileName]);

    const handleSelectAll = () => {
        if (allSelected) {
            setSelectedIds([]);
        } else {
            setSelectedIds(draftList.map(d => d.id));
        }
    };

    const handleToggleSelect = (id) => {
        if (selectedIds.includes(id)) {
            setSelectedIds(selectedIds.filter(item => item !== id));
        } else {
            setSelectedIds([...selectedIds, id]);
        }
    };

    const handleClearFilter = () => {
        setSearch('');
        setDocNumber('');
        setJournalDate('');
        setReference('');
        setFileName('');
        setDateFrom('');
        setDateTo('');
        router.get('/drafts', {}, { preserveState: true, replace: true });
    };

    const handleConfirmDelete = () => {
        if (!deleteTargetId) return;
        router.delete(`/general-journals/${deleteTargetId}`, {
            onSuccess: () => {
                setDeleteModalOpen(false);
                setDeleteTargetId(null);
                setSelectedIds(prev => prev.filter(id => id !== deleteTargetId));
                toast.success('Draft deleted successfully.');
            },
            onError: () => {
                toast.error('Failed to delete draft.');
            }
        });
    };

    const handleRowSubmitClick = (journal) => {
        const hasGj = journal.active_files?.some(f => f.category === 'general_journal');
        const hasRef = Boolean(journal.reference?.trim());
        const hasDate = Boolean(journal.journal_date);

        if (!hasGj || !hasRef || !hasDate) {
            setIncompleteTarget({
                journal,
                missingGj: !hasGj,
                missingRef: !hasRef,
                missingDate: !hasDate,
            });
            setIncompleteModalOpen(true);
            return;
        }

        setSingleSubmitTarget(journal);
        setSingleSubmitModalOpen(true);
    };

    const handleConfirmSingleSubmit = () => {
        if (!singleSubmitTarget) return;
        router.post(`/general-journals/${singleSubmitTarget.id}/submit`, {}, {
            onSuccess: () => {
                setSingleSubmitModalOpen(false);
                setSingleSubmitTarget(null);
                setSelectedIds(prev => prev.filter(id => id !== singleSubmitTarget.id));
                toast.success('Draft submitted successfully for approval.');
            },
            onError: (errs) => {
                const first = typeof errs === 'object' ? Object.values(errs)[0] : null;
                toast.error(first || 'Failed to submit draft.');
            }
        });
    };

    const handleConfirmBulkSubmit = (onlyReady = false) => {
        const targetIds = onlyReady 
            ? readySelectedDrafts.map(d => d.id) 
            : (readySelectedDrafts.length > 0 ? readySelectedDrafts.map(d => d.id) : selectedIds);

        if (targetIds.length === 0) {
            toast.error('No valid drafts to submit.');
            return;
        }

        router.post('/general-journals/bulk-submit', {
            ids: targetIds,
        }, {
            onSuccess: () => {
                setBulkSubmitModalOpen(false);
                setSelectedIds([]);
                toast.success(`${targetIds.length} draft(s) submitted for approval.`);
            },
            onError: (errs) => {
                const first = typeof errs === 'object' ? Object.values(errs)[0] : null;
                toast.error(first || 'Failed to bulk submit drafts.');
            }
        });
    };

    const hasActiveFilters = search || docNumber || journalDate || reference || fileName || dateFrom || dateTo;

    return (
        <MainLayout>
            <Head title="Draft Documents - JAGO" />

            {/* Page Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        Draft Documents
                    </h1>
                    <p className="text-xs text-slate-500 mt-1">
                        Manage prepared General Journal drafts and bulk submit them into the approval workflow.
                    </p>
                </div>

                <div className="flex items-center gap-2.5">
                    {hasActiveFilters && (
                        <button
                            type="button"
                            onClick={handleClearFilter}
                            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-600 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl transition-colors cursor-pointer"
                        >
                            <RotateCcw size={14} /> Clear Filters
                        </button>
                    )}

                    <Link
                        href="/general-journals/create"
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-500/20 transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                        <Plus size={16} />
                        Create New Draft
                    </Link>
                </div>
            </div>

            {/* Bulk Actions Banner */}
            {selectedIds.length > 0 && (
                <div className="bg-blue-50 border border-blue-200/80 rounded-2xl p-3.5 mb-5 flex items-center justify-between shadow-xs animate-in fade-in slide-in-from-top-2 duration-150">
                    <div className="flex items-center gap-2.5 text-xs font-semibold text-blue-900">
                        <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-blue-600 text-white font-bold text-xs">
                            {selectedIds.length}
                        </span>
                        <span>draft document(s) selected for bulk submission</span>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            type="button"
                            onClick={() => setSelectedIds([])}
                            className="px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100/70 rounded-lg transition-colors cursor-pointer"
                        >
                            Deselect All
                        </button>
                        <button
                            type="button"
                            onClick={() => setBulkSubmitModalOpen(true)}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm shadow-blue-600/30 transition-all hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                        >
                            <Send size={14} />
                            Bulk Submit ({selectedIds.length})
                        </button>
                    </div>
                </div>
            )}

            {/* Drafts Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-slate-600 border-collapse">
                        <thead>
                            {/* Table Header */}
                            <tr className="bg-slate-50/90 border-b border-slate-200 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
                                <th className="p-3 w-10 text-center">
                                    <button
                                        type="button"
                                        onClick={handleSelectAll}
                                        className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                        title={allSelected ? 'Deselect All' : 'Select All'}
                                    >
                                        {allSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                                    </button>
                                </th>
                                <th className="py-3 px-3 w-12 text-center">#</th>
                                <th className="py-3 px-3 min-w-[170px]">Document Number</th>
                                <th className="py-3 px-3 min-w-[130px]">Journal Date</th>
                                <th className="py-3 px-3 min-w-[180px]">Reference</th>
                                <th className="py-3 px-3 min-w-[200px]">Attached Files</th>
                                <th className="py-3 px-3 min-w-[130px]">Last Updated</th>
                                <th className="py-3 px-4 text-right min-w-[120px]">Actions</th>
                            </tr>

                            {/* In-Column Search Row */}
                            <tr className="bg-slate-100/70 border-b border-slate-200/80">
                                <td className="py-1.5 px-2 text-center"></td>
                                <td className="py-1.5 px-2 text-center text-slate-400 font-mono text-[10px]">-</td>
                                
                                {/* In Search: Document Number */}
                                <td className="py-1.5 px-2.5">
                                    <div className="relative">
                                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search Doc..."
                                            value={docNumber}
                                            onChange={(e) => setDocNumber(e.target.value)}
                                            className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400 font-medium text-slate-700"
                                        />
                                    </div>
                                </td>

                                {/* In Search: Journal Date */}
                                <td className="py-1.5 px-2.5">
                                    <input
                                        type="date"
                                        value={journalDate}
                                        onChange={(e) => {
                                            setJournalDate(e.target.value);
                                            updateFilters({ date: e.target.value });
                                        }}
                                        className="w-full px-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 text-slate-700 font-medium"
                                    />
                                </td>

                                {/* In Search: Reference */}
                                <td className="py-1.5 px-2.5">
                                    <div className="relative">
                                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search Reference..."
                                            value={reference}
                                            onChange={(e) => setReference(e.target.value)}
                                            className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400 font-medium text-slate-700"
                                        />
                                    </div>
                                </td>

                                {/* In Search: Attached Files */}
                                <td className="py-1.5 px-2.5">
                                    <div className="relative">
                                        <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Search File Name..."
                                            value={fileName}
                                            onChange={(e) => setFileName(e.target.value)}
                                            className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-slate-200 rounded-lg focus:outline-none focus:border-blue-600 placeholder:text-slate-400 font-medium text-slate-700"
                                        />
                                    </div>
                                </td>

                                <td className="py-1.5 px-2.5 text-center text-slate-400 font-mono text-[10px]">-</td>
                                <td className="py-1.5 px-2 text-right">
                                    {hasActiveFilters && (
                                        <button
                                            type="button"
                                            onClick={handleClearFilter}
                                            className="p-1 rounded text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                                            title="Clear filters"
                                        >
                                            <RotateCcw size={13} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {draftList.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="py-16 text-center text-slate-400">
                                        <div className="max-w-sm mx-auto flex flex-col items-center">
                                            <div className="w-14 h-14 rounded-2xl bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
                                                <FileEdit size={28} />
                                            </div>
                                            <p className="text-sm font-bold text-slate-700">No Drafts Found</p>
                                            <p className="text-xs text-slate-400 mt-1 mb-4">
                                                {hasActiveFilters ? 'No draft documents match your filter criteria.' : 'You do not have any saved draft documents at the moment.'}
                                            </p>
                                            {hasActiveFilters && (
                                                <button
                                                    type="button"
                                                    onClick={handleClearFilter}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                                                >
                                                    <RotateCcw size={13} /> Reset Filters
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                draftList.map((journal, index) => {
                                    const isSelected = selectedIds.includes(journal.id);
                                    const rowNum = (drafts.current_page - 1) * drafts.per_page + index + 1;
                                    const gjFile = journal.active_files?.find(f => f.category === 'general_journal');
                                    const supFiles = journal.active_files?.filter(f => f.category === 'supporting_document') || [];

                                    return (
                                        <tr
                                            key={journal.id}
                                            className={`hover:bg-slate-50/70 transition-colors ${isSelected ? 'bg-blue-50/30' : ''}`}
                                        >
                                            {/* Checkbox */}
                                            <td className="p-3 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleToggleSelect(journal.id)}
                                                    className="text-slate-400 hover:text-blue-600 transition-colors cursor-pointer"
                                                >
                                                    {isSelected ? <CheckSquare size={16} className="text-blue-600" /> : <Square size={16} />}
                                                </button>
                                            </td>

                                            {/* # Row Number */}
                                            <td className="py-3 px-3 text-center text-slate-400 font-mono">
                                                {rowNum}
                                            </td>

                                            {/* Document Number */}
                                            <td className="py-3 px-3">
                                                <Link
                                                    href={`/general-journals/${journal.id}/edit`}
                                                    className="font-extrabold text-slate-900 hover:text-blue-600 hover:underline tracking-tight"
                                                >
                                                    {journal.document_number}
                                                </Link>
                                            </td>

                                            {/* Journal Date */}
                                            <td className="py-3 px-3 font-medium text-slate-700">
                                                {journal.journal_date ? new Date(journal.journal_date).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : '-'}
                                            </td>

                                            {/* Reference */}
                                            <td className="py-3 px-3 max-w-xs truncate text-slate-600 font-normal" title={journal.reference}>
                                                {journal.reference || '-'}
                                            </td>

                                            {/* Attached Files */}
                                            <td className="py-3 px-3">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-1.5 flex-wrap">
                                                        {gjFile ? (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFileModal({ open: true, journalId: journal.id })}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-red-50 hover:bg-red-100/80 border border-red-200 text-[10px] font-bold text-red-700 transition-colors cursor-pointer"
                                                                title={`GJ: ${gjFile.file_name}`}
                                                            >
                                                                <FileText size={11} />
                                                                <span className="max-w-[120px] truncate">{gjFile.file_name}</span>
                                                            </button>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-700">
                                                                <AlertCircle size={11} /> Missing PDF
                                                            </span>
                                                        )}

                                                        {supFiles.length > 0 && (
                                                            <button
                                                                type="button"
                                                                onClick={() => setFileModal({ open: true, journalId: journal.id })}
                                                                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-slate-100 hover:bg-slate-200 border border-slate-200 text-[10px] font-semibold text-slate-700 transition-colors cursor-pointer"
                                                                title={`${supFiles.length} supporting attachment(s)`}
                                                            >
                                                                <Paperclip size={11} /> {supFiles.length} file{supFiles.length > 1 ? 's' : ''}
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Last Updated */}
                                            <td className="py-3 px-3 text-slate-500 text-[11px] font-mono">
                                                {journal.last_updated_at ? new Date(journal.last_updated_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '-'}
                                            </td>

                                            {/* Actions */}
                                            <td className="py-3 px-4 text-right">
                                                <div className="flex items-center justify-end gap-1.5">
                                                    <Link
                                                        href={`/general-journals/${journal.id}/edit`}
                                                        className="px-2.5 py-1.5 rounded-lg text-slate-600 hover:text-blue-600 hover:bg-blue-50 text-xs font-semibold transition-colors"
                                                        title="Edit Draft"
                                                    >
                                                        Edit
                                                    </Link>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRowSubmitClick(journal)}
                                                        className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-2xs ${
                                                            gjFile && journal.reference
                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white cursor-pointer'
                                                                : 'bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 cursor-pointer'
                                                        }`}
                                                        title={gjFile && journal.reference ? 'Submit for Approval' : 'Incomplete draft - click to view details'}
                                                    >
                                                        <Send size={12} /> Submit
                                                    </button>

                                                    <button
                                                        type="button"
                                                        onClick={() => {
                                                            setDeleteTargetId(journal.id);
                                                            setDeleteModalOpen(true);
                                                        }}
                                                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                                        title="Delete Draft"
                                                    >
                                                        <Trash2 size={15} />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {drafts?.links && drafts.links.length > 3 && (
                    <div className="px-5 py-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                        <p className="text-xs text-slate-500">
                            Showing <span className="font-bold text-slate-800">{drafts.from || 0}</span> to <span className="font-bold text-slate-800">{drafts.to || 0}</span> of <span className="font-bold text-slate-800">{drafts.total || 0}</span> drafts
                        </p>
                        <div className="flex items-center gap-1 flex-wrap">
                            {drafts.links.map((link, idx) => (
                                <Link
                                    key={idx}
                                    href={link.url || '#'}
                                    preserveScroll
                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${link.active
                                        ? 'bg-blue-600 text-white font-bold'
                                        : !link.url
                                            ? 'text-slate-300 cursor-not-allowed'
                                            : 'text-slate-600 hover:bg-slate-200/70'
                                        }`}
                                    dangerouslySetInnerHTML={{ __html: link.label }}
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>

            {/* Single Submit Modal */}
            <ConfirmModal
                open={singleSubmitModalOpen}
                title="Submit Draft for Approval"
                message={`Are you sure you want to submit draft document "${singleSubmitTarget?.document_number}" into the approval workflow?`}
                confirmText="Yes, Submit"
                cancelText="Cancel"
                type="primary"
                onConfirm={handleConfirmSingleSubmit}
                onClose={() => {
                    setSingleSubmitModalOpen(false);
                    setSingleSubmitTarget(null);
                }}
            />

            {/* Incomplete Draft Warning Modal */}
            {incompleteModalOpen && incompleteTarget && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={() => setIncompleteModalOpen(false)}>
                    <div 
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden animate-in fade-in zoom-in duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                                    <AlertTriangle size={20} />
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-slate-900">
                                        Cannot Submit Incomplete Draft
                                    </h3>
                                    <p className="text-xs text-slate-600 mt-1">
                                        Draft <strong className="text-slate-900 font-mono">{incompleteTarget.journal?.document_number}</strong> is missing required items before it can be submitted:
                                    </p>

                                    <div className="mt-3 p-3 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1.5 text-xs text-amber-900">
                                        {incompleteTarget.missingGj && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-500 font-bold">✕</span>
                                                <span>General Journal PDF document is missing</span>
                                            </div>
                                        )}
                                        {incompleteTarget.missingRef && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-500 font-bold">✕</span>
                                                <span>Reference / Description is required</span>
                                            </div>
                                        )}
                                        {incompleteTarget.missingDate && (
                                            <div className="flex items-center gap-2">
                                                <span className="text-red-500 font-bold">✕</span>
                                                <span>Journal Date is required</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <button 
                                    onClick={() => setIncompleteModalOpen(false)} 
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setIncompleteModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <Link
                                href={`/general-journals/${incompleteTarget.journal?.id}/edit`}
                                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
                            >
                                <FileEdit size={14} /> Edit Draft & Complete
                            </Link>
                        </div>
                    </div>
                </div>
            )}

            {/* Bulk Submit Modal with Incomplete Draft Detection */}
            {bulkSubmitModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={() => setBulkSubmitModalOpen(false)}>
                    <div 
                        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden animate-in fade-in zoom-in duration-150"
                        onClick={e => e.stopPropagation()}
                    >
                        <div className="p-6">
                            <div className="flex items-start gap-4">
                                <div className={`w-10 h-10 rounded-xl ${
                                    incompleteSelectedDrafts.length > 0 
                                        ? (readySelectedDrafts.length > 0 ? 'bg-amber-100 text-amber-600' : 'bg-red-100 text-red-600')
                                        : 'bg-blue-100 text-blue-600'
                                } flex items-center justify-center shrink-0`}>
                                    {incompleteSelectedDrafts.length > 0 ? <AlertTriangle size={20} /> : <Send size={20} />}
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-base font-bold text-slate-900">
                                        Bulk Submit Drafts ({selectedIds.length} Selected)
                                    </h3>

                                    {incompleteSelectedDrafts.length === 0 ? (
                                        <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                                            Are you sure you want to submit all <strong>{selectedIds.length}</strong> selected draft documents simultaneously into the approval workflow?
                                        </p>
                                    ) : (
                                        <div className="mt-2 space-y-2.5">
                                            <p className="text-xs text-slate-600">
                                                <strong>{incompleteSelectedDrafts.length} of {selectedIds.length}</strong> selected draft(s) cannot be submitted because of missing required PDF documents or details:
                                            </p>

                                            <div className="max-h-36 overflow-y-auto p-2.5 rounded-xl bg-amber-50 border border-amber-200/80 space-y-1.5 text-xs">
                                                {incompleteSelectedDrafts.map(d => {
                                                    const missingGj = !d.active_files?.some(f => f.category === 'general_journal');
                                                    const missingRef = !d.reference;
                                                    return (
                                                        <div key={d.id} className="flex items-center justify-between gap-2 text-amber-950 font-medium">
                                                            <span className="font-mono font-bold">{d.document_number}</span>
                                                            <span className="text-[10px] px-2 py-0.5 rounded-md bg-amber-200/70 font-semibold text-amber-900">
                                                                {missingGj ? 'Missing PDF Document' : (missingRef ? 'Missing Reference' : 'Incomplete')}
                                                            </span>
                                                        </div>
                                                    );
                                                })}
                                            </div>

                                            {readySelectedDrafts.length > 0 ? (
                                                <p className="text-xs text-slate-700 font-medium">
                                                    You can submit the remaining <strong>{readySelectedDrafts.length} ready draft(s)</strong> now.
                                                </p>
                                            ) : (
                                                <p className="text-xs text-red-600 font-semibold">
                                                    None of the selected drafts are ready for submission. Please attach the required General Journal PDF files first.
                                                </p>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <button 
                                    onClick={() => setBulkSubmitModalOpen(false)} 
                                    className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <X size={16} />
                                </button>
                            </div>
                        </div>

                        <div className="bg-slate-50 px-6 py-4 flex items-center justify-end gap-2.5 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={() => setBulkSubmitModalOpen(false)}
                                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-200/70 rounded-xl transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>

                            {incompleteSelectedDrafts.length === 0 ? (
                                <button
                                    type="button"
                                    onClick={() => handleConfirmBulkSubmit(false)}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                >
                                    <Send size={14} /> Submit {selectedIds.length} Drafts
                                </button>
                            ) : (
                                readySelectedDrafts.length > 0 ? (
                                    <button
                                        type="button"
                                        onClick={() => handleConfirmBulkSubmit(true)}
                                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
                                    >
                                        <Send size={14} /> Submit {readySelectedDrafts.length} Ready Drafts
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => setBulkSubmitModalOpen(false)}
                                        className="px-4 py-2 rounded-xl bg-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-300 transition-colors cursor-pointer"
                                    >
                                        Close
                                    </button>
                                )
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            <ConfirmModal
                open={deleteModalOpen}
                title="Delete Draft Document"
                message="Are you sure you want to delete this draft? All uploaded files will be permanently removed. This action cannot be undone."
                confirmText="Yes, Delete Draft"
                cancelText="Cancel"
                type="danger"
                onConfirm={handleConfirmDelete}
                onClose={() => {
                    setDeleteModalOpen(false);
                    setDeleteTargetId(null);
                }}
            />

            {/* File Viewer Modal */}
            <FileModal
                open={fileModal.open}
                journalId={fileModal.journalId}
                onClose={() => setFileModal({ open: false, journalId: null })}
            />
        </MainLayout>
    );
}
