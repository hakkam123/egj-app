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
        Schema::create('general_journals', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->string('document_number', 100);
            $table->date('journal_date');
            $table->string('reference', 4000)->nullable(); // NVARCHAR(MAX) equivalent
            $table->string('status', 20)->default('Draft'); // Draft / Waiting Approval / Approved / Rejected
            $table->ulid('requested_by');
            $table->ulid('current_assign_to')->nullable();
            $table->integer('resubmit_count')->default(0);
            $table->dateTime('submitted_at')->nullable();
            $table->dateTime('last_updated_at')->nullable();
            $table->timestamps();

            $table->foreign('requested_by')->references('id')->on('users');
            $table->foreign('current_assign_to')->references('id')->on('users');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('general_journals');
    }
};
