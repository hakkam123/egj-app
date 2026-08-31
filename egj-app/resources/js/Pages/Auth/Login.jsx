import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { User, Lock, Eye, EyeOff } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    const inputClass = "w-full px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white rounded-[7px]";
    const inputStyle = { border: '0.5px solid var(--border)', color: 'var(--text-primary)' };
    const labelClass = "block text-[11px] font-medium uppercase tracking-wide mb-1.5";
    const labelStyle = { color: 'var(--text-muted)' };

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen flex items-center justify-center bg-dashboard px-4">
                <div
                    className="w-full max-w-3xl flex flex-col lg:flex-row overflow-hidden rounded-[12px]"
                    style={{ border: '0.5px solid var(--border)' }}
                >
                    {/* Kolom kiri: Logo + Deskripsi */}
                    <div
                        className="w-full lg:w-[45%] flex flex-col"
                        style={{ background: '#ffffff', borderRight: '0.5px solid var(--border)' }}
                    >
                        {/* Atas: Logo */}
                        <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 pb-4">
                            <img
                                src="/images/egj-png.png"
                                alt="EGJ Logo"
                                className="w-60 sm:w-66 h-auto"
                            />
                        </div>

                        {/* Divider */}
                        <div style={{ height: '0.5px', background: 'var(--border)', margin: '0 24px' }} />

                        {/* Bawah: Deskripsi */}
                        <div className="flex-1 flex flex-col items-center justify-center p-8 pt-5 text-center">
                            <p className="text-[11px] font-semibold uppercase tracking-widest mb-2" style={{ color: 'var(--text-muted)' }}>
                                Tentang Aplikasi
                            </p>
                            <p className="text-[13px] leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                                Electronic General Journal Approval adalah sistem persetujuan jurnal digital untuk PT Astra Visteon Indonesia.
                            </p>
                        </div>
                    </div>

                    {/* Kolom kanan: Form */}
                    <div
                        className="w-full lg:w-[55%] flex flex-col justify-center p-8 lg:p-10"
                        style={{ background: 'var(--card-bg)' }}
                    >
                        {/* Title */}
                        <div className="mb-7">
                            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Masuk
                            </h1>
                            <p className="mt-1 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                Silakan masuk menggunakan akun Anda
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Email */}
                            <div>
                                <label htmlFor="email" className={labelClass} style={labelStyle}>
                                    Email <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User size={15} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <input
                                        id="email"
                                        type="email"
                                        value={data.email}
                                        onChange={(e) => setData('email', e.target.value)}
                                        className={`${inputClass} pl-10`}
                                        style={inputStyle}
                                        placeholder="nama@astra-visteon.com"
                                        required
                                        autoFocus
                                    />
                                </div>
                                {errors.email && (
                                    <p className="mt-1.5 text-[12px]" style={{ color: '#e05c5c' }}>{errors.email}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className={labelClass} style={labelStyle}>
                                    Password <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock size={15} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <input
                                        id="password"
                                        type={showPassword ? 'text' : 'password'}
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={`${inputClass} pl-10 pr-10`}
                                        style={inputStyle}
                                        placeholder="••••••••"
                                        required
                                    />
                                    {/* Toggle show/hide password */}
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword((prev) => !prev)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center"
                                        tabIndex={-1}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={15} style={{ color: 'var(--text-muted)' }} />
                                        ) : (
                                            <Eye size={15} style={{ color: 'var(--text-muted)' }} />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1.5 text-[12px]" style={{ color: '#e05c5c' }}>{errors.password}</p>
                                )}
                            </div>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 rounded-lg text-white font-medium text-[13px] transition-colors disabled:opacity-50"
                                style={{ background: '#1a2540' }}
                                onMouseEnter={e => !processing && (e.currentTarget.style.background = '#243355')}
                                onMouseLeave={e => e.currentTarget.style.background = '#1a2540'}
                            >
                                {processing ? 'Masuk...' : 'Masuk'}
                            </button>
                        </form>

                        {/* Footer */}
                        <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                            © {new Date().getFullYear()} PT Astra Visteon Indonesia. All Rights Reserved. <br />
                                                    </p>
                    </div>
                </div>
            </div>
        </>
    );
}