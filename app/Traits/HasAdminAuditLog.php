<?php

namespace App\Traits;

use App\Models\AdminAuditLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

trait HasAdminAuditLog
{
    protected static function bootHasAdminAuditLog()
    {
        // Log creation
        static::created(function ($model) {
            self::logAdminAction($model, 'create', [], $model->getAttributes());
        });

        // Log updates
        static::updated(function ($model) {
            $oldValues = $model->getOriginal();
            $newValues = $model->getAttributes();
            
            // Only log if there are actual changes
            if ($oldValues !== $newValues) {
                self::logAdminAction($model, 'update', $oldValues, $newValues);
            }
        });

        // Log deletion
        static::deleted(function ($model) {
            self::logAdminAction($model, 'delete', $model->getAttributes(), []);
        });
    }

    protected static function logAdminAction($model, string $action, array $oldValues, array $newValues)
    {
        $user = Auth::user();
        
        // Only log if user is admin/moderator
        if (!$user || !in_array($user->role, ['admin', 'moderator'])) {
            return;
        }

        // Get model name for display
        $modelName = self::getModelDisplayName($model);

        AdminAuditLog::create([
            'admin_user_id' => $user->id,
            'action' => $action,
            'model_type' => get_class($model),
            'model_id' => $model->id ?? null,
            'model_name' => $modelName,
            'old_values' => $oldValues,
            'new_values' => $newValues,
            'ip_address' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'description' => self::generateDescription($user, $action, $modelName, $oldValues, $newValues)
        ]);
    }

    protected static function getModelDisplayName($model): string
    {
        $className = class_basename($model);
        
        // Polish translations
        $translations = [
            'Package' => 'Pakiet',
            'User' => 'Użytkownik',
            'Lesson' => 'Lekcja',
            'TutorProfile' => 'Profil Lektora',
            'StudentProfile' => 'Profil Ucznia',
            'Material' => 'Materiał'
        ];

        return $translations[$className] ?? $className;
    }

    protected static function generateDescription($user, $action, $modelName, $oldValues, $newValues): string
    {
        $actionTranslations = [
            'create' => 'utworzył',
            'update' => 'zaktualizował', 
            'delete' => 'usunął'
        ];

        $actionText = $actionTranslations[$action] ?? $action;
        $description = "{$user->name} {$actionText} {$modelName}";

        // Add specific details for updates
        if ($action === 'update' && !empty($oldValues) && !empty($newValues)) {
            $changes = [];
            foreach ($newValues as $field => $newValue) {
                $oldValue = $oldValues[$field] ?? null;
                if ($oldValue !== $newValue && !in_array($field, ['updated_at', 'created_at'])) {
                    $changes[] = "{$field}: '{$oldValue}' → '{$newValue}'";
                }
            }
            
            if (!empty($changes)) {
                $description .= ' (' . implode(', ', array_slice($changes, 0, 3)) . ')';
                if (count($changes) > 3) {
                    $description .= ' i ' . (count($changes) - 3) . ' innych pól';
                }
            }
        }

        return $description;
    }
}