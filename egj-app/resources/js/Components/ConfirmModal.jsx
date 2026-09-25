import React from 'react';
import { AlertTriangle, CheckCircle2, X, Loader2 } from 'lucide-react';

export default function ConfirmModal({
    open,
    isOpen,
    title = 'Confirmation',
    message = 'Are you sure you want to proceed?',
    confirmText = 'Yes, Proceed',
    cancelText = 'Cancel',
    onConfirm,
    onClose,
    onCancel,
    type = 'danger',
    isDanger = false,
    loading = false
}) {
    const isVisible = open ?? isOpen ?? false;
    const handleClose = onClose ?? onCancel ?? (() => { });

    if (!isVisible) return null;

    const isSuccessType = type === 'success';
    const isDangerType = isDanger || type === 'danger';

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/40"
            onClick={handleClose}
        >
            <div
                className="relative bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-xl w-full max-w-sm mx-auto overflow-hidden"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-5 py-5">
                    <div className="flex items-start gap-3">
                        <div className="flex-1">
                            <h3
                                className="text-sm font-semibold text-[var(--text-primary)]"
                                id="modal-title"
                            >
                                {title}
                            </h3>

                            <p className="text-xs text-[var(--text-secondary)] mt-1.5 leading-relaxed">
                                {message}
                            </p>
                        </div>

                        <button
                            type="button"
                            onClick={handleClose}
                            disabled={loading}
                            className="shrink-0 p-1.5 rounded-md text-[var(--text-secondary)] hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
                        >
                            <X
                                className="h-4 w-4"
                                strokeWidth={1.8}
                            />
                        </button>
                    </div>
                </div>

                <div className="px-5 py-3 border-t border-[var(--border)] flex justify-end gap-2">
                    <button
                        type="button"
                        onClick={handleClose}
                        disabled={loading}
                        className="px-4 py-2 text-xs font-semibold text-[var(--text-secondary)] bg-[var(--card-bg)] border border-[var(--border)] rounded-lg hover:bg-[var(--surface-muted)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {cancelText}
                    </button>

                    <button
                        type="button"
                        onClick={() => {
                            if (onConfirm && !loading) onConfirm();
                        }}
                        disabled={loading}
                        className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <>
                                <Loader2
                                    className="w-3.5 h-3.5 animate-spin"
                                    strokeWidth={1.8}
                                />
                                <span>Processing...</span>
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
