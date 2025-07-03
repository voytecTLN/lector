<?php
// database/seeders/DatabaseSeeder.php - Poprawiony seeder

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
            'email_verified_at' => now()->subDays(30),
            'created_at' => now()->subDays(30),
            'last_login_at' => now()->subDays(1),
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
            'email_verified_at' => now()->subDays(25),
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
            'email_verified_at' => now()->subDays(20),
            'created_at' => now()->subDays(20),
            'last_login_at' => now()->subHours(3),
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
            'email_verified_at' => now()->subDays(18),
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
            'email_verified_at' => now()->subDays(90),
            'created_at' => now()->subDays(90),
            'last_login_at' => now()->subHours(2),
        ]);

        TutorProfile::create([
            'user_id' => $tutor1->id,
            'languages' => ['english', 'german'],
            'specializations' => ['business', 'exam', 'conversation'],
            'hourly_rate' => 80.00,
            'description' => 'Doświadczona lektorka z 8-letnim stażem. Specjalizuję się w języku biznesowym i przygotowaniu do egzaminów międzynarodowych. Posiadam certyfikaty CELTA i TESOL.',
            'years_experience' => 8,
            'certifications' => [
                ['name' => 'CELTA', 'year' => '2016'],
                ['name' => 'TESOL', 'year' => '2018'],
                ['name' => 'Cambridge CPE', 'year' => '2014']
            ],
            'education' => [
                ['degree' => 'Magister', 'field' => 'Filologia Angielska', 'university' => 'Uniwersytet Warszawski', 'year' => '2015']
            ],
            'average_rating' => 4.8,
            'total_lessons' => 1250,
            'total_students' => 89,
            'is_accepting_students' => true,
            'max_students_per_week' => 25,
            'lesson_types' => ['individual', 'group', 'intensive'],
            'is_verified' => true,
            'verified_at' => now()->subDays(85),
            'verification_status' => TutorProfile::VERIFICATION_APPROVED,
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
            'email_verified_at' => now()->subDays(60),
            'created_at' => now()->subDays(60),
        ]);

        TutorProfile::create([
            'user_id' => $tutor2->id,
            'languages' => ['german', 'french'],
            'specializations' => ['conversation', 'grammar', 'pronunciation'],
            'hourly_rate' => 75.00,
            'description' => 'Native speaker języka niemieckiego z francuskim jako drugim językiem ojczystym. 5 lat doświadczenia w nauczaniu online. Specjalizuję się w konwersacjach i poprawie wymowy.',
            'years_experience' => 5,
            'certifications' => [
                ['name' => 'TestDaF', 'year' => '2019'],
                ['name' => 'DALF C2', 'year' => '2020']
            ],
            'education' => [
                ['degree' => 'Licencjat', 'field' => 'Lingwistyka Stosowana', 'university' => 'Uniwersytet Jagielloński', 'year' => '2018']
            ],
            'average_rating' => 4.9,
            'total_lessons' => 780,
            'total_students' => 56,
            'is_accepting_students' => true,
            'max_students_per_week' => 20,
            'lesson_types' => ['individual', 'conversation'],
            'is_verified' => true,
            'verified_at' => now()->subDays(55),
            'verification_status' => TutorProfile::VERIFICATION_APPROVED,
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
            'email_verified_at' => now()->subDays(120),
            'created_at' => now()->subDays(120),
            'last_login_at' => now()->subDays(2),
        ]);

        TutorProfile::create([
            'user_id' => $tutor3->id,
            'languages' => ['spanish', 'italian', 'portuguese'],
            'specializations' => ['grammar', 'exam', 'academic'],
            'hourly_rate' => 70.00,
            'description' => 'Absolwentka filologii romańskiej z doktoratem z językoznawstwa. 10 lat doświadczenia w nauczaniu języków romańskich. Specjalizuję się w gramatyce i przygotowaniu do egzaminów.',
            'years_experience' => 10,
            'certifications' => [
                ['name' => 'DELE C2', 'year' => '2012'],
                ['name' => 'CILS C2', 'year' => '2013'],
                ['name' => 'CELPE-Bras', 'year' => '2014'],
                ['name' => 'Doktorat', 'year' => '2018']
            ],
            'education' => [
                ['degree' => 'Doktor', 'field' => 'Językoznawstwo Romańskie', 'university' => 'Uniwersytet Gdański', 'year' => '2018'],
                ['degree' => 'Magister', 'field' => 'Filologia Romańska', 'university' => 'Uniwersytet Gdański', 'year' => '2013']
            ],
            'average_rating' => 4.7,
            'total_lessons' => 2100,
            'total_students' => 143,
            'is_accepting_students' => true,
            'max_students_per_week' => 15,
            'lesson_types' => ['individual', 'group', 'academic'],
            'is_verified' => true,
            'verified_at' => now()->subDays(115),
            'verification_status' => TutorProfile::VERIFICATION_APPROVED,
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

        // Tutor 4 - John Smith (niezweryfikowany dla testów)
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
            'email_verified_at' => now()->subDays(5),
            'created_at' => now()->subDays(5),
        ]);

        TutorProfile::create([
            'user_id' => $tutor4->id,
            'languages' => ['english'],
            'specializations' => ['business', 'conversation', 'pronunciation'],
            'hourly_rate' => 90.00,
            'description' => 'Native speaker z Wielkiej Brytanii z 12-letnim doświadczeniem w nauczaniu Business English. Pracowałem z największymi korporacjami w Polsce. Specjalizuję się w prezentacjach i negocjacjach.',
            'years_experience' => 12,
            'certifications' => [],
            'education' => [
                ['degree' => 'Master', 'field' => 'Business Administration', 'university' => 'Oxford University', 'year' => '2010']
            ],
            'average_rating' => 0,
            'total_lessons' => 0,
            'total_students' => 0,
            'is_accepting_students' => true,
            'max_students_per_week' => 30,
            'lesson_types' => ['individual', 'group'],
            'is_verified' => false,
            'verified_at' => null,
            'verification_status' => TutorProfile::VERIFICATION_PENDING,
            'verification_notes' => 'Nowy lektor - oczekuje na weryfikację dokumentów',
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
            'email_verified_at' => now()->subDays(45),
            'created_at' => now()->subDays(45),
            'last_login_at' => now()->subHours(6),
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

        // Student 6 - Nieaktywny i niezweryfikowany student dla testów
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
            'email_verified_at' => null, // Niezweryfikowany
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