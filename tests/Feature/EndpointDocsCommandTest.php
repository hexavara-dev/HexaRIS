<?php

it('writes an endpoints markdown doc listing app routes', function () {
    $this->artisan('app:endpoints')->assertSuccessful();

    $path = base_path('docs/endpoints.md');
    expect(file_exists($path))->toBeTrue();
    expect(file_get_contents($path))->toContain('iam.users.index');
});
