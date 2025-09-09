<?php

namespace Tests\Feature;

use App\Mail\TutorAccountCreated;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TutorAccountCreatedMailTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    /** @test */
    public function it_sends_welcome_email_when_tutor_is_created_by_admin(): void
    {
        Mail::fake();

        // Create admin user
        $admin = User::factory()->create(['role' => 'admin']);
        
        // Prepare tutor data
        $tutorData = [
            'name' => $this->faker->name,
            'email' => $this->faker->unique()->safeEmail,
            'password' => 'temporary-password',
            'password_confirmation' => 'temporary-password',
            'phone' => '+48123456789',
            'city' => 'Warszawa',
            'status' => 'active',
            'description' => $this->faker->text(200),
            'hourly_rate' => 80,
            'is_accepting_students' => true,
            'years_experience' => 3,
            'weekly_contract_limit' => 24,
            'specializations' => ['business'],
            'languages' => ['english'],
        ];

        // Create tutor via API (as admin)
        $response = $this->actingAs($admin)
            ->postJson('/api/tutors', $tutorData);

        $response->assertStatus(201);

        // Assert mail was queued (since TutorAccountCreated implements ShouldQueue)
        Mail::assertQueued(TutorAccountCreated::class, function ($mail) use ($tutorData) {
            return $mail->tutor->email === $tutorData['email'] &&
                   str_contains($mail->resetUrl, '/reset-password') &&
                   str_contains($mail->resetUrl, 'token=') &&
                   str_contains($mail->resetUrl, 'email=');
        });
    }

    /** @test */
    public function tutor_can_reset_password_using_email_link(): void
    {
        // Create tutor
        $tutor = User::factory()->create([
            'role' => 'tutor',
            'password' => bcrypt('old-password')
        ]);

        // Generate reset token
        $token = $tutor->generatePasswordResetToken();
        
        // Test password reset
        $response = $this->postJson('/api/auth/reset-password', [
            'token' => $token,
            'email' => $tutor->email,
            'password' => 'new-secure-password',
            'password_confirmation' => 'new-secure-password'
        ]);

        $response->assertStatus(200);
        $response->assertJson(['message' => 'Hasło zostało zmienione pomyślnie.']);

        // Test login with new password
        $loginResponse = $this->postJson('/api/auth/login', [
            'email' => $tutor->email,
            'password' => 'new-secure-password'
        ]);

        $loginResponse->assertStatus(200);
    }
}
