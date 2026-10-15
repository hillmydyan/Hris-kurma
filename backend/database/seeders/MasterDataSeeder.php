<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Department;
use App\Models\JobPosition;
use App\Models\WorkLocation;

class MasterDataSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // 4 Official Kurma Group Departments
        $deptHerbal = Department::updateOrCreate(
            ['code' => 'HRB'],
            ['name' => 'Departemen Herbal']
        );

        $deptFashion = Department::updateOrCreate(
            ['code' => 'FSH'],
            ['name' => 'Departemen Fashion MY PH']
        );

        $deptShopee = Department::updateOrCreate(
            ['code' => 'SPV'],
            ['name' => 'Departemen Shopee Video']
        );

        $deptHR = Department::updateOrCreate(
            ['code' => 'HRD'],
            ['name' => 'Departemen HR & Operasional']
        );

        // Job Positions
        $positions = [
            // Management & Leadership
            ['code' => 'DIR', 'name' => 'Direktur / Management', 'level' => 10],
            ['code' => 'HR-HEAD', 'name' => 'Kepala HR / HR Manager', 'level' => 6],
            ['code' => 'MGR', 'name' => 'Manager Departemen', 'level' => 5],
            ['code' => 'MGR-OPS', 'name' => 'Manager Operasional', 'level' => 5],

            // Herbal & Fashion Roles
            ['code' => 'STF-MKT', 'name' => 'Staff Marketing', 'level' => 2],
            ['code' => 'STF-RST', 'name' => 'Staff Riset', 'level' => 2],
            ['code' => 'STF-CPW', 'name' => 'Staff Copywriter', 'level' => 2],

            // Shopee Video Roles
            ['code' => 'STF-IKL', 'name' => 'Staff Iklan', 'level' => 2],

            // HR & Support Roles
            ['code' => 'STF-HR', 'name' => 'Staff HR', 'level' => 2],
            ['code' => 'STF-FIN', 'name' => 'Staff Finance', 'level' => 2],
            ['code' => 'STF-IT', 'name' => 'Staff IT', 'level' => 2],
            ['code' => 'STF-DAT', 'name' => 'Staff Data', 'level' => 2],
            ['code' => 'STF-SUP', 'name' => 'Staff Support', 'level' => 2],
            ['code' => 'STF-OPS', 'name' => 'Staff Operasional', 'level' => 2],
        ];

        foreach ($positions as $pos) {
            JobPosition::updateOrCreate(
                ['code' => $pos['code']],
                ['name' => $pos['name'], 'level' => $pos['level']]
            );
        }

        // Office Work Locations
        WorkLocation::updateOrCreate(
            ['code' => 'HQ-JKT'],
            [
                'name' => 'Kantor Pusat Kurma Group (Jakarta)',
                'address' => 'Gedung Kurma Group Lt. 5, Jl. Rasuna Said Kav. 8, Jakarta Selatan',
                'latitude' => '-6.2250',
                'longitude' => '106.8000',
                'radius_meters' => 100,
            ]
        );

        WorkLocation::updateOrCreate(
            ['code' => 'STUDIO-SPV'],
            [
                'name' => 'Studio Kreatif Shopee Video',
                'address' => 'Creative Hub Kurma, Jl. Kemang Raya No. 12, Jakarta Selatan',
                'latitude' => '-6.2750',
                'longitude' => '106.8150',
                'radius_meters' => 100,
            ]
        );
    }
}
