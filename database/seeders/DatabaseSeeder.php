<?php
// database/seeders/DatabaseSeeder.php - Rozbudowany seeder

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\TutorProfile;
use App\Models\Package;
use App\Models\PackageAssignment;
use App\Models\Lesson;
use App\Models\LessonMaterial;
use App\Models\LessonStatusHistory;
use App\Models\TutorAvailabilitySlot;
use App\Models\TutorAvailabilityLog;
use App\Models\MeetingSession;
use App\Models\AdminAuditLog;

class DatabaseSeeder extends Seeder
{
    /**
     * Helper method to create user if it doesn't exist
     */
    private function createUserIfNotExists(array $userData, array $profileData = null, string $profileType = null): void
    {
        if (!User::where('email', $userData['email'])->exists()) {
            $user = User::create($userData);
            
            if ($profileData && $profileType) {
                $profileData['user_id'] = $user->id;
                
                switch ($profileType) {
                    case 'tutor':
                        TutorProfile::create($profileData);
                        break;
                    case 'student':
                        StudentProfile::create($profileData);
                        break;
                }
            }
            
            $this->command->info("✅ Created {$userData['role']}: {$userData['email']}");
        } else {
            $this->command->info("⚠️  {$userData['role']} already exists: {$userData['email']}");
        }
    }

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding database with test data...');

        try {
            // Create Admin Users
            $this->createAdminUsers();

            // Create Moderator Users
            $this->createModeratorUsers();

            // Create Packages
            $packages = $this->createPackages();

            // Create Tutor Users with Profiles
            $this->createTutorUsers();

            // Create Student Users with Profiles and Package Assignments
            $this->createStudentUsers($packages);

            // Create Tutor Availability Slots
            $this->createTutorAvailabilitySlots();

            // Create Lessons
            $this->createLessons();

            // Create Lesson Materials
            $this->createLessonMaterials();

            // Create Meeting Sessions
            $this->createMeetingSessions();

            // Create Admin Audit Logs
            $this->createAdminAuditLogs();

            // Create Tutor Availability Logs
            $this->createTutorAvailabilityLogs();

            $this->command->info('✅ Database seeding completed successfully!');
            $this->command->info('📧 Login credentials (password for all: password):');
            $this->command->info('   Admin: admin@test.com');
            $this->command->info('   Moderator: moderator@test.com');
            $this->command->info('   Tutor: anna.kowalska@test.com');
            $this->command->info('   Student: jan.nowak@test.com');
        } catch (\Exception $e) {
            $this->command->error('❌ Seeding failed: ' . $e->getMessage());
            $this->command->info('💡 You can run: php artisan migrate:fresh --seed to start fresh');
        }
    }

    /**
     * Create admin users
     */
    private function createAdminUsers(): void
    {
        $this->command->info('👑 Creating admin user...');

        // Admin - Administrator Główny
        $this->createUserIfNotExists([
            'name' => 'Administrator',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'phone' => '+48 123 456 789',
            'city' => 'Warszawa',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(365),
            'created_at' => now()->subDays(365),
            'last_login_at' => now()->subHours(1),
            'account_source' => User::SOURCE_ADMIN,
        ]);
    }

    /**
     * Create moderator users
     */
    private function createModeratorUsers(): void
    {
        $this->command->info('🛡️  Creating moderator user...');

        // Moderator
        $this->createUserIfNotExists([
            'name' => 'Moderator',
            'email' => 'moderator@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_MODERATOR,
            'phone' => '+48 555 123 456',
            'city' => 'Gdańsk',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(90),
            'created_at' => now()->subDays(90),
            'last_login_at' => now()->subHours(3),
            'account_source' => User::SOURCE_ADMIN,
        ]);
    }

    /**
     * Create packages
     */
    private function createPackages(): array
    {
        $this->command->info('📦 Creating packages...');

        // If packages already exist, return them
        if (Package::count() > 0) {
            $this->command->info('⚠️  Packages already exist, using existing ones');
            return Package::all()->toArray();
        }

        $packages = [];

        $packages[] = Package::create([
            'name' => 'Pakiet Starter',
            'description' => 'Idealny na początek',
            'hours_count' => 5,
            'price' => 350.00,
            'validity_days' => 30,
            'is_active' => true,
            'sort_order' => 1,
            'color' => '#10b981',
        ]);

        $packages[] = Package::create([
            'name' => 'Pakiet Standard',
            'description' => 'Najpopularniejszy wybór',
            'hours_count' => 10,
            'price' => 650.00,
            'validity_days' => 60,
            'is_active' => true,
            'sort_order' => 2,
            'color' => '#3b82f6',
        ]);

        $packages[] = Package::create([
            'name' => 'Pakiet Premium',
            'description' => 'Dla zaawansowanych',
            'hours_count' => 20,
            'price' => 1200.00,
            'validity_days' => 90,
            'is_active' => true,
            'sort_order' => 3,
            'color' => '#8b5cf6',
        ]);

        return $packages;
    }

    /**
     * Create tutor users with profiles
     */
    private function createTutorUsers(): void
    {
        $this->command->info('👩‍🏫 Creating tutor users...');

        // Skip if tutors already exist
        if (User::where('role', User::ROLE_TUTOR)->count() > 0) {
            $this->command->info('⚠️  Tutors already exist, skipping creation');
            return;
        }

        // Tutor 1 - Anna Kowalska (Verified, Active)
        $this->createUserIfNotExists([
            'name' => 'Anna Kowalska',
            'email' => 'anna.kowalska@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TUTOR,
            'phone' => '+48 600 111 222',
            'birth_date' => '1985-03-15',
            'city' => 'Warszawa',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(180),
            'created_at' => now()->subDays(180),
            'last_login_at' => now()->subHours(2),
            'account_source' => User::SOURCE_ADMIN,
        ], [
            'languages' => ['english', 'german'],
            'specializations' => ['business', 'exam', 'conversation'],
            'description' => 'Certyfikowana lektorka z pasją do nauczania. Specjalizuję się w Business English i przygotowaniu do egzaminów Cambridge. Prowadzę lekcje w sposób interaktywny i dostosowany do potrzeb ucznia.',
            'years_experience' => 8,
            'certifications' => ['CELTA', 'DELTA', 'Cambridge CPE'],
            'education' => ['Magister Filologii Angielskiej - Uniwersytet Warszawski'],
            'average_rating' => 4.8,
            'total_lessons' => 1250,
            'total_students' => 89,
            'is_accepting_students' => true,
            'max_students_per_week' => 25,
            'lesson_types' => ['individual', 'group', 'intensive'],
            'is_verified' => true,
            'verified_at' => now()->subDays(175),
            'verification_status' => TutorProfile::VERIFICATION_APPROVED,
            'weekly_availability' => json_encode([
                'monday' => ['09:00-12:00', '14:00-18:00'],
                'tuesday' => ['09:00-12:00', '14:00-18:00'],
                'wednesday' => ['09:00-12:00', '14:00-18:00'],
                'thursday' => ['09:00-12:00', '14:00-18:00'],
                'friday' => ['09:00-12:00', '14:00-16:00'],
            ])
        ], 'tutor');

        // Tutor 2 - Piotr Wiśniewski (Pending verification)
        $tutor2 = User::create([
            'name' => 'Piotr Wiśniewski',
            'email' => 'piotr.wisniewski@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TUTOR,
            'phone' => '+48 600 222 333',
            'birth_date' => '1990-07-22',
            'city' => 'Kraków',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(5),
            'created_at' => now()->subDays(5),
            'account_source' => User::SOURCE_ADMIN,
        ]);

        TutorProfile::create([
            'user_id' => $tutor2->id,
            'languages' => ['german', 'spanish'],
            'specializations' => ['conversation', 'grammar'],
            'description' => 'Nauczyciel języków obcych z pasją.',
            'years_experience' => 3,
            'certifications' => [],
            'education' => ['Licencjat z Filologii'],
            'average_rating' => 0,
            'total_lessons' => 0,
            'total_students' => 0,
            'is_accepting_students' => true,
            'max_students_per_week' => 15,
            'lesson_types' => ['individual'],
            'is_verified' => false,
            'verification_status' => TutorProfile::VERIFICATION_PENDING,
            'verification_notes' => 'Dokumenty w trakcie weryfikacji',
        ]);
    }

    /**
     * Create student users with profiles and package assignments
     */
    private function createStudentUsers(array $packages): void
    {
        $this->command->info('🎓 Creating student users...');

        // Skip if students already exist
        if (User::where('role', User::ROLE_STUDENT)->count() > 0) {
            $this->command->info('⚠️  Students already exist, skipping creation');
            return;
        }

        // Student 1 - Jan Nowak (Active with active package)
        $student1 = User::create([
            'name' => 'Jan Nowak',
            'email' => 'jan.nowak@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 111 222',
            'birth_date' => '1995-01-20',
            'city' => 'Warszawa',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(45),
            'created_at' => now()->subDays(45),
            'last_login_at' => now()->subHours(6),
            'account_source' => User::SOURCE_IMPORT,
        ]);

        StudentProfile::create([
            'user_id' => $student1->id,
            'learning_languages' => ['english', 'german'],
            'current_levels' => json_encode([
                'english' => 'B2',
                'german' => 'A2'
            ]),
            'learning_goals' => ['business', 'conversation', 'exam'],
            'preferred_schedule' => json_encode([
                'preferred_days' => ['monday', 'wednesday', 'friday'],
                'preferred_times' => ['evening'],
                'lesson_duration' => 60,
            ])
        ]);

        // Assign package to student 1
        PackageAssignment::create([
            'student_id' => $student1->id,
            'package_id' => $packages[2]->id, // Pakiet Premium
            'assigned_at' => now()->subDays(10),
            'expires_at' => now()->addDays(80),
            'hours_remaining' => 15.5,
            'is_active' => true,
            'notes' => 'Regularnie uczestniczy w lekcjach',
        ]);

        // Student 2 - Maria Zielińska (Active, no package)
        $student2 = User::create([
            'name' => 'Maria Zielińska',
            'email' => 'maria.zielinska@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 222 333',
            'birth_date' => '1998-03-15',
            'city' => 'Kraków',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(30),
            'created_at' => now()->subDays(30),
            'account_source' => User::SOURCE_IMPORT,
        ]);

        StudentProfile::create([
            'user_id' => $student2->id,
            'learning_languages' => ['spanish'],
            'current_levels' => json_encode([
                'spanish' => 'B1'
            ]),
            'learning_goals' => ['travel', 'conversation'],
        ]);

        // Student 3 - Tomasz Kowalski (Inactive with expired package)
        $student3 = User::create([
            'name' => 'Tomasz Kowalski',
            'email' => 'tomasz.kowalski@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 333 444',
            'birth_date' => '1992-07-10',
            'city' => 'Gdańsk',
            'country' => 'Polska',
            'status' => User::STATUS_INACTIVE,
            'email_verified_at' => now()->subDays(90),
            'created_at' => now()->subDays(90),
            'account_source' => User::SOURCE_IMPORT,
        ]);

        StudentProfile::create([
            'user_id' => $student3->id,
            'learning_languages' => ['german'],
            'current_levels' => json_encode([
                'german' => 'A2'
            ]),
            'learning_goals' => ['exam'],
        ]);

        // Expired package
        PackageAssignment::create([
            'student_id' => $student3->id,
            'package_id' => $packages[0]->id, // Pakiet Starter
            'assigned_at' => now()->subDays(40),
            'expires_at' => now()->subDays(10),
            'hours_remaining' => 0,
            'is_active' => false,
            'notes' => 'Pakiet wygasł',
        ]);
    }

    /**
     * Create tutor availability slots
     */
    private function createTutorAvailabilitySlots(): void
    {
        $this->command->info('📅 Creating tutor availability slots...');

        $tutors = User::where('role', User::ROLE_TUTOR)
            ->whereHas('tutorProfile', function($q) {
                $q->where('is_verified', true);
            })
            ->take(1)
            ->get();

        foreach ($tutors as $tutor) {
            // Create slots for the next 7 days
            for ($day = 0; $day < 7; $day++) {
                $date = now()->addDays($day)->format('Y-m-d');

                // Morning slots (9:00-12:00)
                for ($hour = 9; $hour < 12; $hour++) {
                    TutorAvailabilitySlot::create([
                        'tutor_id' => $tutor->id,
                        'date' => $date,
                        'start_hour' => $hour,
                        'end_hour' => $hour + 1,
                        'is_available' => true,
                        'hours_booked' => ($day === 2 && $hour === 10) ? 1 : 0
                    ]);
                }

                // Afternoon slots (14:00-17:00)
                for ($hour = 14; $hour < 17; $hour++) {
                    TutorAvailabilitySlot::create([
                        'tutor_id' => $tutor->id,
                        'date' => $date,
                        'start_hour' => $hour,
                        'end_hour' => $hour + 1,
                        'is_available' => true,
                        'hours_booked' => 0
                    ]);
                }
            }
        }

        $this->command->info('✅ Created availability slots for ' . $tutors->count() . ' tutors');
    }

    /**
     * Create lessons
     */
    private function createLessons(): void
    {
        $this->command->info('📚 Creating lessons...');

        $tutors = User::where('role', User::ROLE_TUTOR)->get();

        $students = User::where('role', User::ROLE_STUDENT)->get();

        if ($tutors->isEmpty() || $students->isEmpty()) {
            $this->command->info('⚠️  Not enough tutors or students to create lessons');
            return;
        }

        // Past completed lesson
        $lessonDate = now()->subDays(5);
        Lesson::create([
            'tutor_id' => $tutors->first()->id,
            'student_id' => $students->first()->id,
            'lesson_date' => $lessonDate->format('Y-m-d'),
            'start_time' => '10:00:00',
            'end_time' => '11:00:00',
            'duration_minutes' => 60,
            'status' => 'completed',
            'language' => 'english',
            'topic' => 'Business English - Negotiations',
            'notes' => 'Great progress with negotiation vocabulary',
            'student_rating' => 5,
            'student_feedback' => 'Excellent lesson, very practical examples',
            'meeting_room_name' => 'room_' . uniqid(),
            'meeting_room_url' => 'https://meet.example.com/room_' . uniqid(),
        ]);

        // Upcoming scheduled lesson
        $futureDate = now()->addDays(2);
        Lesson::create([
            'tutor_id' => $tutors->first()->id,
            'student_id' => $students->first()->id,
            'lesson_date' => $futureDate->format('Y-m-d'),
            'start_time' => '14:00:00',
            'end_time' => '15:00:00',
            'duration_minutes' => 60,
            'status' => 'scheduled',
            'language' => 'english',
            'topic' => 'Business Presentations',
        ]);

        // Cancelled lesson
        $cancelledDate = now()->subDays(1);
        Lesson::create([
            'tutor_id' => $tutors->first()->id,
            'student_id' => $students->get(1)->id,
            'lesson_date' => $cancelledDate->format('Y-m-d'),
            'start_time' => '11:00:00',
            'end_time' => '11:45:00',
            'duration_minutes' => 45,
            'status' => 'cancelled',
            'language' => 'german',
            'topic' => 'Grammar Review',
            'cancellation_reason' => 'Student was sick',
            'cancelled_by' => 'student',
            'cancelled_at' => $cancelledDate,
        ]);

        // In progress lesson
        $todayDate = now();
        Lesson::create([
            'tutor_id' => $tutors->last()->id,
            'student_id' => $students->last()->id,
            'lesson_date' => $todayDate->format('Y-m-d'),
            'start_time' => $todayDate->copy()->subMinutes(30)->format('H:i:s'),
            'end_time' => $todayDate->copy()->addMinutes(30)->format('H:i:s'),
            'duration_minutes' => 60,
            'status' => 'in_progress',
            'language' => 'spanish',
            'topic' => 'Travel Conversations',
            'meeting_room_name' => 'room_' . uniqid(),
            'meeting_room_url' => 'https://meet.example.com/room_' . uniqid(),
        ]);

        // Scheduled lesson for tomorrow
        $tomorrowDate = now()->addDay();
        Lesson::create([
            'tutor_id' => $tutors->first()->id,
            'student_id' => $students->first()->id,
            'lesson_date' => $tomorrowDate->format('Y-m-d'),
            'start_time' => '16:00:00',
            'end_time' => '17:30:00',
            'duration_minutes' => 90,
            'status' => 'scheduled',
            'language' => 'french',
            'topic' => 'Introduction to French',
        ]);

        $this->command->info('✅ Created 5 lessons with various statuses');
    }

    /**
     * Create lesson materials
     */
    private function createLessonMaterials(): void
    {
        $this->command->info('📎 Creating lesson materials...');

        $lessons = Lesson::whereIn('status', ['completed', 'in_progress'])->get();

        if ($lessons->isEmpty()) {
            $this->command->info('⚠️  No lessons to attach materials to');
            return;
        }

        foreach ($lessons->take(2) as $lesson) {
            LessonMaterial::create([
                'lesson_id' => $lesson->id,
                'student_id' => $lesson->student_id,
                'tutor_id' => $lesson->tutor_id,
                'original_name' => 'lesson_worksheet_' . $lesson->id . '.pdf',
                'file_path' => 'materials/lessons/' . $lesson->id . '/worksheet.pdf',
                'file_size' => 256789,
                'mime_type' => 'application/pdf',
            ]);

            LessonMaterial::create([
                'lesson_id' => $lesson->id,
                'student_id' => $lesson->student_id,
                'tutor_id' => $lesson->tutor_id,
                'original_name' => 'audio_exercise_' . $lesson->id . '.mp3',
                'file_path' => 'materials/lessons/' . $lesson->id . '/audio.mp3',
                'file_size' => 4567890,
                'mime_type' => 'audio/mpeg',
            ]);
        }

        $this->command->info('✅ Created lesson materials');
    }

    /**
     * Create meeting sessions
     */
    private function createMeetingSessions(): void
    {
        $this->command->info('🎥 Creating meeting sessions...');

        $completedLesson = Lesson::where('status', 'completed')->first();
        $inProgressLesson = Lesson::where('status', 'in_progress')->first();

        if ($completedLesson) {
            $joinedAt = now()->subDays(5)->setHour(10)->setMinute(0);
            // Create sessions for tutor and student
            MeetingSession::create([
                'lesson_id' => $completedLesson->id,
                'participant_id' => $completedLesson->tutor_id,
                'room_name' => 'room_' . $completedLesson->id,
                'joined_at' => $joinedAt,
                'left_at' => $joinedAt->copy()->addMinutes($completedLesson->duration_minutes),
                'duration_seconds' => $completedLesson->duration_minutes * 60,
                'connection_quality' => 'good',
            ]);

            MeetingSession::create([
                'lesson_id' => $completedLesson->id,
                'participant_id' => $completedLesson->student_id,
                'room_name' => 'room_' . $completedLesson->id,
                'joined_at' => $joinedAt->copy()->addSeconds(30),
                'left_at' => $joinedAt->copy()->addMinutes($completedLesson->duration_minutes),
                'duration_seconds' => ($completedLesson->duration_minutes * 60) - 30,
                'connection_quality' => 'excellent',
            ]);
        }

        if ($inProgressLesson) {
            $joinedAt = now()->subMinutes(30);
            // Only tutor and student joined, no one left yet
            MeetingSession::create([
                'lesson_id' => $inProgressLesson->id,
                'participant_id' => $inProgressLesson->tutor_id,
                'room_name' => 'room_' . $inProgressLesson->id,
                'joined_at' => $joinedAt,
                'left_at' => null,
                'duration_seconds' => null,
                'connection_quality' => 'good',
            ]);

            MeetingSession::create([
                'lesson_id' => $inProgressLesson->id,
                'participant_id' => $inProgressLesson->student_id,
                'room_name' => 'room_' . $inProgressLesson->id,
                'joined_at' => $joinedAt->copy()->addMinutes(2),
                'left_at' => null,
                'duration_seconds' => null,
                'connection_quality' => 'fair',
            ]);
        }

        $this->command->info('✅ Created meeting sessions');
    }

    /**
     * Create admin audit logs
     */
    private function createAdminAuditLogs(): void
    {
        $this->command->info('📝 Creating admin audit logs...');

        $admin = User::where('role', User::ROLE_ADMIN)->first();
        $moderator = User::where('role', User::ROLE_MODERATOR)->first();

        if ($admin) {
            AdminAuditLog::create([
                'admin_user_id' => $admin->id,
                'action' => 'create',
                'model_type' => 'App\\Models\\User',
                'model_id' => User::where('role', User::ROLE_STUDENT)->first()->id ?? 1,
                'model_name' => 'Student Account',
                'new_values' => [
                    'role' => User::ROLE_STUDENT,
                    'status' => User::STATUS_ACTIVE
                ],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
                'description' => 'Created new student account',
            ]);

            AdminAuditLog::create([
                'admin_user_id' => $admin->id,
                'action' => 'update',
                'model_type' => 'App\\Models\\Package',
                'model_id' => Package::first()->id ?? 1,
                'model_name' => 'Pakiet Starter',
                'old_values' => ['price' => 300],
                'new_values' => ['price' => 350],
                'ip_address' => '192.168.1.100',
                'user_agent' => 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/91.0',
                'description' => 'Updated package price',
            ]);
        }

        if ($moderator) {
            AdminAuditLog::create([
                'admin_user_id' => $moderator->id,
                'action' => 'update',
                'model_type' => 'App\\Models\\TutorProfile',
                'model_id' => TutorProfile::where('is_verified', true)->first()->id ?? 1,
                'model_name' => 'Tutor Profile',
                'old_values' => ['verification_status' => 'pending'],
                'new_values' => ['verification_status' => 'approved', 'verified_at' => now()],
                'ip_address' => '192.168.1.101',
                'user_agent' => 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Safari/605.1.15',
                'description' => 'Verified tutor profile',
            ]);
        }

        $this->command->info('✅ Created admin audit logs');
    }

    /**
     * Create tutor availability logs
     */
    private function createTutorAvailabilityLogs(): void
    {
        $this->command->info('📊 Creating tutor availability logs...');

        $tutors = User::where('role', User::ROLE_TUTOR)->take(2)->get();

        foreach ($tutors as $tutor) {
            TutorAvailabilityLog::create([
                'tutor_id' => $tutor->id,
                'date' => now()->subDays(3),
                'action' => 'added',
                'new_slots' => ['9:00-12:00', '14:00-17:00'],
                'description' => 'Initial availability setup',
                'ip_address' => '192.168.1.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0',
            ]);

            TutorAvailabilityLog::create([
                'tutor_id' => $tutor->id,
                'date' => now(),
                'action' => 'updated',
                'old_slots' => ['9:00-12:00', '14:00-17:00'],
                'new_slots' => ['10:00-13:00', '15:00-18:00'],
                'description' => 'Updated available hours',
                'ip_address' => '192.168.1.' . rand(1, 255),
                'user_agent' => 'Mozilla/5.0',
            ]);
        }

        $this->command->info('✅ Created tutor availability logs');
    }
}