<?php

namespace App\Support\Docs;

use Illuminate\Routing\Route;
use Illuminate\Routing\Router;

class RouteInventory
{
    public function __construct(private readonly Router $router) {}

    /**
     * @return array<int, array{methods: string, uri: string, name: ?string, permission: ?string, action: string}>
     */
    public function entries(): array
    {
        $entries = [];

        foreach ($this->router->getRoutes()->getRoutes() as $route) {
            $action = $route->getActionName();

            if (! str_starts_with($action, 'App\\')) {
                continue; // app routes only — drops Scramble, Ignition, storage, etc.
            }

            $entries[] = [
                'methods' => implode('|', array_values(array_diff($route->methods(), ['HEAD']))),
                'uri' => $route->uri(),
                'name' => $route->getName(),
                'permission' => $this->permissionFrom($route),
                'action' => $action,
            ];
        }

        usort($entries, fn ($a, $b) => $a['uri'] <=> $b['uri']);

        return $entries;
    }

    private function permissionFrom(Route $route): ?string
    {
        foreach ($route->gatherMiddleware() as $middleware) {
            if (is_string($middleware) && str_starts_with($middleware, 'can:')) {
                return explode(',', substr($middleware, 4))[0];
            }
        }

        return null;
    }
}
