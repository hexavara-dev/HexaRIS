<?php

namespace App\Support\Docs;

use Illuminate\Foundation\Http\FormRequest;
use ReflectionMethod;
use ReflectionNamedType;
use Throwable;

class FormRequestInspector
{
    /**
     * @return array{pathParams: array<int, string>, body: array<string, array{rules: array<int, string>, required: bool}>|null}
     */
    public function forAction(string $action, string $uri): array
    {
        return [
            'pathParams' => $this->pathParams($uri),
            'body' => $this->body($action),
        ];
    }

    /**
     * @return array<int, string>
     */
    private function pathParams(string $uri): array
    {
        preg_match_all('/\{(\w+)\??\}/', $uri, $matches);

        return $matches[1];
    }

    /**
     * @return array<string, array{rules: array<int, string>, required: bool}>|null
     */
    private function body(string $action): ?array
    {
        $class = $this->resolveFormRequestClass($action);

        if ($class === null) {
            return null;
        }

        try {
            $instance = new $class;
            $rules = method_exists($instance, 'rules') ? $instance->rules() : [];
        } catch (Throwable) {
            return null; // best-effort: rules() may depend on a real request
        }

        $fields = [];

        foreach ($rules as $field => $ruleSet) {
            $normalized = $this->normalizeRules($ruleSet);
            $fields[$field] = [
                'rules' => $normalized,
                'required' => in_array('required', $normalized, true),
            ];
        }

        return $fields;
    }

    private function resolveFormRequestClass(string $action): ?string
    {
        if (! str_contains($action, '@')) {
            return null;
        }

        [$class, $method] = explode('@', $action, 2);

        if (! class_exists($class) || ! method_exists($class, $method)) {
            return null;
        }

        foreach ((new ReflectionMethod($class, $method))->getParameters() as $param) {
            $type = $param->getType();

            if ($type instanceof ReflectionNamedType && ! $type->isBuiltin()
                && is_subclass_of($type->getName(), FormRequest::class)) {
                return $type->getName();
            }
        }

        return null;
    }

    /**
     * @param  mixed  $ruleSet
     * @return array<int, string>
     */
    private function normalizeRules($ruleSet): array
    {
        $items = is_array($ruleSet) ? $ruleSet : explode('|', (string) $ruleSet);

        return array_values(array_map(function ($rule): string {
            if (is_string($rule)) {
                return $rule;
            }

            if (is_object($rule) && method_exists($rule, '__toString')) {
                return (string) $rule;
            }

            return is_object($rule) ? class_basename($rule) : (string) $rule;
        }, $items));
    }
}
