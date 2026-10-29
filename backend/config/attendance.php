<?php

return [
    /*
    |--------------------------------------------------------------------------
    | Batasan Waktu Absensi
    |--------------------------------------------------------------------------
    |
    | Konfigurasi rentang waktu operasional absensi Kurma Group (WIB).
    |
    */

    'afternoon_start' => env('ATTENDANCE_AFTERNOON_START', '15:00:00'),
    'afternoon_end'   => env('ATTENDANCE_AFTERNOON_END', '17:00:00'),

    'morning_target' => env('ATTENDANCE_MORNING_TARGET', '08:00:00'),
    'ontime_tolerance' => env('ATTENDANCE_ONTIME_TOLERANCE', '08:15:00'),

    'standard_working_days' => 26,
    'meal_rate_per_day' => 11000,
];
