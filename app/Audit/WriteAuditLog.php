<?php

namespace App\Audit;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

class WriteAuditLog implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    /**
     * @param  array<string,mixed>  $payload
     */
    public function __construct(public readonly array $payload) {}

    public function handle(AuditWriter $writer): void
    {
        $writer->write($this->payload);
    }
}
