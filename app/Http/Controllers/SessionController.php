<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use App\Models\User;

class SessionController extends Controller
{
    /**
     * Show login form
     */
    public function create()
    {
        return view('auth.login');
    }

    /**
     * Handle login request using session authentication
     */
    public function store(Request $request)
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required'],
        ]);

        $remember = $request->boolean('remember');

        if (Auth::attempt($credentials, $remember)) {
            $request->session()->regenerate();

            $user = $request->user();
            if ($user instanceof User) {
                if (!$user->isActive()) {
                    Auth::logout();
                    return back()->withErrors([
                        'email' => 'Konto jest nieaktywne lub zablokowane.',
                    ]);
                }

                $user->updateLoginInfo($request->ip());

                // Redirect based on role
                return redirect()->intended(match(true) {
                    $user->isAdmin() => route('admin.dashboard'),
                    $user->isModerator() => route('moderator.dashboard'),
                    $user->isTutor() => route('tutor.dashboard'),
                    $user->isStudent() => route('student.dashboard'),
                    default => '/'
                });
            }

            return redirect('/');
        }

        return back()->withErrors([
            'email' => 'Podane dane logowania są nieprawidłowe.',
        ])->onlyInput('email');
    }

    /**
     * Logout the user
     */
    public function destroy(Request $request)
    {
        Auth::logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
