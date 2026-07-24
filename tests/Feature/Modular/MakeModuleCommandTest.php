<?php

use Illuminate\Support\Facades\File;

afterEach(function () {
    File::deleteDirectory(app_path('Modules/Sample'));
});

it('scaffolds a self-contained module skeleton', function () {
    File::deleteDirectory(app_path('Modules/Sample'));

    $this->artisan('module:make', ['name' => 'sample'])->assertSuccessful();

    $base = app_path('Modules/Sample');

    expect(File::exists("{$base}/module.json"))->toBeTrue()
        ->and(File::exists("{$base}/README.md"))->toBeTrue()
        ->and(File::exists("{$base}/Providers/SampleServiceProvider.php"))->toBeTrue()
        ->and(File::exists("{$base}/routes/web.php"))->toBeTrue()
        ->and(File::exists("{$base}/routes/api.php"))->toBeTrue()
        ->and(File::exists("{$base}/permissions.php"))->toBeTrue()
        ->and(File::isDirectory("{$base}/resources/js/pages"))->toBeTrue()
        ->and(File::isDirectory("{$base}/Database/Migrations"))->toBeTrue();

    $manifest = json_decode(File::get("{$base}/module.json"), true);
    expect($manifest['name'])->toBe('Sample')
        ->and($manifest['alias'])->toBe('sample');
});

it('refuses to overwrite an existing module', function () {
    $this->artisan('module:make', ['name' => 'Sample'])->assertSuccessful();
    $this->artisan('module:make', ['name' => 'Sample'])->assertFailed();
});

it('generates pint-clean route stubs without unused imports', function () {
    $this->artisan('module:make', ['name' => 'Sample'])->assertSuccessful();

    $web = File::get(app_path('Modules/Sample/routes/web.php'));
    $api = File::get(app_path('Modules/Sample/routes/api.php'));

    expect($web)->not->toContain('use Illuminate\\Support\\Facades\\Route;')
        ->and($api)->not->toContain('use Illuminate\\Support\\Facades\\Route;');
});
