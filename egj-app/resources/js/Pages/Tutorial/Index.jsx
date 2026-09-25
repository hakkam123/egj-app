import { Head, usePage, useForm, router } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import { useState } from 'react';
import { 
    Download, 
    FileText, 
    Upload, 
    Trash2, 
    X, 
    Plus, 
    HelpCircle
} from 'lucide-react';
import toast from 'react-hot-toast';

export default function TutorialIndex({ tutorials = [], manualExists }) {
    const { auth } = usePage().props;
    const isAdmin = auth?.user?.role === 'Admin';

    const [uploadModalOpen, setUploadModalOpen] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState(null);

    const uploadForm = useForm({
        title: '',
        description: '',
        file: null,
    });

    const handleUploadSubmit = (e) => {
        e.preventDefault();
        if (!uploadForm.data.file) {
            toast.error('Please select a PDF file first.');
            return;
        }

        uploadForm.post('/tutorial', {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Tutorial PDF uploaded successfully.');
                uploadForm.reset();
                setUploadModalOpen(false);
            },
            onError: (err) => {
                const msg = err.file || err.title || 'Failed to upload tutorial.';
                toast.error(msg);
            }
        });
    };

    const handleDelete = (id) => {
        router.delete(`/tutorial/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Tutorial deleted successfully.');
                setDeleteConfirmId(null);
            },
            onError: () => toast.error('Failed to delete tutorial.')
        });
    };

    return (
        <MainLayout title="User Guide">
            <Head title="User Guide & Tutorials" />

            <div className="space-y-6 max-w-5xl mx-auto">
                <PageHeader
                    title="JAGO User Guide"
                    subtitle="Learn the workflow for submission, verification, revision, and approval in Journal Approval General Operations (JAGO)"
                    actions={
                        <>
                            {isAdmin && (
                                <button
                                    onClick={() => setUploadModalOpen(true)}
                                    className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-xs"
                                >
                                    <Plus size={15} /> Add Tutorial
                                </button>
                            )}
                        </>
                    }
                />

                {/* Info alert if no manual and no uploaded tutorials */}
                {!manualExists && tutorials.length === 0 && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-xs text-amber-800 flex items-start gap-3">
                        <HelpCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <span className="font-semibold">Notice:</span> No tutorial files or PDF manual books have been uploaded yet. Administrators can use the &ldquo;Add Tutorial&rdquo; button above to upload guide documents.
                        </div>
                    </div>
                )}

                {/* Uploaded Tutorials Section */}
                <div>
                    <div className="flex items-center justify-between mb-3">
                        <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)]">
                            Guide Documents List
                        </p>
                    </div>

                    {tutorials.length === 0 ? (
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-8 text-center text-xs text-gray-500">
                            <p className="font-medium text-gray-700">No additional tutorial documents available</p>
                            <p className="text-gray-400 mt-0.5">Please check back later or contact your system administrator.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tutorials.map((t) => (
                                <div
                                    key={t.id}
                                    className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 shadow-xs hover:border-gray-300 transition-colors"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex items-start gap-3">
                                            <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center shrink-0">
                                                <FileText size={20} />
                                            </div>
                                            <div>
                                                <h4 className="text-sm font-bold text-[var(--text-primary)] leading-tight">
                                                    {t.title}
                                                </h4>
                                                <p className="text-[11px] text-gray-400 font-mono mt-0.5">
                                                    {t.file_name}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Action buttons */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <a
                                                href={`/tutorial/download/${t.id}`}
                                                className="px-3 py-1.5 bg-[#e6f2ef] text-[#2b6b5c] rounded-md text-xs font-semibold hover:brightness-95 transition-all flex items-center gap-1.5"
                                                title="Download PDF"
                                            >
                                                <Download size={14} />
                                            </a>
                                            {isAdmin && (
                                                <button
                                                    onClick={() => setDeleteConfirmId(t.id)}
                                                    className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                    title="Delete Tutorial"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                    {t.description && (
                                        <p className="text-xs text-[var(--text-secondary)] mt-3 line-clamp-2 leading-relaxed">
                                            {t.description}
                                        </p>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Workflow Cards */}
                <div>
                    <p className="text-[11px] font-bold uppercase tracking-widest text-[var(--text-muted)] mb-3">
                        Process Workflow Summary
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Card 1 */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex flex-col shadow-xs">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-[#1a2540] text-white shrink-0">
                                    1
                                </span>
                                Create & Submit Draft
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1 mb-4">
                                Staff or Section Head fills in Document Number (prefixed with JOT), Journal Date, Reference, and uploads General Journal and Supporting Document PDFs. Save as draft or submit immediately.
                            </p>
                            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 pt-3 border-t border-[var(--border)]">
                                <li className="flex items-center gap-2">✓ PDF format, max 10MB each</li>
                                <li className="flex items-center gap-2">✓ Auto Accounting stamp with journal date</li>
                            </ul>
                        </div>

                        {/* Card 2 */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex flex-col shadow-xs">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-[#1a2540] text-white shrink-0">
                                    2
                                </span>
                                Review & Approval
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1 mb-4">
                                Section Head and Dept/Div Head review documents via web or email. Approvers can Approve or Request Revision. If revised, requester can re-upload files or self-reject.
                            </p>
                            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 pt-3 border-t border-[var(--border)]">
                                <li className="flex items-center gap-2">✓ Notes required for revision</li>
                                <li className="flex items-center gap-2">✓ Sequential multi-tier approvals</li>
                            </ul>
                        </div>

                        {/* Card 3 */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex flex-col shadow-xs">
                            <h3 className="text-sm font-bold text-[var(--text-primary)] mb-2 flex items-center gap-2">
                                <span className="w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold bg-[#1a2540] text-white shrink-0">
                                    3
                                </span>
                                Monitoring & Timeline
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] leading-relaxed flex-1 mb-4">
                                Monitor document progress in real time on Monitoring with in-column filters, and view full audit timeline and stamped PDF copies directly from the table.
                            </p>
                            <ul className="text-xs text-[var(--text-secondary)] space-y-1.5 pt-3 border-t border-[var(--border)]">
                                <li className="flex items-center gap-2">✓ Export filtered data to Excel</li>
                                <li className="flex items-center gap-2">✓ Instant timeline history & stamped PDF previews</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>

            {/* Upload Modal (Admin Only) */}
            {uploadModalOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-xl max-w-lg w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150">
                        <div className="flex items-center justify-between pb-3 border-b border-gray-200">
                            <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                                <Upload size={18} className="text-blue-600" /> Upload Tutorial PDF
                            </h3>
                            <button
                                onClick={() => setUploadModalOpen(false)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <form onSubmit={handleUploadSubmit} className="space-y-4 pt-4">
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                    Guide Title <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={uploadForm.data.title}
                                    onChange={e => uploadForm.setData('title', e.target.value)}
                                    placeholder="e.g. General Journal Submission Guidelines"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                {uploadForm.errors.title && (
                                    <p className="text-xs text-red-500 mt-1">{uploadForm.errors.title}</p>
                                )}
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                    Brief Description
                                </label>
                                <textarea
                                    value={uploadForm.data.description}
                                    onChange={e => uploadForm.setData('description', e.target.value)}
                                    placeholder="Brief summary of this document..."
                                    rows={2}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                                    PDF Document File <span className="text-red-500">* (Max 20MB)</span>
                                </label>
                                <input
                                    type="file"
                                    accept="application/pdf"
                                    onChange={e => uploadForm.setData('file', e.target.files[0])}
                                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    required
                                />
                                {uploadForm.errors.file && (
                                    <p className="text-xs text-red-500 mt-1">{uploadForm.errors.file}</p>
                                )}
                            </div>

                            <div className="pt-3 border-t border-gray-200 flex items-center justify-end gap-2">
                                <button
                                    type="button"
                                    onClick={() => setUploadModalOpen(false)}
                                    className="px-4 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={uploadForm.processing}
                                    className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg transition-colors shadow-xs flex items-center gap-1.5"
                                >
                                    <Upload size={14} /> {uploadForm.processing ? 'Uploading...' : 'Upload File'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteConfirmId && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-xl max-w-sm w-full p-6 shadow-xl relative animate-in fade-in zoom-in duration-150">
                        <h3 className="text-base font-bold text-gray-900 mb-2">Delete Tutorial?</h3>
                        <p className="text-xs text-gray-600 mb-5">
                            Are you sure you want to delete this tutorial document? This action cannot be undone.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDelete(deleteConfirmId)}
                                className="px-4 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                            >
                                Yes, Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}