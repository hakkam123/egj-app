import { Head, Link } from '@inertiajs/react';
import { Plus, Edit2, Trash2 } from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';

export default function UsersIndex({ users }) {
    return (
        <MainLayout title="Manajemen Pengguna">
            <Head title="User Management" />

            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-bold text-[var(--text-primary)]">User Management</h2>
                        <p className="text-sm text-[var(--text-secondary)] mt-1">Kelola data pengguna, peran, dan akses sistem</p>
                    </div>
                    <Link
                        href="/users/create"
                        className="inline-flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-[13px] font-bold rounded-full shadow-sm transition-colors"
                    >
                        <Plus size={16} /> Tambah User
                    </Link>
                </div>

                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[var(--text-primary)]">
                            <thead className="bg-[#fafafa] border-b-[0.5px] border-[var(--border)] text-[11px] uppercase text-[var(--text-muted)] font-semibold">
                                <tr>
                                    <th className="px-5 py-3 whitespace-nowrap">Nama</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Email</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Role</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3 text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {users?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-5 py-12 text-center text-[var(--text-muted)] text-[13px]">
                                            Tidak ada data pengguna.
                                        </td>
                                    </tr>
                                ) : (
                                    users?.data?.map(user => (
                                        <tr key={user.id} className="hover:bg-[#f9fafb] transition-colors">
                                            <td className="px-5 py-3">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-[11px] font-bold text-blue-700 flex-shrink-0">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[13px]">{user.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                                                {user.email}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className="px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700">
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                                                    user.is_active
                                                        ? 'bg-[var(--badge-approved-bg)] text-[var(--badge-approved-text)]'
                                                        : 'bg-[var(--badge-rejected-bg)] text-[var(--badge-rejected-text)]'
                                                }`}>
                                                    {user.is_active ? 'Aktif' : 'Nonaktif'}
                                                </span>
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <Link
                                                        href={`/users/${user.id}/edit`}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border-[0.5px] border-[var(--border)] rounded-md text-[12px] font-medium text-blue-600 hover:bg-blue-50 transition-colors"
                                                    >
                                                        <Edit2 size={14} /> Edit
                                                    </Link>
                                                    <button
                                                        onClick={() => {
                                                            if(confirm('Yakin ingin menghapus user ini?')) {
                                                                // router.delete(`/users/${user.id}`)
                                                            }
                                                        }}
                                                        className="flex items-center gap-1.5 px-3 py-1.5 border-[0.5px] border-[var(--border)] rounded-md text-[12px] font-medium text-red-600 hover:bg-red-50 transition-colors"
                                                    >
                                                        <Trash2 size={14} /> Hapus
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {users?.links && users.links.length > 3 && (
                        <div className="px-5 py-3 border-t-[0.5px] border-[var(--border)] flex items-center justify-between">
                            <p className="text-[12px] text-[var(--text-secondary)]">
                                Menampilkan <span className="font-medium text-[var(--text-primary)]">{users.from}</span> - <span className="font-medium text-[var(--text-primary)]">{users.to}</span> dari <span className="font-medium text-[var(--text-primary)]">{users.total}</span> data
                            </p>
                            <div className="flex gap-1">
                                {users.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${
                                            link.active
                                                ? 'bg-blue-600 text-white font-medium'
                                                : link.url
                                                    ? 'text-[var(--text-secondary)] hover:bg-gray-100'
                                                    : 'text-gray-300 cursor-not-allowed'
                                        }`}
                                        dangerouslySetInnerHTML={{ __html: link.label }}
                                        preserveState
                                    />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </MainLayout>
    );
}
