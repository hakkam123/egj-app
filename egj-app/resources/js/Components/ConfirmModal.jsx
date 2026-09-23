import React from 'react';
import { AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';

export default function ConfirmModal({ 
    open,
    isOpen, 
    title = 'Konfirmasi', 
    message = 'Apakah Anda yakin?', 
    confirmText = 'Ya, Lanjutkan', 
    cancelText = 'Batal', 
    onConfirm, 
    onClose,
    onCancel,
    type = 'danger',
    isDanger = false,
    loading = false
}) {
    const isVisible = open ?? isOpen ?? false;
    const handleClose = onClose ?? onCancel ?? (() => {});

    if (!isVisible) return null;

    const isSuccessType = type === 'success';
    const isDangerType = isDanger || type === 'danger';

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs" onClick={handleClose}>
            <div 
                className="relative bg-white rounded-xl shadow-2xl w-full max-w-sm mx-auto overflow-hidden animate-in fade-in zoom-in duration-150"
                onClick={e => e.stopPropagation()}
            >
                <div className="px-6 py-5">
                    <div className="flex items-start gap-4">
                        <div className={`shrink-0 flex items-center justify-center h-10 w-10 rounded-full ${
                            isSuccessType 
                                ? 'bg-emerald-100 text-emerald-700' 
                                : isDangerType 
                                ? 'bg-red-100 text-red-600' 
                                : 'bg-blue-100 text-blue-600'
                        }`}>
                            {isSuccessType ? (
                                <CheckCircle2 className="w-5 h-5" />
                            ) : (
                                <AlertTriangle className="w-5 h-5" />
                            )}
                        </div>
                        <div className="flex-1">
                            <h3 className="text-base font-bold text-gray-900" id="modal-title">
                                {title}
                            </h3>
                            <p className="text-xs text-gray-600 mt-1.5 leading-relaxed">
                                {message}
                            </p>
                        </div>
                        <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors">
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                </div>
                <div className="bg-gray-50 px-6 py-3.5 flex justify-end gap-2 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-3.5 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                        {cancelText}
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            if (onConfirm && !loading) onConfirm();
                        }}
                        disabled={loading}
                        className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors shadow-xs ${
                            loading ? 'cursor-not-allowed opacity-75' : ''
                        } ${
                            isSuccessType 
                                ? 'bg-emerald-600 hover:bg-emerald-700' 
                                : isDangerType 
                                ? 'bg-red-600 hover:bg-red-700' 
                                : 'bg-blue-600 hover:bg-blue-700'
                        }`}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                <span>Memproses...</span>
                            </>
                        ) : (
                            confirmText
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
