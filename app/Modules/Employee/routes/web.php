<?php

use App\Modules\Employee\Http\Controllers\EmployeeController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->group(function () {
    Route::get('employees', [EmployeeController::class, 'index'])
        ->name('employees.index')->middleware('can:employees.viewAny');
    // Route::get('employees/create', [EmployeeController::class, 'create'])
    //     ->name('employees.create')->middleware('can:employees.create');
    // Route::post('employees', [EmployeeController::class, 'store'])
    //     ->name('employees.store')->middleware('can:employees.create');
    // Route::get('employees/{employee}/edit', [EmployeeController::class, 'edit'])
    //     ->name('employees.edit')->middleware('can:employees.update');
    // Route::put('employees/{employee}', [EmployeeController::class, 'update'])
    //     ->name('employees.update')->middleware('can:employees.update');
    // Route::delete('employees/{employee}', [EmployeeController::class, 'destroy'])
    //     ->name('employees.destroy')->middleware('can:employees.delete');

    Route::get('employees/career', [EmployeeController::class, 'career'])->name('employees.career.index')->middleware('can:employees.viewAny');
    Route::get('employees/resign', [EmployeeController::class, 'resign'])->name('employees.resign.index')->middleware('can:employees.viewAny');
    Route::get('employees/contracts', [EmployeeController::class, 'contracts'])->name('employees.contracts.index')->middleware('can:employees.viewAny');
});
