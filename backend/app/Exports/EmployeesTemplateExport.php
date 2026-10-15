<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\ShouldAutoSize;

class EmployeesTemplateExport implements FromArray, WithHeadings, ShouldAutoSize
{
    public function headings(): array
    {
        return [
            'NIK Karyawan',
            'Nama Depan',
            'Nama Belakang',
            'Email',
            'No Telepon',
            'NIK KTP',
            'Departemen',
            'Jabatan',
            'Tipe Kerja',
            'Gaji Pokok',
            'Nama Bank',
            'Nomor Rekening',
            'Nama Pemilik Rekening',
            'Tanggal Masuk',
            'Status'
        ];
    }

    public function array(): array
    {
        return [
            [
                'EMP-101',
                'Fauzan',
                'Ramadhan',
                'fauzan.ramadhan@kurmagroup.co.id',
                '081234567890',
                '3271012345678901',
                'Departemen Herbal',
                'Staff Marketing',
                'permanent',
                5500000,
                'BCA',
                '8820192831',
                'Fauzan Ramadhan',
                '2026-01-15',
                'active'
            ],
            [
                'EMP-102',
                'Aulia',
                'Rahma',
                'aulia.rahma@kurmagroup.co.id',
                '081298765432',
                '3271098765432102',
                'Departemen Fashion MY PH',
                'Staff Copywriter',
                'contract',
                5000000,
                'Mandiri',
                '1370019283712',
                'Aulia Rahma',
                '2026-02-01',
                'active'
            ]
        ];
    }
}
