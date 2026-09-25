import { Link, usePage, router } from '@inertiajs/react';
import { useState, useEffect, useRef } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import {
    LayoutDashboard,
    Monitor,
    CheckCircle,
    Clock,
    FileEdit,
    Users,
    Bell,
    UserCog,
    LogOut,
    Menu,
    X,
    BookOpen,
    CheckCheck,
    ChevronDown,
    AlertTriangle,
    FilePlus
} from 'lucide-react';

export default function MainLayout({ children, title }) {
    const { auth, flash } = usePage().props;
    const user = auth?.user;
    const currentPath = window.location.pathname;

    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const [userDropdownOpen, setUserDropdownOpen] = useState(false);
    const [notifDropdownOpen, setNotifDropdownOpen] = useState(false);

    const [unreadCount, setUnreadCount] = useState(0);
    const [notifications, setNotifications] = useState([]);
    const [loadingNotifs, setLoadingNotifs] = useState(false);

    const userDropdownRef = useRef(null);
    const notifDropdownRef = useRef(null);

    // Flash message handling
    useEffect(() => {
        if (flash?.success) {
            toast.success(flash.success, { position: 'top-right' });
        }
        if (flash?.error) {
            toast.error(flash.error, { position: 'top-right' });
        }
        if (flash?.warning) {
            toast(flash.warning, { icon: '⚠️', position: 'top-right' });
        }
    }, [flash]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (userDropdownRef.current && !userDropdownRef.current.contains(e.target)) {
                setUserDropdownOpen(false);
            }
            if (notifDropdownRef.current && !notifDropdownRef.current.contains(e.target)) {
                setNotifDropdownOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Polling for unread notification count
    const fetchUnreadCount = () => {
        fetch('/notifications/unread-count', {
            headers: {
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
            }
        })
            .then(res => res.json())
            .then(data => {
                if (data && typeof data.unread_count === 'number') {
                    setUnreadCount(data.unread_count);
                }
            })
            .catch(() => { });
    };

    useEffect(() => {
        fetchUnreadCount();
        const interval = setInterval(fetchUnreadCount, 30000); // Poll every 30 seconds
        return () => clearInterval(interval);
    }, []);

    // Fetch notifications list when dropdown opens
    const toggleNotifications = () => {
        const nextState = !notifDropdownOpen;
        setNotifDropdownOpen(nextState);
        setUserDropdownOpen(false);

        if (nextState) {
            setLoadingNotifs(true);
            fetch('/notifications', {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            })
                .then(res => res.json())
                .then(data => {
                    setNotifications(data.notifications || []);
                    setLoadingNotifs(false);
                })
                .catch(() => setLoadingNotifs(false));
        }
    };

    const handleMarkAsRead = (id, journalId) => {
        fetch(`/notifications/${id}/read`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).then(() => {
            fetchUnreadCount();
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
        });

        if (journalId) {
            setNotifDropdownOpen(false);
            if (user?.role === 'Section Head' || user?.role === 'Dept/Div Head') {
                router.get(`/approval/${journalId}`);
            } else {
                router.get(`/general-journals/${journalId}`);
            }
        }
    };

    const handleMarkAllRead = () => {
        fetch('/notifications/read-all', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'X-Requested-With': 'XMLHttpRequest'
            }
        }).then(() => {
            setUnreadCount(0);
            setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
            toast.success('All notifications marked as read.');
        });
    };

    // Navigation Menu Items in English
    const navItems = [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['Admin', 'Staff', 'Section Head', 'Dept/Div Head'] },
        { name: 'Monitoring', href: '/monitoring', icon: Monitor, roles: ['Admin', 'Staff', 'Section Head', 'Dept/Div Head'] },
        { name: 'Approval', href: '/approval', icon: CheckCircle, roles: ['Section Head', 'Dept/Div Head'] },
        { name: 'Draft Documents', href: '/drafts', icon: FileEdit, roles: ['Staff', 'Section Head'] },
        { name: 'Error Monitoring', href: '/error-monitoring', icon: AlertTriangle, roles: ['Admin'] },
        { name: 'User Management', href: '/users', icon: Users, roles: ['Admin'] },
    ];

    const visibleNavItems = navItems.filter(item => item.roles.includes(user?.role));

    return (
        <div className="min-h-screen bg-[var(--page-bg)] bg-dashboard flex flex-col font-sans relative">
            <Toaster />

            {/* Top Navbar */}
            <header className="bg-[var(--sidebar-bg)] border-b border-gray-800 text-white sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">

                        {/* Brand & Left Navigation */}
                        <div className="flex items-center gap-6">

                            {/* Desktop Nav Items */}
                            <nav className="hidden md:flex items-center gap-1 ml-4">
                                {visibleNavItems.map(item => {
                                    const isActive = (item.href === '/dashboard' && currentPath === '/dashboard') ||
                                        (item.href !== '/dashboard' && currentPath.startsWith(item.href));
                                    const Icon = item.icon;
                                    return (
                                        <Link
                                            key={item.name}
                                            href={item.href}
                                            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[13px] font-medium transition-colors ${isActive
                                                ? 'bg-white/15 text-white font-semibold shadow-xs'
                                                : 'text-white/75 hover:bg-white/10 hover:text-white'
                                                }`}
                                        >
                                            <Icon size={16} />
                                            <span>{item.name}</span>
                                        </Link>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Right Section: New Draft CTA + Notifications + User Menu */}
                        <div className="flex items-center gap-3">


                            {/* Notifications Dropdown */}
                            <div className="relative" ref={notifDropdownRef}>
                                <button
                                    onClick={toggleNotifications}
                                    className="p-2 rounded-full text-white/80 hover:text-white hover:bg-white/10 transition-colors relative"
                                    title="Notifications"
                                >
                                    <Bell size={19} />
                                    {unreadCount > 0 && (
                                        <span className="absolute top-1 right-1 flex items-center justify-center min-w-4.5 h-4.5 px-1 text-[10px] font-bold text-white bg-red-500 rounded-full border-2 border-[var(--sidebar-bg)] animate-pulse">
                                            {unreadCount > 99 ? '99+' : unreadCount}
                                        </span>
                                    )}
                                </button>

                                {notifDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-2xl border border-gray-200 text-gray-800 z-50 overflow-hidden animate-in fade-in zoom-in duration-150">
                                        <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between bg-gray-50">
                                            <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
                                                Notifications
                                            </h4>
                                            {unreadCount > 0 && (
                                                <button
                                                    onClick={handleMarkAllRead}
                                                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 cursor-pointer"
                                                >
                                                    <CheckCheck size={14} /> Mark all read
                                                </button>
                                            )}
                                        </div>

                                        <div className="max-h-80 overflow-y-auto divide-y divide-gray-100">
                                            {loadingNotifs ? (
                                                <div className="py-8 text-center text-xs text-gray-400">
                                                    Loading notifications...
                                                </div>
                                            ) : notifications.length === 0 ? (
                                                <div className="py-8 text-center text-xs text-gray-400">
                                                    No notifications yet.
                                                </div>
                                            ) : (
                                                notifications.map(n => (
                                                    <div
                                                        key={n.id}
                                                        onClick={() => handleMarkAsRead(n.id, n.general_journal_id)}
                                                        className={`p-3.5 text-xs cursor-pointer hover:bg-blue-50/50 transition-colors ${!n.is_read ? 'bg-blue-50/30 font-medium' : ''
                                                            }`}
                                                    >
                                                        <div className="flex items-start justify-between gap-2">
                                                            <p className="text-gray-800 leading-snug">{n.message}</p>
                                                            {!n.is_read && (
                                                                <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0 mt-1"></span>
                                                            )}
                                                        </div>
                                                        <p className="text-[10px] text-gray-400 mt-1">
                                                            {n.created_at ? new Date(n.created_at).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' }) : ''}
                                                        </p>
                                                    </div>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* User Profile Dropdown */}
                            <div className="relative" ref={userDropdownRef}>
                                <button
                                    onClick={() => { setUserDropdownOpen(!userDropdownOpen); setNotifDropdownOpen(false); }}
                                    className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-white/10 transition-colors cursor-pointer"
                                >
                                    <div className="hidden sm:flex flex-col text-left">
                                        <span className="text-[13px] font-semibold text-white leading-tight">{user?.name}</span>
                                        <span className="text-[10px] text-gray-300">{user?.role}</span>
                                    </div>
                                    <ChevronDown size={14} className="text-gray-300 hidden sm:block" />
                                </button>

                                {userDropdownOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-2xl border border-gray-200 py-1 text-gray-800 z-50 animate-in fade-in zoom-in duration-150">
                                        <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                                            <p className="text-xs font-bold text-gray-800 truncate">{user?.name}</p>
                                            <p className="text-[10px] text-gray-500">{user?.role}</p>
                                        </div>
                                        <Link
                                            href="/profile"
                                            onClick={() => setUserDropdownOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <UserCog size={15} className="text-gray-500" />
                                            Account Settings
                                        </Link>
                                        <Link
                                            href="/tutorial"
                                            onClick={() => setUserDropdownOpen(false)}
                                            className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-gray-700 hover:bg-gray-100 transition-colors"
                                        >
                                            <BookOpen size={15} className="text-gray-500" />
                                            User Manual / Guide
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <Link
                                            href="/logout"
                                            method="post"
                                            as="button"
                                            className="w-full text-left flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                        >
                                            <LogOut size={15} />
                                            Logout
                                        </Link>
                                    </div>
                                )}
                            </div>

                            {/* Mobile Hamburger Toggle */}
                            <button
                                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                                className="md:hidden p-2 rounded-lg text-white hover:bg-white/10 transition-colors"
                            >
                                {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
                            </button>

                        </div>
                    </div>
                </div>

                {/* Mobile Menu Dropdown */}
                {mobileMenuOpen && (
                    <div className="md:hidden border-t border-gray-800 bg-[var(--sidebar-bg)] px-4 pt-2 pb-4 space-y-1">
                        {(user?.role === 'Staff' || user?.role === 'Section Head') && (
                            <Link
                                href="/general-journals/create"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-blue-600 text-white text-sm font-semibold mb-2"
                            >
                                <FilePlus size={18} />
                                <span>+ New Draft</span>
                            </Link>
                        )}

                        {visibleNavItems.map(item => {
                            const isActive = (item.href === '/dashboard' && currentPath === '/dashboard') ||
                                (item.href !== '/dashboard' && currentPath.startsWith(item.href));
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.name}
                                    href={item.href}
                                    onClick={() => setMobileMenuOpen(false)}
                                    className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-white/20 text-white font-semibold'
                                        : 'text-white/80 hover:bg-white/10 hover:text-white'
                                        }`}
                                >
                                    <Icon size={18} />
                                    <span>{item.name}</span>
                                </Link>
                            );
                        })}

                        <div className="border-t border-gray-800 pt-2 mt-2 space-y-1">
                            <Link
                                href="/profile"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                            >
                                <UserCog size={18} />
                                <span>Account Settings</span>
                            </Link>
                            <Link
                                href="/tutorial"
                                onClick={() => setMobileMenuOpen(false)}
                                className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10 hover:text-white rounded-lg transition-colors"
                            >
                                <BookOpen size={18} />
                                <span>User Manual</span>
                            </Link>
                            <Link
                                href="/logout"
                                method="post"
                                as="button"
                                className="w-full text-left flex items-center gap-3 px-3 py-2 text-sm font-medium text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                                <LogOut size={18} />
                                <span>Logout</span>
                            </Link>
                        </div>
                    </div>
                )}
            </header>

            {/* Main Content Body */}
            <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:px-6 lg:px-8 py-6 relative z-10">
                {children}
            </main>
        </div>
    );
}
