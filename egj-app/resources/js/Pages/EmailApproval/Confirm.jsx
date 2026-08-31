import { Head, router, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';

export default function Confirm({ journal, token }) {
    const { flash } = usePage().props;
    const [isSuccess, setIsSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        if (flash?.success || isSuccess) {
            const timer = setTimeout(() => { window.close(); }, 2500);
            return () => clearTimeout(timer);
        }
    }, [flash, isSuccess]);

    const handleApprove = () => {
        setIsSubmitting(true);
        router.post(`/approve-email/${token}`, {}, {
            onSuccess: () => setIsSuccess(true),
            onFinish: () => setIsSubmitting(false),
        });
    };

    if (flash?.success || isSuccess) {
        return (
            <>
                <Head title="Dokumen Berhasil Disetujui" />
                <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
                    <div style={{ background: '#fff', borderRadius: 10, padding: '40px 40px', border: '0.5px solid #e0e0e0', textAlign: 'center', maxWidth: 400, width: '100%' }}>
                        <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#e6f4ea', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                            <span style={{ fontSize: 22, color: '#1a6e35', fontWeight: 'bold' }}>✓</span>
                        </div>
                        <p style={{ fontSize: 15, fontWeight: 600, color: '#1a1a2e', margin: '0 0 6px' }}>Dokumen Berhasil Disetujui</p>
                        <p style={{ fontSize: 13, color: '#5f6368', margin: '0 0 4px' }}>{journal?.document_number}</p>
                        <p style={{ fontSize: 12, color: '#9aa0a6', margin: 0 }}>Tab ini akan tertutup otomatis...</p>
                    </div>
                </div>
            </>
        );
    }

    return (
        <>
            <Head title="Konfirmasi Approval" />
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
                <div style={{ background: '#fff', borderRadius: 10, border: '0.5px solid #e0e0e0', width: '100%', maxWidth: 480, overflow: 'hidden' }}>

                    {/* Header navy */}
                    <div style={{ background: '#1a2540', padding: '20px 28px' }}>
                        <p style={{ margin: 0, color: '#fff', fontSize: 15, fontWeight: 600 }}>Konfirmasi Persetujuan</p>
                    </div>

                    {/* Body */}
                    <div style={{ padding: '24px 28px' }}>
                        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#5f6368', lineHeight: 1.6 }}>
                            Anda akan menyetujui dokumen General Journal berikut:
                        </p>

                        {/* Info dokumen */}
                        <div style={{ border: '0.5px solid #e8eaed', borderRadius: 8, overflow: 'hidden', marginBottom: 20 }}>
                            {[
                                { label: 'No. Dokumen', value: journal?.document_number, mono: true },
                                { label: 'Tanggal Journal', value: journal?.journal_date?.split('T')[0] },
                                { label: 'Reference', value: journal?.reference || '-' },
                                { label: 'Diajukan Oleh', value: journal?.requester?.name },
                            ].map((row, i) => (
                                <div key={i} style={{ padding: '9px 14px', background: i % 2 === 0 ? '#f5f6f8' : '#ffffff', borderTop: i > 0 ? '0.5px solid #e8eaed' : 'none' }}>
                                    <p style={{ margin: '0 0 2px', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.8px', color: '#9aa0a6' }}>{row.label}</p>
                                    <p style={{ margin: 0, fontSize: 13, color: '#1a1a2e', fontFamily: row.mono ? 'monospace' : 'inherit', fontWeight: row.mono ? 600 : 400 }}>{row.value}</p>
                                </div>
                            ))}
                        </div>

                        {/* Tombol */}
                        <button
                            onClick={handleApprove}
                            disabled={isSubmitting}
                            style={{
                                width: '100%', padding: '11px 16px', background: isSubmitting ? '#6b7d9f' : '#1a2540',
                                color: '#fff', border: 'none', borderRadius: 7, fontSize: 13, fontWeight: 600,
                                cursor: isSubmitting ? 'not-allowed' : 'pointer', transition: 'background 0.15s',
                            }}
                            onMouseEnter={e => !isSubmitting && (e.currentTarget.style.background = '#243355')}
                            onMouseLeave={e => !isSubmitting && (e.currentTarget.style.background = '#1a2540')}
                        >
                            {isSubmitting ? 'Memproses...' : 'Setujui'}
                        </button>

                        <p style={{ margin: '12px 0 0', fontSize: 11, color: '#9aa0a6', textAlign: 'center' }}>
                            Dengan menekan tombol di atas, Anda menyetujui General Journal ini.
                        </p>
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