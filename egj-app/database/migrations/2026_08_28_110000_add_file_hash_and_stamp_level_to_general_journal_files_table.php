<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('general_journal_files', function (Blueprint $table) {
            $table->string('file_hash', 64)->nullable()->after('mime_type');
            $table->string('stamp_level', 30)->nullable()->after('file_hash');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_journal_files', function (Blueprint $table) {
            $table->dropColumn(['file_hash', 'stamp_level']);
        });
    }
};

