<?php

namespace App\Imports;

use App\Models\Employee;
use App\Models\User;
use App\Models\Department;
use App\Models\JobPosition;
use App\Models\WorkLocation;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Maatwebsite\Excel\Concerns\ToCollection;
use Maatwebsite\Excel\Concerns\WithHeadingRow;
use Maatwebsite\Excel\Concerns\SkipsEmptyRows;
use Maatwebsite\Excel\Concerns\WithCalculatedFormulas;

class EmployeesImport implements ToCollection, WithHeadingRow, SkipsEmptyRows, WithCalculatedFormulas
{
    protected int $rowCount = 0;

    public function collection(Collection $rows)
    {
        $defaultLocation = WorkLocation::first();
        $locationId = $defaultLocation ? $defaultLocation->id : 1;

        $allDepartments = Department::all();
        $allPositions = JobPosition::all();

        foreach ($rows as $row) {
            // Normalize row array keys
            $r = [];
            foreach ($row as $k => $v) {
                $cleanKey = strtolower(trim(str_replace([' ', '-', '.'], '_', (string)$k)));
                $r[$cleanKey] = is_string($v) ? trim($v) : $v;
            }

            // Extract employee_id & email
            $employeeId = $r['nik_karyawan'] ?? $r['employee_id'] ?? $r['id_karyawan'] ?? $r['nik'] ?? null;
            $email = $r['email'] ?? null;

            if (empty($email)) {
                continue; // Email is mandatory
            }

            if (empty($employeeId)) {
                $employeeId = 'EMP-' . str_pad((string)(Employee::count() + 1), 3, '0', STR_PAD_LEFT);
            }

            // Name resolution
            $firstName = $r['nama_depan'] ?? $r['first_name'] ?? $r['nama'] ?? $r['name'] ?? 'Karyawan';
            $lastName = $r['nama_belakang'] ?? $r['last_name'] ?? '';

            if (empty($lastName) && str_contains($firstName, ' ')) {
                $parts = explode(' ', $firstName, 2);
                $firstName = $parts[0];
                $lastName = $parts[1] ?? '';
            }

            $fullName = trim($firstName . ' ' . $lastName);

            // Department resolution
            $deptName = $r['departemen'] ?? $r['department'] ?? null;
            $department = null;
            if ($deptName) {
                $department = $allDepartments->first(function ($d) use ($deptName) {
                    return strcasecmp($d->name, $deptName) === 0 || strcasecmp($d->code, $deptName) === 0 || stripos($d->name, $deptName) !== false;
                });
            }
            if (!$department) {
                $department = $allDepartments->first();
            }

            // Job Position resolution
            $posName = $r['jabatan'] ?? $r['job_position'] ?? $r['position'] ?? null;
            $position = null;
            if ($posName) {
                $position = $allPositions->first(function ($p) use ($posName) {
                    return strcasecmp($p->name, $posName) === 0 || strcasecmp($p->code, $posName) === 0 || stripos($p->name, $posName) !== false;
                });
            }
            if (!$position) {
                $position = $allPositions->first();
            }

            // Salary & Bank Details
            $rawSalary = $r['gaji_pokok'] ?? $r['basic_salary'] ?? $r['gaji'] ?? 0;
            $basicSalary = (float)preg_replace('/[^0-9.]/', '', (string)$rawSalary);

            $bankName = $r['nama_bank'] ?? $r['bank_name'] ?? $r['bank'] ?? 'BCA';
            $bankAccNo = $r['nomor_rekening'] ?? $r['no_rekening'] ?? $r['bank_account_number'] ?? null;
            $bankHolder = $r['nama_pemilik_rekening'] ?? $r['pemilik_rekening'] ?? $r['bank_account_holder'] ?? $fullName;

            // Dates & Status
            $joinDate = $r['tanggal_masuk'] ?? $r['join_date'] ?? date('Y-m-d');
            if (is_numeric($joinDate)) {
                // Excel serialized timestamp conversion if needed
                $joinDate = date('Y-m-d', \PhpOffice\PhpSpreadsheet\Shared\Date::excelToTimestamp($joinDate));
            }

            $status = in_array(strtolower($r['status'] ?? ''), ['inactive', 'nonaktif', 'resign']) ? 'inactive' : 'active';
            $employmentType = in_array(strtolower($r['tipe_kerja'] ?? $r['employment_type'] ?? ''), ['contract', 'kontrak']) ? 'contract' : 'permanent';
            $nikKtp = $r['nik_ktp'] ?? $r['nik'] ?? null;
            $phone = $r['no_telepon'] ?? $r['telepon'] ?? $r['phone'] ?? null;

            DB::transaction(function () use (
                $employeeId, $email, $firstName, $lastName, $fullName, $phone, $nikKtp,
                $joinDate, $status, $employmentType, $basicSalary, $bankName, $bankAccNo, $bankHolder,
                $department, $position, $locationId
            ) {
                // 1. Find or create User
                $user = User::where('email', $email)->first();
                if (!$user) {
                    $user = User::create([
                        'name' => $fullName,
                        'email' => $email,
                        'password' => Hash::make('password123'),
                        'is_active' => ($status === 'active') ? 1 : 0,
                    ]);
                    $user->assignRole('employee');
                }

                // 2. Find or create Employee (Upsert by employee_id or email)
                $employee = Employee::where('employee_id', $employeeId)
                    ->orWhere('email', $email)
                    ->first();

                $employeeData = [
                    'employee_id' => $employeeId,
                    'user_id' => $user->id,
                    'first_name' => $firstName,
                    'last_name' => $lastName,
                    'email' => $email,
                    'phone' => $phone,
                    'nik' => $nikKtp,
                    'join_date' => $joinDate,
                    'status' => $status,
                    'employment_type' => $employmentType,
                    'basic_salary' => $basicSalary,
                    'bank_name' => $bankName,
                    'bank_account_number' => $bankAccNo,
                    'bank_account_holder' => $bankHolder,
                ];

                if ($employee) {
                    $employee->update($employeeData);
                } else {
                    $employee = Employee::create($employeeData);
                }

                // 3. Setup assignment
                if ($department && $position) {
                    $assignment = $employee->currentAssignment;
                    if ($assignment) {
                        $assignment->update([
                            'department_id' => $department->id,
                            'job_position_id' => $position->id,
                            'work_location_id' => $locationId,
                        ]);
                    } else {
                        $employee->assignments()->create([
                            'department_id' => $department->id,
                            'job_position_id' => $position->id,
                            'work_location_id' => $locationId,
                            'start_date' => $joinDate,
                            'is_primary' => true,
                        ]);
                    }
                }

                $this->rowCount++;
            });
        }
    }

    public function getRowCount(): int
    {
        return $this->rowCount;
    }
}
