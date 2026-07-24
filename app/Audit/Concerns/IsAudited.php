<?php

namespace App\Audit\Concerns;

use App\Audit\AuditLogger;
use Illuminate\Database\Eloquent\Model;

/**
 * Auto-captures create/update/delete on the model into the audit log (atomic mode).
 * Hidden attributes are never recorded.
 *
 * @mixin Model
 */
trait IsAudited
{
    public static function bootIsAudited(): void
    {
        static::created(function (Model $model): void {
            /** @var static $model */
            $model->recordAudit('created', [], $model->auditableAttributes($model->getAttributes()));
        });

        static::updated(function (Model $model): void {
            /** @var static $model */
            $changes = $model->auditableAttributes($model->getChanges());

            if ($changes === []) {
                return; // only hidden/timestamp columns changed — nothing meaningful to audit
            }

            $before = array_intersect_key($model->auditableAttributes($model->getOriginal()), $changes);
            $model->recordAudit('updated', $before, $changes);
        });

        static::deleted(function (Model $model): void {
            /** @var static $model */
            $model->recordAudit('deleted', $model->auditableAttributes($model->getAttributes()), []);
        });
    }

    /**
     * @param  array<string,mixed>  $before
     * @param  array<string,mixed>  $after
     */
    public function recordAudit(string $event, array $before, array $after): void
    {
        AuditLogger::atomic()
            ->subject($this->getMorphClass(), $this->getKey())
            ->before($before)
            ->after($after)
            ->event($event)
            ->log(class_basename($this)." {$event}");
    }

    /**
     * Strip hidden attributes (e.g. passwords) and timestamp columns from an attribute array.
     *
     * @param  array<string,mixed>  $attributes
     * @return array<string,mixed>
     */
    public function auditableAttributes(array $attributes): array
    {
        $excluded = $this->getHidden();

        if ($this->usesTimestamps()) {
            // Filter only the timestamp columns (they can be null), never the $hidden list.
            $excluded = array_merge($excluded, array_filter([
                $this->getCreatedAtColumn(),
                $this->getUpdatedAtColumn(),
            ]));
        }

        return array_diff_key($attributes, array_flip($excluded));
    }
}
