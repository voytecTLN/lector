<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AdminAuditLog extends Model
{
    protected $fillable = [
        'admin_user_id',
        'action',
        'model_type',
        'model_id',
        'model_name',
        'old_values',
        'new_values',
        'ip_address',
        'user_agent',
        'description'
    ];

    protected $casts = [
        'old_values' => 'array',
        'new_values' => 'array',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    public function adminUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'admin_user_id');
    }

    /**
     * Create a readable description of the change
     */
    public function getReadableDescriptionAttribute(): string
    {
        $userName = $this->adminUser->name ?? 'Unknown';
        $modelName = $this->model_name ?? class_basename($this->model_type);
        
        switch ($this->action) {
            case 'create':
                return "{$userName} utworzył {$modelName}";
            case 'update':
                return "{$userName} zaktualizował {$modelName}";
            case 'delete':
                return "{$userName} usunął {$modelName}";
            default:
                return "{$userName} wykonał akcję {$this->action} na {$modelName}";
        }
    }

    /**
     * Get the changed fields summary
     */
    public function getChangedFieldsAttribute(): array
    {
        if (!$this->old_values || !$this->new_values) {
            return [];
        }

        $changes = [];
        foreach ($this->new_values as $field => $newValue) {
            $oldValue = $this->old_values[$field] ?? null;
            if ($oldValue !== $newValue) {
                $changes[$field] = [
                    'from' => $oldValue,
                    'to' => $newValue
                ];
            }
        }

        return $changes;
    }
}