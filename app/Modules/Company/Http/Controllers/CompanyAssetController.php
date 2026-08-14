<?php

namespace App\Modules\Company\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class CompanyAssetController
{
    public function __invoke(): Response
    {
        return Inertia::render('Company::pages/Asset');
    }
}
