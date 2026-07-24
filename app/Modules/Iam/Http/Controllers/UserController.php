<?php

namespace App\Modules\Iam\Http\Controllers;

use App\Models\User;
use App\Modules\Iam\Data\UserData;
use App\Modules\Iam\Http\Requests\StoreUserRequest;
use App\Modules\Iam\Http\Requests\UpdateUserRequest;
use App\Support\Tables\FiltersTableColumns;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Spatie\Permission\Models\Role;

class UserController
{
    use FiltersTableColumns;

    public function index(Request $request): Response
    {
        $query = User::query()->with('roles');

        $this->applySorting($query, $request, ['name', 'email', 'created_at']);
        $this->applyColumnSearch($query, $request, ['name', 'email']);
        $this->applyColumnFilters($query, $request, [
            'name' => ['type' => 'text'],
            'email' => ['type' => 'text'],
            'roles' => ['type' => 'select', 'relation' => 'roles', 'relationColumn' => 'name'],
        ]);

        $users = $query
            ->paginate($request->integer('per_page', 25))
            ->withQueryString()
            ->through(fn (User $user) => UserData::fromModel($user));

        return Inertia::render('Iam::pages/users/Index', [
            'users' => $users,
            'sort' => $request->string('sort')->toString() ?: null,
            'filters' => (object) $request->input('filter', []),
            'search' => $request->string('search')->toString(),
            'roleOptions' => Role::query()->orderBy('name')->pluck('name')->map(fn (string $name) => ['value' => $name, 'label' => $name]),
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('Iam::pages/users/Form', [
            'user' => null,
            'roles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function store(StoreUserRequest $request): RedirectResponse
    {
        $user = User::create($request->safe()->only(['name', 'email', 'password']));
        $user->syncRoles($request->input('roles', []));

        return redirect()->route('iam.users.index');
    }

    public function edit(User $user): Response
    {
        return Inertia::render('Iam::pages/users/Form', [
            'user' => UserData::fromModel($user->load('roles')),
            'roles' => Role::query()->orderBy('name')->pluck('name'),
        ]);
    }

    public function update(UpdateUserRequest $request, User $user): RedirectResponse
    {
        $user->update($request->safe()->only(['name', 'email']));

        if ($request->filled('password')) {
            $user->update(['password' => (string) $request->string('password')]);
        }

        $user->syncRoles($request->input('roles', []));

        return redirect()->route('iam.users.index');
    }

    public function destroy(Request $request, User $user): RedirectResponse
    {
        if ($request->user()?->is($user)) {
            return redirect()->route('iam.users.index')->with('error', 'You cannot delete your own account.');
        }

        $user->delete();

        return redirect()->route('iam.users.index');
    }
}
