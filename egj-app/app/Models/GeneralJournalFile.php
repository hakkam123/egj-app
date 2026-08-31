<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;
use Illuminate\Support\Facades\Storage;

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
        'file_hash',
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
     * Ambil file aktif (versi original yang ditampilkan ke user).
     */
    public static function getActive($journalId, $category)
    {
        return self::where('general_journal_id', $journalId)
            ->where('category', $category)
            ->where('is_active', true)
            ->latest('version')
            ->first();
    }

    /**
     * Verifikasi integritas file fisik asli terhadap file_hash yang disimpan.
     */
    public function verifyIntegrity(): bool
    {
        $path = Storage::path($this->file_path);
        if (!file_exists($path)) {
            return false;
        }
        return hash_file('sha256', $path) === $this->file_hash;
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
