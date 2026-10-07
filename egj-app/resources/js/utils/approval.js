/**
 * Mirrors GeneralJournal::canBeActionedBy() on the server, so approve / revise buttons
 * are only shown to the user who can actually act at the journal's current stage.
 */
const LEVEL_ORDER = ['accounting', 'superior', 'superior_of_superior'];

const LEVEL_ROLES = {
    superior: 'Section Head',
    superior_of_superior: 'Dept/Div Head',
};

/** The earliest approval level that is still Pending (the stage the journal is at). */
export function currentPendingApproval(journal) {
    return [...(journal?.approvals || [])]
        .filter(a => a.status === 'Pending')
        .sort((a, b) => LEVEL_ORDER.indexOf(a.approval_level) - LEVEL_ORDER.indexOf(b.approval_level))[0] || null;
}

export function canActOnJournal(journal, user) {
    if (!journal || !user || journal.status !== 'Waiting Approval') {
        return false;
    }

    const pending = currentPendingApproval(journal);
    if (!pending) {
        return false;
    }

    return String(pending.assigned_user_id) === String(user.id)
        || LEVEL_ROLES[pending.approval_level] === user.role;
}
