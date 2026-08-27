import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import { FileText, Clock, CheckCircle, XCircle, Users, ArrowRight, Plus } from 'lucide-react';
import { STATUS_COLORS } from '../../constants/statusColors';

export default function DashboardIndex({ role, stats, recentData }) {
    const isApprover = role === 'Section Head' || role === 'Dept/Div Head';
    const isStaff = role === 'Staff';
    const isAdmin = role === 'Admin';

    // Status Badge matching the tone-down palette
    const statusBadge = (status) => {
        const config = STATUS_COLORS[status] || STATUS_COLORS['Draft'];
        return (
            <span
                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold"
                style={{
                    backgroundColor: config.bgSoft,
                    color: config.solid,
                }}
            >
                {status}
            </span>
        );
    };

    // Calculate count values for Vertical Bar Chart
    const waitingCount = stats?.waiting ?? stats?.pending_approval ?? 0;
    const approvedCount = stats?.approved ?? stats?.total_approved ?? 0;
    const rejectedCount = stats?.rejected ?? stats?.total_rejected ?? 0;
    const totalDistribution = waitingCount + approvedCount + rejectedCount;

    const chartItems = [
        {
            key: 'waiting',
            label: 'Waiting Approval',
            shortLabel: 'Waiting',
            count: waitingCount,
            percent: totalDistribution > 0 ? Math.round((waitingCount / totalDistribution) * 100) : 0,
            color: STATUS_COLORS['Waiting Approval'].solid,
            bgSoft: STATUS_COLORS['Waiting Approval'].bgSoft,
        },
        {
            key: 'approved',
            label: 'Approved',
            shortLabel: 'Approved',
            count: approvedCount,
            percent: totalDistribution > 0 ? Math.round((approvedCount / totalDistribution) * 100) : 0,
            color: STATUS_COLORS['Approved'].solid,
            bgSoft: STATUS_COLORS['Approved'].bgSoft,
        },
        {
            key: 'rejected',
            label: 'Rejected',
            shortLabel: 'Rejected',
            count: rejectedCount,
            percent: totalDistribution > 0 ? Math.round((rejectedCount / totalDistribution) * 100) : 0,
            color: STATUS_COLORS['Rejected'].solid,
            bgSoft: STATUS_COLORS['Rejected'].bgSoft,
        },
    ];

    return (
        <MainLayout title="Dashboard">
            <Head title="Dashboard" />

            <div className="space-y-6">
                <PageHeader
                    title="Dashboard Overview"
                    subtitle="Ringkasan aktivitas dan status General Journal"
                    
                />

                {/* 4 Summary Cards (Toned-down soft backgrounds) */}
                {isStaff && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Diajukan (Neutral) */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Diajukan</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.total || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS.Neutral.bgSoft, color: STATUS_COLORS.Neutral.solid }}>
                                <FileText size={20} />
                            </div>
                        </div>

                        {/* Waiting Approval */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Waiting Approval</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS['Waiting Approval'].solid }}>
                                    {stats?.waiting || 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS['Waiting Approval'].bgSoft, color: STATUS_COLORS['Waiting Approval'].solid }}>
                                <Clock size={20} />
                            </div>
                        </div>

                        {/* Disetujui */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Disetujui</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS['Approved'].solid }}>
                                    {stats?.approved || 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS['Approved'].bgSoft, color: STATUS_COLORS['Approved'].solid }}>
                                <CheckCircle size={20} />
                            </div>
                        </div>

                        {/* Ditolak */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Ditolak</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS['Rejected'].solid }}>
                                    {stats?.rejected || 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS['Rejected'].bgSoft, color: STATUS_COLORS['Rejected'].solid }}>
                                <XCircle size={20} />
                            </div>
                        </div>
                    </div>
                )}

                {isApprover && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Antrean Approval */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Antrean Approval</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS['Waiting Approval'].solid }}>
                                    {stats?.pending_approval || 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS['Waiting Approval'].bgSoft, color: STATUS_COLORS['Waiting Approval'].solid }}>
                                <Clock size={20} />
                            </div>
                        </div>

                        {/* Telah Anda Approve */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Telah Diapprove</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS['Approved'].solid }}>
                                    {stats?.total_approved || 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS['Approved'].bgSoft, color: STATUS_COLORS['Approved'].solid }}>
                                <CheckCircle size={20} />
                            </div>
                        </div>

                        {/* Telah Anda Reject */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Telah Direject</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS['Rejected'].solid }}>
                                    {stats?.total_rejected || 0}
                                </p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS['Rejected'].bgSoft, color: STATUS_COLORS['Rejected'].solid }}>
                                <XCircle size={20} />
                            </div>
                        </div>

                        {/* Dokumen Saya */}
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Dokumen Saya</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.total_submitted_by_me || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS.Neutral.bgSoft, color: STATUS_COLORS.Neutral.solid }}>
                                <FileText size={20} />
                            </div>
                        </div>
                    </div>
                )}

                {isAdmin && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total User</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.total_users || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS.Neutral.bgSoft, color: STATUS_COLORS.Neutral.solid }}>
                                <Users size={20} />
                            </div>
                        </div>
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Total Dokumen</p>
                                <p className="text-2xl font-bold text-[var(--text-primary)] mt-1">{stats?.total_journals || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS.Neutral.bgSoft, color: STATUS_COLORS.Neutral.solid }}>
                                <FileText size={20} />
                            </div>
                        </div>
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Waiting</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS['Waiting Approval'].solid }}>{stats?.waiting || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS['Waiting Approval'].bgSoft, color: STATUS_COLORS['Waiting Approval'].solid }}>
                                <Clock size={20} />
                            </div>
                        </div>
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Approved</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS['Approved'].solid }}>{stats?.approved || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS['Approved'].bgSoft, color: STATUS_COLORS['Approved'].solid }}>
                                <CheckCircle size={20} />
                            </div>
                        </div>
                        <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 flex items-center justify-between shadow-xs">
                            <div>
                                <p className="text-xs font-medium text-[var(--text-secondary)] uppercase tracking-wide">Rejected</p>
                                <p className="text-2xl font-bold mt-1" style={{ color: STATUS_COLORS['Rejected'].solid }}>{stats?.rejected || 0}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full flex items-center justify-center" style={{ backgroundColor: STATUS_COLORS['Rejected'].bgSoft, color: STATUS_COLORS['Rejected'].solid }}>
                                <XCircle size={20} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Vertical Bar Chart: Distribusi Status Dokumen */}
                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-6 shadow-xs">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)]">Distribusi Status Dokumen</h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">Proporsi persentase dokumen berdasarkan status terkini</p>
                        </div>
                        <div className="text-right">
                            <span className="text-[11px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Total Dokumen</span>
                            <p className="text-lg font-bold text-[var(--text-primary)]">{totalDistribution}</p>
                        </div>
                    </div>

                    {/* Chart Container with Scale Gridlines */}
                    <div className="relative pt-6 pb-2">
                        {/* Horizontal Gridlines (0%, 25%, 50%, 75%, 100%) */}
                        <div className="absolute inset-x-0 top-6 bottom-14 flex flex-col justify-between pointer-events-none">
                            {[100, 75, 50, 25, 0].map((level) => (
                                <div key={level} className="flex items-center gap-3 w-full">
                                    <span className="text-[10px] text-gray-400 w-7 text-right font-mono shrink-0">{level}%</span>
                                    <div className="w-full border-b border-gray-200/60" />
                                </div>
                            ))}
                        </div>

                        {/* Vertical Bars */}
                        <div className="relative pl-10 pr-2 h-[150px] flex items-end justify-around gap-6 sm:gap-12">
                            {chartItems.map((item) => {
                                const isZero = item.count === 0;
                                const barHeightPercent = isZero ? 4 : Math.max(item.percent, 6);

                                return (
                                    <div key={item.key} className="flex-1 flex flex-col items-center max-w-[80px] sm:max-w-[100px] h-full justify-end group">
                                        {/* Number Count above bar */}
                                        <span
                                            className="text-xs sm:text-sm font-bold mb-1.5 transition-transform group-hover:-translate-y-0.5"
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
                        <div className="pl-10 pr-2 pt-3 grid grid-cols-3 gap-6 sm:gap-12 text-center">
                            {chartItems.map((item) => (
                                <div key={item.key} className="flex flex-col items-center">
                                    <div className="flex items-center gap-1.5 justify-center">
                                        <span
                                            className="w-2.5 h-2.5 rounded-full shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="text-xs font-semibold text-[var(--text-primary)] truncate max-w-[110px]">
                                            {item.label}
                                        </span>
                                    </div>
                                    <span className="text-[11px] font-medium text-[var(--text-muted)] mt-0.5">
                                        {item.percent}%
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Recent Items Table */}
                <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-xs">
                    <div className="px-5 py-4 flex items-center justify-between border-b-[0.5px] border-[var(--border)]">
                        <div>
                            <h3 className="text-base font-semibold text-[var(--text-primary)]">
                                {isApprover ? 'Antrean Approval Terbaru' : 'Dokumen Terbaru'}
                            </h3>
                            <p className="text-xs text-[var(--text-secondary)] mt-0.5">5 aktivitas/dokumen terbaru</p>
                        </div>
                        <Link
                            href={isApprover ? '/approval' : '/monitoring'}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                        >
                            Lihat Semua <ArrowRight size={14} />
                        </Link>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm text-[var(--text-primary)]">
                            <thead className="bg-[#fafafa] border-b-[0.5px] border-[var(--border)] text-[11px] uppercase text-[var(--text-muted)] font-semibold">
                                <tr>
                                    <th className="px-5 py-3 whitespace-nowrap">No. Dokumen</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Tanggal</th>
                                    <th className="px-5 py-3">Reference</th>
                                    <th className="px-5 py-3 whitespace-nowrap">Status</th>
                                    <th className="px-5 py-3 whitespace-nowrap">
                                        {isStaff ? 'Assign To' : 'Person Request'}
                                    </th>
                                    <th className="px-5 py-3 text-right whitespace-nowrap">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[var(--border)]">
                                {!recentData?.length ? (
                                    <tr>
                                        <td colSpan={6} className="px-5 py-8 text-center text-[var(--text-muted)] text-[13px]">
                                            Tidak ada dokumen terbaru.
                                        </td>
                                    </tr>
                                ) : (
                                    recentData?.map(journal => (
                                        <tr key={journal.id} className="hover:bg-[#f9fafb] transition-colors">
                                            <td className="px-5 py-3 font-mono text-blue-600 font-medium">
                                                {journal.document_number}
                                            </td>
                                            <td className="px-5 py-3 text-[13px] whitespace-nowrap">
                                                {journal.journal_date?.split('T')[0]}
                                            </td>
                                            <td className="px-5 py-3 text-[13px] max-w-[220px] truncate">
                                                {journal.reference || '-'}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                {statusBadge(journal.status)}
                                            </td>
                                            <td className="px-5 py-3 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {isStaff ? (
                                                        journal.assignee ? (
                                                            <span className="text-[13px]">{journal.assignee.name}</span>
                                                        ) : <span className="text-[13px] text-gray-400">-</span>
                                                    ) : (
                                                        journal.requester ? (
                                                            <span className="text-[13px]">{journal.requester.name}</span>
                                                        ) : <span className="text-[13px] text-gray-400">-</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-5 py-3 text-right whitespace-nowrap">
                                                <Link
                                                    href={isApprover ? `/approval/${journal.id}` : `/general-journals/${journal.id}`}
                                                    className="px-3 py-1.5 border-[0.5px] border-[var(--border)] rounded-md text-[12px] font-medium text-[var(--text-secondary)] hover:bg-gray-50 transition-colors"
                                                >
                                                    Detail
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
        </MainLayout>
    );
}