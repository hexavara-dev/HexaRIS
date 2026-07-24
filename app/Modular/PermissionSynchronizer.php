<?php

namespace App\Modular;

use Spatie\Permission\Models\Permission;

final class PermissionSynchronizer
{
    public function __construct(private readonly PermissionRegistry $registry) {}

    /**
     * @return array{declared: int, created: int, invalid: array<int, string>}
     */
    public function sync(bool $prune = false): array
    {
        $declared = $this->registry->all();

        $invalid = array_values(array_filter(
            $declared,
            fn (string $name): bool => ! PermissionRegistry::isValidName($name),
        ));

        if ($invalid !== []) {
            return ['declared' => count($declared), 'created' => 0, 'invalid' => $invalid];
        }

        $existing = Permission::query()->pluck('name')->all();
        $created = 0;

        foreach ($declared as $name) {
            if (! in_array($name, $existing, true)) {
                $created++;
            }
            Permission::findOrCreate($name, 'web');
        }

        if ($prune) {
            Permission::whereNotIn('name', $declared)->delete();
        }

        return ['declared' => count($declared), 'created' => $created, 'invalid' => []];
    }
}
