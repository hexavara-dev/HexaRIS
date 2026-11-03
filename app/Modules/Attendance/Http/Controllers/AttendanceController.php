<?php

namespace App\Modules\Attendance\Http\Controllers;

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
}
