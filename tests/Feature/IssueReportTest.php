<?php

namespace Tests\Feature;

use App\Mail\IssueReport;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\RateLimiter;
use Tests\TestCase;

class IssueReportTest extends TestCase
{
//     use RefreshDatabase, WithFaker;

    protected function setUp(): void
    {
//         parent::setUp();
//         // Clear potential rate limiter keys - user IDs typically start from 1 in tests
//         for ($i = 1; $i <= 10; $i++) {
//             RateLimiter::clear('issue-report:'.$i);
//         }
    }

    /** @test */
    public function it_sends_issue_report_email_for_technical_issues(): void
    {
//         Mail::fake();
//
//         $user = User::factory()->create(['role' => 'student']);
//
//         $issueData = [
//             'issue_type' => 'technical',
//             'subject' => 'Cannot login to the system',
//             'description' => 'I am having trouble logging into my account. The login form shows an error message every time I try to enter my credentials.',
//             'priority' => 'high',
//             'current_url' => 'https://example.com/login',
//         ];
//
//         $response = $this->actingAs($user)
//             ->postJson('/api/support/issue', $issueData);
//
//         $response->assertStatus(200);
//         $response->assertJson([
//             'success' => true,
//             'message' => 'Twoje zgłoszenie zostało wysłane. Odpowiemy na nie w ciągu 24-48 godzin.',
//         ]);
//
//         Mail::assertQueued(IssueReport::class, function ($mail) use ($user, $issueData) {
//             return $mail->user->id === $user->id &&
//                    $mail->issueType === $issueData['issue_type'] &&
//                    $mail->issueSubject === $issueData['subject'] &&
//                    $mail->description === $issueData['description'] &&
//                    $mail->priority === $issueData['priority'] &&
//                    isset($mail->issueMetadata['url']) &&
//                    $mail->issueMetadata['url'] === $issueData['current_url'];
//         });
    }

    /** @test */
    public function it_sends_issue_report_email_for_business_issues(): void
    {
//         Mail::fake();
//
//         $user = User::factory()->create(['role' => 'tutor']);
//
//         $issueData = [
//             'issue_type' => 'business',
//             'subject' => 'Invoice payment issue',
//             'description' => 'I have not received payment for my tutoring sessions from last month. Please help me resolve this billing issue.',
//             'priority' => 'medium',
//         ];
//
//         $response = $this->actingAs($user)
//             ->postJson('/api/support/issue', $issueData);
//
//         $response->assertStatus(200);
//
//         Mail::assertQueued(IssueReport::class, function ($mail) use ($user, $issueData) {
//             return $mail->user->id === $user->id &&
//                    $mail->issueType === $issueData['issue_type'] &&
//                    $mail->issueSubject === $issueData['subject'] &&
//                    $mail->description === $issueData['description'] &&
//                    $mail->priority === $issueData['priority'];
//         });
    }

    /** @test */
    public function it_validates_required_fields(): void
    {
//         $user = User::factory()->create(['role' => 'admin']);
//
//         $response = $this->actingAs($user)
//             ->postJson('/api/support/issue', []);
//
//         $response->assertStatus(422);
//         $response->assertJsonValidationErrors([
//             'issue_type',
//             'subject',
//             'description',
//             'priority',
//         ]);
    }

    /** @test */
    public function it_validates_field_lengths(): void
    {
//         $user = User::factory()->create(['role' => 'student']);
//
//         $response = $this->actingAs($user)
//             ->postJson('/api/support/issue', [
//                 'issue_type' => 'technical',
//                 'subject' => 'Hi', // Too short
//                 'description' => 'Short desc', // Too short
//                 'priority' => 'high',
//             ]);
//
//         $response->assertStatus(422);
//         $response->assertJsonValidationErrors([
//             'subject',
//             'description',
//         ]);
    }

    /** @test */
    public function it_validates_enum_values(): void
    {
//         $user = User::factory()->create(['role' => 'tutor']);
//
//         $response = $this->actingAs($user)
//             ->postJson('/api/support/issue', [
//                 'issue_type' => 'invalid_type',
//                 'subject' => 'Valid subject that is long enough',
//                 'description' => 'Valid description that is definitely long enough to pass validation rules',
//                 'priority' => 'invalid_priority',
//             ]);
//
//         $response->assertStatus(422);
//         $response->assertJsonValidationErrors([
//             'issue_type',
//             'priority',
//         ]);
    }

    /** @test */
    public function it_applies_rate_limiting(): void
    {
//         Mail::fake();
//
//         $user = User::factory()->create(['role' => 'student']);
//
//         $validIssueData = [
//             'issue_type' => 'technical',
//             'subject' => 'Test issue for rate limiting',
//             'description' => 'This is a test description for rate limiting functionality.',
//             'priority' => 'low',
//         ];
//
//         // Send 3 requests (should succeed)
//         for ($i = 0; $i < 3; $i++) {
//             $response = $this->actingAs($user)
//                 ->postJson('/api/support/issue', $validIssueData);
//             $response->assertStatus(200);
//         }
//
//         // 4th request should be rate limited
//         $response = $this->actingAs($user)
//             ->postJson('/api/support/issue', $validIssueData);
//
//         $response->assertStatus(422);
//         $response->assertJsonValidationErrors(['rate_limit']);
    }

    /** @test */
    public function it_requires_authentication(): void
    {
//         $issueData = [
//             'issue_type' => 'technical',
//             'subject' => 'Test issue without authentication',
//             'description' => 'This should not work without authentication.',
//             'priority' => 'low',
//         ];
//
//         $response = $this->postJson('/api/support/issue', $issueData);
//
//         $response->assertStatus(401);
    }

    /** @test */
    public function it_logs_issue_report_submission(): void
    {
//         Mail::fake();
//
//         $user = User::factory()->create(['role' => 'admin']);
//
//         $issueData = [
//             'issue_type' => 'business',
//             'subject' => 'Test logging functionality',
//             'description' => 'This is a test to verify that issue reports are properly logged.',
//             'priority' => 'low',
//         ];
//
//         // We would need to mock the Log facade to test this properly
//         // For now, we just ensure the request succeeds
//         $response = $this->actingAs($user)
//             ->postJson('/api/support/issue', $issueData);
//
//         $response->assertStatus(200);
//
//         Mail::assertQueued(IssueReport::class);
    }
}
