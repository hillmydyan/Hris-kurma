<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    use HasFactory, \App\Traits\Auditable;

    protected $fillable = ['group', 'key', 'value', 'type'];
}
