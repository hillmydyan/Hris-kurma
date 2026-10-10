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
        Department::create(['code' => 'DIR', 'name' => 'Direksi']);
        Department::create(['code' => 'HR', 'name' => 'Human Resources']);
        Department::create(['code' => 'IT', 'name' => 'Information Technology']);
        Department::create(['code' => 'FIN', 'name' => 'Finance']);

        JobPosition::create(['code' => 'CEO', 'name' => 'Chief Executive Officer', 'level' => 10]);
        JobPosition::create(['code' => 'MGR', 'name' => 'Manager', 'level' => 5]);
        JobPosition::create(['code' => 'STF', 'name' => 'Staff', 'level' => 1]);

        WorkLocation::create([
            'code' => 'HQ',
            'name' => 'Headquarters Jakarta',
            'address' => 'Jl. Sudirman No. 1, Jakarta',
            'latitude' => '-6.2250',
            'longitude' => '106.8000',
            'radius_meters' => 100
        ]);
    }
}
