import { Link, usePage } from '@inertiajs/react';
import { useState, useEffect } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import { Monitor, CheckCircle, Clock, Plus, Users, Search, Bell, Download, ChevronLeft, ChevronRight } from 'lucide-react';

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
        <div className="flex h-screen w-full bg-[var(--page-bg)] overflow-hidden font-sans">
            {/* Sidebar */}
            <aside 
                className={`flex flex-col bg-[var(--sidebar-bg)] transition-all duration-300 flex-shrink-0 z-20 ${sidebarOpen ? 'w-[220px]' : 'w-[72px]'}`}
            >
                {/* Logo Area */}
                <div className="h-[52px] flex items-center justify-between px-4 border-b border-[var(--sidebar-section-label)]/20">
                    {sidebarOpen && (
                        <div className="flex items-center gap-2 overflow-hidden">
                            <div className="bg-white p-1 rounded">
                                <img src="/images/egj-png.png" alt="Logo" className="h-5 w-auto object-contain" />
                            </div>
                            <div className="flex flex-col">
                                <span className="font-bold text-white text-sm tracking-wide leading-tight truncate">GJAS</span>
                                <span className="text-[10px] text-[var(--sidebar-text)] uppercase truncate">PT Astra Visteon</span>
                            </div>
                        </div>
                    )}
                    <button 
                        onClick={() => setSidebarOpen(!sidebarOpen)}
                        className="p-1.5 rounded-md text-[var(--sidebar-text)] hover:text-white hover:bg-white/10 transition-colors mx-auto"
                    >
                        {sidebarOpen ? <ChevronLeft size={18} /> : <ChevronRight size={18} />}
                    </button>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-4 scrollbar-thin">
                    {navGroups.map((group, idx) => {
                        const visibleItems = group.items.filter(item => item.roles.includes(user?.role));
                        if (visibleItems.length === 0) return null;

                        return (
                            <div key={idx} className="mb-6 px-3">
                                {sidebarOpen && (
                                    <p className="px-3 mb-2 text-[10px] font-semibold tracking-wider text-[var(--sidebar-section-label)] uppercase">
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
                                                        ? 'bg-[var(--sidebar-active-bg)] text-[var(--sidebar-active-text)]' 
                                                        : 'text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white'
                                                } ${!sidebarOpen ? 'justify-center' : ''}`}
                                                title={!sidebarOpen ? item.name : undefined}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <Icon size={18} strokeWidth={isActive ? 2.5 : 2} />
                                                    {sidebarOpen && <span className="truncate">{item.name}</span>}
                                                </div>
                                                {sidebarOpen && item.badge && (
                                                    <span className="flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-red-500 rounded-full">
                                                        {item.badge}
                                                    </span>
                                                )}
                                                {!sidebarOpen && item.badge && (
                                                    <span className="absolute right-2 mt-[-16px] flex items-center justify-center w-2 h-2 bg-red-500 rounded-full"></span>
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
                <div className="p-3 border-t border-[var(--sidebar-section-label)]/20">
                    <div className={`flex items-center gap-3 ${!sidebarOpen && 'justify-center'}`}>
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold flex-shrink-0 shadow-sm">
                            {user?.name?.charAt(0).toUpperCase()}
                        </div>
                        {sidebarOpen && (
                            <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-white truncate">{user?.name}</p>
                                <p className="text-[11px] text-[var(--sidebar-text)] truncate">{user?.role}</p>
                            </div>
                        )}
                    </div>
                    {sidebarOpen && (
                        <div className="mt-3 px-1">
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full text-left text-[12px] text-[var(--sidebar-text)] hover:text-white transition-colors flex items-center gap-2"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                                Keluar Sistem
                            </Link>
                        </div>
                    )}
                </div>
            </aside>

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col min-w-0 bg-[var(--page-bg)]">
                {/* Topbar */}
                <header className="h-[52px] bg-[var(--topbar-bg)] border-b-[0.5px] border-[var(--border)] flex items-center justify-between px-6 flex-shrink-0 z-10">
                    <div className="flex items-center">
                        <h1 className="text-[15px] font-medium text-[var(--text-primary)]">
                            {title || 'Dashboard'}
                        </h1>
                    </div>
                    
                    <div className="flex items-center gap-5">
                        <div className="hidden md:flex relative">
                            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                            <input 
                                type="text" 
                                placeholder="Search..." 
                                className="pl-9 pr-4 py-1.5 text-[13px] bg-gray-50 border-[0.5px] border-[var(--border)] rounded-full focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 transition-all"
                            />
                        </div>
                        <div className="flex items-center gap-3 text-[var(--text-secondary)]">
                            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors relative">
                                <Bell size={18} />
                                {pendingCount > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>}
                            </button>
                            <button className="p-1.5 hover:bg-gray-100 rounded-full transition-colors">
                                <Download size={18} />
                            </button>
                        </div>
                    </div>
                </header>

                <Toaster />

                {/* Page Content */}
                <main className="flex-1 overflow-auto p-[20px] md:p-[24px]">
                    {children}
                </main>
            </div>
        </div>
    );
}
