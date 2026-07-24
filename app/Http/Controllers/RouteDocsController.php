<?php

namespace App\Http\Controllers;

use App\Support\Docs\FormRequestInspector;
use App\Support\Docs\RouteInventory;
use Inertia\Inertia;
use Inertia\Response;

class RouteDocsController
{
    public function __invoke(RouteInventory $inventory, FormRequestInspector $inspector): Response
    {
        abort_unless(app()->environment(['local', 'development', 'testing']), 404);

        $routes = array_map(
            fn (array $entry) => [...$entry, ...$inspector->forAction($entry['action'], $entry['uri'])],
            $inventory->entries(),
        );

        return Inertia::render('docs/routes', [
            'routes' => $routes,
        ]);
    }
}
