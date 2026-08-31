<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class UserController extends Controller
{
    /**
     * Show user management list with filtering and pagination.
     */
    public function index(Request $request)
    {
        $query = User::query();

        // Search by name, email, or NPK
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('npk', 'like', "%{$search}%");
            });
        }

        // Filter by role
        if ($request->filled('role')) {
            $query->where('role', $request->role);
        }

        // Filter by active status
        if ($request->filled('status')) {
            if ($request->status === 'active') {
                $query->where('is_active', true);
            } elseif ($request->status === 'inactive') {
                $query->where('is_active', false);
            }
        }

        $query->orderBy('name');

        $allowedPerPage = [10, 25, 50, 100];
        $perPage = in_array((int) $request->input('per_page', 10), $allowedPerPage)
            ? (int) $request->input('per_page', 10)
            : 10;

        $users = $query->paginate($perPage)->withQueryString();

        return Inertia::render('Users/Index', [
            'users' => $users,
            'filters' => $request->only(['search', 'role', 'status', 'per_page']),
        ]);
    }

    /**
     * Store a new user.
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'npk' => ['nullable', 'string', 'max:50', 'unique:users,npk'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'role' => ['required', Rule::in(['Staff', 'Section Head', 'Dept/Div Head', 'Admin'])],
            'is_active' => ['required', 'boolean'],
            'is_default_approver' => ['nullable', 'boolean'],
        ]);

        $isDefault = $request->role === 'Section Head' && (bool) $request->is_default_approver;

        if ($isDefault) {
            User::where('role', 'Section Head')->update(['is_default_approver' => false]);
        }

        User::create([
            'name' => $request->name,
            'email' => $request->email,
            'npk' => $request->npk,
            'password' => Hash::make($request->password),
            'role' => $request->role,
            'is_active' => $request->is_active,
            'is_default_approver' => $isDefault,
        ]);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil ditambahkan.');
    }

    /**
     * Update a user.
     */
    public function update(Request $request, string $id)
    {
        $user = User::findOrFail($id);

        $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($user->id)],
            'npk' => ['nullable', 'string', 'max:50', Rule::unique('users', 'npk')->ignore($user->id)],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
            'role' => ['required', Rule::in(['Staff', 'Section Head', 'Dept/Div Head', 'Admin'])],
            'is_active' => ['required', 'boolean'],
            'is_default_approver' => ['nullable', 'boolean'],
        ]);

        $isDefault = $request->role === 'Section Head' && (bool) $request->is_default_approver;

        if ($isDefault) {
            User::where('role', 'Section Head')
                ->where('id', '!=', $user->id)
                ->update(['is_default_approver' => false]);
        }

        $data = [
            'name' => $request->name,
            'email' => $request->email,
            'npk' => $request->npk,
            'role' => $request->role,
            'is_active' => $request->is_active,
            'is_default_approver' => $isDefault,
        ];

        if ($request->filled('password')) {
            $data['password'] = Hash::make($request->password);
        }

        $user->update($data);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil diperbarui.');
    }

    /**
     * Delete (deactivate) a user.
     */
    public function destroy(string $id)
    {
        $user = User::findOrFail($id);

        // Deactivate instead of hard delete to preserve historical integrity
        $user->update(['is_active' => false]);

        return redirect()->route('users.index')
            ->with('success', 'User berhasil dinonaktifkan.');
    }
}
