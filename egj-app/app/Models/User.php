<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class User extends Authenticatable
{
    use HasFactory, Notifiable, HasUlids;

    protected $fillable = [
        'name',
        'email',
        'npk',
        'password',
        'role',
        'is_active',
    ];

    protected $hidden = [
        'password',
    ];

    /**
     * Disable remember token functionality since the column doesn't exist.
     */
    public $rememberTokenName = false;

    protected function casts(): array
    {
        return [
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * General Journals requested by this user.
     */
    public function generalJournals()
    {
        return $this->hasMany(GeneralJournal::class, 'requested_by');
    }

    /**
     * General Journals currently assigned to this user.
     */
    public function assignedJournals()
    {
        return $this->hasMany(GeneralJournal::class, 'current_assign_to');
    }

    /**
     * Approval records assigned to this user.
     */
    public function approvals()
    {
        return $this->hasMany(GeneralJournalApproval::class, 'assigned_user_id');
    }

    /**
     * Check if user has a specific role.
     */
    public function hasRole(string $role): bool
    {
        return $this->role === $role;
    }

    /**
     * Check if user has any of the given roles.
     */
    public function hasAnyRole(array $roles): bool
    {
        return in_array($this->role, $roles);
    }

    /**
     * Check if user is an approver (Section Head or Dept/Div Head).
     */
    public function isApprover(): bool
    {
        return $this->hasAnyRole(['Section Head', 'Dept/Div Head']);
    }

    /**
     * Check if user can create General Journals.
     */
    public function canCreateJournal(): bool
    {
        return $this->hasAnyRole(['Staff', 'Section Head']);
    }
}
