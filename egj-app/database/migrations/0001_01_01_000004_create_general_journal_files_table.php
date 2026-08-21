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
        Schema::create('general_journal_files', function (Blueprint $table) {
            $table->ulid('id')->primary();
            $table->ulid('general_journal_id');
            $table->string('category', 20); // 'general_journal' / 'supporting_document'
            $table->string('file_name', 255);
            $table->string('file_path', 500);
            $table->bigInteger('file_size');
            $table->string('mime_type', 100);
            $table->integer('version')->default(1);
            $table->boolean('is_active')->default(true);
            $table->dateTime('uploaded_at');

            $table->foreign('general_journal_id')->references('id')->on('general_journals')->cascadeOnDelete();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('general_journal_files');
    }
};
