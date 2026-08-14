<?php

use App\Modules\Payroll\Http\Controllers\PayrollController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('payroll/data', [PayrollController::class, 'index'])
        ->name('payroll.data.index')->middleware('can:payroll.viewAny');
    Route::get('payroll/settings', [PayrollController::class, 'settings'])
        ->name('payroll.settings.index')->middleware('can:payroll.update');
    Route::get('payroll/reimburse', [PayrollController::class, 'reimburse'])
        ->name('payroll.reimburse.index')->middleware('can:reimburse.viewAny');
});
