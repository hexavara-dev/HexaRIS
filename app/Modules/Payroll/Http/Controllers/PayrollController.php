<?php

namespace App\Modules\Payroll\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PayrollController
{
    public function index(Request $request): Response
    {
        return Inertia::render('Payroll::pages/Index');
    }

    public function settings(Request $request): Response
    {
        return Inertia::render('Payroll::pages/Settings');
    }
}
