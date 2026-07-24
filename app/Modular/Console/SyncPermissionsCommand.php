<?php

namespace App\Modular\Console;

use App\Modular\PermissionSynchronizer;
use Illuminate\Console\Command;

class SyncPermissionsCommand extends Command
{
    protected $signature = 'permission:sync {--prune : Delete permissions no longer declared by any module}';

    protected $description = 'Sync module-declared permissions into the database';

    public function handle(PermissionSynchronizer $synchronizer): int
    {
        $result = $synchronizer->sync((bool) $this->option('prune'));

        if ($result['invalid'] !== []) {
            $this->error('Invalid permission names (expected <resource>.<action>): '.implode(', ', $result['invalid']));

            return self::FAILURE;
        }

        $this->info("{$result['declared']} permissions synced ({$result['created']} new).");

        return self::SUCCESS;
    }
}
