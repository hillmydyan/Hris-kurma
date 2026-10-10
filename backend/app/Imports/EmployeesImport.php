<?php

namespace App\Imports;

use App\Models\Employee;
use Maatwebsite\Excel\Concerns\ToModel;
use Maatwebsite\Excel\Concerns\WithHeadingRow;

class EmployeesImport implements ToModel, WithHeadingRow
{
    public function model(array $row)
    {
        return new Employee([
            'employee_id' => $row['nik'],
            'first_name'  => $row['first_name'],
            'last_name'   => $row['last_name'] ?? null,
            'email'       => $row['email'],
            'phone'       => $row['phone'] ?? null,
            'join_date'   => $row['join_date'] ?? now(),
            'status'      => 'active',
        ]);
        // NOTE: A more complex logic would be needed to handle User creation and assignments,
        // but this covers the basic import for now.
    }
}
