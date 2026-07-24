<?php

namespace App\Modular;

use InvalidArgumentException;

final class Module
{
    /**
     * @param  array<int,string>  $dependencies
     */
    public function __construct(
        public readonly string $name,
        public readonly string $alias,
        public readonly string $version,
        public readonly string $description,
        public readonly array $dependencies,
        public readonly string $path,
    ) {}

    /**
     * @param  array<string,mixed>  $data
     */
    public static function fromManifest(array $data, string $path): self
    {
        foreach (['name', 'alias', 'version'] as $key) {
            if (empty($data[$key])) {
                throw new InvalidArgumentException("Module manifest at {$path} is missing required key: {$key}");
            }
        }

        return new self(
            name: $data['name'],
            alias: $data['alias'],
            version: $data['version'],
            description: $data['description'] ?? '',
            dependencies: $data['dependencies'] ?? [],
            path: $path,
        );
    }

    public function namespace(): string
    {
        return "App\\Modules\\{$this->name}";
    }

    public function providerClass(): string
    {
        return $this->namespace()."\\Providers\\{$this->name}ServiceProvider";
    }

    public function path(string $append = ''): string
    {
        return $append === '' ? $this->path : $this->path.'/'.ltrim($append, '/');
    }
}
