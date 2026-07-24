<?php

namespace App\Modules\Iam\Http\Controllers;

use App\Modules\Iam\Data\RoleData;
use App\Modules\Iam\Http\Requests\StoreRoleRequest;
use App\Modules\Iam\Http\Requests\UpdateRoleRequest;
use App\Modules\Iam\Models\Role;
use App\Support\Tables\FiltersTableColumns;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Permission;

class RoleController
{
    use FiltersTableColumns;

    public function index(Request $request): Response
    {
        $query = Role::query()->with('permissions');

        $this->applySorting($query, $request, ['name'], 'name');
        $this->applyColumnFilters($query, $request, ['name' => ['type' => 'text']]);

        $roles = $query
            ->paginate($request->integer('per_page', 25))
            ->withQueryString()
            ->through(fn (Role $role) => RoleData::fromModel($role));

        return Inertia::render('Iam::pages/roles/Index', [
            'roles' => $roles,
            'sort' => $request->string('sort')->toString() ?: null,
            'filters' => (object) $request->input('filter', []),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Iam::pages/roles/Form', [
            'role' => null,
            'permissions' => $this->groupedPermissions(),
        ]);
    }

    public function store(StoreRoleRequest $request): RedirectResponse
    {
        $role = Role::create(['name' => (string) $request->string('name'), 'guard_name' => 'web']);
        $role->syncPermissions($request->input('permissions', []));

        return redirect()->route('iam.roles.index');
    }

    public function edit(Role $role): Response
    {
        return Inertia::render('Iam::pages/roles/Form', [
            'role' => RoleData::fromModel($role->load('permissions')),
            'permissions' => $this->groupedPermissions(),
        ]);
    }

    public function update(UpdateRoleRequest $request, Role $role): RedirectResponse
    {
        abort_if($role->name === 'super-admin', 403, 'The super-admin role cannot be modified.');

        $role->update(['name' => (string) $request->string('name')]);
        $role->syncPermissions($request->input('permissions', []));

        return redirect()->route('iam.roles.index');
    }

    public function destroy(Role $role): RedirectResponse
    {
        if ($role->name !== 'super-admin') {
            $role->delete();
        }

        return redirect()->route('iam.roles.index');
    }

    /**
     * @return array<string, array<int,string>>
     */
    private function groupedPermissions(): array
    {
        return Permission::query()
            ->orderBy('name')
            ->pluck('name')
            ->groupBy(fn (string $name) => explode('.', $name)[0])
            ->map(fn ($group) => $group->values()->all())
            ->all();
    }
}
