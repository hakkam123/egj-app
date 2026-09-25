import { Head } from '@inertiajs/react';
import { useEffect } from 'react';

export default function Success({ journal, action = 'approved', notes }) {
    const isApproved = action === 'approved';

    useEffect(() => {
        const timer = setTimeout(() => {
            window.close();
        }, 2500);
        return () => clearTimeout(timer);
    }, []);

    return (
        <>
            <Head title={isApproved ? "Approval Succeeded" : "Revision Requested"} />
            <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#f0f2f5', padding: '16px' }}>
                <div style={{ background: '#fff', borderRadius: 10, padding: '40px 48px', border: '0.5px solid #e0e0e0', textAlign: 'center', maxWidth: 400, width: '100%', boxShadow: '0 4px 12px rgba(0,0,0,0.05)' }}>
                    <div style={{
                        width: 48,
                        height: 48,
                        borderRadius: '50%',
                        background: isApproved ? '#e6f4ea' : '#fffbeb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        margin: '0 auto 16px'
                    }}>
                        <span style={{ fontSize: 24, color: isApproved ? '#1a6e35' : '#b45309', fontWeight: 'bold' }}>
                            {isApproved ? '✓' : '↺'}
                        </span>
                    </div>

                    <p style={{ fontSize: 16, fontWeight: 600, color: '#1a1a2e', margin: '0 0 8px' }}>
                        {isApproved ? 'Document Approved Successfully' : 'Revision Requested Successfully'}
                    </p>

                    <p style={{ fontSize: 13, color: '#5f6368', margin: '0 0 4px' }}>
                        General Journal {journal?.document_number}
                    </p>

                    {notes && (
                        <div style={{ marginTop: 12, marginBottom: 12, padding: '10px 14px', background: '#fffbeb', borderRadius: 8, border: '0.5px solid #fde68a', textAlign: 'left' }}>
                            <span style={{ fontSize: 11, fontWeight: 'bold', color: '#92400e', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>
                                Revision Notes:
                            </span>
                            <span style={{ fontSize: 12, color: '#78350f' }}>
                                {notes}
                            </span>
                        </div>
                    )}

                    <p style={{ fontSize: 12, color: '#9aa0a6', margin: '8px 0 0' }}>
                        This tab will close automatically...
                    </p>
                </div>
            </div>
        </>
    );
}
