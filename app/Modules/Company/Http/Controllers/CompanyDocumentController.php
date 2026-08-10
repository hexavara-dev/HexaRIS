<?php

namespace App\Modules\Company\Http\Controllers;

use Inertia\Inertia;
use Inertia\Response;

class CompanyDocumentController
{
    public function index(): Response
    {
        return Inertia::render('Company::pages/Document');
    }

    public function create(): Response
    {
        return Inertia::render('Company::pages/DocumentForm');
    }

    /**
     * Templates still live in the browser's localStorage, so the id is passed
     * straight through for the page to resolve — there's no model to bind or
     * authorize against until this resource gets a real backend.
     *
     * Same page component as create() — DocumentForm branches on whether
     * `templateId` is present, mirroring Iam's users/Form.tsx (`user: UserRow | null`).
     */
    public function edit(string $template): Response
    {
        return Inertia::render('Company::pages/DocumentForm', ['templateId' => $template]);
    }
}
