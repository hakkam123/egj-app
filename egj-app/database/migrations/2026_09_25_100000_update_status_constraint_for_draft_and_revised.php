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
        // Try dropping existing check constraint if it exists
        try {
            DB::statement("ALTER TABLE general_journals DROP CONSTRAINT chk_general_journals_status");
        } catch (\Throwable $e) {
            // Constraint might not exist in some environments (e.g. SQLite tests)
        }

        Schema::table('general_journals', function (Blueprint $table) {
            $table->string('status', 30)->default('Draft')->change();
        });

        // Add updated CHECK constraint for SQL Server if on sqlsrv
        if (DB::getDriverName() === 'sqlsrv') {
            DB::statement("ALTER TABLE general_journals ADD CONSTRAINT chk_general_journals_status CHECK (status IN ('Draft', 'Waiting Approval', 'Revised', 'Approved', 'Rejected'))");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlsrv') {
            try {
                DB::statement("ALTER TABLE general_journals DROP CONSTRAINT chk_general_journals_status");
                DB::statement("ALTER TABLE general_journals ADD CONSTRAINT chk_general_journals_status CHECK (status IN ('Waiting Approval', 'Approved', 'Rejected'))");
            } catch (\Throwable $e) {}
        }

        Schema::table('general_journals', function (Blueprint $table) {
            $table->string('status', 20)->default('Waiting Approval')->change();
        });
    }
};
