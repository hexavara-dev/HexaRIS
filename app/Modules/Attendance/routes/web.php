<?php

use App\Modules\Attendance\Http\Controllers\AttendanceController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('attendance/check-in', [AttendanceController::class, 'checkIn'])->name('attendance.check-in.index');
    Route::get('attendance/report', [AttendanceController::class, 'report'])->name('attendance.report.index');
    Route::get('attendance/leave', [AttendanceController::class, 'leave'])->name('attendance.leave.index');
    Route::get('attendance/overtime', [AttendanceController::class, 'overtime'])->name('attendance.overtime.index');
});
