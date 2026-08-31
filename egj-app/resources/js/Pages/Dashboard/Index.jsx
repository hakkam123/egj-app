import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import PageHeader from '../../Components/PageHeader';
import { FileText, Clock, CheckCircle, XCircle, Users, ArrowRight } from 'lucide-react';
import { STATUS_COLORS } from '../../constants/statusColors';

export default function DashboardIndex({ role, stats, recentData, actionRequiredDocs = [], thresholdDays = 3 }) {
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

                {/* Dokumen Perlu Tindakan (Action Required / Priority Queue) - Approvers & Admin Only */}
                {(isApprover || isAdmin) && (
                    <div className="bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] overflow-hidden shadow-xs">
                        <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b-[0.5px] border-[var(--border)]">
                            <div className="flex items-center gap-3">
                                <div>
                                    <div className="flex items-center gap-2">
                                        <h3 className="text-base font-semibold text-[var(--text-primary)]">
                                            Dokumen Perlu Tindakan
                                        </h3>
                                        {actionRequiredDocs?.length > 0 && (
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#faf1e2] text-[#b8791f] border border-amber-200">
                                                {actionRequiredDocs.length} Dokumen
                                            </span>
                                        )}
                                    </div>
                                    <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                                        Dokumen yang telah menunggu persetujuan lebih dari {thresholdDays || 3} hari
                                    </p>
                                </div>
                            </div>

                            {actionRequiredDocs?.length > 0 && (
                                <Link
                                    href={isApprover ? '/approval' : '/monitoring?status=Waiting%20Approval'}
                                    className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900 transition-colors"
                                >
                                    Buka Semua Antrean <ArrowRight size={14} />
                                </Link>
                            )}
                        </div>

                        {/* Content: List or Empty State */}
                        {!actionRequiredDocs?.length ? (
                            <div className="py-8 px-5 text-center">
                                <p className="text-sm font-semibold text-[var(--text-primary)]">Semua dokumen tertangani dengan baik</p>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5 max-w-md mx-auto">
                                    Tidak ada dokumen yang melebihi batas waktu tunggu persetujuan (&gt;{thresholdDays || 3} hari).
                                </p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm text-[var(--text-primary)]">
                                    <thead className="bg-[#fafafa] border-b-[0.5px] border-[var(--border)] text-[11px] uppercase text-[var(--text-muted)] font-semibold">
                                        <tr>
                                            <th className="px-5 py-3 whitespace-nowrap">No. Dokumen</th>
                                            <th className="px-5 py-3 whitespace-nowrap">Diajukan Oleh</th>
                                            <th className="px-5 py-3 whitespace-nowrap">Tanggal Pengajuan</th>
                                            <th className="px-5 py-3 whitespace-nowrap">Lama Menunggu</th>
                                            <th className="px-5 py-3 text-right whitespace-nowrap">Aksi</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[var(--border)]">
                                        {actionRequiredDocs.map((doc) => (
                                            <tr key={doc.id} className="hover:bg-[#f9fafb] transition-colors">
                                                <td className="px-5 py-3.5">
                                                    <span className="font-mono text-xs font-bold text-blue-600">
                                                        {doc.document_number}
                                                    </span>
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
                                                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                                                        doc.days_waiting >= 5
                                                            ? 'bg-[#fbeceb] text-[#b8433c] border border-red-200'
                                                            : 'bg-[#faf1e2] text-[#b8791f] border border-amber-200'
                                                    }`}>
                                                        <Clock size={12} />
                                                        {doc.days_waiting} Hari
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                                    <Link
                                                        href={isApprover ? `/approval/${doc.id}` : `/general-journals/${doc.id}`}
                                                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold shadow-2xs transition-colors ${
                                                            isApprover
                                                                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                                                : 'border-[0.5px] border-[var(--border)] bg-white text-[var(--text-secondary)] hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {isApprover ? 'Review' : 'Detail'}
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

                {/* Main Content Grid: Distribusi Status Dokumen (40%) + Dokumen Terbaru (60%) */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                    {/* Left Column: Distribusi Status Dokumen (5/12 cols) */}
                    <div className="lg:col-span-5 bg-[var(--card-bg)] rounded-[10px] border-[0.5px] border-[var(--border)] p-5 sm:p-6 shadow-xs">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h3 className="text-base font-semibold text-[var(--text-primary)]">Distribusi Status</h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">Proporsi status terkini</p>
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
                            <div className="relative pl-8 pr-1 h-[150px] flex items-end justify-around gap-3 sm:gap-6">
                                {chartItems.map((item) => {
                                    const isZero = item.count === 0;
                                    const barHeightPercent = isZero ? 4 : Math.max(item.percent, 6);

                                    return (
                                        <div key={item.key} className="flex-1 flex flex-col items-center max-w-[70px] h-full justify-end group">
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
                            <div className="pl-8 pr-1 pt-3 grid grid-cols-3 gap-2 sm:gap-4 text-center">
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
                                    {isApprover ? 'Antrean Approval Terbaru' : 'Dokumen Terbaru'}
                                </h3>
                                <p className="text-xs text-[var(--text-secondary)] mt-0.5">5 aktivitas/dokumen terbaru</p>
                            </div>
                            <Link
                                href={isApprover ? '/approval' : '/monitoring'}
                                className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-800 transition-colors"
                            >
                                Lihat Semua
                            </Link>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-[var(--text-primary)]">
                                <thead className="bg-[#fafafa] border-b-[0.5px] border-[var(--border)] text-[11px] uppercase text-[var(--text-muted)] font-semibold">
                                    <tr>
                                        <th className="px-4 py-3 whitespace-nowrap">No. Dokumen</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Tanggal</th>
                                        <th className="px-4 py-3">Reference</th>
                                        <th className="px-4 py-3 whitespace-nowrap">Status</th>
                                        <th className="px-4 py-3 whitespace-nowrap">
                                            {isStaff ? 'Assign To' : 'Person Request'}
                                        </th>
                                        <th className="px-4 py-3 text-right whitespace-nowrap">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[var(--border)]">
                                    {!recentData?.length ? (
                                        <tr>
                                            <td colSpan={6} className="px-4 py-8 text-center text-[var(--text-muted)] text-[13px]">
                                                Tidak ada dokumen terbaru.
                                            </td>
                                        </tr>
                                    ) : (
                                        recentData?.map(journal => (
                                            <tr key={journal.id} className="hover:bg-[#f9fafb] transition-colors">
                                                <td className="px-4 py-3 font-mono text-blue-600 font-medium text-xs whitespace-nowrap">
                                                    {journal.document_number}
                                                </td>
                                                <td className="px-4 py-3 text-xs whitespace-nowrap text-gray-600">
                                                    {journal.journal_date?.split('T')[0]}
                                                </td>
                                                <td className="px-4 py-3 text-xs max-w-[140px] truncate text-gray-600">
                                                    {journal.reference || '-'}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    {statusBadge(journal.status)}
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
            </div>
        </MainLayout>
    );
}