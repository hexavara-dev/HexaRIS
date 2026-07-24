<?php

namespace App\Modules\Iam\Data;

use Spatie\LaravelData\Data;
use Spatie\Permission\Models\Role;

class RoleData extends Data
{
    /**
     * @param  array<int,string>  $permissions
     */
    public function __construct(
        public int $id,
        public string $name,
        public array $permissions,
    ) {}

    public static function fromModel(Role $role): self
    {
        return new self(
            id: $role->id,
            name: $role->name,
            permissions: $role->permissions->pluck('name')->all(),
        );
    }
}
