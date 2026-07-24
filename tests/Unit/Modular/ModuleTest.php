<?php

use App\Modular\Module;

it('builds a module from a manifest', function () {
    $module = Module::fromManifest([
        'name' => 'Blog',
        'alias' => 'blog',
        'version' => '1.2.0',
        'description' => 'Blog module',
        'dependencies' => ['users'],
    ], '/tmp/Blog');

    expect($module->name)->toBe('Blog')
        ->and($module->alias)->toBe('blog')
        ->and($module->version)->toBe('1.2.0')
        ->and($module->dependencies)->toBe(['users'])
        ->and($module->namespace())->toBe('App\\Modules\\Blog')
        ->and($module->providerClass())->toBe('App\\Modules\\Blog\\Providers\\BlogServiceProvider')
        ->and($module->path('routes/web.php'))->toBe('/tmp/Blog/routes/web.php');
});

it('throws when a required manifest key is missing', function () {
    Module::fromManifest(['alias' => 'blog'], '/tmp/Blog');
})->throws(InvalidArgumentException::class);
