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
        Schema::table('general_journals', function (Blueprint $table) {
            $table->index('status', 'idx_gj_status');
            $table->index('journal_date', 'idx_gj_journal_date');
            $table->index('requested_by', 'idx_gj_requested_by');
            $table->index('current_assign_to', 'idx_gj_current_assign_to');
            $table->index('document_number', 'idx_gj_document_number');
            $table->index('last_updated_at', 'idx_gj_last_updated_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('general_journals', function (Blueprint $table) {
            $table->dropIndex('idx_gj_status');
            $table->dropIndex('idx_gj_journal_date');
            $table->dropIndex('idx_gj_requested_by');
            $table->dropIndex('idx_gj_current_assign_to');
            $table->dropIndex('idx_gj_document_number');
            $table->dropIndex('idx_gj_last_updated_at');
        });
    }
};

