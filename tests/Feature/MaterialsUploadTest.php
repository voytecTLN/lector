<?php

namespace Tests\Feature;

use App\Models\Lesson;
use App\Models\LessonMaterial;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Tests\TestCase;

class MaterialsUploadTest extends TestCase
{
    use RefreshDatabase;

    private User $tutor;
    private User $student;
    private User $anotherTutor;

    protected function setUp(): void
    {
        parent::setUp();
        
        Storage::fake('local');
        
        // Create test users
        $this->tutor = User::factory()->create(['role' => 'tutor']);
        $this->student = User::factory()->create(['role' => 'student']);
        $this->anotherTutor = User::factory()->create(['role' => 'tutor']);
        
        // Create tutor-student relationship
        $this->tutor->students()->attach($this->student->id);
    }

    public function test_tutor_can_upload_material_for_their_student()
    {
        $file = UploadedFile::fake()->create('test.pdf', 1000, 'application/pdf');
        
        $response = $this->actingAs($this->tutor)
            ->postJson('/api/materials/upload', [
                'student_id' => $this->student->id,
                'file' => $file
            ]);
        
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'File uploaded successfully'
            ]);
        
        $this->assertDatabaseHas('lesson_materials', [
            'student_id' => $this->student->id,
            'tutor_id' => $this->tutor->id,
            'original_name' => 'test.pdf',
            'mime_type' => 'application/pdf',
            'is_active' => true,
            'version' => 1
        ]);
        
        // Check file was stored
        $material = LessonMaterial::first();
        Storage::disk('local')->assertExists($material->file_path);
    }

    public function test_tutor_cannot_upload_material_for_other_tutors_student()
    {
        $file = UploadedFile::fake()->create('test.pdf', 1000);
        
        $response = $this->actingAs($this->anotherTutor)
            ->postJson('/api/materials/upload', [
                'student_id' => $this->student->id,
                'file' => $file
            ]);
        
        $response->assertStatus(403);
        $this->assertDatabaseCount('lesson_materials', 0);
    }

    public function test_upload_creates_new_version_for_same_filename()
    {
        // Upload first version
        $file1 = UploadedFile::fake()->create('document.pdf', 1000);
        
        $this->actingAs($this->tutor)
            ->postJson('/api/materials/upload', [
                'student_id' => $this->student->id,
                'file' => $file1
            ]);
        
        // Upload second version
        $file2 = UploadedFile::fake()->create('document.pdf', 2000);
        
        $response = $this->actingAs($this->tutor)
            ->postJson('/api/materials/upload', [
                'student_id' => $this->student->id,
                'file' => $file2
            ]);
        
        $response->assertStatus(200);
        
        // Check versions
        $materials = LessonMaterial::where('original_name', 'document.pdf')->get();
        $this->assertCount(2, $materials);
        
        // Check version numbers
        $this->assertEquals(1, $materials->first()->version);
        $this->assertEquals(2, $materials->last()->version);
        
        // Check only latest is active
        $this->assertFalse($materials->first()->is_active);
        $this->assertTrue($materials->last()->is_active);
    }

    public function test_upload_validates_file_size()
    {
        // 11MB file (over 10MB limit)
        $file = UploadedFile::fake()->create('large.pdf', 11 * 1024);
        
        $response = $this->actingAs($this->tutor)
            ->postJson('/api/materials/upload', [
                'student_id' => $this->student->id,
                'file' => $file
            ]);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_upload_validates_file_type()
    {
        $file = UploadedFile::fake()->create('test.exe', 1000);
        
        $response = $this->actingAs($this->tutor)
            ->postJson('/api/materials/upload', [
                'student_id' => $this->student->id,
                'file' => $file
            ]);
        
        $response->assertStatus(422)
            ->assertJsonValidationErrors(['file']);
    }

    public function test_tutor_can_list_materials_for_student()
    {
        // Create some materials
        LessonMaterial::factory()->count(3)->create([
            'tutor_id' => $this->tutor->id,
            'student_id' => $this->student->id,
            'is_active' => true
        ]);
        
        $response = $this->actingAs($this->tutor)
            ->getJson("/api/tutor/students/{$this->student->id}/materials");
        
        $response->assertStatus(200)
            ->assertJson([
                'success' => true
            ])
            ->assertJsonCount(3, 'materials');
    }

    public function test_tutor_can_delete_material()
    {
        $material = LessonMaterial::factory()->create([
            'tutor_id' => $this->tutor->id,
            'student_id' => $this->student->id
        ]);
        
        Storage::disk('local')->put($material->file_path, 'test content');
        
        $response = $this->actingAs($this->tutor)
            ->deleteJson("/api/materials/{$material->id}");
        
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'message' => 'Material deleted successfully'
            ]);
        
        // Check soft deleted
        $this->assertSoftDeleted('lesson_materials', ['id' => $material->id]);
        
        // Check file was deleted
        Storage::disk('local')->assertMissing($material->file_path);
    }

    public function test_student_can_download_their_materials()
    {
        $material = LessonMaterial::factory()->create([
            'tutor_id' => $this->tutor->id,
            'student_id' => $this->student->id
        ]);
        
        Storage::disk('local')->put($material->file_path, 'test content');
        
        $response = $this->actingAs($this->student)
            ->get("/api/materials/{$material->id}/download");
        
        $response->assertStatus(200)
            ->assertHeader('Content-Type', $material->mime_type);
    }

    public function test_rate_limiting_on_upload()
    {
        // Make 10 requests (the limit)
        for ($i = 0; $i < 10; $i++) {
            $file = UploadedFile::fake()->create("test{$i}.pdf", 100);
            
            $this->actingAs($this->tutor)
                ->postJson('/api/materials/upload', [
                    'student_id' => $this->student->id,
                    'file' => $file
                ]);
        }
        
        // 11th request should be rate limited
        $file = UploadedFile::fake()->create('test11.pdf', 100);
        
        $response = $this->actingAs($this->tutor)
            ->postJson('/api/materials/upload', [
                'student_id' => $this->student->id,
                'file' => $file
            ]);
        
        $response->assertStatus(429); // Too Many Requests
    }

    public function test_toggle_material_active_status()
    {
        $material = LessonMaterial::factory()->create([
            'tutor_id' => $this->tutor->id,
            'student_id' => $this->student->id,
            'is_active' => true
        ]);
        
        $response = $this->actingAs($this->tutor)
            ->putJson("/api/materials/{$material->id}/toggle-active");
        
        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'is_active' => false
            ]);
        
        $material->refresh();
        $this->assertFalse($material->is_active);
    }
}