<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUlids;

class ErrorLog extends Model
{
    use HasUlids;

    protected $fillable = [
        'message',
        'exception_class',
        'file',
        'line',
        'stack_trace',
        'url',
        'method',
        'user_id',
        'ip_address',
        'user_agent',
        'status',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}

