import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Monitor, CheckCircle, Clock, Plus, Users, Search, Bell, Download, ChevronLeft, ChevronRight, Menu, UserCog, LogOut } from 'lucide-react';

export default function MainLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const user = auth.user;
    const pendingCount = auth.pending_count || 0;
    
    // Default open on desktop, can be toggled
    const [sidebarOpen, setSidebarOpen] = useState(true);

    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, { position: 'top-right' });
        }
        if (flash?.error) {
            toast.error(flash.error, { position: 'top-right' });
        }
    }, [flash]);

    const currentPath = window.location.pathname;

    const navGroups = [
        {
            label: 'Main Menu',
            items: [
                { name: 'Monitoring', href: '/monitoring', icon: Monitor, roles: ['Admin', 'Staff', 'Section Head', 'Dept/Div Head'] },
                { name: 'Buat Draft', href: '/general-journals/create', icon: Plus, roles: ['Staff', 'Section Head'] },
            ]
        },
        {
            label: 'Tasks',
            items: [
                { 
                    name: 'Approval', 
                    href: '/approval', 
                    icon: CheckCircle, 
                    roles: ['Section Head', 'Dept/Div Head'],
                    badge: pendingCount > 0 ? pendingCount : null
                },
                { name: 'Tracking', href: '/tracking', icon: Clock, roles: ['Staff', 'Section Head', 'Dept/Div Head'] },
            ]
        },
        {
            label: 'Settings',
            items: [
                { name: 'User Management', href: '/users', icon: Users, roles: ['Admin'] },
            ]
        }
    ];

    return (
        <div className="flex h-screen w-full bg-(--page-bg) overflow-hidden font-sans">
            {/* Sidebar */}
            <aside 
                className={`flex flex-col bg-(--sidebar-bg) transition-all duration-300 shrink-0 z-20 ${sidebarOpen ? 'w-55' : 'w-18'}`}
            >

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
                    {navGroups.map((group, idx) => {
                        const visibleItems = group.items.filter(item => item.roles.includes(user?.role));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx} className="mb-6 px-3">
                                {sidebarOpen && (
                                    <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-(--sidebar-section-label) uppercase">
                                        {group.label}
                                    </p>
                                )}
                                <div className="space-y-1">
                                    {visibleItems.map(item => {
                                        const isActive = currentPath.startsWith(item.href);
                                        const Icon = item.icon;
                                        return (
                                            <Link
                                                key={item.name}
                                                href={item.href}
                                                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${
                                                    isActive 
                                                        ? 'bg-(--sidebar-active-bg) text-(--sidebar-active-text)' 
                                                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                                                } ${!sidebarOpen ? 'justify-center' : ''}`}
                                                title={!sidebarOpen ? item.name : undefined}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                                    {sidebarOpen && <span className="truncate">{item.name}</span>}
                                                </div>
                                                {sidebarOpen && item.badge && (
                                                    <span className="flex items-center justify-center min-w-5 h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {!sidebarOpen && item.badge && (
                                                    <span className="absolute right-2 -mt-4 flex items-center justify-center w-2 h-2 bg-red-500 rounded-full"></span>
                                                )}
                                            </Link>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </nav>

                {/* User Info */}
                <div className="p-3 border-t border-(--sidebar-section-label)/20">
                    <Link
                        href="/profile"
                        className={`flex items-center gap-3 rounded-lg px-2 py-2 transition-colors ${
                            currentPath === '/profile'
                                ? 'bg-(--sidebar-active-bg)'
                                : 'hover:bg-white/5'
                        } ${!sidebarOpen && 'justify-center'}`}
                        title={!sidebarOpen ? user?.name : undefined}
                    >
                        <div className="w-9 h-9 rounded-full bg-linear-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold shrink-0 shadow-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-white truncate">{user?.name}</p>
                                <p className="text-[11px] text-(--sidebar-text) truncate">{user?.role}</p>
                            </div>
                        )}
                    </Link>
                    {sidebarOpen && (
                        <div className="mt-2 px-1 space-y-1">
                            <Link
                                href="/profile"
                                className="w-full text-left text-[12px] text-white/75 hover:text-white transition-colors flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5"
                            >
                                <UserCog className="w-4 h-4" />
                                Akun Saya
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full text-left text-[12px] text-white/75 hover:text-white transition-colors flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-white/5"
                            >
                                <LogOut className="w-4 h-4" />
                                Keluar Sistem
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-(--page-bg)">
                {/* Topbar */}
                <header className="h-13 bg-(--topbar-bg) border-b-[0.5px] border-(--border) flex items-center justify-between px-6 hrink-0 z-10">
                    <div className="flex items-center gap-4">
                        <button 
                            onClick={() => setSidebarOpen(!sidebarOpen)}
                            className="p-1.5 rounded-md text-(--text-secondary) hover:text-(--text-primary) hover:bg-gray-100 transition-colors"
                        >
                            <Menu size={18} />
                        </button>
                    </div>
                    
                </header>

                <Toaster />

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-5 md:p-6">
                    {children}
                </main>
            </div>
        </div>
    );
}
