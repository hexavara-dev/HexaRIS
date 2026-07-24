<?php

namespace App\Modules\Audit\Data;

use App\Audit\Models\AuditActivity;
use Illuminate\Support\Collection;
use Spatie\LaravelData\Data;

class AuditEntryData extends Data
{
    /**
     * @param  array{old: array<string,mixed>, new: array<string,mixed>}|null  $changes
     * @param  array<string,mixed>  $properties
     */
    public function __construct(
        public int $id,
        public string $description,
        public ?string $event,
        public ?string $subjectType,
        public int|string|null $subjectId,
        public ?string $causer,
        public ?array $changes,
        public array $properties,
        public string $createdAt,
    ) {}

    public static function fromModel(AuditActivity $a): self
    {
        $causerModel = $a->causer;
        $causerName = null;
        if ($causerModel !== null) {
            $causerName = isset($causerModel->name) ? (string) $causerModel->name : null;
        } elseif ($a->causer_id !== null) {
            $causerName = "#{$a->causer_id}";
        }

        return new self(
            id: $a->id,
            description: $a->description,
            event: $a->event,
            subjectType: $a->subject_type,
            subjectId: $a->subject_id,
            causer: $causerName,
            changes: $a->attribute_changes instanceof Collection ? $a->attribute_changes->all() : $a->attribute_changes,
            properties: $a->properties ?? [],
            createdAt: $a->created_at?->toIso8601String() ?? '',
        );
    }
}
