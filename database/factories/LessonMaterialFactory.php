<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\LessonMaterial>
 */
class LessonMaterialFactory extends Factory
{
    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $mimeTypes = [
            'image/jpeg',
            'image/png',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
        ];
        
        $extensions = [
            'image/jpeg' => 'jpg',
            'image/png' => 'png',
            'application/pdf' => 'pdf',
            'application/msword' => 'doc',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document' => 'docx'
        ];
        
        $mimeType = $this->faker->randomElement($mimeTypes);
        $extension = $extensions[$mimeType];
        $fileName = $this->faker->word() . '.' . $extension;
        
        return [
            'lesson_id' => null,
            'student_id' => \App\Models\User::factory(),
            'tutor_id' => \App\Models\User::factory(),
            'file_path' => 'materials/' . $this->faker->numberBetween(1, 100) . '/' . $this->faker->numberBetween(1, 100) . '/' . $fileName,
            'original_name' => $fileName,
            'file_size' => $this->faker->numberBetween(100000, 5000000), // 100KB - 5MB
            'mime_type' => $mimeType,
            'is_active' => true,
            'version' => 1,
            'uploaded_at' => now(),
        ];
    }
}
