<?php

namespace App\Audit;

use Illuminate\Auth\Events\Failed;
use Illuminate\Auth\Events\Login;
use Illuminate\Auth\Events\Logout;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Events\Dispatcher;

class AuditEventSubscriber
{
    public function handleLogin(Login $event): void
    {
        $user = $event->user instanceof Model ? $event->user : null;

        AuditLogger::async()->event('auth.login')->by($user)->log('User logged in');
    }

    public function handleLogout(Logout $event): void
    {
        $user = $event->user instanceof Model ? $event->user : null;

        AuditLogger::async()->event('auth.logout')->by($user)->log('User logged out');
    }

    public function handleFailed(Failed $event): void
    {
        AuditLogger::async()
            ->event('auth.failed')
            ->withProperties(['email' => $event->credentials['email'] ?? null])
            ->log('Failed login attempt');
    }

    public function subscribe(Dispatcher $events): void
    {
        $events->listen(Login::class, [self::class, 'handleLogin']);
        $events->listen(Logout::class, [self::class, 'handleLogout']);
        $events->listen(Failed::class, [self::class, 'handleFailed']);
    }
}
