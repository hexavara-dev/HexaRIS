<?php

namespace App\Modules\Iam\Data;

use App\Models\User;
use Spatie\LaravelData\Data;

class UserData extends Data
{
    /**
     * @param  array<int,string>  $roles
     */
    public function __construct(
        public int $id,
        public string $name,
        public string $email,
        public array $roles,
        public string $createdAt,
    ) {}

    public static function fromModel(User $user): self
    {
        return new self(
            id: $user->id,
            name: $user->name,
            email: $user->email,
            roles: $user->roles->pluck('name')->all(),
            createdAt: $user->created_at?->toIso8601String() ?? '',
        );
    }
}
