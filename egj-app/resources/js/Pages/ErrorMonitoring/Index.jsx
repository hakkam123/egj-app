import { Head, Link, router } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import { useState, useEffect, useRef } from 'react';
import {
    AlertTriangle,
    Search,
    RotateCcw,
    Eye,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Trash2,
    X,
    Copy,
    Check,
    Globe,
    User,
    Code,
    Clock
} from 'lucide-react';
import toast from 'react-hot-toast';
import { formatDateTime } from '@/utils/dateFormat';

export default function ErrorMonitoringIndex({ logs, filters, stats }) {
    const [searchQuery, setSearchQuery] = useState(filters?.search || '');
    const [status, setStatus] = useState(filters?.status || '');
    const [dateFrom, setDateFrom] = useState(filters?.date_from || '');
    const [dateTo, setDateTo] = useState(filters?.date_to || '');
    const [perPage, setPerPage] = useState(filters?.per_page || 10);

    const [selectedLog, setSelectedLog] = useState(null);
    const [copied, setCopied] = useState(false);

    const isInitialMount = useRef(true);

    const updateFilters = (overrides = {}) => {
        const queryParams = {
            search: searchQuery,
            status,
            date_from: dateFrom,
            date_to: dateTo,
            per_page: perPage,
            ...overrides,
        };

        const cleaned = {};
        Object.entries(queryParams).forEach(([k, v]) => {
            if (v !== undefined && v !== null && v !== '') {
                cleaned[k] = v;
            }
        });

        router.get('/error-monitoring', cleaned, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
        });
    };

    // Debounce search input
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

    const handleStatusChange = (e) => {
        const val = e.target.value;
        setStatus(val);
        updateFilters({ status: val });
    };

    const handleDateFromChange = (e) => {
        const val = e.target.value;
        setDateFrom(val);
        updateFilters({ date_from: val });
    };

    const handleDateToChange = (e) => {
        const val = e.target.value;
        setDateTo(val);
        updateFilters({ date_to: val });
    };

    const handlePerPageChange = (e) => {
        const val = e.target.value;
        setPerPage(val);
        updateFilters({ per_page: val });
    };

    const handleReset = () => {
        setSearchQuery('');
        setStatus('');
        setDateFrom('');
        setDateTo('');
        setPerPage(10);
        router.get('/error-monitoring', {}, { preserveState: true, preserveScroll: true, replace: true });
    };

    const updateLogStatus = (id, newStatus) => {
        router.patch(`/error-monitoring/${id}/status`, { status: newStatus }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success(`Error log status changed to ${newStatus}`);
                if (selectedLog && selectedLog.id === id) {
                    setSelectedLog(prev => ({ ...prev, status: newStatus }));
                }
            }
        });
    };

    const deleteLog = (id) => {
        router.delete(`/error-monitoring/${id}`, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Error log deleted successfully');
                if (selectedLog && selectedLog.id === id) {
                    setSelectedLog(null);
                }
            }
        });
    };

    const copyStackTrace = () => {
        if (!selectedLog?.stack_trace) return;
        navigator.clipboard.writeText(selectedLog.stack_trace);
        setCopied(true);
        toast.success('Stack trace copied to clipboard');
        setTimeout(() => setCopied(false), 2000);
    };

    const statusBadge = (s) => {
        const map = {
            'New': { bg: '#fbeceb', text: '#b8433c', label: 'New' },
            'Resolved': { bg: '#e6f2ef', text: '#2b6b5c', label: 'Resolved' },
            'Ignored': { bg: '#f1f5f9', text: '#475569', label: 'Ignored' },
        };
        const conf = map[s] || map['New'];
        return (
            <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{ backgroundColor: conf.bg, color: conf.text }}
            >
                {conf.label}
            </span>
        );
    };

    return (
        <MainLayout title="Error Monitoring">
            <Head title="Error Monitoring" />

            <div className="space-y-6">
                <PageHeader
                    title="Error Monitoring"
                    subtitle="System exception logs and technical diagnostics"
                />

                {/* Stat Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    {/* Total Errors */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                Total Errors
                            </p>
                            <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                {stats?.total || 0}
                            </p>
                        </div>

                        <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                            <AlertTriangle size={18} strokeWidth={1.8} />
                        </div>
                    </div>

                    {/* New Errors */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                New Errors
                            </p>
                            <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                {stats?.new || 0}
                            </p>
                        </div>

                        <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                            <XCircle size={18} strokeWidth={1.8} />
                        </div>
                    </div>

                    {/* Resolved */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                Resolved
                            </p>
                            <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                {stats?.resolved || 0}
                            </p>
                        </div>

                        <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                            <CheckCircle2 size={18} strokeWidth={1.8} />
                        </div>
                    </div>

                    {/* Ignored */}
                    <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-[var(--text-secondary)]">
                                Ignored
                            </p>
                            <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                {stats?.ignored || 0}
                            </p>
                        </div>

                        <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                            <MinusCircle size={18} strokeWidth={1.8} />
                        </div>
                    </div>
                </div>


                {/* Main Table Card */}
                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-xs">
                    <div className="px-5 py-4 border-b-[0.5px] border-[var(--border)] flex items-center justify-between">
                        <h3 className="text-base font-semibold text-[var(--text-primary)]">Error Logs</h3>
                    </div>

                    {/* Standard Card Filters */}
                    <div className="p-5 border-b-[0.5px] border-[var(--border)] bg-gray-50/50">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
                            <div className="lg:col-span-2">
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Search</label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        placeholder="Search message, class, URL, or file..."
                                        value={searchQuery}
                                        onChange={e => setSearchQuery(e.target.value)}
                                        className="w-full pl-9 pr-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                    />
                                    <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">Status</label>
                                <select
                                    value={status}
                                    onChange={handleStatusChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="New">New</option>
                                    <option value="Resolved">Resolved</option>
                                    <option value="Ignored">Ignored</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">From Date</label>
                                <input
                                    type="date"
                                    value={dateFrom}
                                    onChange={handleDateFromChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">To Date</label>
                                <input
                                    type="date"
                                    value={dateTo}
                                    onChange={handleDateToChange}
                                    className="w-full px-3 py-2 border-[0.5px] border-[var(--border)] rounded-md text-[13px] focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                                />
                            </div>

                            <div>
                                <label className="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wide mb-1.5">&nbsp;</label>
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="w-full px-3 py-2 bg-white border-[0.5px] border-[var(--border)] text-[var(--text-secondary)] text-[13px] font-semibold rounded-md hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                                    title="Reset Filters"
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
                                    <th className="px-5 py-3 whitespace-nowrap">Timestamp</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Method & URL</th>
                                    <th className="px-5 py-3">Exception & Message</th>
                                    <th className="px-5 py-3 whitespace-nowrap">User</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3 text-center whitespace-nowrap">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {logs?.data?.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-12 text-center text-[var(--text-muted)] text-[13px]">
                                            No error logs found.
                                        </td>
                                    </tr>
                                ) : (
                                    logs?.data?.map(log => (
                                        <tr key={log.id} className="hover:bg-[#f9fafb] transition-colors">
                                            <td className="px-5 py-3 text-[12px] text-[var(--text-secondary)] whitespace-nowrap font-medium">
                                                {formatDateTime(log.created_at, true)}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-1.5">
                                                    <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-gray-100 text-gray-700 font-mono uppercase">
                                                        {log.method || 'GET'}
                                                    </span>
                                                    <span className="text-[12px] font-mono text-gray-600 max-w-[180px] truncate" title={log.url}>
                                                        {log.url ? new URL(log.url, 'http://localhost').pathname : '-'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 max-w-[320px]">
                                                <p className="text-[12px] font-mono font-semibold text-[#b8433c] truncate">
                                                    {log.exception_class?.split('\\').pop()}
                                                </p>
                                                <p className="text-[12px] text-[var(--text-primary)] truncate mt-0.5" title={log.message}>
                                                    {log.message}
                                                </p>
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap text-[12px]">
                                                {log.user ? (
                                                    <span className="font-medium text-gray-800">{log.user.name}</span>
                                                ) : (
                                                    <span className="text-gray-400 font-mono text-[11px]">{log.ip_address || 'Guest'}</span>
                                                )}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                {statusBadge(log.status)}
                                            </td>
                                            <td className="px-5 py-3">
                                                <div className="flex items-center justify-center gap-1.5">
                                                    <button
                                                        onClick={() => setSelectedLog(log)}
                                                        className="px-2.5 py-1.5 border-[0.5px] border-[var(--border)] rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-gray-50 transition-colors flex items-center gap-1"
                                                        title="View Stack Trace"
                                                    >
                                                        <Eye size={14} /> Detail
                                                    </button>
                                                    {log.status === 'New' && (
                                                        <button
                                                            onClick={() => updateLogStatus(log.id, 'Resolved')}
                                                            className="px-2.5 py-1.5 bg-[#e6f2ef] text-[#2b6b5c] rounded-md text-[12px] font-semibold hover:brightness-95 transition-all"
                                                            title="Mark as Resolved"
                                                        >
                                                            Resolve
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
                                <span className="text-[12px] text-[var(--text-secondary)]">Show</span>
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
                                <span className="text-[12px] text-[var(--text-secondary)]">entries</span>
                            </div>
                            {logs?.from && (
                                <p className="text-[12px] text-[var(--text-secondary)]">
                                    Showing <span className="font-medium text-[var(--text-primary)]">{logs.from}</span> to <span className="font-medium text-[var(--text-primary)]">{logs.to}</span> of <span className="font-medium text-[var(--text-primary)]">{logs.total}</span> logs
                                </p>
                            )}
                        </div>
                        {logs?.links && logs.links.length > 3 && (
                            <div className="flex gap-1 flex-wrap">
                                {logs.links.map((link, i) => (
                                    <Link
                                        key={i}
                                        href={link.url || '#'}
                                        className={`px-3 py-1.5 text-[12px] rounded-md transition-colors ${link.active
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

            {/* Error Detail Modal */}
            {selectedLog && (
                <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
                    <div className="bg-white rounded-xl max-w-3xl w-full p-6 shadow-2xl relative animate-in fade-in zoom-in duration-150 max-h-[90vh] flex flex-col">
                        {/* Modal Header */}
                        <div className="flex items-start justify-between pb-4 border-b border-gray-200">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-red-100 text-[#b8433c] font-mono uppercase">
                                        {selectedLog.method || 'GET'}
                                    </span>
                                    <h3 className="text-base font-bold text-gray-900 font-mono">
                                        {selectedLog.exception_class}
                                    </h3>
                                </div>
                                <p className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                                    <Clock size={13} /> {formatDateTime(selectedLog.created_at, true)}
                                </p>
                            </div>
                            <button
                                onClick={() => setSelectedLog(null)}
                                className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto py-4 space-y-4">
                            {/* Message */}
                            <div>
                                <label className="block text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                                    Exception Message
                                </label>
                                <div className="p-3 bg-red-50/80 border border-red-200 rounded-lg text-xs font-mono text-[#b8433c] break-all leading-relaxed">
                                    {selectedLog.message}
                                </div>
                            </div>

                            {/* Location (File & Line) */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">File Location</span>
                                    <p className="font-mono text-gray-800 break-all">{selectedLog.file || '-'} : {selectedLog.line}</p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-xs">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">Request URL</span>
                                    <p className="font-mono text-gray-800 break-all">{selectedLog.url || '-'}</p>
                                </div>
                            </div>

                            {/* Client Meta */}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">User & IP</span>
                                    <p className="text-gray-800">
                                        {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'Guest'}
                                        <span className="text-gray-500 font-mono ml-2">[{selectedLog.ip_address}]</span>
                                    </p>
                                </div>
                                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200">
                                    <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-0.5">User Agent</span>
                                    <p className="text-gray-600 truncate text-[11px]" title={selectedLog.user_agent}>
                                        {selectedLog.user_agent || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Stack Trace */}
                            {selectedLog.stack_trace && (
                                <div>
                                    <div className="flex items-center justify-between mb-1">
                                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                                            <Code size={14} /> Stack Trace
                                        </label>
                                        <button
                                            onClick={copyStackTrace}
                                            className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                        >
                                            {copied ? <Check size={13} /> : <Copy size={13} />}
                                            {copied ? 'Copied' : 'Copy Trace'}
                                        </button>
                                    </div>
                                    <pre className="p-3 bg-gray-900 text-gray-200 rounded-lg text-[11px] font-mono overflow-x-auto max-h-56 scrollbar-thin">
                                        {selectedLog.stack_trace}
                                    </pre>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer / Status Switch */}
                        <div className="pt-4 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-medium text-gray-600">Change Status:</span>
                                <button
                                    onClick={() => updateLogStatus(selectedLog.id, 'New')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${selectedLog.status === 'New'
                                            ? 'bg-[#b8433c] text-white'
                                            : 'bg-[#fbeceb] text-[#b8433c] hover:brightness-95'
                                        }`}
                                >
                                    New
                                </button>
                                <button
                                    onClick={() => updateLogStatus(selectedLog.id, 'Resolved')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${selectedLog.status === 'Resolved'
                                            ? 'bg-[#2b6b5c] text-white'
                                            : 'bg-[#e6f2ef] text-[#2b6b5c] hover:brightness-95'
                                        }`}
                                >
                                    Resolved
                                </button>
                                <button
                                    onClick={() => updateLogStatus(selectedLog.id, 'Ignored')}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${selectedLog.status === 'Ignored'
                                            ? 'bg-gray-700 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                        }`}
                                >
                                    Ignored
                                </button>
                            </div>

                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => deleteLog(selectedLog.id)}
                                    className="px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-50 rounded-lg transition-colors flex items-center gap-1.5"
                                >
                                    <Trash2 size={14} /> Delete Log
                                </button>
                                <button
                                    onClick={() => setSelectedLog(null)}
                                    className="px-4 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Close
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
    );
}


