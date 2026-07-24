<?php

use App\Audit\AuditServiceProvider;
use App\Modular\ModuleServiceProvider;
use App\Providers\AppServiceProvider;

return [
    AppServiceProvider::class,
    ModuleServiceProvider::class,
    AuditServiceProvider::class,
];
