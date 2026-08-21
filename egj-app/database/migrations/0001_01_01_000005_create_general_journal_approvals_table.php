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
        Schema::create('general_journal_approvals', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('general_journal_id');
            $table->string('approval_level', 30); // 'accounting' / 'superior' / 'superior_of_superior'
            $table->foreignUlid('assigned_user_id')->constrained('users');
            $table->foreignUlid('approved_by_user_id')->nullable()->constrained('users');
            $table->string('status', 20)->default('Pending'); // Pending / Approved / Rejected
            $table->timestamp('approved_at')->nullable();
            $table->string('notes', 4000)->nullable(); // NVARCHAR(MAX) equivalent
            $table->timestamps();

            $table->foreign('general_journal_id')->references('id')->on('general_journals')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('general_journal_approvals');
    }
};
