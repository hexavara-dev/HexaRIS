<?php

use App\Modules\Company\Http\Controllers\CompanyDocumentController;
use App\Modules\Company\Http\Controllers\CompanyStructureController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('company')->name('company.')->group(function () {
    Route::get('structure', [CompanyStructureController::class, 'index'])->name('structure');

    Route::get('documents', [CompanyDocumentController::class, 'index'])->name('document.index');
    Route::get('documents/create', [CompanyDocumentController::class, 'create'])->name('document.create');
    Route::get('documents/{template}/edit', [CompanyDocumentController::class, 'edit'])->name('document.edit');
});
