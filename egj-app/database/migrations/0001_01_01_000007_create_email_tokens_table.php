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
        Schema::create('email_tokens', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('general_journal_id');
            $table->string('token', 255)->unique();
            $table->string('email', 255);
            $table->string('purpose', 20); // 'approval' / 'preview'
            $table->dateTime('expires_at');
            $table->dateTime('used_at')->nullable();
            $table->dateTime('created_at');

            $table->foreign('general_journal_id')->references('id')->on('general_journals')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('email_tokens');
    }
};
