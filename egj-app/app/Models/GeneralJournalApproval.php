<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class GeneralJournalApproval extends Model
{
    use HasUlids;

    protected $fillable = [
        'general_journal_id',
        'approval_level',
        'assigned_user_id',
        'approved_by_user_id',
        'status',
        'approved_at',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'approved_at' => 'datetime',
        ];
    }

    /**
     * The general journal this approval belongs to.
     */
    public function generalJournal()
    {
        return $this->belongsTo(GeneralJournal::class);
    }

    /**
     * The user assigned to this approval.
     */
    public function assignedUser()
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    /**
     * The user who approved/rejected this.
     */
    public function approvedByUser()
    {
        return $this->belongsTo(User::class, 'approved_by_user_id');
    }

    /**
     * Alias for approvedByUser.
     */
    public function approvedBy()
    {
        return $this->approvedByUser();
    }

    /**
     * Check if this approval is pending.
     */
    public function isPending(): bool
    {
        return $this->status === 'Pending';
    }
}
