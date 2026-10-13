<?php

namespace App\Modules\Company\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class CompanyStructureController
{
    public function index(): Response
    {
        return Inertia::render('Company::pages/Structure/Index');
    }

    public function create(): Response
    {
        return Inertia::render('Company::pages/Structure/Create');
    }

    public function edit(): Response
    {
        return Inertia::render('Company::pages/Structure/Edit');
    }
}
