<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckContractExpiry extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'app:check-contract-expiry';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Command description';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $expiringDocs = \App\Models\EmployeeDocument::whereNotNull('expiry_date')
            ->whereBetween('expiry_date', [now(), now()->addDays(30)])
            ->with('employee')
            ->get();

        $hrUsers = \App\Models\User::role('HR')->get();

        foreach ($expiringDocs as $doc) {
            foreach ($hrUsers as $user) {
                $user->notify(new \App\Notifications\ContractExpiryNotification($doc));
            }
            $this->info("Notified about contract expiry for: {$doc->employee->first_name}");
        }

        $this->info('Contract expiry check completed.');
    }
}
