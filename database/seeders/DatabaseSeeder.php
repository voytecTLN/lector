<?php
// database/seeders/DatabaseSeeder.php - Kompletny seeder do testowania aplikacji

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\User;
use App\Models\StudentProfile;
use App\Models\TutorProfile;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        $this->command->info('🌱 Seeding database with test data...');

        // Create Admin Users
        $this->createAdminUsers();

        // Create Moderator Users
        $this->createModeratorUsers();

        // Create Tutor Users with Profiles
        $this->createTutorUsers();

        // Create Student Users with Profiles
        $this->createStudentUsers();

        $this->command->info('✅ Database seeding completed successfully!');
        $this->command->info('📧 Login credentials:');
        $this->command->info('   Admin: admin@test.com / password');
        $this->command->info('   Moderator: moderator@test.com / password');
        $this->command->info('   Tutor: anna.kowalska@test.com / password');
        $this->command->info('   Student: jan.nowak@test.com / password');
    }

    /**
     * Create admin users
     */
    private function createAdminUsers(): void
    {
        $this->command->info('👑 Creating admin users...');

        User::create([
            'name' => 'Super Administrator',
            'email' => 'admin@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'phone' => '+48 123 456 789',
            'city' => 'Warszawa',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(30),
        ]);

        User::create([
            'name' => 'Tomasz Administratorski',
            'email' => 'tomasz.admin@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'phone' => '+48 987 654 321',
            'city' => 'Kraków',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(25),
        ]);
    }

    /**
     * Create moderator users
     */
    private function createModeratorUsers(): void
    {
        $this->command->info('🛡️  Creating moderator users...');

        User::create([
            'name' => 'Moderator Główny',
            'email' => 'moderator@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_MODERATOR,
            'phone' => '+48 555 123 456',
            'city' => 'Gdańsk',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(20),
        ]);

        User::create([
            'name' => 'Agnieszka Moderatorska',
            'email' => 'agnieszka.mod@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_MODERATOR,
            'phone' => '+48 555 987 654',
            'city' => 'Wrocław',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(18),
        ]);
    }

    /**
     * Create tutor users with profiles
     */
    private function createTutorUsers(): void
    {
        $this->command->info('👩‍🏫 Creating tutor users...');

        // Tutor 1 - Anna Kowalska
        $tutor1 = User::create([
            'name' => 'Anna Kowalska',
            'email' => 'anna.kowalska@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TUTOR,
            'phone' => '+48 600 111 222',
            'birth_date' => '1985-03-15',
            'city' => 'Warszawa',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(15),
        ]);

        TutorProfile::create([
            'user_id' => $tutor1->id,
            'languages' => ['english', 'german'],
            'specializations' => ['business', 'exam', 'conversation'],
            'hourly_rate' => 80.00,
            'description' => 'Doświadczona lektorka z 8-letnim stażem. Specjalizuję się w języku biznesowym i przygotowaniu do egzaminów międzynarodowych. Posiadam certyfikaty CELTA i TESOL.',
            'weekly_availability' => [
                'monday' => ['09:00-12:00', '14:00-18:00'],
                'tuesday' => ['09:00-12:00', '14:00-18:00'],
                'wednesday' => ['09:00-12:00', '14:00-18:00'],
                'thursday' => ['09:00-12:00', '14:00-18:00'],
                'friday' => ['09:00-12:00', '14:00-16:00'],
                'saturday' => ['10:00-14:00'],
                'sunday' => []
            ]
        ]);

        // Tutor 2 - Piotr Schmidt
        $tutor2 = User::create([
            'name' => 'Piotr Schmidt',
            'email' => 'piotr.schmidt@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TUTOR,
            'phone' => '+48 600 222 333',
            'birth_date' => '1990-07-22',
            'city' => 'Kraków',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(12),
        ]);

        TutorProfile::create([
            'user_id' => $tutor2->id,
            'languages' => ['german', 'french'],
            'specializations' => ['conversation', 'grammar', 'pronunciation'],
            'hourly_rate' => 75.00,
            'description' => 'Native speaker języka niemieckiego z francuskim jako drugim językiem ojczystym. 5 lat doświadczenia w nauczaniu online. Specjalizuję się w konwersacjach i poprawie wymowy.',
            'weekly_availability' => [
                'monday' => ['16:00-20:00'],
                'tuesday' => ['16:00-20:00'],
                'wednesday' => ['16:00-20:00'],
                'thursday' => ['16:00-20:00'],
                'friday' => ['16:00-20:00'],
                'saturday' => ['09:00-15:00'],
                'sunday' => ['09:00-15:00']
            ]
        ]);

        // Tutor 3 - Maria Silva
        $tutor3 = User::create([
            'name' => 'Maria Silva',
            'email' => 'maria.silva@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TUTOR,
            'phone' => '+48 600 333 444',
            'birth_date' => '1988-11-08',
            'city' => 'Gdańsk',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(10),
        ]);

        TutorProfile::create([
            'user_id' => $tutor3->id,
            'languages' => ['spanish', 'italian', 'portuguese'],
            'specializations' => ['grammar', 'exam', 'academic'],
            'hourly_rate' => 70.00,
            'description' => 'Absolwentka filologii romańskiej z doktoratem z językoznawstwa. 10 lat doświadczenia w nauczaniu języków romańskich. Specjalizuję się w gramatyce i przygotowaniu do egzaminów.',
            'weekly_availability' => [
                'monday' => ['08:00-14:00'],
                'tuesday' => ['08:00-14:00'],
                'wednesday' => ['08:00-14:00'],
                'thursday' => ['08:00-14:00'],
                'friday' => ['08:00-14:00'],
                'saturday' => [],
                'sunday' => []
            ]
        ]);

        // Tutor 4 - John Smith
        $tutor4 = User::create([
            'name' => 'John Smith',
            'email' => 'john.smith@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TUTOR,
            'phone' => '+48 600 444 555',
            'birth_date' => '1982-05-12',
            'city' => 'Wrocław',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(8),
        ]);

        TutorProfile::create([
            'user_id' => $tutor4->id,
            'languages' => ['english'],
            'specializations' => ['business', 'conversation', 'pronunciation'],
            'hourly_rate' => 90.00,
            'description' => 'Native speaker z Wielkiej Brytanii z 12-letnim doświadczeniem w nauczaniu Business English. Pracowałem z największymi korporacjami w Polsce. Specjalizuję się w prezentacjach i negocjacjach.',
            'weekly_availability' => [
                'monday' => ['10:00-16:00'],
                'tuesday' => ['10:00-16:00'],
                'wednesday' => ['10:00-16:00'],
                'thursday' => ['10:00-16:00'],
                'friday' => ['10:00-16:00'],
                'saturday' => ['09:00-13:00'],
                'sunday' => []
            ]
        ]);
    }

    /**
     * Create student users with profiles
     */
    private function createStudentUsers(): void
    {
        $this->command->info('🎓 Creating student users...');

        // Student 1 - Jan Nowak
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
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(7),
        ]);

        StudentProfile::create([
            'user_id' => $student1->id,
            'learning_languages' => ['english', 'german'],
            'current_levels' => [
                'english' => 'B2',
                'german' => 'A2'
            ],
            'learning_goals' => ['business', 'conversation', 'exam'],
            'preferred_schedule' => [
                'preferred_days' => ['monday', 'wednesday', 'friday'],
                'preferred_times' => ['evening'],
                'lesson_duration' => 60,
                'frequency' => 'twice_per_week'
            ]
        ]);

        // Student 2 - Katarzyna Wiśniewska
        $student2 = User::create([
            'name' => 'Katarzyna Wiśniewska',
            'email' => 'katarzyna.wisniewski@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 222 333',
            'birth_date' => '1992-08-15',
            'city' => 'Kraków',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(5),
        ]);

        StudentProfile::create([
            'user_id' => $student2->id,
            'learning_languages' => ['spanish', 'italian'],
            'current_levels' => [
                'spanish' => 'A1',
                'italian' => 'A1'
            ],
            'learning_goals' => ['travel', 'conversation'],
            'preferred_schedule' => [
                'preferred_days' => ['tuesday', 'thursday', 'saturday'],
                'preferred_times' => ['morning', 'afternoon'],
                'lesson_duration' => 45,
                'frequency' => 'once_per_week'
            ]
        ]);

        // Student 3 - Michał Kowalczyk
        $student3 = User::create([
            'name' => 'Michał Kowalczyk',
            'email' => 'michal.kowalczyk@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 333 444',
            'birth_date' => '1988-12-03',
            'city' => 'Gdańsk',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(3),
        ]);

        StudentProfile::create([
            'user_id' => $student3->id,
            'learning_languages' => ['english', 'french'],
            'current_levels' => [
                'english' => 'C1',
                'french' => 'B1'
            ],
            'learning_goals' => ['academic', 'exam', 'business'],
            'preferred_schedule' => [
                'preferred_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                'preferred_times' => ['morning'],
                'lesson_duration' => 90,
                'frequency' => 'three_times_per_week'
            ]
        ]);

        // Student 4 - Anna Zielińska
        $student4 = User::create([
            'name' => 'Anna Zielińska',
            'email' => 'anna.zielinska@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 444 555',
            'birth_date' => '1999-04-25',
            'city' => 'Wrocław',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(2),
        ]);

        StudentProfile::create([
            'user_id' => $student4->id,
            'learning_languages' => ['english', 'spanish', 'german'],
            'current_levels' => [
                'english' => 'B1',
                'spanish' => 'A2',
                'german' => 'A1'
            ],
            'learning_goals' => ['conversation', 'travel', 'academic'],
            'preferred_schedule' => [
                'preferred_days' => ['saturday', 'sunday'],
                'preferred_times' => ['afternoon', 'evening'],
                'lesson_duration' => 60,
                'frequency' => 'once_per_week'
            ]
        ]);

        // Student 5 - Piotr Dąbrowski
        $student5 = User::create([
            'name' => 'Piotr Dąbrowski',
            'email' => 'piotr.dabrowski@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 555 666',
            'birth_date' => '1985-09-10',
            'city' => 'Poznań',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'is_verified' => true,
            'email_verified_at' => now(),
            'created_at' => now()->subDays(1),
        ]);

        StudentProfile::create([
            'user_id' => $student5->id,
            'learning_languages' => ['english'],
            'current_levels' => [
                'english' => 'A2'
            ],
            'learning_goals' => ['business', 'exam'],
            'preferred_schedule' => [
                'preferred_days' => ['monday', 'wednesday', 'friday'],
                'preferred_times' => ['evening'],
                'lesson_duration' => 60,
                'frequency' => 'twice_per_week'
            ]
        ]);

        // Student 6 - Inactive student for testing
        $student6 = User::create([
            'name' => 'Testowy Student Nieaktywny',
            'email' => 'inactive.student@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 666 777',
            'birth_date' => '1990-06-15',
            'city' => 'Łódź',
            'country' => 'Polska',
            'status' => User::STATUS_INACTIVE,
            'is_verified' => false,
            'created_at' => now()->subMonths(2),
        ]);

        StudentProfile::create([
            'user_id' => $student6->id,
            'learning_languages' => ['english'],
            'current_levels' => [
                'english' => 'A1'
            ],
            'learning_goals' => ['conversation'],
            'preferred_schedule' => [
                'preferred_days' => ['saturday'],
                'preferred_times' => ['morning'],
                'lesson_duration' => 45,
                'frequency' => 'once_per_week'
            ]
        ]);
    }
}