<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('npk', 50)->nullable()->after('email');
        });

        if (DB::getDriverName() === 'sqlsrv') {
            DB::statement('CREATE UNIQUE INDEX idx_users_npk_unique ON users(npk) WHERE npk IS NOT NULL');
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->unique('npk', 'idx_users_npk_unique');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() === 'sqlsrv') {
            DB::statement('DROP INDEX IF EXISTS idx_users_npk_unique ON users');
        } else {
            Schema::table('users', function (Blueprint $table) {
                $table->dropUnique('idx_users_npk_unique');
            });
        }

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn('npk');
        });
    }
};

