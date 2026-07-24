<?php

namespace App\Modules\Iam\Http\Controllers;

use App\Audit\AuditLogger;
use App\Modular\PermissionSynchronizer;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class PermissionController
{
    public function index(): Response
    {
        $groups = Permission::query()
            ->orderBy('name')
            ->pluck('name')
            ->groupBy(fn (string $name) => explode('.', $name)[0])
            ->map(fn ($group) => $group->values()->all())
            ->all();

        return Inertia::render('Iam::pages/permissions/Index', [
            'groups' => $groups,
        ]);
    }

    public function sync(Request $request, PermissionSynchronizer $synchronizer): RedirectResponse
    {
        $result = $synchronizer->sync();

        if ($result['invalid'] !== []) {
            return back()->with('error', 'Invalid permission names: '.implode(', ', $result['invalid']));
        }

        AuditLogger::atomic()
            ->event('permissions.synced')
            ->module('Iam')
            ->by($request->user())
            ->withProperties(['declared' => $result['declared'], 'created' => $result['created']])
            ->log("Synced {$result['declared']} permissions ({$result['created']} new)");

        return back()->with('success', "Synced {$result['declared']} permissions ({$result['created']} new).");
    }
}
