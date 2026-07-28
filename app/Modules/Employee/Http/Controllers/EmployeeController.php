<?php

namespace App\Modules\Employee\Http\Controllers;

use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class EmployeeController
{
    public function index(Request $request): Response
    {
        return Inertia::render('Employee::pages/Index');
    }

    public function create(): Response
    {
        return Inertia::render('Employee::pages/Form');
    }

    public function store(Request $request): RedirectResponse
    {
        return redirect()->route('employee.index');
    }

    public function edit(string $employee): Response
    {
        return Inertia::render('Employee::pages/Form');
    }

    public function update(Request $request, string $employee): RedirectResponse
    {
        return redirect()->route('employee.index');
    }

    public function destroy(string $employee): RedirectResponse
    {
        return redirect()->route('employee.index');
    }
}
