<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use Illuminate\Support\Facades\Hash;

class UserAndEmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $admin = User::create([
            'name' => 'Super Admin',
            'email' => 'admin@kurma.group',
            'password' => Hash::make('password123'),
        ]);

        $admin->assignRole('super-admin');

        Employee::create([
            'employee_id' => 'EMP-001',
            'user_id' => $admin->id,
            'first_name' => 'Super',
            'last_name' => 'Admin',
            'email' => 'admin@kurma.group',
            'join_date' => '2023-01-01',
        ]);
    }
}
