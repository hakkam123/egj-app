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
