<?php

namespace App\Exports;

use App\Models\Employee;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class EmployeesExport implements FromCollection, WithHeadings, WithMapping
{
    public function collection()
    {
        return Employee::with(['currentAssignment.department', 'currentAssignment.jobPosition'])->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'NIK',
            'First Name',
            'Last Name',
            'Email',
            'Phone',
            'Join Date',
            'Status',
            'Department',
            'Job Position'
        ];
    }

    public function map($employee): array
    {
        return [
            $employee->id,
            $employee->employee_id,
            $employee->first_name,
            $employee->last_name,
            $employee->email,
            $employee->phone,
            $employee->join_date,
            $employee->status,
            $employee->currentAssignment->department->name ?? '-',
            $employee->currentAssignment->jobPosition->name ?? '-',
        ];
    }
}
