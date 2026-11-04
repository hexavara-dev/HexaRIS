<?php

namespace App\Modules\Attendance\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AttendanceController
{
    public function checkIn(): Response
    {
        return Inertia::render('Attendance::pages/CheckIn/Index');
    }

    public function report(): Response
    {
        return Inertia::render('Attendance::pages/CheckIn/attendance-report');
    }

    public function leave(): Response
    {
        return Inertia::render('Attendance::pages/Leave/Index');
    }

    public function overtime(): Response
    {
        return Inertia::render('Attendance::pages/Overtime/Index');
    }

    public function schedule(): Response
    {
        return Inertia::render('Attendance::pages/Schedule/Index');
    }

    public function scheduleDetail(Request $request): Response
    {
        $validated = $request->validate(['date' => ['required', 'date_format:Y-m-d']]);

        return Inertia::render('Attendance::pages/Schedule/Detail', ['date' => $validated['date']]);
    }
}
