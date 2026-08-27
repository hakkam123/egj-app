import { Head, useForm } from '@inertiajs/react';
import { LogIn, User, Lock } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        email: '',
        password: '',
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    // Style konsisten dengan halaman lain
    const inputClass = "w-full px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white rounded-[7px]";
    const inputStyle = { border: '0.5px solid var(--border)', color: 'var(--text-primary)' };
    const labelClass = "block text-[11px] font-medium uppercase tracking-wide mb-1.5";
    const labelStyle = { color: 'var(--text-muted)' };

    return (
        <>
            <Head title="Login" />

            <div className="min-h-screen flex items-center justify-center bg-dashboard px-4 relative">
                <div className="w-full max-w-md relative z-10">
                    {/* Card utama */}
                    <div
                        className="rounded-[10px] p-8"
                        style={{ background: 'var(--card-bg)', border: '0.5px solid var(--border)' }}
                    >
                        {/* Logo + Brand */}
                        <div className="text-center mb-8">
                            <div className="flex justify-center mb-4">
                                <img
                                    src="/images/egj-png.png"
                                    alt="Company Logo"
                                    className="h-24 w-auto"
                                />
                            </div>
                            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                GJAS
                            </h1>
                            <p className="text-sm mt-0.5" style={{ color: 'var(--text-secondary)' }}>
                                General Journal Approval System
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
                                        type="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className={`${inputClass} pl-10`}
                                        style={inputStyle}
                                        placeholder="••••••••"
                                        required
                                    />
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
                    </div>

                    {/* Footer */}
                    <p className="text-center text-xs mt-6" style={{ color: 'var(--text-muted)' }}>
                        © {new Date().getFullYear()} PT Astra Visteon Indonesia
                    </p>
                </div>
            </div>
        </>
    );
}