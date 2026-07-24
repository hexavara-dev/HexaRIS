<?php

namespace App\Audit;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class AuditLogger
{
    private ?string $subjectType = null;

    private int|string|null $subjectId = null;

    private ?string $event = null;

    /** @var array<string,mixed> */
    private array $before = [];

    /** @var array<string,mixed> */
    private array $after = [];

    /** @var array<string,mixed> */
    private array $properties = [];

    private ?Model $causer = null;

    private function __construct(private readonly string $mode) {}

    public static function atomic(): self
    {
        return new self('atomic');
    }

    public static function async(): self
    {
        return new self('async');
    }

    public function subject(string $type, int|string $id): self
    {
        $this->subjectType = $type;
        $this->subjectId = $id;

        return $this;
    }

    /**
     * @param  array<string,mixed>  $before
     */
    public function before(array $before): self
    {
        $this->before = $before;

        return $this;
    }

    /**
     * @param  array<string,mixed>  $after
     */
    public function after(array $after): self
    {
        $this->after = $after;

        return $this;
    }

    public function event(string $event): self
    {
        $this->event = $event;

        return $this;
    }

    public function module(string $module): self
    {
        $this->properties['module'] = $module;

        return $this;
    }

    /**
     * @param  array<string,mixed>  $properties
     */
    public function withProperties(array $properties): self
    {
        $this->properties = array_merge($this->properties, $properties);

        return $this;
    }

    public function by(?Model $causer): self
    {
        $this->causer = $causer;

        return $this;
    }

    public function log(string $description): void
    {
        $causer = $this->causer ?? Auth::user();
        $causerType = $causer instanceof Model ? $causer->getMorphClass() : null;
        $causerId = $causer instanceof Model ? $causer->getKey() : null;

        $payload = [
            'description' => $description,
            'event' => $this->event,
            'subject_type' => $this->subjectType,
            'subject_id' => $this->subjectId,
            'causer_type' => $causerType,
            'causer_id' => $causerId,
            'before' => $this->before,
            'after' => $this->after,
            'properties' => array_merge(['ip' => Request::ip()], $this->properties),
        ];

        if ($this->mode === 'async') {
            WriteAuditLog::dispatch($payload);

            return;
        }

        app(AuditWriter::class)->write($payload);
    }
}
