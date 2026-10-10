<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $roles = [
            'super-admin',
            'hr-manager',
            'hr-staff',
            'dept-head',
            'employee',
            'finance-staff',
            'management'
        ];

        foreach ($roles as $role) {
            Role::create(['name' => $role]);
        }
    }
}
