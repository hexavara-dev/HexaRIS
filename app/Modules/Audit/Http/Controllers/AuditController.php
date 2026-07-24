<?php

namespace App\Modules\Audit\Http\Controllers;

use App\Audit\Models\AuditActivity;
use App\Modules\Audit\Data\AuditEntryData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditController
{
    public function __invoke(Request $request): Response
    {
        $activities = AuditActivity::query()
            ->with('causer')
            ->when($request->filled('event'), fn ($q) => $q->where('event', $request->input('event')))
            ->when($request->filled('causer_id'), fn ($q) => $q->where('causer_id', $request->input('causer_id')))
            ->when($request->filled('module'), fn ($q) => $q->where('properties->module', $request->input('module')))
            ->when($request->filled('date_from'), fn ($q) => $q->whereDate('created_at', '>=', $request->date('date_from')))
            ->when($request->filled('date_to'), fn ($q) => $q->whereDate('created_at', '<=', $request->date('date_to')))
            ->latest()
            ->paginate(25)
            ->withQueryString()
            ->through(fn (AuditActivity $a) => AuditEntryData::fromModel($a));

        return Inertia::render('Audit::pages/Index', [
            'activities' => $activities,
            'filters' => $request->only(['event', 'causer_id', 'module', 'date_from', 'date_to']),
            'events' => AuditActivity::query()->whereNotNull('event')->distinct()->orderBy('event')->pluck('event'),
        ]);
    }
}
