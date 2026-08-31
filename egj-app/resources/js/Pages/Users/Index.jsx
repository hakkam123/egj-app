import { Head, useForm, Link, router } from '@inertiajs/react';
import {
    Plus,
    Edit2,
    Trash2,
    Search,
    RotateCcw,
    X,
    User as UserIcon,
    Lock,
    Save,
    ShieldCheck,
    CheckCircle2,
    XCircle,
    Mail,
    IdCard,
} from 'lucide-react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

export default function UsersIndex({ users, filters }) {
    // Filter states
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [roleFilter, setRoleFilter] = useState(filters?.role || '');
    const [statusFilter, setStatusFilter] = useState(filters?.status || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    // Modal states
    const [showModal, setShowModal] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingUserId, setEditingUserId] = useState(null);

    // Delete modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [userToDelete, setUserToDelete] = useState(null);

    const isInitialMount = useRef(true);

    // User Form
    const userForm = useForm({
        name: '',
        email: '',
        npk: '',
        password: '',
        password_confirmation: '',
        role: 'Staff',
        is_active: true,
        is_default_approver: false,
    });

    const updateFilters = (overrides = {}) => {
        const queryParams = {
            search: searchQuery,
            role: roleFilter,
            status: statusFilter,
            per_page: perPage,
            ...overrides,
        };

        const cleaned = {};
        Object.entries(queryParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                cleaned[k] = v;
            }
        });

        router.get('/users', cleaned, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounce search
    useEffect(() => {
        if (isInitialMount.current) {
            isInitialMount.current = false;
            return;
        }

        const timer = setTimeout(() => {
            if (searchQuery !== (filters?.search || '')) {
                updateFilters({ search: searchQuery });
            }
        }, 400);

        return () => clearTimeout(timer);
    }, [searchQuery]);

    const handleRoleChange = (e) => {
        const val = e.target.value;
        setRoleFilter(val);
        updateFilters({ role: val });
    };

    const handleStatusChange = (e) => {
        const val = e.target.value;
        setStatusFilter(val);
        updateFilters({ status: val });
    };

    const handlePerPageChange = (e) => {
        const val = e.target.value;
        setPerPage(val);
        updateFilters({ per_page: val });
    };

    const handleResetFilters = () => {
        setSearchQuery('');
        setRoleFilter('');
        setStatusFilter('');
        setPerPage(10);
        router.get('/users', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    // Open Modal for Create
    const openCreateModal = () => {
        setIsEditing(false);
        setEditingUserId(null);
        userForm.reset();
        userForm.clearErrors();
        userForm.setData({
            name: '',
            email: '',
            npk: '',
            password: '',
            password_confirmation: '',
            role: 'Staff',
            is_active: true,
            is_default_approver: false,
        });
        setShowModal(true);
    };

    // Open Modal for Edit
    const openEditModal = (user) => {
        setIsEditing(true);
        setEditingUserId(user.id);
        userForm.clearErrors();
        userForm.setData({
            name: user.name || '',
            email: user.email || '',
            npk: user.npk || '',
            password: '',
            password_confirmation: '',
            role: user.role || 'Staff',
            is_active: Boolean(user.is_active),
            is_default_approver: Boolean(user.is_default_approver),
        });
        setShowModal(true);
    };

    // Submit Create or Edit
    const handleSubmit = (e) => {
        e.preventDefault();

        if (isEditing) {
            userForm.put(`/users/${editingUserId}`, {
                preserveScroll: true,
                onSuccess: () => {
                    setShowModal(false);
                    toast.success('Data user berhasil diperbarui.');
                },
                onError: () => {
                    toast.error('Gagal memperbarui data user. Periksa kembali form isian.');
                }
            });
        } else {
            userForm.post('/users', {
                preserveScroll: true,
                onSuccess: () => {
                    setShowModal(false);
                    userForm.reset();
                    toast.success('User baru berhasil ditambahkan.');
                },
                onError: () => {
                    toast.error('Gagal menambahkan user baru. Periksa kembali form isian.');
                }
            });
        }
    };

    // Delete (Deactivate) User
    const handleDeleteClick = (user) => {
        setUserToDelete(user);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (!userToDelete) return;

        router.delete(`/users/${userToDelete.id}`, {
            preserveScroll: true,
            onSuccess: () => {
                setShowDeleteModal(false);
                setUserToDelete(null);
                toast.success('User berhasil dinonaktifkan.');
            },
            onError: () => {
                toast.error('Gagal menonaktifkan user.');
            }
        });
    };

    const inputClass = "w-full px-3 py-2 text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white rounded-[7px] border border-[var(--border)]";
    const labelClass = "block text-[11px] font-medium uppercase tracking-wide mb-1.5 text-[var(--text-muted)]";

    return (
        <MainLayout title="Manajemen Pengguna">
            <Head title="User Management" />

            <div className="space-y-6 max-w-7xl mx-auto">
                <PageHeader
                    title="User Management"
                    subtitle="Kelola data pengguna, peran akses, dan status akun"
                    actions={
                        <button
                            onClick={openCreateModal}
                            className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg text-white transition-colors shadow-xs"
                            style={{ background: '#1a2540' }}
                            onMouseEnter={e => e.currentTarget.style.background = '#243355'}
                            onMouseLeave={e => e.currentTarget.style.background = '#1a2540'}
                        >
                            <Plus size={16} /> Tambah User
                        </button>
                    }
                />

                {/* Main Card */}
                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-xs">
                    {/* Header bar */}
                    <div className="px-5 py-4 border-b-[0.5px] border-[var(--border)] flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">Daftar Pengguna Sistem</h3>
                        <span className="text-xs text-[var(--text-muted)]">
                            Total: <strong className="text-[var(--text-primary)]">{users?.total || 0}</strong> user
                        </span>
                    </div>

                    {/* Filters Bar */}
                    <div className="p-5 border-b-[0.5px] border-[var(--border)] bg-gray-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
                            {/* Search */}
                            <div className="lg:col-span-2">
                                <label className={labelClass}>Pencarian</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Cari nama, email, atau NPK..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    />
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            {/* Role Filter */}
                            <div>
                                <label className={labelClass}>Role</label>
                                <select
                                    value={roleFilter}
                                    onChange={handleRoleChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Semua Role</option>
                                    <option value="Staff">Staff</option>
                                    <option value="Section Head">Section Head</option>
                                    <option value="Dept/Div Head">Dept/Div Head</option>
                                    <option value="Admin">Admin</option>
                                </select>
                            </div>

                            {/* Status Filter */}
                            <div>
                                <label className={labelClass}>Status Akun</label>
                                <select
                                    value={statusFilter}
                                    onChange={handleStatusChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">Semua Status</option>
                                    <option value="active">Aktif</option>
                                    <option value="inactive">Nonaktif</option>
                                </select>
                            </div>

                            {/* Reset Button */}
                            <div>
                                <label className={labelClass}>&nbsp;</label>
                                <button
                                    type="button"
                                    onClick={handleResetFilters}
                                    className="w-full px-3 py-2 bg-white border-[0.5px] border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-semibold rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                >
                                    <RotateCcw size={15} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[var(--text-primary)]">
                            <thead className="bg-[#fafafa] border-b-[0.5px] border-[var(--border)] text-[11px] uppercase text-[var(--text-muted)] font-semibold">
                                <tr>
                                    <th className="px-5 py-3 whitespace-nowrap">Nama Pengguna</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Email</th>
                                    <th className="px-5 py-3 whitespace-nowrap">NPK</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Role</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3 text-center whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {!users?.data?.length ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-muted)] text-[13px]">
                                            Tidak ada data pengguna yang ditemukan.
                                        </td>
                                    </tr>
                                ) : (
                                    users.data.map(user => (
                                        <tr key={user.id} className="hover:bg-[#f9fafb] transition-colors">
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2.5">
                                                    <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center font-bold text-xs">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-semibold text-[13px] text-[var(--text-primary)]">{user.name}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-[13px] text-[var(--text-secondary)] whitespace-nowrap">
                                                {user.email}
                                            </td>
                                            <td className="px-5 py-3 text-[13px] font-mono whitespace-nowrap">
                                                {user.npk || <span className="text-gray-400">-</span>}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex flex-col items-start gap-1">
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                                                        {user.role}
                                                    </span>
                                                    {user.role === 'Section Head' && user.is_default_approver && (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                                            ★ Default Approver
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                {user.is_active ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#e6f2ef] text-[#2b6b5c]">
                                                        Aktif
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#f1f5f9] text-[#475569]">
                                                        Nonaktif
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 text-center whitespace-nowrap">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => openEditModal(user)}
                                                        className="px-2.5 py-1.5 border-[0.5px] border-[var(--border)] rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-gray-50 transition-colors flex items-center gap-1"
                                                        title="Edit User"
                                                    >
                                                        <Edit2 size={13} /> Edit
                                                    </button>
                                                    {user.is_active && (
                                                        <button
                                                            onClick={() => handleDeleteClick(user)}
                                                            className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors"
                                                            title="Nonaktifkan User"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Footer */}
                    <div className="px-5 py-3 border-t-[0.5px] border-[var(--border)] flex flex-col sm:flex-row items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-[12px] text-[var(--text-secondary)]">Tampilkan</span>
                                <select
                                    value={perPage}
                                    onChange={handlePerPageChange}
                                    className="px-2 py-1 border-[0.5px] border-[var(--border)] rounded-md text-[12px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="10">10</option>
                                    <option value="25">25</option>
                                    <option value="50">50</option>
                                    <option value="100">100</option>
                                </select>
                                <span className="text-[12px] text-[var(--text-secondary)]">data per halaman</span>
                            </div>
                            {users?.from && (
                                <p className="text-[12px] text-[var(--text-secondary)]">
                                    Menampilkan <span className="font-medium text-[var(--text-primary)]">{users.from}</span> - <span className="font-medium text-[var(--text-primary)]">{users.to}</span> dari <span className="font-medium text-[var(--text-primary)]">{users.total}</span> user
                                </p>
                            )}
                        </div>
                        {users?.links && users.links.length > 3 && (
                            <div className="flex gap-1 flex-wrap">
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
                        )}
                    </div>
                </div>
            </div>

            {/* Create & Edit Modal Popup */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs overflow-y-auto"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowModal(false);
                    }}
                >
                    <div className="bg-white rounded-[10px] w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl relative animate-in fade-in zoom-in duration-150 border-[0.5px] border-[var(--border)]">
                        {/* Modal Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b-[0.5px] border-[var(--border)] bg-gray-50/50">
                            <div>
                                <h3 className="text-sm font-bold text-[var(--text-primary)]">
                                    {isEditing ? 'Edit Data Pengguna' : 'Tambah Pengguna Baru'}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                    {isEditing ? 'Perbarui informasi profil, NPK, peran, atau kata sandi pengguna' : 'Lengkapi informasi pengguna baru yang akan didaftarkan ke sistem'}
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="p-1 rounded-md hover:bg-gray-200 text-[var(--text-muted)] transition-colors"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        {/* Modal Form */}
                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* Name */}
                                <div>
                                    <label className={labelClass}>
                                        Nama Lengkap <span style={{ color: '#e05c5c' }}>*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={userForm.data.name}
                                        onChange={e => userForm.setData('name', e.target.value)}
                                        className={inputClass}
                                        placeholder="Nama lengkap user"
                                        required
                                    />
                                    {userForm.errors.name && (
                                        <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{userForm.errors.name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className={labelClass}>
                                        Email <span style={{ color: '#e05c5c' }}>*</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={userForm.data.email}
                                        onChange={e => userForm.setData('email', e.target.value)}
                                        className={inputClass}
                                        placeholder="nama@astra-visteon.com"
                                        required
                                    />
                                    {userForm.errors.email && (
                                        <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{userForm.errors.email}</p>
                                    )}
                                </div>

                                {/* NPK */}
                                <div>
                                    <label className={labelClass}>NPK (Nomor Pokok Karyawan)</label>
                                    <input
                                        type="text"
                                        value={userForm.data.npk}
                                        onChange={e => userForm.setData('npk', e.target.value)}
                                        className={inputClass}
                                        placeholder="Contoh: 12345 (Opsional)"
                                    />
                                    {userForm.errors.npk && (
                                        <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{userForm.errors.npk}</p>
                                    )}
                                </div>

                                {/* Role */}
                                <div>
                                    <label className={labelClass}>
                                        Role / Peran <span style={{ color: '#e05c5c' }}>*</span>
                                    </label>
                                    <select
                                        value={userForm.data.role}
                                        onChange={e => userForm.setData('role', e.target.value)}
                                        className={inputClass}
                                        required
                                    >
                                        <option value="Staff">Staff</option>
                                        <option value="Section Head">Section Head</option>
                                        <option value="Dept/Div Head">Dept/Div Head</option>
                                        <option value="Admin">Admin</option>
                                    </select>
                                    {userForm.errors.role && (
                                        <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{userForm.errors.role}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className={labelClass}>
                                        {isEditing ? (
                                            <>Password Baru <span className="text-gray-400 font-normal lowercase">(opsional)</span></>
                                        ) : (
                                            <>Password <span style={{ color: '#e05c5c' }}>*</span></>
                                        )}
                                    </label>
                                    <input
                                        type="password"
                                        value={userForm.data.password}
                                        onChange={e => userForm.setData('password', e.target.value)}
                                        className={inputClass}
                                        placeholder={isEditing ? 'Kosongkan jika tidak diubah' : 'Minimal 8 karakter'}
                                        required={!isEditing}
                                    />
                                    {(!isEditing || Boolean(userForm.data.password?.length)) && (
                                        <p className="mt-1 text-right text-[11px]" style={{ color: (userForm.data.password?.length || 0) < 8 ? '#e05c5c' : 'var(--text-muted)' }}>
                                            {userForm.data.password?.length || 0} / 8 karakter minimum
                                        </p>
                                    )}
                                    {userForm.errors.password && (
                                        <p className="mt-1 text-[12px]" style={{ color: '#e05c5c' }}>{userForm.errors.password}</p>
                                    )}
                                </div>

                                {/* Password Confirmation */}
                                <div>
                                    <label className={labelClass}>
                                        {isEditing ? (
                                            <>Konfirmasi Password Baru <span className="text-gray-400 font-normal lowercase">(opsional)</span></>
                                        ) : (
                                            <>Konfirmasi Password <span style={{ color: '#e05c5c' }}>*</span></>
                                        )}
                                    </label>
                                    <input
                                        type="password"
                                        value={userForm.data.password_confirmation}
                                        onChange={e => userForm.setData('password_confirmation', e.target.value)}
                                        className={inputClass}
                                        placeholder="Ulangi password"
                                        required={!isEditing && Boolean(userForm.data.password)}
                                    />
                                </div>
                            </div>

                            {/* Status Aktif & Default Approver */}
                            <div className="space-y-3 pt-3 border-t-[0.5px] border-[var(--border)]">
                                <div className="flex items-center gap-3">
                                    <input
                                        type="checkbox"
                                        id="modal_is_active"
                                        checked={userForm.data.is_active}
                                        onChange={e => userForm.setData('is_active', e.target.checked)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                    />
                                    <label htmlFor="modal_is_active" className="text-[13px] font-medium text-[var(--text-primary)] cursor-pointer">
                                        Akun Aktif (Dapat login ke sistem)
                                    </label>
                                </div>

                                {userForm.data.role === 'Section Head' && (
                                    <div className="flex items-start gap-3 p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                                        <input
                                            type="checkbox"
                                            id="modal_is_default_approver"
                                            checked={userForm.data.is_default_approver}
                                            onChange={e => userForm.setData('is_default_approver', e.target.checked)}
                                            className="w-4 h-4 mt-0.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                        />
                                        <div>
                                            <label htmlFor="modal_is_default_approver" className="text-[13px] font-semibold text-blue-900 cursor-pointer">
                                                Default Approver Section Head
                                            </label>
                                            <p className="text-[11px] text-blue-700 mt-0.5">
                                                Jika dicentang, dokumen General Journal baru dari Staff akan otomatis ditugaskan ke Section Head ini untuk approval tingkat pertama.
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Modal Actions */}
                            <div className="flex items-center justify-end gap-3 pt-4 border-t-[0.5px] border-[var(--border)]">
                                <button
                                    type="button"
                                    onClick={() => setShowModal(false)}
                                    className="px-4 py-2 text-[13px] font-medium rounded-lg border-[0.5px] border-[var(--border)] text-[var(--text-secondary)] hover:bg-gray-50 transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={userForm.processing}
                                    className="inline-flex items-center gap-2 px-5 py-2 text-[13px] font-semibold rounded-lg text-white transition-colors disabled:opacity-50 shadow-xs"
                                    style={{ background: '#1a2540' }}
                                    onMouseEnter={e => !userForm.processing && (e.currentTarget.style.background = '#243355')}
                                    onMouseLeave={e => e.currentTarget.style.background = '#1a2540'}
                                >
                                    {userForm.processing ? 'Menyimpan...' : isEditing ? 'Simpan Perubahan' : 'Tambah User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {showDeleteModal && userToDelete && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs"
                    onClick={(e) => {
                        if (e.target === e.currentTarget) setShowDeleteModal(false);
                    }}
                >
                    <div className="bg-white rounded-[10px] p-6 w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-150 border-[0.5px] border-[var(--border)]">
                        <h3 className="text-base font-bold text-[var(--text-primary)] mb-2">
                            Nonaktifkan Pengguna?
                        </h3>
                        <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-6">
                            Apakah Anda yakin ingin menonaktifkan akun pengguna <strong className="text-[var(--text-primary)]">{userToDelete.name}</strong> ({userToDelete.email})? Pengguna tidak akan dapat login lagi ke dalam sistem.
                        </p>
                        <div className="flex justify-end gap-3">
                            <button
                                type="button"
                                onClick={() => setShowDeleteModal(false)}
                                className="px-4 py-2 text-[13px] font-medium rounded-lg border-[0.5px] border-[var(--border)] text-[var(--text-secondary)] hover:bg-gray-50 transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                type="button"
                                onClick={confirmDelete}
                                className="px-4 py-2 text-[13px] font-bold rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors shadow-xs"
                            >
                                Ya, Nonaktifkan
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}