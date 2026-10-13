<?php

use App\Modules\Company\Http\Controllers\CompanyAssetController;
use App\Modules\Company\Http\Controllers\CompanyDocumentController;
use App\Modules\Company\Http\Controllers\CompanyStructureController;
use Illuminate\Support\Facades\Route;

Route::middleware('auth')->prefix('company')->name('company.')->group(function () {
    Route::get('structure', [CompanyStructureController::class, 'index'])->name('structure');
    Route::get('structure/create', [CompanyStructureController::class, 'create'])->name('structure.create');
    Route::get('structure/{structure}/edit', [CompanyStructureController::class, 'edit'])->name('structure.edit');

    Route::get('documents', [CompanyDocumentController::class, 'index'])->name('document.index');
    Route::get('documents/create', [CompanyDocumentController::class, 'create'])->name('document.create');
    Route::get('documents/{template}/edit', [CompanyDocumentController::class, 'edit'])->name('document.edit');

    Route::get('asset', CompanyAssetController::class)->name('asset.index');
});
