<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Traits\Auditable;

class WorkLocation extends Model
{
    use HasFactory, Auditable;

    protected $fillable = ['code', 'name', 'address', 'latitude', 'longitude', 'radius_meters', 'timezone'];
}
