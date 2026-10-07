<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class LoginController extends Controller
{
    /**
     * Show the login form.
     */
    public function showLoginForm()
    {
        return Inertia::render('Auth/Login');
    }

    /**
     * Handle login request.
     */
    public function login(Request $request)
    {
        $request->validate([
            'npk' => ['required', 'string'],
            'password' => ['required', 'string'],
        ], [
            'npk.required' => 'NPK is required.',
            'password.required' => 'Password is required.',
        ]);

        $input = trim($request->input('npk'));
        $fieldType = filter_var($input, FILTER_VALIDATE_EMAIL) ? 'email' : 'npk';

        $credentials = [
            $fieldType => $input,
            'password' => $request->input('password'),
            'is_active' => true,
        ];

        if (Auth::attempt($credentials)) {
            $request->session()->regenerate();

            return redirect()->intended('/dashboard');
        }

        return back()->withErrors([
            'npk' => 'Invalid NPK or password, or the account is inactive.',
        ])->onlyInput('npk');
    }

    /**
     * Handle logout.
     */
    public function logout(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
