<?php

use App\Http\Controllers\RouteDocsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    Route::get('company/structure', function () {
        return Inertia::render('company/structure');
    })->name('company.structure');

    Route::get('/docs/routes', RouteDocsController::class)->name('docs.routes');
});
