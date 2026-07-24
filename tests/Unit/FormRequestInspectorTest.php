<?php

use App\Support\Docs\FormRequestInspector;
use Tests\TestCase;

uses(TestCase::class);

function inspect(string $action, string $uri): array
{
    return app(FormRequestInspector::class)->forAction($action, $uri);
}

const USER_CTRL = 'App\Modules\Iam\Http\Controllers\UserController';

it('extracts FormRequest body fields with rules and a required flag', function () {
    $result = inspect(USER_CTRL.'@store', 'users');

    expect($result['body'])->toBeArray()
        ->and($result['body']['name']['required'])->toBeTrue()
        ->and($result['body']['email']['rules'])->toContain('email')
        ->and($result['body']['password']['required'])->toBeTrue();
});

it('resolves a FormRequest whose rules() reads the route without throwing', function () {
    $result = inspect(USER_CTRL.'@update', 'users/{user}');

    expect($result['body'])->toHaveKey('email')
        ->and(collect($result['body']['email']['rules'])->implode(' '))->toContain('unique');
});

it('returns a null body for actions without a FormRequest', function () {
    $result = inspect(USER_CTRL.'@index', 'users');

    expect($result['body'])->toBeNull();
});

it('detects path parameters from the URI', function () {
    expect(inspect(USER_CTRL.'@edit', 'users/{user}/edit')['pathParams'])->toContain('user')
        ->and(inspect(USER_CTRL.'@index', 'users')['pathParams'])->toBe([]);
});

it('returns null body and empty params for a Closure/invalid action', function () {
    $result = inspect('Closure', 'docs/routes');

    expect($result['body'])->toBeNull()
        ->and($result['pathParams'])->toBe([]);
});
