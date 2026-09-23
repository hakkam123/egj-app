import { Head } from '@inertiajs/react';

export default function Invalid({ message }) {
    return (
        <>
            <Head title="Token Tidak Valid" />
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-red-950 to-slate-900 p-4">
                <div className="w-full max-w-md text-center">
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-red-500/20 rounded-full mb-6">
                        <svg className="w-10 h-10 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                        </svg>
                    </div>
                    <h1 className="text-2xl font-bold text-white mb-2">Token Tidak Valid</h1>
                    <p className="text-gray-400 text-sm">{message}</p>
                    <div className="mt-8">
                        <a href="/login" className="text-sm text-blue-400 hover:text-blue-300 underline">
                            Login ke Portal JAGO
                        </a>
                    </div>
                </div>
            </div>
        </>
    );
}
