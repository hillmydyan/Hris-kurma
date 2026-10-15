<?php

namespace App\Exports;

use App\Models\Employee;
use Maatwebsite\Excel\Concerns\FromCollection;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithMapping;

class EmployeesExport implements FromCollection, WithHeadings, WithMapping, \Maatwebsite\Excel\Concerns\ShouldAutoSize
{
    public function collection()
    {
        return Employee::with(['currentAssignment.department', 'currentAssignment.jobPosition', 'user'])->get();
    }

    public function headings(): array
    {
        return [
            'ID',
            'NIK Karyawan',
            'NIK KTP',
            'Nama Depan',
            'Nama Belakang',
            'Nama Lengkap',
            'Email',
            'No Telepon',
            'Departemen',
            'Jabatan',
            'Tipe Kerja',
            'Status',
            'Gaji Pokok (Rp)',
            'Nama Bank',
            'Nomor Rekening',
            'Nama Pemilik Rekening',
            'Tanggal Masuk'
        ];
    }

    public function map($employee): array
    {
        return [
            $employee->id,
            $employee->employee_id,
            $employee->nik ?? '-',
            $employee->first_name,
            $employee->last_name ?? '',
            $employee->full_name,
            $employee->email,
            $employee->phone ?? '-',
            $employee->currentAssignment?->department?->name ?? 'Umum',
            $employee->currentAssignment?->jobPosition?->name ?? 'Staff',
            $employee->employment_type ?? 'permanent',
            $employee->status,
            $employee->basic_salary ?? 0,
            $employee->bank_name ?? 'BCA',
            $employee->bank_account_number ?? '-',
            $employee->bank_account_holder ?? $employee->full_name,
            $employee->join_date ? date('Y-m-d', strtotime($employee->join_date)) : '-',
        ];
    }
}
