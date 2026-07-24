<?php

namespace App\Support\Tables;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

/**
 * Server-side, type-aware, operator-based column filtering for index controllers.
 *
 * URL contract: filter[<field>][<operator>]=value   (e.g. filter[name][contains]=jane)
 * plus a global ?search= handled by {@see applyColumnSearch()}.
 *
 * Security: only declared fields are filterable, operators are validated against the
 * column's type, and column/relation names come from the developer-supplied config
 * (never from the request), so values are always bound, never interpolated.
 *
 * Usage:
 *   $query = User::query()->with('roles');
 *   $this->applySorting($query, $request, ['name', 'email', 'created_at']);
 *   $this->applyColumnSearch($query, $request, ['name', 'email']);
 *   $this->applyColumnFilters($query, $request, [
 *       'name'  => ['type' => 'text'],
 *       'email' => ['type' => 'text'],
 *       'roles' => ['type' => 'select', 'relation' => 'roles', 'relationColumn' => 'name'],
 *   ]);
 */
trait FiltersTableColumns
{
    /**
     * @var array<string, array<int, string>>
     */
    private array $operatorsByType = [
        'text' => ['eq', 'neq', 'contains', 'ncontains', 'in'],
        'number' => ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
        'date' => ['eq', 'neq', 'gt', 'gte', 'lt', 'lte'],
        'select' => ['eq', 'neq', 'in'],
        'boolean' => ['eq', 'neq'],
    ];

    /**
     * @template TModelType of Model
     *
     * @param  Builder<TModelType>  $query
     * @param  array<string, array{type: string, column?: string, relation?: string, relationColumn?: string}>  $config
     */
    protected function applyColumnFilters(Builder $query, Request $request, array $config): void
    {
        $filters = $request->input('filter', []);

        if (! is_array($filters)) {
            return;
        }

        foreach ($filters as $field => $conditions) {
            if (! isset($config[$field]) || ! is_array($conditions)) {
                continue;
            }

            $cfg = $config[$field];

            foreach ($conditions as $operator => $value) {
                if ($value === null || $value === '' || ! $this->isValidOperator($cfg['type'], (string) $operator)) {
                    continue;
                }

                if (isset($cfg['relation'])) {
                    $relationColumn = $cfg['relationColumn'] ?? $field;
                    $query->whereHas($cfg['relation'], fn ($q) => $this->applyOperator($q, $relationColumn, (string) $operator, $value, $cfg['type']));
                } else {
                    $this->applyOperator($query, $cfg['column'] ?? $field, (string) $operator, $value, $cfg['type']);
                }
            }
        }
    }

    /**
     * Apply sorting from the `?sort=` param (leading `-` = descending), whitelisted.
     *
     * @template TModelType of Model
     *
     * @param  Builder<TModelType>  $query
     * @param  array<int, string>  $allowed
     */
    protected function applySorting(Builder $query, Request $request, array $allowed, string $default = '-created_at'): void
    {
        $sort = $request->string('sort')->toString() ?: $default;
        $column = ltrim($sort, '-');

        if (! in_array($column, $allowed, true)) {
            $sort = $default;
            $column = ltrim($sort, '-');
        }

        $query->orderBy($column, str_starts_with($sort, '-') ? 'desc' : 'asc');
    }

    /**
     * @template TModelType of Model
     *
     * @param  Builder<TModelType>  $query
     * @param  array<int, string>  $columns
     */
    protected function applyColumnSearch(Builder $query, Request $request, array $columns): void
    {
        $search = $request->string('search')->toString();

        if ($search === '' || $columns === []) {
            return;
        }

        $query->where(function ($q) use ($search, $columns): void {
            foreach ($columns as $column) {
                $q->orWhere($column, 'like', "%{$search}%");
            }
        });
    }

    private function isValidOperator(string $type, string $operator): bool
    {
        return in_array($operator, $this->operatorsByType[$type] ?? [], true);
    }

    /**
     * @template TModelType of Model
     *
     * @param  Builder<TModelType>  $query
     */
    private function applyOperator(Builder $query, string $column, string $operator, mixed $value, string $type): void
    {
        if ($type === 'date' && is_string($value)) {
            $value = date('Y-m-d', strtotime($value) ?: time());
        }

        match ($operator) {
            'eq' => $query->where($column, '=', $value),
            'neq' => $query->where($column, '!=', $value),
            'contains' => $query->where($column, 'like', "%{$value}%"),
            'ncontains' => $query->where($column, 'not like', "%{$value}%"),
            'in' => $query->whereIn($column, is_array($value) ? $value : explode(',', (string) $value)),
            'gt' => $query->where($column, '>', $value),
            'gte' => $query->where($column, '>=', $value),
            'lt' => $query->where($column, '<', $value),
            'lte' => $query->where($column, '<=', $value),
            default => null,
        };
    }
}
