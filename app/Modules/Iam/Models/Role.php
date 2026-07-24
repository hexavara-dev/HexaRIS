<?php

namespace App\Modules\Iam\Models;

use App\Audit\Concerns\IsAudited;
use Spatie\Permission\Models\Role as SpatieRole;

class Role extends SpatieRole
{
    use IsAudited;
}
