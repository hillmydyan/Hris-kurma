<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class ContractExpiryNotification extends Notification
{
    use Queueable;

    protected $document;

    /**
     * Create a new notification instance.
     */
    public function __construct($document)
    {
        $this->document = $document;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database']; // Add 'mail' if mail server is configured
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
                    ->subject('Contract Expiry Reminder')
                    ->line('The contract for ' . $this->document->employee->first_name . ' is expiring soon.')
                    ->line('Expiry Date: ' . $this->document->expiry_date)
                    ->action('View Employee', url('/karyawan/' . $this->document->employee_id))
                    ->line('Please review and take necessary action.');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'employee_id' => $this->document->employee_id,
            'employee_name' => $this->document->employee->first_name,
            'expiry_date' => $this->document->expiry_date,
            'message' => 'Contract expiring for ' . $this->document->employee->first_name,
        ];
    }
}
