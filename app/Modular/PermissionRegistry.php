<?php

namespace App\Modular;

class PermissionRegistry
{
    /** @var array<int,string> */
    private array $permissions = [];

    public static function fromModules(ModuleRegistry $registry): self
    {
        $instance = new self;

        foreach ($registry->all() as $module) {
            $file = $module->path('permissions.php');
            if (is_file($file)) {
                /** @var array<int,string> $declared */
                $declared = require $file;
                $instance->add($declared);
            }
        }

        return $instance;
    }

    /**
     * @param  array<int,string>  $permissions
     */
    public function add(array $permissions): void
    {
        foreach ($permissions as $permission) {
            $this->permissions[] = $permission;
        }
    }

    /**
     * @return array<int,string>
     */
    public function all(): array
    {
        return array_values(array_unique($this->permissions));
    }

    public static function isValidName(string $name): bool
    {
        return (bool) preg_match('/^[a-z][a-z0-9_]*\.[a-zA-Z][a-zA-Z0-9]*$/', $name);
    }
}
