<?php

namespace App\Http\Controllers;

use App\Models\GeneralJournal;
use App\Models\ApprovalHistory;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Display role-based dashboard.
     */
    public function index()
    {
        $user = Auth::user();
        $role = $user->role;

        $stats = [];
        $recentData = [];

        if ($role === 'Staff') {
            $stats = [
                'total' => GeneralJournal::where('requested_by', $user->id)->count(),
                'waiting' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Waiting Approval')->count(),
                'approved' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Approved')->count(),
                'rejected' => GeneralJournal::where('requested_by', $user->id)->where('status', 'Rejected')->count(),
            ];

            $recentData = GeneralJournal::with(['assignee'])
                ->where('requested_by', $user->id)
                ->orderBy('last_updated_at', 'desc')
                ->limit(5)
                ->get();

        } elseif ($role === 'Section Head' || $role === 'Dept/Div Head') {
            $stats = [
                'pending_approval' => GeneralJournal::where('current_assign_to', $user->id)->where('status', 'Waiting Approval')->count(),
                'total_approved' => ApprovalHistory::where('actor_user_id', $user->id)->where('action', 'approve')->count(),
                'total_rejected' => ApprovalHistory::where('actor_user_id', $user->id)->where('action', 'reject')->count(),
                'total_submitted_by_me' => GeneralJournal::where('requested_by', $user->id)->count(),
            ];

            $recentData = GeneralJournal::with(['requester'])
                ->where('current_assign_to', $user->id)
                ->where('status', 'Waiting Approval')
                ->orderBy('last_updated_at', 'desc')
                ->limit(5)
                ->get();

        } elseif ($role === 'Admin') {
            $stats = [
                'total_users' => User::count(),
                'total_journals' => GeneralJournal::count(),
                'waiting' => GeneralJournal::where('status', 'Waiting Approval')->count(),
                'approved' => GeneralJournal::where('status', 'Approved')->count(),
                'rejected' => GeneralJournal::where('status', 'Rejected')->count(),
            ];

            $recentData = GeneralJournal::with(['requester', 'assignee'])
                ->orderBy('last_updated_at', 'desc')
                ->limit(5)
                ->get();
        }

        return Inertia::render('Dashboard/Index', [
            'role' => $role,
            'stats' => $stats,
            'recentData' => $recentData,
        ]);
    }
}
