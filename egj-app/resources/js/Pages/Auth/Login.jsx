import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import { User, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function Login() {
    const { data, setData, post, processing, errors } = useForm({
        npk: '',
        password: '',
    });
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        post('/login');
    };

    const inputClass = "w-full px-3.5 py-2.5 text-[13px] focus:outline-none focus:ring-2 focus:ring-[#1a2540]/20 focus:border-[#1a2540] bg-white rounded-lg transition-all";
    const inputStyle = { border: '1px solid var(--border)', color: 'var(--text-primary)' };
    const labelClass = "block text-[11px] font-semibold uppercase tracking-wider mb-1.5";
    const labelStyle = { color: 'var(--text-muted)' };

    return (
        <>
            <Head title="Sign In" />

            <div className="min-h-screen flex items-center justify-center bg-dashboard px-4 py-12">
                <div
                    className="w-full max-w-md bg-white rounded-2xl shadow-sm p-8 sm:p-10"
                    style={{ border: '0.5px solid var(--border)' }}
                >
                    {/* Row 1: Logo */}
                    <div className="flex justify-center mb-6">
                        <img
                            src="/images/JAGO-logo.png"
                            alt="JAGO Logo"
                            className="w-56 sm:w-64 h-auto object-contain"
                        />
                    </div>

                    {/* Row 2: Title, Form Input, Button */}
                    <div>
                        {/* Title */}
                        <div className="mb-6 text-center">
                            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                                Sign In
                            </h1>
                            <p className="mt-1 text-[13px]" style={{ color: 'var(--text-secondary)' }}>
                                Please sign in with your corporate account
                            </p>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* NPK */}
                            <div>
                                <label htmlFor="npk" className={labelClass} style={labelStyle}>
                                    Employee ID (NPK) <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <User size={15} style={{ color: 'var(--text-muted)' }} />
                                    </div>
                                    <input
                                        id="npk"
                                        type="text"
                                        value={data.npk}
                                        onChange={(e) => setData('npk', e.target.value)}
                                        className={`${inputClass} pl-10`}
                                        style={inputStyle}
                                        placeholder="e.g. 10004"
                                        required
                                        autoFocus
                                    />
                                </div>
                                {errors.npk && (
                                    <p className="mt-1.5 text-[12px]" style={{ color: '#e05c5c' }}>{errors.npk}</p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className={labelClass} style={labelStyle}>
                                    Password <span style={{ color: '#e05c5c' }}>*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
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
                                        className="absolute inset-y-0 right-0 pr-3.5 flex items-center"
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
                                className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg text-white font-medium text-[13px] transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-2"
                                style={{ background: '#1a2540' }}
                                onMouseEnter={e => !processing && (e.currentTarget.style.background = '#243355')}
                                onMouseLeave={e => e.currentTarget.style.background = '#1a2540'}
                            >
                                {processing ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        <span>Signing In...</span>
                                    </>
                                ) : (
                                    'Sign In'
                                )}
                            </button>
                        </form>

                        {/* Footer */}
                        <p className="text-center text-[11px] mt-6" style={{ color: 'var(--text-muted)' }}>
                            © {new Date().getFullYear()} PT Astra Visteon Indonesia. All Rights Reserved.
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}