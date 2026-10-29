import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';

const COUNTDOWN_SECONDS = 3;

export default function Confirm({ journal, token }) {
    const { flash } = usePage().props;
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cancelled, setCancelled] = useState(false);
    const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
    const firedRef = useRef(false);

    const submitApprove = () => {
        if (firedRef.current) return;
        firedRef.current = true;
        setIsSubmitting(true);
        router.post(`/approve-email/${token}`, {}, {
            onSuccess: () => setIsSuccess(true),
            onFinish: () => setIsSubmitting(false),
        });
    };

    // Hitung mundur otomatis lalu kirim approval. Dibatalkan kalau user klik Cancel.
    useEffect(() => {
        if (cancelled || isSubmitting || isSuccess || flash?.success) return;

        if (countdown <= 0) {
            submitApprove();
            return;
        }

        const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
        return () => clearTimeout(timer);
    }, [countdown, cancelled, isSubmitting, isSuccess, flash]);

    // Setelah sukses, coba tutup tab (hanya berhasil kalau tab dibuka oleh script).
    useEffect(() => {
        if (flash?.success || isSuccess) {
            const timer = setTimeout(() => { window.close(); }, 2500);
            return () => clearTimeout(timer);
        }
    }, [flash, isSuccess]);

    // ---- Success state ----
    if (flash?.success || isSuccess) {
        return (
            <>
                <Head title="Document Approved" />
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '40px 40px', border: '0.5px solid #e0e0e0', textAlign: 'center', maxWidth: 400, width: '100%' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <span style={{ fontSize: 22, color: '#1a6e35', fontWeight: 'bold' }}>✓</span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px' }}>Document Approved Successfully</p>
                        <p style={{ fontSize: 13, color: '#5f6368', margin: '0 0 4px' }}>{journal?.document_number}</p>
                        <p style={{ fontSize: 12, color: '#9aa0a6', margin: 0 }}>You can close this tab now.</p>
                    </div>
                </div>
            </>
        );
    }

    // ---- Cancelled state ----
    if (cancelled) {
        return (
            <>
                <Head title="Approval Cancelled" />
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
                    <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #e0e0e0', width: '100%', maxWidth: 420, padding: '32px 32px', textAlign: 'center' }}>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '0 0 8px' }}>Approval Cancelled</p>
                        <p style={{ fontSize: 13, color: '#5f6368', margin: '0 0 20px', lineHeight: 1.6 }}>
                            Document {journal?.document_number} was not approved.
                        </p>
                        <button
                            onClick={() => { setCountdown(COUNTDOWN_SECONDS); setCancelled(false); }}
                            style={{ padding: '10px 20px', background: '#1a2540', color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}
                        >
                            Approve Now
                        </button>
                    </div>
                </div>
            </>
        );
    }

    // ---- Approving / countdown state ----
    return (
        <>
            <Head title="Approving..." />
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
                <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #e0e0e0', width: '100%', maxWidth: 480, overflow: 'hidden' }}>

                    {/* Header navy */}
                    <div style={{ background: '#1a2540', padding: '20px 28px' }}>
                        <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 600 }}>Approval Confirmation</p>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '24px 28px', textAlign: 'center' }}>
                        {/* Spinner */}
                        <svg style={{ animation: 'spin 1s linear infinite', width: 36, height: 36, color: '#1a2540', margin: '0 auto 14px', display: 'block' }} viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" opacity="0.2" />
                            <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" opacity="0.85" />
                        </svg>
                        <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>

                        <p style={{ margin: '0 0 6px', fontSize: 16, fontWeight: 600, color: '#1a1a2e' }}>
                            {isSubmitting ? 'Approving…' : `Approving in ${countdown}s…`}
                        </p>
                        <p style={{ margin: '0 0 18px', fontSize: 13, color: '#5f6368' }}>
                            {journal?.document_number}
                        </p>

                        {/* Progress bar */}
                        <div style={{ height: 4, background: '#e8eaed', borderRadius: 4, overflow: 'hidden', marginBottom: 20 }}>
                            <div style={{
                                height: '100%', background: '#1a2540', borderRadius: 4,
                                width: `${isSubmitting ? 100 : ((COUNTDOWN_SECONDS - countdown) / COUNTDOWN_SECONDS) * 100}%`,
                                transition: 'width 1s linear',
                            }} />
                        </div>

                        {!isSubmitting && (
                            <button
                                onClick={() => setCancelled(true)}
                                style={{
                                    padding: '8px 18px', background: 'transparent', color: '#5f6368',
                                    border: '0.5px solid #d0d3d8', borderRadius: 7, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                                }}
                            >
                                Cancel
                            </button>
                        )}
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
