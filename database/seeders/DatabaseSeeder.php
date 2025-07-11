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
        $this->command->info('👑 Creating admin users...');

        // Admin 1 - Administrator Główny
        $this->createUserIfNotExists([
            'name' => 'Administrator Główny',
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
        ]);

        // Admin 2 - Tomasz Administratorski
        $this->createUserIfNotExists([
            'name' => 'Tomasz Administratorski',
            'email' => 'tomasz.admin@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_ADMIN,
            'phone' => '+48 987 654 321',
            'city' => 'Kraków',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(180),
            'created_at' => now()->subDays(180),
        ]);
    }

    /**
     * Create moderator users
     */
    private function createModeratorUsers(): void
    {
        $this->command->info('🛡️  Creating moderator users...');

        // Moderator 1 - Moderator Główny
        $this->createUserIfNotExists([
            'name' => 'Moderator Główny',
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
        ]);

        // Moderator 2 - Agnieszka Moderatorska
        $this->createUserIfNotExists([
            'name' => 'Agnieszka Moderatorska',
            'email' => 'agnieszka.mod@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_MODERATOR,
            'phone' => '+48 555 987 654',
            'city' => 'Wrocław',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(60),
            'created_at' => now()->subDays(60),
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
            'name' => 'Pakiet Próbny',
            'description' => 'Idealny na początek - poznaj swojego lektora',
            'hours_count' => 5,
            'price' => 350.00,
            'validity_days' => 30,
            'is_active' => true,
            'sort_order' => 1,
            'color' => '#10b981', // green
        ]);

        $packages[] = Package::create([
            'name' => 'Pakiet Standardowy',
            'description' => 'Najpopularniejszy wybór - optymalne tempo nauki',
            'hours_count' => 10,
            'price' => 650.00,
            'validity_days' => 60,
            'is_active' => true,
            'sort_order' => 2,
            'color' => '#3b82f6', // blue
        ]);

        $packages[] = Package::create([
            'name' => 'Pakiet Rozszerzony',
            'description' => 'Dla zdeterminowanych - szybkie postępy',
            'hours_count' => 20,
            'price' => 1200.00,
            'validity_days' => 90,
            'is_active' => true,
            'sort_order' => 3,
            'color' => '#8b5cf6', // purple
        ]);

        $packages[] = Package::create([
            'name' => 'Pakiet Premium',
            'description' => 'Maksymalne zaangażowanie - najlepsze rezultaty',
            'hours_count' => 40,
            'price' => 2200.00,
            'validity_days' => 120,
            'is_active' => true,
            'sort_order' => 4,
            'color' => '#f59e0b', // amber
        ]);

        $packages[] = Package::create([
            'name' => 'Pakiet Intensywny',
            'description' => 'Kurs intensywny - szybkie rezultaty',
            'hours_count' => 30,
            'price' => 1650.00,
            'validity_days' => 45,
            'is_active' => true,
            'sort_order' => 5,
            'color' => '#ef4444', // red
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

        // Tutor 1 - Anna Kowalska (Verified)
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

        // Tutor 2 - Piotr Wiśniewski (Verified)
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
            'email_verified_at' => now()->subDays(120),
            'created_at' => now()->subDays(120),
        ]);

        TutorProfile::create([
            'user_id' => $tutor2->id,
            'languages' => ['german', 'french'],
            'specializations' => ['conversation', 'grammar', 'pronunciation'],
            'description' => 'Native speaker języka niemieckiego. Uczę niemieckiego i francuskiego na wszystkich poziomach. Stawiam na praktyczne wykorzystanie języka w codziennych sytuacjach.',
            'years_experience' => 5,
            'certifications' => ['TestDaF', 'Goethe-Zertifikat C2'],
            'education' => ['Licencjat z Lingwistyki Stosowanej - Uniwersytet Jagielloński'],
            'average_rating' => 4.9,
            'total_lessons' => 780,
            'total_students' => 56,
            'is_accepting_students' => true,
            'max_students_per_week' => 20,
            'lesson_types' => ['individual', 'conversation'],
            'is_verified' => true,
            'verified_at' => now()->subDays(115),
            'verification_status' => TutorProfile::VERIFICATION_APPROVED,
        ]);

        // Tutor 3 - Maria Dąbrowska (Verified)
        $tutor3 = User::create([
            'name' => 'Maria Dąbrowska',
            'email' => 'maria.dabrowska@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TUTOR,
            'phone' => '+48 600 333 444',
            'birth_date' => '1988-11-08',
            'city' => 'Gdańsk',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(200),
            'created_at' => now()->subDays(200),
        ]);

        TutorProfile::create([
            'user_id' => $tutor3->id,
            'languages' => ['spanish', 'italian', 'portuguese'],
            'specializations' => ['grammar', 'exam', 'academic'],
            'description' => 'Jestem pasjonatką języków romańskich. Ukończyłam studia doktoranckie z językoznawstwa. Przygotowuję do egzaminów DELE, CILS i innych certyfikatów.',
            'years_experience' => 10,
            'certifications' => ['DELE C2', 'CILS C2', 'CELPE-Bras'],
            'education' => ['Doktor nauk humanistycznych - Uniwersytet Gdański', 'Magister Filologii Romańskiej'],
            'average_rating' => 4.7,
            'total_lessons' => 2100,
            'total_students' => 143,
            'is_accepting_students' => true,
            'max_students_per_week' => 15,
            'lesson_types' => ['individual', 'group', 'academic'],
            'is_verified' => true,
            'verified_at' => now()->subDays(195),
            'verification_status' => TutorProfile::VERIFICATION_APPROVED,
        ]);

        // Tutor 4 - James Wilson (Pending verification)
        $tutor4 = User::create([
            'name' => 'James Wilson',
            'email' => 'james.wilson@test.com',
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
            'description' => 'Native English speaker from the UK. Experienced Business English teacher. I specialize in presentation skills and negotiation techniques.',
            'years_experience' => 12,
            'certifications' => [],
            'education' => ['MBA - Oxford University'],
            'average_rating' => 0,
            'total_lessons' => 0,
            'total_students' => 0,
            'is_accepting_students' => true,
            'max_students_per_week' => 30,
            'lesson_types' => ['individual', 'group'],
            'is_verified' => false,
            'verification_status' => TutorProfile::VERIFICATION_PENDING,
            'verification_notes' => 'Nowy lektor - dokumenty w trakcie weryfikacji',
        ]);

        // Tutor 5 - Katarzyna Zielińska (Rejected)
        $tutor5 = User::create([
            'name' => 'Katarzyna Zielińska',
            'email' => 'katarzyna.zielinska@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_TUTOR,
            'phone' => '+48 600 555 666',
            'birth_date' => '1995-09-20',
            'city' => 'Łódź',
            'country' => 'Polska',
            'status' => User::STATUS_INACTIVE,
            'email_verified_at' => now()->subDays(30),
            'created_at' => now()->subDays(30),
        ]);

        TutorProfile::create([
            'user_id' => $tutor5->id,
            'languages' => ['russian', 'chinese'],
            'specializations' => ['conversation'],
            'description' => 'Uczę języka rosyjskiego i chińskiego.',
            'years_experience' => 2,
            'certifications' => [],
            'education' => ['Student Sinologii'],
            'average_rating' => 0,
            'total_lessons' => 0,
            'total_students' => 0,
            'is_accepting_students' => false,
            'max_students_per_week' => 10,
            'lesson_types' => ['individual'],
            'is_verified' => false,
            'verification_status' => TutorProfile::VERIFICATION_REJECTED,
            'verification_notes' => 'Brak wymaganych kwalifikacji',
            'verified_at' => now()->subDays(25),
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

        // Student 1 - Jan Nowak (Active with package)
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
            'package_id' => $packages[2]->id, // Pakiet Rozszerzony
            'assigned_at' => now()->subDays(10),
            'expires_at' => now()->addDays(80),
            'hours_remaining' => 15.5,
            'is_active' => true,
            'notes' => 'Student bardzo zmotywowany, regularnie uczestniczy w lekcjach',
        ]);

        // Student 2 - Alicja Kowalczyk (Active with package)
        $student2 = User::create([
            'name' => 'Alicja Kowalczyk',
            'email' => 'alicja.kowalczyk@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 222 333',
            'birth_date' => '1998-03-15',
            'city' => 'Kraków',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(60),
            'created_at' => now()->subDays(60),
        ]);

        StudentProfile::create([
            'user_id' => $student2->id,
            'learning_languages' => ['spanish', 'french'],
            'current_levels' => json_encode([
                'spanish' => 'B1',
                'french' => 'A1'
            ]),
            'learning_goals' => ['travel', 'conversation'],
            'preferred_schedule' => json_encode([
                'preferred_days' => ['tuesday', 'thursday'],
                'preferred_times' => ['morning'],
                'lesson_duration' => 45,
            ])
        ]);

        // Assign package to student 2
        PackageAssignment::create([
            'student_id' => $student2->id,
            'package_id' => $packages[1]->id, // Pakiet Standardowy
            'assigned_at' => now()->subDays(5),
            'expires_at' => now()->addDays(55),
            'hours_remaining' => 8.0,
            'is_active' => true,
        ]);

        // Student 3 - Michał Lewandowski (Active, no package)
        $student3 = User::create([
            'name' => 'Michał Lewandowski',
            'email' => 'michal.lewandowski@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 333 444',
            'birth_date' => '1992-07-10',
            'city' => 'Gdańsk',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(30),
            'created_at' => now()->subDays(30),
        ]);

        StudentProfile::create([
            'user_id' => $student3->id,
            'learning_languages' => ['english'],
            'current_levels' => json_encode([
                'english' => 'C1'
            ]),
            'learning_goals' => ['exam', 'academic'],
            'preferred_schedule' => json_encode([
                'preferred_days' => ['saturday', 'sunday'],
                'preferred_times' => ['afternoon'],
                'lesson_duration' => 90,
            ])
        ]);

        // Student 4 - Ewa Wójcik (Active with expired package)
        $student4 = User::create([
            'name' => 'Ewa Wójcik',
            'email' => 'ewa.wojcik@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 444 555',
            'birth_date' => '2000-11-25',
            'city' => 'Wrocław',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(90),
            'created_at' => now()->subDays(90),
        ]);

        StudentProfile::create([
            'user_id' => $student4->id,
            'learning_languages' => ['german', 'italian'],
            'current_levels' => json_encode([
                'german' => 'B1',
                'italian' => 'A2'
            ]),
            'learning_goals' => ['business', 'conversation'],
        ]);

        // Expired package
        PackageAssignment::create([
            'student_id' => $student4->id,
            'package_id' => $packages[0]->id, // Pakiet Próbny
            'assigned_at' => now()->subDays(40),
            'expires_at' => now()->subDays(10),
            'hours_remaining' => 0,
            'is_active' => false,
            'notes' => 'Pakiet wygasł - student rozważa zakup kolejnego',
        ]);

        // Student 5 - Piotr Kamiński (Inactive)
        $student5 = User::create([
            'name' => 'Piotr Kamiński',
            'email' => 'piotr.kaminski@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 555 666',
            'birth_date' => '1988-04-05',
            'city' => 'Poznań',
            'country' => 'Polska',
            'status' => User::STATUS_INACTIVE,
            'email_verified_at' => now()->subDays(120),
            'created_at' => now()->subDays(120),
        ]);

        StudentProfile::create([
            'user_id' => $student5->id,
            'learning_languages' => ['english'],
            'current_levels' => json_encode([
                'english' => 'B2'
            ]),
            'learning_goals' => ['business'],
        ]);

        // Student 6 - Testowy Niezweryfikowany (Unverified)
        $student6 = User::create([
            'name' => 'Testowy Niezweryfikowany',
            'email' => 'unverified.student@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 666 777',
            'birth_date' => '1990-06-15',
            'city' => 'Łódź',
            'country' => 'Polska',
            'status' => User::STATUS_UNVERIFIED,
            'email_verified_at' => null,
            'created_at' => now()->subDays(2),
        ]);

        StudentProfile::create([
            'user_id' => $student6->id,
            'learning_languages' => ['english'],
            'current_levels' => json_encode([
                'english' => 'A1'
            ]),
            'learning_goals' => ['conversation'],
        ]);

        // Student 7 - Anna Zielińska (Blocked)
        $student7 = User::create([
            'name' => 'Anna Zielińska',
            'email' => 'anna.zielinska@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 777 888',
            'birth_date' => '1994-09-30',
            'city' => 'Katowice',
            'country' => 'Polska',
            'status' => User::STATUS_BLOCKED,
            'email_verified_at' => now()->subDays(100),
            'created_at' => now()->subDays(100),
        ]);

        StudentProfile::create([
            'user_id' => $student7->id,
            'learning_languages' => ['french'],
            'current_levels' => json_encode([
                'french' => 'B1'
            ]),
            'learning_goals' => ['exam'],
        ]);

        // Student 8 - Krzysztof Mazur (Active with Premium package)
        $student8 = User::create([
            'name' => 'Krzysztof Mazur',
            'email' => 'krzysztof.mazur@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 888 999',
            'birth_date' => '1985-12-20',
            'city' => 'Szczecin',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(15),
            'created_at' => now()->subDays(15),
            'last_login_at' => now()->subHours(1),
        ]);

        StudentProfile::create([
            'user_id' => $student8->id,
            'learning_languages' => ['english', 'spanish', 'chinese'],
            'current_levels' => json_encode([
                'english' => 'C1',
                'spanish' => 'B2',
                'chinese' => 'A1'
            ]),
            'learning_goals' => ['business', 'exam', 'academic'],
            'preferred_schedule' => json_encode([
                'preferred_days' => ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
                'preferred_times' => ['evening'],
                'lesson_duration' => 60,
            ])
        ]);

        // Assign Premium package
        PackageAssignment::create([
            'student_id' => $student8->id,
            'package_id' => $packages[3]->id, // Pakiet Premium
            'assigned_at' => now()->subDays(7),
            'expires_at' => now()->addDays(113),
            'hours_remaining' => 38.0,
            'is_active' => true,
            'notes' => 'VIP student - CEO firmy międzynarodowej',
        ]);

        // Student 9 - Monika Pawlak (Active with intensive package)
        $student9 = User::create([
            'name' => 'Monika Pawlak',
            'email' => 'monika.pawlak@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 999 000',
            'birth_date' => '1997-02-14',
            'city' => 'Lublin',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(20),
            'created_at' => now()->subDays(20),
        ]);

        StudentProfile::create([
            'user_id' => $student9->id,
            'learning_languages' => ['german'],
            'current_levels' => json_encode([
                'german' => 'A2'
            ]),
            'learning_goals' => ['exam', 'travel'],
            'preferred_schedule' => json_encode([
                'preferred_days' => ['monday', 'tuesday', 'wednesday', 'thursday'],
                'preferred_times' => ['morning', 'afternoon'],
                'lesson_duration' => 90,
            ])
        ]);

        // Assign Intensive package
        PackageAssignment::create([
            'student_id' => $student9->id,
            'package_id' => $packages[4]->id, // Pakiet Intensywny
            'assigned_at' => now()->subDays(3),
            'expires_at' => now()->addDays(42),
            'hours_remaining' => 27.5,
            'is_active' => true,
            'notes' => 'Przygotowanie do wyjazdu służbowego do Niemiec',
        ]);

        // Student 10 - Robert Kaczmarek (Active, multiple packages history)
        $student10 = User::create([
            'name' => 'Robert Kaczmarek',
            'email' => 'robert.kaczmarek@test.com',
            'password' => Hash::make('password'),
            'role' => User::ROLE_STUDENT,
            'phone' => '+48 700 000 111',
            'birth_date' => '1991-08-08',
            'city' => 'Białystok',
            'country' => 'Polska',
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now()->subDays(180),
            'created_at' => now()->subDays(180),
            'last_login_at' => now()->subDays(1),
        ]);

        StudentProfile::create([
            'user_id' => $student10->id,
            'learning_languages' => ['english'],
            'current_levels' => json_encode([
                'english' => 'B2'
            ]),
            'learning_goals' => ['conversation', 'pronunciation'],
        ]);

        // Old expired package
        PackageAssignment::create([
            'student_id' => $student10->id,
            'package_id' => $packages[0]->id,
            'assigned_at' => now()->subDays(150),
            'expires_at' => now()->subDays(120),
            'hours_remaining' => 0,
            'is_active' => false,
        ]);

        // Another expired package
        PackageAssignment::create([
            'student_id' => $student10->id,
            'package_id' => $packages[1]->id,
            'assigned_at' => now()->subDays(90),
            'expires_at' => now()->subDays(30),
            'hours_remaining' => 0,
            'is_active' => false,
        ]);

        // Current active package
        PackageAssignment::create([
            'student_id' => $student10->id,
            'package_id' => $packages[1]->id,
            'assigned_at' => now()->subDays(15),
            'expires_at' => now()->addDays(45),
            'hours_remaining' => 7.0,
            'is_active' => true,
            'notes' => 'Stały klient - trzeci zakupiony pakiet',
        ]);
    }
}