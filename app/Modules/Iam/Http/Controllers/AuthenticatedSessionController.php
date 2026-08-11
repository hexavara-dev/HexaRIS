<?php

namespace App\Modules\Iam\Http\Controllers;

use App\Models\User;
use App\Modules\Iam\Http\Requests\LoginRequest;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Inertia\Response;

class AuthenticatedSessionController
{
    public function create(): Response
    {
        return Inertia::render('Iam::pages/Login');
    }

    public function resetPassword(): Response
    {
        return Inertia::render('Iam::pages/ResetPassword');
    }

    public function store(LoginRequest $request): RedirectResponse
    {
        Auth::login(User::where('email', 'admin@example.com')->firstOrFail());

        $request->session()->regenerate();

        return redirect()->route('dashboard');
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/');
    }
}
