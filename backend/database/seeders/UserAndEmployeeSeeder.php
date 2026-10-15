<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Department;
use App\Models\JobPosition;
use App\Models\WorkLocation;
use App\Models\EmployeeAssignment;
use Illuminate\Support\Facades\Hash;

class UserAndEmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     * Hanya membuat akun Super Admin awal. Data karyawan lainnya akan diinput secara riil oleh pengguna.
     */
    public function run(): void
    {
        $defaultPassword = Hash::make('password123');

        $deptHR = Department::where('code', 'HRD')->first();
        $locHQ = WorkLocation::where('code', 'HQ-JKT')->first();
        $posDir = JobPosition::where('code', 'DIR')->first();

        // 1. Akun Super Admin Utama
        $adminUser = User::updateOrCreate(
            ['email' => 'admin@kurma.group'],
            [
                'name' => 'Super Admin',
                'password' => $defaultPassword,
            ]
        );

        $adminUser->syncRoles(['super-admin']);

        // 2. Profil Karyawan Super Admin (agar akun admin dapat mengakses seluruh modul portal & backend dengan lancar)
        $adminEmployee = Employee::updateOrCreate(
            ['employee_id' => 'EMP-001'],
            [
                'user_id' => $adminUser->id,
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'email' => 'admin@kurma.group',
                'phone' => '081234567890',
                'join_date' => '2024-01-01',
                'status' => 'active',
                'employment_type' => 'permanent',
                'basic_salary' => 0,
                'allowances' => 0,
            ]
        );

        if ($deptHR && $posDir && $locHQ) {
            EmployeeAssignment::updateOrCreate(
                [
                    'employee_id' => $adminEmployee->id,
                    'department_id' => $deptHR->id,
                    'job_position_id' => $posDir->id,
                ],
                [
                    'work_location_id' => $locHQ->id,
                    'start_date' => '2024-01-01',
                    'is_primary' => true,
                ]
            );
        }
    }
}
