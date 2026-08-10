<?php

use App\Modules\Payroll\Http\Controllers\PayrollController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('payroll/data', [PayrollController::class, 'index'])
        ->name('payroll.data.index')->middleware('can:payroll.viewAny');
});
