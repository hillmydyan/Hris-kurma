<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class PayrollAndRecruitmentSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        \App\Models\PayrollPeriod::create([
            'name' => 'September 2026',
            'start_date' => '2026-09-01',
            'end_date' => '2026-09-30',
            'pay_date' => '2026-09-25',
            'status' => 'paid',
            'paid_at' => '2026-09-25 09:00:00'
        ]);

        \App\Models\PayrollPeriod::create([
            'name' => 'Oktober 2026',
            'start_date' => '2026-10-01',
            'end_date' => '2026-10-31',
            'pay_date' => '2026-10-25',
            'status' => 'draft'
        ]);
        
        $dept = \App\Models\Department::first();
        if ($dept) {
            \App\Models\JobOpening::create([
                'department_id' => $dept->id,
                'headcount' => 2,
                'description' => 'Staff Marketing untuk Herbal',
                'status' => 'open'
            ]);
            \App\Models\JobOpening::create([
                'department_id' => $dept->id,
                'headcount' => 1,
                'description' => 'Copywriter',
                'status' => 'open'
            ]);
        }
    }
}
