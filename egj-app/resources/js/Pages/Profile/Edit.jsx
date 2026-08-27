import { Head, useForm, usePage } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import { User, Lock, Save, ShieldCheck } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EditProfile({ user }) {
    const { flash } = usePage().props;

    const profileForm = useForm({
        name: user?.name || '',
        email: user?.email || '',
        npk: user?.npk || '',
    });

    const passwordForm = useForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.put('/profile', {
            preserveScroll: true,
            onSuccess: () => toast.success('Profil berhasil diperbarui.'),
        });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
                toast.success('Password berhasil diubah.');
            },
        });
    };

    const inputClass = "w-full px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white rounded-[7px]";
    const inputStyle = { border: '0.5px solid var(--border)', color: 'var(--text-primary)' };
    const labelClass = "block text-[11px] font-medium uppercase tracking-wide mb-1.5";
    const labelStyle = { color: 'var(--text-muted)' };

    return (
        <MainLayout title="Akun Saya">
            <Head title="Akun Saya" />

            <div className="max-w-5xl mx-auto space-y-6">
                <PageHeader
                    title="Akun Saya"
                    subtitle="Kelola data diri dan keamanan kata sandi akun Anda"
                />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">

                    {/* Kiri: Informasi Profil */}
                    <div
                        className="rounded-[10px] p-6"
                        style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border)' }}
                    >
                        {/* Card header */}
                        <div className="flex items-center gap-3 pb-4 mb-5" style={{ borderBottom: '0.5px solid var(--border)' }}>
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: '#1a2540' }}
                            >
                                <User size={15} color="#ffffff" />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Informasi Profil</p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Perbarui nama, email, dan NPK Anda</p>
                            </div>
                        </div>

                        <form onSubmit={handleProfileSubmit} className="space-y-4">
                            <div>
                                <label className={labelClass} style={labelStyle}>
                                    Nama Lengkap <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.data.name}
                                    onChange={e => profileForm.setData('name', e.target.value)}
                                    className={inputClass}
                                    style={inputStyle}
                                    required
                                />
                                {profileForm.errors.name && (
                                    <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{profileForm.errors.name}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass} style={labelStyle}>
                                    Alamat Email <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <input
                                    type="email"
                                    value={profileForm.data.email}
                                    onChange={e => profileForm.setData('email', e.target.value)}
                                    className={inputClass}
                                    style={inputStyle}
                                    required
                                />
                                {profileForm.errors.email && (
                                    <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{profileForm.errors.email}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass} style={labelStyle}>
                                    NPK (Nomor Pokok Karyawan)
                                </label>
                                <input
                                    type="text"
                                    value={profileForm.data.npk}
                                    onChange={e => profileForm.setData('npk', e.target.value)}
                                    placeholder="Contoh: 123456"
                                    className={inputClass}
                                    style={inputStyle}
                                />
                                {profileForm.errors.npk && (
                                    <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{profileForm.errors.npk}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass} style={labelStyle}>
                                    Role / Jabatan
                                </label>
                                <div
                                    className="flex items-center gap-2 px-3 py-2 text-[13px] rounded-[7px]"
                                    style={{ background: '#f5f6f8', border: '0.5px solid var(--border)', color: 'var(--text-secondary)' }}
                                >
                                    <ShieldCheck size={15} style={{ color: 'var(--text-muted)' }} />
                                    <span>{user?.role}</span>
                                </div>
                            </div>

                            <div className="pt-3 flex justify-end" style={{ borderTop: '0.5px solid var(--border)' }}>
                                <button
                                    type="submit"
                                    disabled={profileForm.processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-[13px] rounded-lg transition-colors disabled:opacity-50"
                                    style={{ background: '#1a2540', color: '#ffffff' }}
                                    onMouseEnter={e => !profileForm.processing && (e.currentTarget.style.background = '#243355')}
                                    onMouseLeave={e => e.currentTarget.style.background = '#1a2540'}
                                >
                                    <Save size={14} />
                                    {profileForm.processing ? 'Menyimpan...' : 'Simpan Profil'}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* Kanan: Ubah Password */}
                    <div
                        className="rounded-[10px] p-6"
                        style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border)' }}
                    >
                        {/* Card header */}
                        <div className="flex items-center gap-3 pb-4 mb-5" style={{ borderBottom: '0.5px solid var(--border)' }}>
                            <div
                                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: '#1a2540' }}
                            >
                                <Lock size={15} color="#ffffff" />
                            </div>
                            <div>
                                <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>Ubah Password</p>
                                <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Ganti kata sandi untuk mengamankan akun</p>
                            </div>
                        </div>

                        <form onSubmit={handlePasswordSubmit} className="space-y-4">
                            <div>
                                <label className={labelClass} style={labelStyle}>
                                    Password Saat Ini <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.data.current_password}
                                    onChange={e => passwordForm.setData('current_password', e.target.value)}
                                    className={inputClass}
                                    style={inputStyle}
                                    required
                                />
                                {passwordForm.errors.current_password && (
                                    <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{passwordForm.errors.current_password}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass} style={labelStyle}>
                                    Password Baru <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.data.new_password}
                                    onChange={e => passwordForm.setData('new_password', e.target.value)}
                                    placeholder="Minimal 8 karakter"
                                    className={inputClass}
                                    style={inputStyle}
                                    required
                                />
                                {passwordForm.errors.new_password && (
                                    <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{passwordForm.errors.new_password}</p>
                                )}
                            </div>

                            <div>
                                <label className={labelClass} style={labelStyle}>
                                    Konfirmasi Password Baru <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <input
                                    type="password"
                                    value={passwordForm.data.new_password_confirmation}
                                    onChange={e => passwordForm.setData('new_password_confirmation', e.target.value)}
                                    className={inputClass}
                                    style={inputStyle}
                                    required
                                />
                            </div>

                            <div className="pt-3 flex justify-end" style={{ borderTop: '0.5px solid var(--border)' }}>
                                <button
                                    type="submit"
                                    disabled={passwordForm.processing}
                                    className="inline-flex items-center gap-2 px-4 py-2 text-[13px] rounded-lg transition-colors disabled:opacity-50"
                                    style={{ background: '#1a2540', color: '#ffffff' }}
                                    onMouseEnter={e => !passwordForm.processing && (e.currentTarget.style.background = '#243355')}
                                    onMouseLeave={e => e.currentTarget.style.background = '#1a2540'}
                                >
                                    <Lock size={14} />
                                    {passwordForm.processing ? 'Memproses...' : 'Ubah Password'}
                                </button>
                            </div>
                        </form>
                    </div>

                </div>
            </div>
        </MainLayout>
    );
}