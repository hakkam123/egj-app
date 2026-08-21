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
        Schema::create('approval_histories', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('general_journal_id');
            $table->string('action', 30); // 'submit' / 'approve' / 'reject' / 'resubmit'
            $table->foreignUlid('actor_user_id')->constrained('users');
            $table->string('target_level', 30)->nullable();
            $table->string('notes', 4000)->nullable(); // NVARCHAR(MAX) equivalent
            $table->dateTime('created_at');

            $table->foreign('general_journal_id')->references('id')->on('general_journals')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_histories');
    }
};
