import { Head, useForm, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Reject({ journal, token }) {
    const { flash } = usePage().props;
    const [isSuccess, setIsSuccess] = useState(false);

    const { data, setData, post, processing, errors } = useForm({ notes: '' });

    useEffect(() => {
        if (flash?.success || isSuccess) {
            const timer = setTimeout(() => { window.close(); }, 2500);
            return () => clearTimeout(timer);
        }
    }, [flash, isSuccess]);

    const handleRevise = (e) => {
        e.preventDefault();
        post(`/revise-email/${token}`, {
            onSuccess: () => setIsSuccess(true),
        });
    };

    if (flash?.success || isSuccess) {
        return (
            <>
                <Head title="Revision Requested" />
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '40px 40px', border: '0.5px solid #e0e0e0', textAlign: 'center', maxWidth: 400, width: '100%' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#fffbeb', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <span style={{ fontSize: 22, color: '#b45309', fontWeight: 'bold' }}>↺</span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px' }}>Revision Requested Successfully</p>
                        <p style={{ fontSize: 13, color: '#5f6368', margin: '0 0 4px' }}>{journal?.document_number}</p>
                        <p style={{ fontSize: 12, color: '#9aa0a6', margin: 0 }}>This tab will close automatically...</p>
                    </div>
                </div>
            </>
        );
    }

    const MIN_CHARS = 5;
    const charCount = data.notes.length;
    const isValid = charCount >= MIN_CHARS;

    return (
        <>
            <Head title="Request Revision" />
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
                <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #e0e0e0', width: '100%', maxWidth: 480, overflow: 'hidden' }}>

                    {/* Header navy with amber accent */}
                    <div style={{ background: '#1a2540', padding: '20px 28px', borderLeft: '4px solid #d97706' }}>
                        <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 600 }}>Request Document Revision</p>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '24px 28px' }}>
                        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#5f6368', lineHeight: 1.6 }}>
                            You are requesting a revision for the following General Journal document:
                        </p>

                        {/* Document info */}
                        <div style={{ border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                            {[
                                { label: 'Document Number', value: journal?.document_number, mono: true },
                                { label: 'Journal Date', value: journal?.journal_date?.split('T')[0] },
                                { label: 'Reference', value: journal?.reference || '-' },
                                { label: 'Person Request', value: journal?.requester?.name },
                            ].map((row, i) => (
                                <div key={i} style={{ padding: '9px 14px', background: i % 2 === 0 ? '#f5f6f8' : '#ffffff', borderTop: i > 0 ? '0.5px solid #e8eaed' : 'none' }}>
                                    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9aa0a6' }}>{row.label}</p>
                                    <p style={{ margin: 0, fontSize: 13, color: '#1a1a2e', fontFamily: row.mono ? 'monospace' : 'inherit', fontWeight: row.mono ? 600 : 400 }}>{row.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Reason form */}
                        <form onSubmit={handleRevise}>
                            <div style={{ marginBottom: 16 }}>
                                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9aa0a6', marginBottom: 6 }}>
                                    Revision Notes <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <textarea
                                    value={data.notes}
                                    onChange={e => setData('notes', e.target.value)}
                                    rows={4}
                                    placeholder="Provide detailed feedback on what needs to be revised..."
                                    style={{
                                        width: '100%', padding: '10px 12px', fontSize: 13,
                                        border: `0.5px solid ${errors.notes ? '#e05c5c' : '#e0e0e0'}`,
                                        borderRadius: 7, resize: 'vertical', outline: 'none',
                                        color: '#1a1a2e', fontFamily: 'Arial, sans-serif',
                                        boxSizing: 'border-box',
                                    }}
                                    onFocus={e => e.currentTarget.style.borderColor = '#1a2540'}
                                    onBlur={e => e.currentTarget.style.borderColor = errors.notes ? '#e05c5c' : '#e0e0e0'}
                                    required
                                />
                                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                                    {errors.notes
                                        ? <p style={{ margin: 0, fontSize: 11, color: '#e05c5c' }}>{errors.notes}</p>
                                        : <span />
                                    }
                                    <p style={{ margin: 0, fontSize: 11, color: isValid ? '#9aa0a6' : '#e05c5c', textAlign: 'right' }}>
                                        {charCount} / {MIN_CHARS} minimum characters
                                    </p>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing || !isValid}
                                style={{
                                    width: '100%', padding: '11px 16px',
                                    background: processing || !isValid ? '#e5c07b' : '#d97706',
                                    color: '#fff', border: 'none', borderRadius: 7,
                                    fontSize: 13, fontWeight: 600,
                                    cursor: processing || !isValid ? 'not-allowed' : 'pointer',
                                    transition: 'background 0.15s',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                }}
                                onMouseEnter={e => isValid && !processing && (e.currentTarget.style.background = '#b45309')}
                                onMouseLeave={e => isValid && !processing && (e.currentTarget.style.background = '#d97706')}
                            >
                                {processing ? (
                                    <>
                                        <svg style={{ animation: 'spin 1s linear infinite', width: 16, height: 16 }} viewBox="0 0 24 24" fill="none">
                                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.25" />
                                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.75" />
                                        </svg>
                                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
                                        <span>Processing...</span>
                                    </>
                                ) : (
                                    'Request Revision'
                                )}
                            </button>

                            <p style={{ margin: '12px 0 0', fontSize: 11, color: '#9aa0a6', textAlign: 'center' }}>
                                Notification along with revision notes will be sent back to the requester.
                            </p>
                        </form>
                    </div>

                    {/* Footer */}
                    <div style={{ background: '#f5f6f8', padding: '12px 28px', borderTop: '0.5px solid #e8eaed' }}>
                        <p style={{ margin: 0, fontSize: 11, color: '#9aa0a6', textAlign: 'center' }}>© {new Date().getFullYear()} PT Astra Visteon Indonesia</p>
                    </div>
                </div>
            </div>
        </>
    );
}