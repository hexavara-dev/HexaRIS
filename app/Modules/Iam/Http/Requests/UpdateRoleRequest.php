<?php

namespace App\Modules\Iam\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateRoleRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // route middleware enforces can:roles.update
    }

    /**
     * @return array<string,mixed>
     */
    public function rules(): array
    {
        $roleId = $this->route('role');

        return [
            'name' => ['required', 'string', 'max:255', Rule::unique('roles', 'name')->ignore($roleId)],
            'permissions' => ['sometimes', 'array'],
            'permissions.*' => ['string', 'exists:permissions,name'],
        ];
    }
}
