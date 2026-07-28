<?php

use App\Modules\Employee\Http\Controllers\EmployeeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('employee', [EmployeeController::class, 'index'])
        ->name('employee.index')->middleware('can:employee.viewAny');
    Route::get('employee/create', [EmployeeController::class, 'create'])
        ->name('employee.create')->middleware('can:employee.create');
    Route::post('employee', [EmployeeController::class, 'store'])
        ->name('employee.store')->middleware('can:employee.create');
    Route::get('employee/{employee}/edit', [EmployeeController::class, 'edit'])
        ->name('employee.edit')->middleware('can:employee.update');
    Route::put('employee/{employee}', [EmployeeController::class, 'update'])
        ->name('employee.update')->middleware('can:employee.update');
    Route::delete('employee/{employee}', [EmployeeController::class, 'destroy'])
        ->name('employee.destroy')->middleware('can:employee.delete');
});
