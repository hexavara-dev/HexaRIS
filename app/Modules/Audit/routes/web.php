<?php

use App\Modules\Audit\Http\Controllers\AuditController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth', 'can:audit.view'])
    ->get('/audit', AuditController::class)
    ->name('audit.index');
