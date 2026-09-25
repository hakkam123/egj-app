import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import { FileText, Clock, CheckCircle, XCircle, Users, ArrowRight, RotateCcw, Edit3 } from 'lucide-react';
import { STATUS_COLORS } from '../../constants/statusColors';
import { formatDate } from '@/utils/dateFormat';

export default function DashboardIndex({ role, stats, recentData, actionRequiredDocs = [], thresholdDays = 3 }) {
    const isApprover = role === 'Section Head' || role === 'Dept/Div Head';
    const isStaff = role === 'Staff';
    const isAdmin = role === 'Admin';

    // Status Badge matching the exact Monitoring style
    const renderStatusBadge = (status) => {
        const conf = STATUS_COLORS[status] || STATUS_COLORS['Neutral'];

        return (
            <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold">
                <span
                    className={`w-1.5 h-1.5 rounded-full shrink-0 ${conf.dotClass || 'bg-slate-500'
                        }`}
                />
                <span className={conf.text || 'text-slate-500'}>
                    {conf.label || status}
                </span>
            </span>
        );
    };


    // Calculate count values for Vertical Bar Chart
    const draftCount = stats?.draft ?? 0;
    const waitingCount = stats?.waiting ?? stats?.pending_approval ?? 0;
    const revisedCount = stats?.revised ?? stats?.total_revised ?? 0;
    const approvedCount = stats?.approved ?? stats?.total_approved ?? 0;
    const rejectedCount = stats?.rejected ?? stats?.total_rejected ?? 0;
    const totalDistribution = draftCount + waitingCount + revisedCount + approvedCount + rejectedCount;

    const chartItems = [
        {
            key: 'waiting',
            label: 'Waiting Approval',
            shortLabel: 'Waiting',
            count: waitingCount,
            percent: totalDistribution > 0 ? Math.round((waitingCount / totalDistribution) * 100) : 0,
            color: STATUS_COLORS['Waiting Approval']?.solid || '#2563eb',
            bgSoft: STATUS_COLORS['Waiting Approval']?.bgSoft || '#eff6ff',
        },
        {
            key: 'revised',
            label: 'Revised',
            shortLabel: 'Revised',
            count: revisedCount,
            percent: totalDistribution > 0 ? Math.round((revisedCount / totalDistribution) * 100) : 0,
            color: STATUS_COLORS['Revised']?.solid || '#d97706',
            bgSoft: STATUS_COLORS['Revised']?.bgSoft || '#fffbeb',
        },
        {
            key: 'approved',
            label: 'Approved',
            shortLabel: 'Approved',
            count: approvedCount,
            percent: totalDistribution > 0 ? Math.round((approvedCount / totalDistribution) * 100) : 0,
            color: STATUS_COLORS['Approved']?.solid || '#16a34a',
            bgSoft: STATUS_COLORS['Approved']?.bgSoft || '#f0fdf4',
        },
        {
            key: 'rejected',
            label: 'Rejected',
            shortLabel: 'Rejected',
            count: rejectedCount,
            percent: totalDistribution > 0 ? Math.round((rejectedCount / totalDistribution) * 100) : 0,
            color: STATUS_COLORS['Rejected']?.solid || '#dc2626',
            bgSoft: STATUS_COLORS['Rejected']?.bgSoft || '#fef2f2',
        },
    ];

    return (
        <MainLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                <PageHeader
                    title="Dashboard Overview"
                    subtitle="Summary of activities, metrics, and General Journal status"
                />

                {/* Summary Cards for Staff */}
                {isStaff && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Drafts */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Drafts
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.draft || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <Edit3 size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Waiting Approval */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Waiting Approval
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.waiting || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <Clock size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Revised */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Revised
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.revised || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <RotateCcw size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Approved */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Approved
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.approved || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <CheckCircle size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Rejected */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Rejected
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.rejected || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <XCircle size={18} strokeWidth={1.8} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards for Approver */}
                {isApprover && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
                        {/* Pending Approval */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Pending Approval
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.pending_approval || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <Clock size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Approved by You */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Approved
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.total_approved || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <CheckCircle size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Revised by You */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Revisions Requested
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.total_revised || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <RotateCcw size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* My Drafts */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    My Drafts
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.draft || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <Edit3 size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* My Submissions */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    My Submissions
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.total_submitted_by_me || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <FileText size={18} strokeWidth={1.8} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Summary Cards for Admin */}
                {isAdmin && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
                        {/* Total Users */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Total Users
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.total_users || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <Users size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Total Documents */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Total Documents
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.total_journals || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <FileText size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Waiting */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Waiting
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.waiting || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <Clock size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Revised */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Revised
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.revised || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <RotateCcw size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Approved */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Approved
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.approved || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <CheckCircle size={18} strokeWidth={1.8} />
                            </div>
                        </div>

                        {/* Rejected */}
                        <div className="bg-[var(--card-bg)] border border-[var(--border)] rounded-lg px-5 py-4 flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)]">
                                    Rejected
                                </p>
                                <p className="text-2xl font-semibold text-[var(--text-primary)] mt-1">
                                    {stats?.rejected || 0}
                                </p>
                            </div>

                            <div className="w-9 h-9 rounded-lg bg-[var(--surface-muted)] flex items-center justify-center text-[var(--text-secondary)]">
                                <XCircle size={18} strokeWidth={1.8} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Documents Requiring Action / Priority Queue - Approvers & Admin Only */}
                {(isApprover || isAdmin) && (
                    <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-xs">
                        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-[0.5px] border-[var(--border)]">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                                            Documents Requiring Action
                                        </h3>
                                        {actionRequiredDocs?.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#faf1e2] text-[#b8791f] border border-amber-200">
                                                {actionRequiredDocs.length} Documents
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                        Documents pending approval for more than {thresholdDays || 3} business days
                                    </p>
                                </div>
                            </div>

                            {actionRequiredDocs?.length > 0 && (
                                <Link
                                    href={isApprover ? '/approval' : '/monitoring?status=Waiting%20Approval'}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                                >
                                    View All Pending <ArrowRight size={14} />
                                </Link>
                            )}
                        </div>

                        {/* Content: List or Empty State */}
                        {!actionRequiredDocs?.length ? (
                            <div className="py-8 px-5 text-center">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">All documents are up to date</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-md mx-auto">
                                    There are no documents exceeding the approval waiting threshold (&gt;{thresholdDays || 3} days).
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-[var(--text-primary)]">
                                    <thead className="bg-[#fafafa] border-b-[0.5px] border-[var(--border)] text-[11px] uppercase text-[var(--text-muted)] font-semibold">
                                        <tr>
                                            <th className="px-5 py-3 whitespace-nowrap">Document Number</th>
                                            <th className="px-5 py-3 whitespace-nowrap">Person Request</th>
                                            <th className="px-5 py-3 whitespace-nowrap">Submission Date</th>
                                            <th className="px-5 py-3 whitespace-nowrap">Waiting Time</th>
                                            <th className="px-5 py-3 text-right whitespace-nowrap">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {actionRequiredDocs.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-[#f9fafb] transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <Link
                                                        href={isApprover ? `/approval/${doc.id}` : `/general-journals/${doc.id}`}
                                                        className="font-mono text-xs font-bold text-blue-600 hover:text-blue-800 hover:underline"
                                                    >
                                                        {doc.document_number}
                                                    </Link>
                                                    {doc.reference && (
                                                        <p className="text-[11px] text-[var(--text-secondary)] truncate max-w-[220px] mt-0.5">
                                                            {doc.reference}
                                                        </p>
                                                    )}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-[var(--text-primary)] font-medium">
                                                    {doc.requester ? doc.requester.name : '-'}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap text-xs text-gray-600">
                                                    {doc.submitted_at || doc.journal_date || '-'}
                                                </td>
                                                <td className="px-5 py-3.5 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${doc.days_waiting >= 5
                                                            ? 'bg-[#fbeceb] text-[#b8433c] border border-red-200'
                                                            : 'bg-[#faf1e2] text-[#b8791f] border border-amber-200'
                                                        }`}>
                                                        <Clock size={12} />
                                                        {doc.days_waiting} Days
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                    <Link
                                                        href={isApprover ? `/approval/${doc.id}` : `/general-journals/${doc.id}`}
                                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${isApprover
                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                : 'border-[0.5px] border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-gray-50'
                                                            }`}
                                                    >
                                                        {isApprover ? 'Review' : 'View Detail'}
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>
                )}

                {/* Main Content Grid: Status Distribution (40%) + Recent Documents (60%) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Status Distribution (5/12 cols) */}
                    <div className="lg:col-span-5 bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">Status Distribution</h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Current workflow proportions</p>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total</span>
                                <p className="text-base font-bold text-[var(--text-primary)]">{totalDistribution}</p>
                            </div>
                        </div>

                        {/* Chart Container with Scale Gridlines */}
                        <div className="relative pt-6 pb-2">
                            {/* Horizontal Gridlines (0%, 25%, 50%, 75%, 100%) */}
                            <div className="absolute inset-x-0 top-6 bottom-14 flex flex-col justify-between pointer-events-none">
                                {[100, 75, 50, 25, 0].map((level) => (
                                    <div key={level} className="flex items-center gap-2 w-full">
                                        <span className="text-[10px] text-gray-400 w-6 text-right font-mono shrink-0">{level}%</span>
                                        <div className="w-full border-b border-gray-200/60" />
                                    </div>
                                ))}
                            </div>

                            {/* Vertical Bars */}
                            <div className="relative pl-8 pr-1 h-[150px] flex items-end justify-around gap-2 sm:gap-4">
                                {chartItems.map((item) => {
                                    const isZero = item.count === 0;
                                    const barHeightPercent = isZero ? 4 : Math.max(item.percent, 6);

                                    return (
                                        <div key={item.key} className="flex-1 flex flex-col items-center max-w-[60px] h-full justify-end group">
                                            {/* Number Count above bar */}
                                            <span
                                                className="text-xs font-bold mb-1.5 transition-transform group-hover:-translate-y-0.5"
                                                style={{ color: item.color }}
                                            >
                                                {item.count}
                                            </span>

                                            {/* The Bar */}
                                            <div
                                                className="w-full transition-all duration-500 ease-out shadow-2xs"
                                                style={{
                                                    height: `${barHeightPercent}%`,
                                                    backgroundColor: isZero ? item.bgSoft : item.color,
                                                    border: isZero ? `1.5px dashed ${item.color}` : 'none',
                                                    borderTopLeftRadius: '8px',
                                                    borderTopRightRadius: '8px',
                                                    borderBottomLeftRadius: '3px',
                                                    borderBottomRightRadius: '3px',
                                                }}
                                                title={`${item.label}: ${item.count} (${item.percent}%)`}
                                            />
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Labels & Percentages below each bar */}
                            <div className="pl-8 pr-1 pt-3 grid grid-cols-4 gap-1 sm:gap-2 text-center">
                                {chartItems.map((item) => (
                                    <div key={item.key} className="flex flex-col items-center min-w-0">
                                        <div className="flex items-center gap-1 justify-center max-w-full">
                                            <span
                                                className="w-2 h-2 rounded-full shrink-0"
                                                style={{ backgroundColor: item.color }}
                                            />
                                            <span className="text-[11px] font-semibold text-[var(--text-primary)] truncate">
                                                {item.shortLabel}
                                            </span>
                                        </div>
                                        <span className="text-[10px] font-medium text-[var(--text-muted)] mt-0.5">
                                            {item.percent}%
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Recent Items Table (7/12 cols) */}
                    <div className="lg:col-span-7 bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-xs">
                        <div className="px-5 py-4 flex items-center justify-between border-b-[0.5px] border-[var(--border)]">
                            <div>
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">
                                    {isApprover ? 'Recent Approval Queue' : 'Recent Documents'}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Last 5 active documents</p>
                            </div>
                            <Link
                                href={isApprover ? '/approval' : '/monitoring'}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                View All
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-[var(--text-primary)]">
                                <thead className="bg-[#fafafa] border-b-[0.5px] border-[var(--border)] text-[11px] uppercase text-[var(--text-muted)] font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap">Document Number</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Journal Date</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3 whitespace-nowrap">
                                            {isStaff ? 'Assign To' : 'Person Request'}
                                        </th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">Action</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {!recentData?.length ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)] text-[13px]">
                                                No recent documents found.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentData?.map(journal => (
                                            <tr key={journal.id} className="hover:bg-[#f9fafb] transition-colors">
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <Link
                                                        href={isApprover ? `/approval/${journal.id}` : `/general-journals/${journal.id}`}
                                                        className="font-mono text-blue-600 hover:text-blue-800 hover:underline font-semibold text-xs"
                                                    >
                                                        {journal.document_number}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-600 font-medium">
                                                    {formatDate(journal.journal_date)}
                                                </td>
                                                <td className="px-4 py-3 text-xs max-w-[140px] truncate text-gray-600">
                                                    {journal.reference || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {renderStatusBadge(journal.status)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-700">
                                                    {isStaff ? (
                                                        journal.assignee ? journal.assignee.name : '-'
                                                    ) : (
                                                        journal.requester ? journal.requester.name : '-'
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-right whitespace-nowrap">
                                                    <Link
                                                        href={isApprover ? `/approval/${journal.id}` : `/general-journals/${journal.id}`}
                                                        className="px-2.5 py-1 border-[0.5px] border-[var(--border)] rounded-md text-[11px] font-medium text-[var(--text-secondary)] hover:bg-gray-50 transition-colors shadow-2xs"
                                                    >
                                                        View Detail
                                                    </Link>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}