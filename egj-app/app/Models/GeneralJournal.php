<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class GeneralJournal extends Model
{
    use HasUlids;

    protected $fillable = [
        'document_number',
        'journal_date',
        'reference',
        'status',
        'requested_by',
        'current_assign_to',
        'resubmit_count',
        'submitted_at',
        'last_updated_at',
    ];

    protected function casts(): array
    {
        return [
            'journal_date' => 'date',
            'submitted_at' => 'datetime',
            'last_updated_at' => 'datetime',
        ];
    }

    /**
     * The user who requested this journal.
     */
    public function requester()
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    /**
     * The user currently assigned for approval.
     */
    public function assignee()
    {
        return $this->belongsTo(User::class, 'current_assign_to');
    }

    /**
     * Files attached to this journal.
     */
    public function files()
    {
        return $this->hasMany(GeneralJournalFile::class);
    }

    /**
     * Active files only.
     */
    public function activeFiles()
    {
        return $this->hasMany(GeneralJournalFile::class)->where('is_active', true);
    }

    /**
     * Approval records for this journal.
     */
    public function approvals()
    {
        return $this->hasMany(GeneralJournalApproval::class);
    }

    /**
     * Approval history timeline.
     */
    public function histories()
    {
        return $this->hasMany(ApprovalHistory::class);
    }

    /**
     * Get the latest approve action history.
     */
    public function lastApproveHistory()
    {
        return $this->hasOne(ApprovalHistory::class)->where('action', 'approve')->latestOfMany('created_at');
    }

    /**
     * Email tokens for this journal.
     */
    public function emailTokens()
    {
        return $this->hasMany(EmailToken::class);
    }

    /**
     * Which role acts on each approval level (accounting is always auto-approved).
     */
    public const LEVEL_ROLES = [
        'superior' => 'Section Head',
        'superior_of_superior' => 'Dept/Div Head',
    ];

    /**
     * The earliest approval level that is still Pending, i.e. the stage the journal is at.
     */
    public function currentPendingApproval(): ?GeneralJournalApproval
    {
        return $this->approvals()
            ->where('status', 'Pending')
            ->orderByRaw("CASE approval_level WHEN 'accounting' THEN 1 WHEN 'superior' THEN 2 WHEN 'superior_of_superior' THEN 3 END")
            ->first();
    }

    /**
     * Whether the user may approve / request revision at the journal's current stage.
     * The assigned user can always act; otherwise any user holding the stage's role can.
     */
    public function canBeActionedBy(User $user): bool
    {
        if (!$this->isWaitingApproval()) {
            return false;
        }

        $pending = $this->currentPendingApproval();
        if (!$pending) {
            return false;
        }

        return $pending->assigned_user_id === $user->id
            || (self::LEVEL_ROLES[$pending->approval_level] ?? null) === $user->role;
    }

    /**
     * Journals waiting at a stage the given approver can act on.
     */
    public function scopeActionableBy($query, User $user)
    {
        return $query->where('status', 'Waiting Approval')->where(function ($q) use ($user) {
            $q->where('current_assign_to', $user->id);

            if ($user->hasRole('Dept/Div Head')) {
                // Only once the Superior level is done — never ahead of the Section Head
                $q->orWhere(function ($sub) {
                    $sub->whereHas('approvals', fn ($a) => $a->where('approval_level', 'superior_of_superior')->where('status', 'Pending'))
                        ->whereDoesntHave('approvals', fn ($a) => $a->where('approval_level', 'superior')->where('status', 'Pending'));
                });
            } elseif ($user->hasRole('Section Head')) {
                $q->orWhereHas('approvals', fn ($a) => $a->where('approval_level', 'superior')->where('status', 'Pending'));
            }
        });
    }

    /**
     * Check if the journal is in draft status.
     */
    public function isDraft(): bool
    {
        return $this->status === 'Draft';
    }
    /**
      * Check if the journal is waiting for approval.
     **/
    public function isWaitingApproval(): bool
    {
        return $this->status === 'Waiting Approval';
    }

    /**
     * Check if the journal has been rejected.
     */
    public function isRejected(): bool
    {
        return $this->status === 'Rejected';
    }

    /**
     * Check if the journal has been requested for revision.
     */
    public function isRevised(): bool
    {
        return $this->status === 'Revised';
    }

    /**
     * Check if the journal has been approved.
     */
    public function isApproved(): bool
    {
        return $this->status === 'Approved';
    }
}
