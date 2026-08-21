import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ 
    open, 
    title = 'Konfirmasi', 
    message = 'Apakah Anda yakin?', 
    confirmText = 'Ya, Lanjutkan', 
    cancelText = 'Batal', 
    onConfirm, 
    onClose,
    isDanger = false
}) {
    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto" onClick={onClose}>
            <div className="flex items-center justify-center min-h-screen px-4 text-center sm:p-0">
                <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity"></div>
                <div 
                    className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-auto text-left overflow-hidden transform transition-all sm:my-8"
                    onClick={e => e.stopPropagation()}
                >
                    <div className="px-6 py-5">
                        <div className="flex items-start">
                            <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full sm:mx-0 sm:h-10 sm:w-10 ${isDanger ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                                <h3 className="text-lg leading-6 font-medium text-gray-900" id="modal-title">
                                    {title}
                                </h3>
                                <div className="mt-2">
                                    <p className="text-sm text-gray-500">
                                        {message}
                                    </p>
                                </div>
                            </div>
                            <div className="ml-4 flex-shrink-0 flex">
                                <button onClick={onClose} className="bg-white rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none">
                                    <span className="sr-only">Close</span>
                                    <X className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                    <div className="bg-gray-50 px-6 py-4 flex flex-row-reverse gap-3">
                        <button
                            type="button"
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`w-full inline-flex justify-center rounded-lg border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm focus:outline-none sm:w-auto sm:text-sm ${
                                isDanger ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                            }`}
                        >
                            {confirmText}
                        </button>
                        <button
                            type="button"
                            onClick={onClose}
                            className="w-full inline-flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none sm:w-auto sm:text-sm"
                        >
                            {cancelText}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
