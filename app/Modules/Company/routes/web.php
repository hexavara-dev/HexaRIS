<?php

use App\Modules\Company\Http\Controllers\CompanyStructureController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('company')->name('company.')->group(function () {
    Route::get('structure', [CompanyStructureController::class, 'index'])->name('structure.index');
});
