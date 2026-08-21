<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class ApprovalHistory extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $table = 'approval_histories';

    protected $fillable = [
        'general_journal_id',
        'action',
        'actor_user_id',
        'target_level',
        'notes',
        'created_at',
    ];

    protected function casts(): array
    {
        return [
            'created_at' => 'datetime',
        ];
    }

    /**
     * The general journal this history entry belongs to.
     */
    public function generalJournal()
    {
        return $this->belongsTo(GeneralJournal::class);
    }

    /**
     * The user who performed the action.
     */
    public function actor()
    {
        return $this->belongsTo(User::class, 'actor_user_id');
    }
}
