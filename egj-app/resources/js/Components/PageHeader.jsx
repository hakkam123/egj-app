export default function PageHeader({ title, subtitle, actions }) {
    return (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
                <h2 className="text-xl font-bold text-[var(--text-primary)]">{title}</h2>
                {subtitle && (
                    <p className="text-sm text-[var(--text-secondary)] mt-0.5">{subtitle}</p>
                )}
            </div>
            {actions && (
                <div className="flex items-center gap-3 shrink-0 flex-wrap">
                    {actions}
                </div>
            )}
        </div>
    );
}

