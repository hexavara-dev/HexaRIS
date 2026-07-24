<?php

namespace App\Modular;

use Illuminate\Support\Collection;

class ModuleRegistry
{
    /** @var Collection<int,Module>|null */
    private ?Collection $modules = null;

    public function __construct(private readonly string $basePath) {}

    /**
     * @return Collection<int,Module>
     */
    public function all(): Collection
    {
        return $this->modules ??= $this->discover();
    }

    public function find(string $alias): ?Module
    {
        return $this->all()->firstWhere('alias', $alias);
    }

    /**
     * @return Collection<int,Module>
     */
    private function discover(): Collection
    {
        if (! is_dir($this->basePath)) {
            return collect();
        }

        return collect(glob($this->basePath.'/*/module.json') ?: [])
            ->map(function (string $manifestPath): Module {
                /** @var array<string,mixed> $data */
                $data = json_decode((string) file_get_contents($manifestPath), true) ?? [];

                return Module::fromManifest($data, dirname($manifestPath));
            })
            ->values();
    }
}
