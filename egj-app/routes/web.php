<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\MonitoringController;
use App\Http\Controllers\GeneralJournalController;
use App\Http\Controllers\ApprovalController;
use App\Http\Controllers\TrackingController;
use App\Http\Controllers\PreviewController;
use App\Http\Controllers\EmailApprovalController;
use App\Http\Controllers\FileController;
use App\Http\Controllers\UserController;
use App\Http\Controllers\ProfileController;

/*
|--------------------------------------------------------------------------
| Guest Routes
|--------------------------------------------------------------------------
*/
Route::middleware('guest')->group(function () {
    Route::get('/login', [LoginController::class, 'showLoginForm'])->name('login');
    Route::post('/login', [LoginController::class, 'login']);
});

/*
|--------------------------------------------------------------------------
| Token Routes (no auth required)
|--------------------------------------------------------------------------
*/
Route::get('/preview/{token}', [PreviewController::class, 'show'])->name('preview.token');
Route::get('/approve-email/{token}', [EmailApprovalController::class, 'show'])->name('email-approval.show');
Route::post('/approve-email/{token}', [EmailApprovalController::class, 'approve'])->name('email-approval.approve');

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
*/
Route::middleware('auth')->group(function () {
    Route::post('/logout', [LoginController::class, 'logout'])->name('logout');
    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    // Profile
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::put('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::put('/profile/password', [ProfileController::class, 'updatePassword'])->name('profile.password');

    // Monitoring
    Route::get('/monitoring', [MonitoringController::class, 'index'])->name('monitoring.index');
    Route::get('/monitoring/export', [MonitoringController::class, 'export'])->name('monitoring.export');

    // General Journals
    Route::get('/general-journals/create', [GeneralJournalController::class, 'create'])->name('general-journals.create');
    Route::post('/general-journals', [GeneralJournalController::class, 'store'])->name('general-journals.store');
    Route::get('/general-journals/{id}', [GeneralJournalController::class, 'show'])->name('general-journals.show');
    Route::get('/general-journals/{id}/resubmit', [GeneralJournalController::class, 'resubmitForm'])->name('general-journals.resubmit');
    Route::post('/general-journals/{id}/resubmit', [GeneralJournalController::class, 'resubmit'])->name('general-journals.resubmit.store');

    // Approval (Section Head & Dept/Div Head only)
    Route::middleware('role:Section Head,Dept/Div Head')->group(function () {
        Route::get('/approval', [ApprovalController::class, 'index'])->name('approval.index');
        Route::get('/approval/{id}', [ApprovalController::class, 'show'])->name('approval.show');
        Route::post('/approval/{id}/approve', [ApprovalController::class, 'approve'])->name('approval.approve');
        Route::post('/approval/{id}/reject', [ApprovalController::class, 'reject'])->name('approval.reject');
    });

    // Tracking
    Route::get('/tracking', [TrackingController::class, 'index'])->name('tracking.index');
    Route::get('/tracking/{id}', [TrackingController::class, 'show'])->name('tracking.show');

    // Files
    Route::get('/files/{id}/download', [FileController::class, 'download'])->name('files.download');
    Route::get('/files/{id}/preview', [FileController::class, 'preview'])->name('files.preview');

    // User Management (Admin only)
    Route::middleware('role:Admin')->group(function () {
        Route::get('/users', [UserController::class, 'index'])->name('users.index');
        Route::get('/users/create', [UserController::class, 'create'])->name('users.create');
        Route::post('/users', [UserController::class, 'store'])->name('users.store');
        Route::get('/users/{id}/edit', [UserController::class, 'edit'])->name('users.edit');
        Route::put('/users/{id}', [UserController::class, 'update'])->name('users.update');
        Route::delete('/users/{id}', [UserController::class, 'destroy'])->name('users.destroy');
    });
});
