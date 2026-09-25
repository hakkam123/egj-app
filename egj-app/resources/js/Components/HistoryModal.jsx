import { useState, useEffect } from 'react';
import { Clock, CheckCircle, XCircle, FileText, Send, RefreshCw, X, AlertCircle } from 'lucide-react';

export default function HistoryModal({ open, journalId, onClose }) {
    const [history, setHistory] = useState([]);
    const [journal, setJournal] = useState(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (open && journalId) {
            setLoading(true);
            fetch(`/tracking/${journalId}`, {
                headers: { 
                    'Accept': 'application/json', 
                    'X-Requested-With': 'XMLHttpRequest'
                },
            })
                .then(res => res.json())
                .then(data => {
                    const j = data.journal;
                    setJournal(j);
                    setHistory(j?.histories || []);
                    setLoading(false);
                })
                .catch(() => setLoading(false));
        }
    }, [open, journalId]);

    if (!open) return null;

    const actionLabel = (action) => {
        const labels = { 
            'submit': 'Submitted', 
            'approve': 'Approved', 
            'reject': 'Rejected', 
            'revise': 'Revision Requested',
            'resubmit': 'Resubmitted' 
        };
        return labels[action] || action;
    };

    const actionColor = (action) => {
        const colors = {
            'submit': 'text-blue-600',
            'approve': 'text-emerald-600',
            'reject': 'text-red-600',
            'revise': 'text-orange-600',
            'resubmit': 'text-amber-600',
        };
        return colors[action] || 'text-gray-600';
    };

    const actionIcon = (action) => {
        const icons = {
            'submit': <Send size={16} className="text-blue-500 bg-white" />,
            'approve': <CheckCircle size={16} className="text-emerald-500 bg-white" />,
            'reject': <XCircle size={16} className="text-red-500 bg-white" />,
            'revise': <AlertCircle size={16} className="text-orange-500 bg-white" />,
            'resubmit': <RefreshCw size={16} className="text-amber-500 bg-white" />,
        };
        return icons[action] || <Clock size={16} className="text-gray-500 bg-white" />;
    };

    const levelLabel = (level) => {
        const labels = { 
            'accounting': 'Accounting', 
            'superior': 'Superior', 
            'superior_of_superior': 'Superior of Superior' 
        };
        return labels[level] || level;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex items-center justify-center min-h-screen px-4 py-8">
                <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity"></div>
                <div className="relative bg-[var(--card-bg)] rounded-2xl shadow-2xl w-full max-w-lg mx-auto overflow-hidden border-[0.5px] border-[var(--border)]" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b-[0.5px] border-[var(--border)] bg-[#fafafa]">
                        <div>
                            <h3 className="text-lg font-bold text-[var(--text-primary)] flex items-center gap-2">
                                Document Timeline
                            </h3>
                            {journal && <p className="text-[13px] font-mono text-[var(--text-secondary)] mt-0.5">Doc No: {journal.document_number}</p>}
                        </div>
                        <button onClick={onClose} className="p-1.5 text-[var(--text-muted)] hover:text-gray-800 hover:bg-gray-100 rounded-full transition-colors">
                            <X size={20} />
                        </button>
                    </div>

                    {/* Content */}
                    <div className="px-6 py-6 max-h-[70vh] overflow-y-auto bg-white">
                        {loading ? (
                            <div className="flex items-center justify-center py-12">
                                <svg className="w-6 h-6 animate-spin text-blue-600" viewBox="0 0 24 24" fill="none">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                </svg>
                            </div>
                        ) : history.length > 0 ? (
                            <div className="relative border-l-[0.5px] border-[var(--border)] ml-3 space-y-6">
                                {history.map((h) => (
                                    <div key={h.id} className="relative pl-6">
                                        <div className="absolute -left-[8px] top-1">
                                            {actionIcon(h.action)}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[13px] font-bold ${actionColor(h.action)}`}>
                                                    {actionLabel(h.action)}
                                                </span>
                                                <span className="text-[11px] text-[var(--text-muted)]">• {new Date(h.created_at).toLocaleString('en-US')}</span>
                                            </div>
                                            <p className="text-[13px] font-semibold text-[var(--text-primary)] mt-1">
                                                {h.actor?.name}
                                            </p>
                                            
                                            {h.target_level && (
                                                <p className="text-[12px] font-medium text-[var(--text-secondary)] mt-0.5">
                                                    Target: {levelLabel(h.target_level)}
                                                </p>
                                            )}
                                            
                                            {h.notes && (
                                                <div className="mt-2 p-3 bg-gray-50 border-[0.5px] border-[var(--border)] rounded-[7px] text-[12px] text-[var(--text-secondary)] italic">
                                                    &ldquo;{h.notes}&rdquo;
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-[var(--text-muted)]">
                                <FileText className="w-10 h-10 mb-2 opacity-50" />
                                <p className="text-[13px]">No activity history recorded yet.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
