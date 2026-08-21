<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class GeneralJournalFile extends Model
{
    use HasUlids;

    public $timestamps = false;

    protected $fillable = [
        'general_journal_id',
        'category',
        'file_name',
        'file_path',
        'file_size',
        'mime_type',
        'version',
        'is_active',
        'uploaded_at',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'uploaded_at' => 'datetime',
        ];
    }

    /**
     * The general journal this file belongs to.
     */
    public function generalJournal()
    {
        return $this->belongsTo(GeneralJournal::class);
    }

    /**
     * Check if this is a general journal PDF.
     */
    public function isGeneralJournal(): bool
    {
        return $this->category === 'general_journal';
    }

    /**
     * Check if this is a supporting document.
     */
    public function isSupportingDocument(): bool
    {
        return $this->category === 'supporting_document';
    }
}
