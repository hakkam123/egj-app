import { Head, useForm, usePage } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { User, Lock, Save } from 'lucide-react';

export default function ProfileEdit({ user }) {
    const profileForm = useForm({
        name: user.name || '',
        email: user.email || '',
        npk: user.npk || '',
    });

    const passwordForm = useForm({
        current_password: '',
        new_password: '',
        new_password_confirmation: '',
    });

    const handleProfileSubmit = (e) => {
        e.preventDefault();
        profileForm.put('/profile', { preserveScroll: true });
    };

    const handlePasswordSubmit = (e) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            preserveScroll: true,
            onSuccess: () => {
                passwordForm.reset();
            },
        });
    };

    return (
        <MainLayout title="Profil Saya">
            <Head title="Profil" />

            <div className="max-w-3xl mx-auto space-y-6">
                <div>
                    <h2 className="text-xl font-bold text-[var(--text-primary)]">Pengaturan Akun</h2>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Kelola informasi profil dan keamanan akun Anda</p>
                </div>

                {/* Edit Profile Card */}
                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden">
                    <div className="px-6 py-4 border-b-[0.5px] border-[var(--border)] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center">
                            <User size={16} className="text-blue-600" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Informasi Profil</h3>
                            <p className="text-[11px] text-[var(--text-secondary)]">Perbarui nama, email, dan NPK Anda</p>
                        </div>
                    </div>

                    <form onSubmit={handleProfileSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Nama Lengkap <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="text"
                                value={profileForm.data.name}
                                onChange={e => profileForm.setData('name', e.target.value)}
                                className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Masukkan nama lengkap"
                            />
                            {profileForm.errors.name && <p className="mt-1 text-[12px] text-red-500">{profileForm.errors.name}</p>}
                        </div>

                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Email <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="email"
                                value={profileForm.data.email}
                                onChange={e => profileForm.setData('email', e.target.value)}
                                className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="contoh@email.com"
                            />
                            {profileForm.errors.email && <p className="mt-1 text-[12px] text-red-500">{profileForm.errors.email}</p>}
                        </div>

                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                NPK (Nomor Pokok Karyawan)
                            </label>
                            <input
                                type="text"
                                value={profileForm.data.npk}
                                onChange={e => profileForm.setData('npk', e.target.value)}
                                className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Masukkan NPK"
                            />
                            {profileForm.errors.npk && <p className="mt-1 text-[12px] text-red-500">{profileForm.errors.npk}</p>}
                        </div>

                        <div className="flex items-center gap-2 text-[12px] text-[var(--text-secondary)] bg-gray-50 px-3 py-2 rounded-lg border-[0.5px] border-[var(--border)]">
                            <span className="font-medium text-[var(--text-primary)]">Role:</span>
                            <span>{user.role}</span>
                        </div>

                        <div className="flex justify-end pt-4 border-t-[0.5px] border-[var(--border)]">
                            <button
                                type="submit"
                                disabled={profileForm.processing}
                                className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 text-white text-[13px] font-bold rounded-full hover:bg-blue-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <Save size={14} />
                                {profileForm.processing ? 'Menyimpan...' : 'Simpan Profil'}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Change Password Card */}
                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden">
                    <div className="px-6 py-4 border-b-[0.5px] border-[var(--border)] flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-amber-50 flex items-center justify-center">
                            <Lock size={16} className="text-amber-600" />
                        </div>
                        <div>
                            <h3 className="text-[14px] font-bold text-[var(--text-primary)]">Ganti Password</h3>
                            <p className="text-[11px] text-[var(--text-secondary)]">Pastikan akun Anda menggunakan password yang kuat</p>
                        </div>
                    </div>

                    <form onSubmit={handlePasswordSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Password Saat Ini <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.current_password}
                                onChange={e => passwordForm.setData('current_password', e.target.value)}
                                className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Masukkan password saat ini"
                            />
                            {passwordForm.errors.current_password && <p className="mt-1 text-[12px] text-red-500">{passwordForm.errors.current_password}</p>}
                        </div>

                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Password Baru <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.new_password}
                                onChange={e => passwordForm.setData('new_password', e.target.value)}
                                className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Minimal 8 karakter"
                            />
                            {passwordForm.errors.new_password && <p className="mt-1 text-[12px] text-red-500">{passwordForm.errors.new_password}</p>}
                        </div>

                        <div>
                            <label className="block text-[12px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">
                                Konfirmasi Password Baru <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="password"
                                value={passwordForm.data.new_password_confirmation}
                                onChange={e => passwordForm.setData('new_password_confirmation', e.target.value)}
                                className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-[7px] text-[13px] text-[var(--text-primary)] focus:outline-none focus:ring-1 focus:ring-blue-500"
                                placeholder="Ketik ulang password baru"
                            />
                        </div>

                        <div className="flex justify-end pt-4 border-t-[0.5px] border-[var(--border)]">
                            <button
                                type="submit"
                                disabled={passwordForm.processing}
                                className="inline-flex items-center gap-2 px-5 py-2 bg-amber-600 text-white text-[13px] font-bold rounded-full hover:bg-amber-700 disabled:opacity-50 transition-colors shadow-sm"
                            >
                                <Lock size={14} />
                                {passwordForm.processing ? 'Menyimpan...' : 'Ubah Password'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </MainLayout>
    );
}
