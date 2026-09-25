import { useState, useEffect } from 'react';
import { Paperclip, FileText, X } from 'lucide-react';

export default function FileModal({ open, journalId, onClose }) {
    const [files, setFiles] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && journalId) {
            setLoading(true);
            fetch(`/general-journals/${journalId}`, {
                headers: { 
                    'Accept': 'application/json', 
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Inertia': 'true'
                },
            })
                .then(res => res.json())
                .then(data => {
                    const journal = data.props?.journal || data.journal || data;
                    setFiles(journal?.active_files || journal?.files?.filter(f => f.is_active) || []);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [open, journalId]);

    if (!open) return null;

    const gjFiles = files.filter(f => f.category === 'general_journal');
    const sdFiles = files.filter(f => f.category === 'supporting_document');

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                            <Paperclip className="w-5 h-5 text-gray-600" /> Attached Files
                        </h3>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-4 max-h-96 overflow-y-auto">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <svg className="w-6 h-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* General Journal Files */}
                                {gjFiles.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">General Journal</p>
                                        {gjFiles.map(f => (
                                             <div key={f.id} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg mb-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <FileText className="w-6 h-6 text-blue-500 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{f.file_name}</p>
                                                        <p className="text-xs text-gray-500">{(f.file_size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0 ml-2">
                                                    <a href={`/files/${f.id}/preview?v=${f.file_size}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50">Preview</a>
                                                    <a href={`/files/${f.id}/download`} download target="_blank" rel="noreferrer" className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50">Download</a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Supporting Documents */}
                                {sdFiles.length > 0 && (
                                    <div>
                                        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">Supporting Documents</p>
                                        {sdFiles.map(f => (
                                            <div key={f.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg mb-2">
                                                <div className="flex items-center gap-3 min-w-0">
                                                    <Paperclip className="w-6 h-6 text-gray-500 flex-shrink-0" />
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{f.file_name}</p>
                                                        <p className="text-xs text-gray-500">{(f.file_size / 1024).toFixed(1)} KB</p>
                                                    </div>
                                                </div>
                                                <div className="flex gap-1 flex-shrink-0 ml-2">
                                                    <a href={`/files/${f.id}/preview?v=${f.file_size}`} target="_blank" rel="noreferrer" className="px-2.5 py-1 text-xs font-medium text-blue-700 bg-white border border-blue-200 rounded-md hover:bg-blue-50">Preview</a>
                                                    <a href={`/files/${f.id}/download`} download target="_blank" rel="noreferrer" className="px-2.5 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-200 rounded-md hover:bg-gray-50">Download</a>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {gjFiles.length === 0 && sdFiles.length === 0 && (
                                    <p className="text-sm text-gray-400 text-center py-4">No files attached.</p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
