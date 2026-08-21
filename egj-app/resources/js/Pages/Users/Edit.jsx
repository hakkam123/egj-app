import { Head, useForm, router } from '@inertiajs/react';
import { useState } from 'react';
import MainLayout from '../../Layouts/MainLayout';
import ConfirmModal from '../../Components/ConfirmModal';

export default function UserEdit({ user }) {
    const { data, setData, processing, errors } = useForm({
        name: user.name || '', email: user.email || '', password: '', password_confirmation: '', role: user.role || 'Staff', is_active: user.is_active ?? true,
    });
    const [confirmOpen, setConfirmOpen] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        router.put(`/users/${user.id}`, data);
    };

    const handleDeactivate = () => {
        setConfirmOpen(true);
    };

    const confirmDeactivate = () => {
        router.delete(`/users/${user.id}`);
    };

    return (
        <MainLayout title="Edit User">
            <Head title="Edit User" />
            <div className="max-w-2xl mx-auto">
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4">
                        <h2 className="text-lg font-semibold text-white">Edit User</h2>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-5">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama <span className="text-red-500">*</span></label>
                            <input type="text" value={data.name} onChange={e => setData('name', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                            {errors.name && <p className="mt-1 text-sm text-red-500">{errors.name}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Email <span className="text-red-500">*</span></label>
                            <input type="email" value={data.email} onChange={e => setData('email', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" required />
                            {errors.email && <p className="mt-1 text-sm text-red-500">{errors.email}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Password <span className="text-gray-400">(kosongkan jika tidak berubah)</span></label>
                            <input type="password" value={data.password} onChange={e => setData('password', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                            {errors.password && <p className="mt-1 text-sm text-red-500">{errors.password}</p>}
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Konfirmasi Password</label>
                            <input type="password" value={data.password_confirmation} onChange={e => setData('password_confirmation', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Role <span className="text-red-500">*</span></label>
                            <select value={data.role} onChange={e => setData('role', e.target.value)} className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500">
                                <option value="Staff">Staff</option>
                                <option value="Section Head">Section Head</option>
                                <option value="Dept/Div Head">Dept/Div Head</option>
                                <option value="Admin">Admin</option>
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <input type="checkbox" id="is_active" checked={data.is_active} onChange={e => setData('is_active', e.target.checked)} className="rounded border-gray-300 text-blue-600 focus:ring-blue-500" />
                            <label htmlFor="is_active" className="text-sm text-gray-700">Aktif</label>
                        </div>
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                            <button type="button" onClick={handleDeactivate} className="px-4 py-2.5 text-sm font-medium text-red-700 bg-red-50 border border-red-200 rounded-lg hover:bg-red-100 transition-colors">
                                Nonaktifkan User
                            </button>
                            <div className="flex gap-3">
                                <a href="/users" className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg">Batal</a>
                                <button type="submit" disabled={processing} className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 rounded-lg shadow-sm">{processing ? 'Menyimpan...' : 'Update'}</button>
                            </div>
                        </div>
                    </form>
                </div>
            </div>

            <ConfirmModal
                open={confirmOpen}
                title="Nonaktifkan User"
                message="Apakah Anda yakin ingin menonaktifkan user ini? User tidak akan bisa login ke sistem."
                confirmText="Nonaktifkan"
                isDanger={true}
                onClose={() => setConfirmOpen(false)}
                onConfirm={confirmDeactivate}
            />
        </MainLayout>
    );
}
