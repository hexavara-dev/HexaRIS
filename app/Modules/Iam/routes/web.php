<?php

use App\Modules\Iam\Http\Controllers\AuthenticatedSessionController;
use App\Modules\Iam\Http\Controllers\PermissionController;
use App\Modules\Iam\Http\Controllers\RoleController;
use App\Modules\Iam\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

Route::middleware('guest')->group(function () {
    Route::get('login', [AuthenticatedSessionController::class, 'create'])->name('login');
    Route::post('login', [AuthenticatedSessionController::class, 'store']);
    Route::get('reset-password', [AuthenticatedSessionController::class, 'resetPassword'])->name('password.reset');
});

Route::middleware('auth')->group(function () {
    Route::post('logout', [AuthenticatedSessionController::class, 'destroy'])->name('logout');
});

Route::middleware('auth')->prefix('iam')->name('iam.')->group(function () {
    Route::get('users', [UserController::class, 'index'])->name('users.index')->middleware('can:users.viewAny');
    Route::get('users/create', [UserController::class, 'create'])->name('users.create')->middleware('can:users.create');
    Route::post('users', [UserController::class, 'store'])->name('users.store')->middleware('can:users.create');
    Route::get('users/{user}/edit', [UserController::class, 'edit'])->name('users.edit')->middleware('can:users.update');
    Route::put('users/{user}', [UserController::class, 'update'])->name('users.update')->middleware('can:users.update');
    Route::delete('users/{user}', [UserController::class, 'destroy'])->name('users.destroy')->middleware('can:users.delete');

    Route::get('permissions', [PermissionController::class, 'index'])->name('permissions.index')->middleware('can:permissions.viewAny');
    Route::post('permissions/sync', [PermissionController::class, 'sync'])->name('permissions.sync')->middleware('can:permissions.sync');
    Route::get('roles', [RoleController::class, 'index'])->name('roles.index')->middleware('can:roles.viewAny');
    Route::get('roles/create', [RoleController::class, 'create'])->name('roles.create')->middleware('can:roles.create');
    Route::post('roles', [RoleController::class, 'store'])->name('roles.store')->middleware('can:roles.create');
    Route::get('roles/{role}/edit', [RoleController::class, 'edit'])->name('roles.edit')->middleware('can:roles.update');
    Route::put('roles/{role}', [RoleController::class, 'update'])->name('roles.update')->middleware('can:roles.update');
    Route::delete('roles/{role}', [RoleController::class, 'destroy'])->name('roles.destroy')->middleware('can:roles.delete');
});
