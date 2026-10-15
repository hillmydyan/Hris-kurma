<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;

class RoleAndPermissionSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        // Comprehensive granular permissions list
        $permissions = [
            // Daily Report Spreadsheet
            'daily_report.view_self',
            'daily_report.create',
            'daily_report.edit',
            'daily_report.submit',
            'daily_report.view_team',
            'daily_report.view_all',
            'daily_report.review',
            'daily_report.export',

            // Attendance & Dynamic QR
            'attendance.scan_qr',
            'attendance.view_self',
            'attendance.view_team',
            'attendance.view_all',
            'attendance.generate_qr',
            'attendance.manage',
            'attendance.approve',

            // Leaves & Approvals
            'leave.request',
            'leave.view_self',
            'leave.view_team',
            'leave.view_all',
            'leave.approve_manager',
            'leave.approve_hr',

            // Employees
            'employee.view_self',
            'employee.view_directory',
            'employee.view_all',
            'employee.create',
            'employee.edit',
            'employee.delete',

            // Organization
            'organization.view',
            'organization.manage',

            // Payroll (Strict Separation)
            'payroll.view_self',
            'payroll.view_all',
            'payroll.create',
            'payroll.process',
            'payroll.approve',

            // KPI & Evaluation
            'kpi.view_self',
            'kpi.view_team',
            'kpi.manage',
            'kpi.evaluate',

            // Recruitment & Documents
            'recruitment.view',
            'recruitment.manage',
            'document.view_self',
            'document.manage',

            // System & Portal Backend Access
            'portal.backend_access',
            'system.settings',
            'system.audit_logs',
            'system.rbac',
        ];

        foreach ($permissions as $permissionName) {
            Permission::firstOrCreate(['name' => $permissionName, 'guard_name' => 'web']);
        }

        // Roles Definition
        $roles = [
            'super-admin',
            'owner',
            'direksi',
            'hr-manager',
            'dept-head',
            'employee',
            'finance-staff',
        ];

        foreach ($roles as $roleName) {
            Role::firstOrCreate(['name' => $roleName, 'guard_name' => 'web']);
        }

        // 1. Super Admin, Owner, and Direksi have all permissions & full backend access
        $superAdmin = Role::findByName('super-admin', 'web');
        $superAdmin->syncPermissions(Permission::all());

        $owner = Role::findByName('owner', 'web');
        $owner->syncPermissions(Permission::all());

        $direksi = Role::findByName('direksi', 'web');
        $direksi->syncPermissions(Permission::all());

        // 2. HR Manager / HR Admin (Has portal.backend_access and full HR/employee/payroll management)
        $hrManager = Role::findByName('hr-manager', 'web');
        $hrManager->syncPermissions([
            'portal.backend_access',
            'daily_report.view_self', 'daily_report.create', 'daily_report.edit', 'daily_report.submit',
            'daily_report.view_team', 'daily_report.view_all', 'daily_report.review', 'daily_report.export',
            'attendance.scan_qr', 'attendance.view_self', 'attendance.view_team', 'attendance.view_all',
            'attendance.generate_qr', 'attendance.manage', 'attendance.approve',
            'leave.request', 'leave.view_self', 'leave.view_team', 'leave.view_all', 'leave.approve_manager', 'leave.approve_hr',
            'employee.view_self', 'employee.view_directory', 'employee.view_all', 'employee.create', 'employee.edit', 'employee.delete',
            'organization.view', 'organization.manage',
            'payroll.view_self', 'payroll.view_all', 'payroll.create', 'payroll.process', 'payroll.approve',
            'document.view_self', 'document.manage',
            'system.settings', 'system.audit_logs',
        ]);

        // 3. Dept Head / Manager (User Portal Only - NO portal.backend_access)
        $deptHead = Role::findByName('dept-head', 'web');
        $deptHead->syncPermissions([
            'daily_report.view_self', 'daily_report.create', 'daily_report.edit', 'daily_report.submit',
            'daily_report.view_team', 'daily_report.review', 'daily_report.export',
            'attendance.scan_qr', 'attendance.view_self', 'attendance.view_team',
            'leave.request', 'leave.view_self', 'leave.view_team', 'leave.approve_manager',
            'employee.view_self', 'employee.view_directory',
            'organization.view',
            'payroll.view_self', // STRICT: Only self payroll!
            'document.view_self',
        ]);

        // 4. Employee / Staff (User Portal Only, No Management Backend access)
        $employee = Role::findByName('employee', 'web');
        $employee->syncPermissions([
            'daily_report.view_self', 'daily_report.create', 'daily_report.edit', 'daily_report.submit',
            'attendance.scan_qr', 'attendance.view_self',
            'leave.request', 'leave.view_self',
            'employee.view_self', 'employee.view_directory',
            'payroll.view_self',
            'document.view_self',
        ]);

        // 5. Finance Staff (User Portal Only - NO portal.backend_access)
        $finance = Role::findByName('finance-staff', 'web');
        $finance->syncPermissions([
            'daily_report.view_self', 'daily_report.create', 'daily_report.edit', 'daily_report.submit',
            'attendance.scan_qr', 'attendance.view_self',
            'leave.request', 'leave.view_self',
            'employee.view_self', 'employee.view_directory',
            'payroll.view_self',
            'document.view_self',
        ]);
    }
}
