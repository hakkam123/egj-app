import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

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
        const labels = { 'submit': 'Submit', 'approve': 'Approve', 'reject': 'Reject', 'resubmit': 'Resubmit' };
        return labels[action] || action;
    };

    const actionColor = (action) => {
        const colors = {
            'submit': 'bg-blue-500',
            'approve': 'bg-emerald-500',
            'reject': 'bg-red-500',
            'resubmit': 'bg-amber-500',
        };
        return colors[action] || 'bg-gray-500';
    };

    const levelLabel = (level) => {
        const labels = { 'accounting': 'Accounting', 'superior': 'Superior', 'superior_of_superior': 'Superior of Superior' };
        return labels[level] || level;
    };

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex items-center justify-center min-h-screen px-4">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>
                <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-auto" onClick={e => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                        <div>
                            <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                                <Clock className="w-5 h-5 text-gray-600" /> Timeline History
                            </h3>
                            {journal && <p className="text-xs text-gray-500 mt-0.5">{journal.document_number}</p>}
                        </div>
                        <button onClick={onClose} className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
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
                        ) : history.length > 0 ? (
                            <div className="space-y-0">
                                {history.map((h, i) => (
                                    <div key={h.id} className="flex gap-4">
                                        {/* Timeline dot & line */}
                                        <div className="flex flex-col items-center">
                                            <div className={`w-3 h-3 rounded-full mt-1.5 flex-shrink-0 ${actionColor(h.action)}`}></div>
                                            {i < history.length - 1 && <div className="w-px flex-1 bg-gray-200 my-1"></div>}
                                        </div>
                                        {/* Content */}
                                        <div className="pb-5 min-w-0">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-0.5 text-xs font-semibold rounded-full text-white ${actionColor(h.action)}`}>
                                                    {actionLabel(h.action)}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-gray-800 mt-1">
                                                Oleh: {h.actor?.name}
                                            </p>
                                            {h.target_level && (
                                                <p className="text-xs font-medium text-gray-500 mt-0.5">
                                                    Target: {levelLabel(h.target_level)}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-400 mt-0.5">{new Date(h.created_at).toLocaleString('id-ID')}</p>
                                            {h.notes && (
                                                <p className="text-sm text-gray-600 mt-1 bg-gray-50 rounded-lg px-3 py-2 italic">{h.notes}</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-gray-400 text-center py-8">Belum ada history.</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
