<?php

namespace App\Audit;

use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class AuditServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(AuditWriter::class);
    }

    public function boot(): void
    {
        Event::subscribe(AuditEventSubscriber::class);
    }
}
