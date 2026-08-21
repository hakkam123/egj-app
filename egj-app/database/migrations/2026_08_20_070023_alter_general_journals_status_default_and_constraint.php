<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // 1. Update any existing 'Draft' records to 'Waiting Approval' to avoid constraint failure
        DB::table('general_journals')
            ->where('status', 'Draft')
            ->update(['status' => 'Waiting Approval']);

        // 2. Change the default value of the column
        // Since SQL Server does not support modifying default constraint easily via basic blueprint,
        // we recreate the column or use DB statements if needed. 
        // But Laravel 11 handles change() with doctrine/dbal (which we will assume is installed).
        // For safety across SQL server, we drop old default (handled by Laravel) and add new one.
        Schema::table('general_journals', function (Blueprint $table) {
            $table->string('status', 20)->default('Waiting Approval')->change();
        });

        // 3. Add the CHECK constraint (SQL Server syntax)
        DB::statement("ALTER TABLE general_journals ADD CONSTRAINT chk_general_journals_status CHECK (status IN ('Waiting Approval', 'Approved', 'Rejected'))");
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement("ALTER TABLE general_journals DROP CONSTRAINT chk_general_journals_status");
        
        Schema::table('general_journals', function (Blueprint $table) {
            $table->string('status', 20)->default('Draft')->change();
        });
    }
};
