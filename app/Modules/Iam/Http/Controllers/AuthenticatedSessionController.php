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
        // Demo bypass: any email/password logs in as the seeded super-admin, no credential
        // check. Must log in as a real User (not skip Auth entirely) so `auth.user` stays
        // non-null for every component that assumes a logged-in user, and as the super-admin
        // specifically (not User::first(), which is the unprivileged seeded "test" user) so
        // every `can:` gated route still works. Revert to $request->authenticate() before ship.
        // Guarded so this can never fire outside local dev, even if this branch is deployed by mistake.
        abort_unless(app()->environment('local'), 404);

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
