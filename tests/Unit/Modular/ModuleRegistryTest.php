<?php

use App\Modular\ModuleRegistry;

beforeEach(function () {
    $this->base = sys_get_temp_dir().'/modular-test-'.uniqid();
    mkdir($this->base.'/Blog', 0777, true);
    file_put_contents($this->base.'/Blog/module.json', json_encode([
        'name' => 'Blog',
        'alias' => 'blog',
        'version' => '1.0.0',
    ]));
});

afterEach(function () {
    exec('rm -rf '.escapeshellarg($this->base));
});

it('discovers modules from manifests', function () {
    $registry = new ModuleRegistry($this->base);

    expect($registry->all())->toHaveCount(1)
        ->and($registry->find('blog')?->name)->toBe('Blog');
});

it('returns an empty collection when the base path is missing', function () {
    expect((new ModuleRegistry('/no/such/path'))->all())->toBeEmpty();
});
