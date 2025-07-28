<?php

namespace Database\Seeders;

use App\Models\Lesson;
use App\Models\Package;
use App\Models\PackageAssignment;
use App\Models\TutorAvailabilitySlot;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class TestDataSeeder extends Seeder
{
    public function run(): void
    {
        $this->command->info('🌱 Creating test data...');
        
        // Update package prices
        $this->updatePackagePrices();
        
        // Create tutor availability
        $this->createTutorAvailability();
        
        // Create lessons
        $this->createLessons();
        
        $this->command->info('✅ Test data created successfully!');
    }
    
    private function updatePackagePrices(): void
    {
        $this->command->info('💰 Updating package prices...');
        
        $packages = [
            ['hours' => 5, 'price' => 5000],    // 50 PLN (stored in grosze)
            ['hours' => 10, 'price' => 10000],  // 100 PLN
            ['hours' => 20, 'price' => 18000],  // 180 PLN
            ['hours' => 30, 'price' => 25000],  // 250 PLN
        ];
        
        foreach ($packages as $package) {
            $updated = Package::where('hours_count', $package['hours'])
                ->update(['price' => $package['price']]);
            
            if ($updated) {
                $this->command->info("   Updated {$package['hours']}h package to " . number_format($package['price'] / 100, 2) . " PLN");
            }
        }
        
        // If packages don't exist, create them
        foreach ($packages as $package) {
            $exists = Package::where('hours_count', $package['hours'])->exists();
            if (!$exists) {
                Package::create([
                    'name' => "Pakiet {$package['hours']} godzin",
                    'description' => "Pakiet {$package['hours']} godzin lekcyjnych",
                    'hours_count' => $package['hours'],
                    'price' => $package['price'],
                    'is_active' => true,
                    'validity_days' => $package['hours'] <= 10 ? 30 : 60,
                    'sort_order' => $package['hours'],
                    'color' => $this->getPackageColor($package['hours']),
                ]);
                $this->command->info("   Created new {$package['hours']}h package");
            }
        }
    }
    
    private function getPackageColor(int $hours): string
    {
        $colors = [
            5 => '#22c55e',   // green
            10 => '#3b82f6',  // blue
            20 => '#a855f7',  // purple
            30 => '#f59e0b',  // amber
        ];
        
        return $colors[$hours] ?? '#6b7280';
    }
    
    private function createTutorAvailability(): void
    {
        $this->command->info('📅 Creating tutor availability slots...');
        
        $tutors = User::where('role', 'tutor')->get();
        
        if ($tutors->isEmpty()) {
            $this->command->warn('   No tutors found! Run main seeder first.');
            return;
        }
        
        foreach ($tutors as $tutor) {
            // Clear existing slots
            TutorAvailabilitySlot::where('tutor_id', $tutor->id)->delete();
            
            // Create availability for next 4 weeks
            $startDate = Carbon::now()->startOfWeek();
            
            for ($week = 0; $week < 4; $week++) {
                $weekStart = $startDate->copy()->addWeeks($week);
                
                // Monday to Friday
                for ($day = 0; $day < 5; $day++) {
                    $date = $weekStart->copy()->addDays($day);
                    
                    // Only one slot per day due to unique constraint
                    $timeSlot = rand(0, 10) > 5 ? 'afternoon' : 'morning';
                    
                    TutorAvailabilitySlot::create([
                        'tutor_id' => $tutor->id,
                        'date' => $date->format('Y-m-d'),
                        'time_slot' => $timeSlot,
                        'is_available' => true,
                        'hours_booked' => rand(0, 4), // Some hours already booked
                    ]);
                }
                
                // Saturday morning
                if (rand(0, 1)) { // 50% chance for Saturday availability
                    $saturday = $weekStart->copy()->addDays(5);
                    TutorAvailabilitySlot::create([
                        'tutor_id' => $tutor->id,
                        'date' => $saturday->format('Y-m-d'),
                        'time_slot' => 'morning',
                        'is_available' => true,
                        'hours_booked' => 0,
                    ]);
                }
            }
            
            $this->command->info("   Created availability for tutor: {$tutor->name}");
        }
    }
    
    private function createLessons(): void
    {
        $this->command->info('📚 Creating lessons...');
        
        $tutors = User::where('role', 'tutor')->get();
        $students = User::where('role', 'student')->get();
        
        if ($tutors->isEmpty() || $students->isEmpty()) {
            $this->command->warn('   No tutors or students found! Run main seeder first.');
            return;
        }
        
        // Clear existing lessons (soft delete to avoid foreign key issues)
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Lesson::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        
        foreach ($students as $student) {
            // Assign random tutor(s) to each student
            $assignedTutors = $tutors->random(rand(1, min(2, $tutors->count())));
            
            foreach ($assignedTutors as $tutor) {
                // Create past lessons (completed)
                $pastLessonsCount = rand(5, 15);
                for ($i = 0; $i < $pastLessonsCount; $i++) {
                    $lessonDate = Carbon::now()->subDays(rand(1, 60));
                    $hour = rand(9, 18);
                    
                    Lesson::create([
                        'tutor_id' => $tutor->id,
                        'student_id' => $student->id,
                        'lesson_date' => $lessonDate->format('Y-m-d'),
                        'start_time' => sprintf('%02d:00:00', $hour),
                        'end_time' => sprintf('%02d:00:00', $hour + 1),
                        'status' => 'completed',
                        'topic' => $this->getRandomTopic(),
                        'notes' => rand(0, 1) ? 'Lekcja przebiegła bardzo dobrze. Student robił postępy.' : null,
                        'created_at' => $lessonDate->subHours(rand(24, 72)),
                        'updated_at' => $lessonDate->addHours(1),
                    ]);
                }
                
                // Create upcoming lessons (scheduled)
                $upcomingLessonsCount = rand(2, 5);
                for ($i = 0; $i < $upcomingLessonsCount; $i++) {
                    $lessonDate = Carbon::now()->addDays(rand(1, 21));
                    
                    // Find available slot for this tutor
                    $availableSlot = TutorAvailabilitySlot::where('tutor_id', $tutor->id)
                        ->where('date', '>=', Carbon::now()->format('Y-m-d'))
                        ->where('is_available', true)
                        ->where('hours_booked', '<', 8) // Max 8 hours per slot
                        ->inRandomOrder()
                        ->first();
                    
                    if ($availableSlot) {
                        // Generate random time within the slot
                        $startHour = $availableSlot->time_slot === 'morning' ? rand(8, 14) : rand(14, 20);
                        
                        Lesson::create([
                            'tutor_id' => $tutor->id,
                            'student_id' => $student->id,
                            'lesson_date' => $availableSlot->date,
                            'start_time' => sprintf('%02d:00:00', $startHour),
                            'end_time' => sprintf('%02d:00:00', $startHour + 1),
                            'status' => 'scheduled',
                            'topic' => $this->getRandomTopic(),
                            'created_at' => Carbon::now()->subDays(rand(1, 7)),
                        ]);
                        
                        // Update hours booked
                        $availableSlot->increment('hours_booked');
                    }
                }
                
                // Create one cancelled lesson
                if (rand(0, 1)) {
                    $lessonDate = Carbon::now()->subDays(rand(5, 30));
                    Lesson::create([
                        'tutor_id' => $tutor->id,
                        'student_id' => $student->id,
                        'lesson_date' => $lessonDate->format('Y-m-d'),
                        'start_time' => '15:00:00',
                        'end_time' => '16:00:00',
                        'status' => 'cancelled',
                        'topic' => $this->getRandomTopic(),
                        'cancellation_reason' => 'Student był chory',
                        'created_at' => $lessonDate->subDays(3),
                        'updated_at' => $lessonDate->subDays(1),
                    ]);
                }
            }
            
            $this->command->info("   Created lessons for student: {$student->name}");
        }
        
        // Create today's lessons
        $this->createTodayLessons($tutors, $students);
    }
    
    private function createTodayLessons($tutors, $students): void
    {
        $this->command->info('   Creating today\'s lessons...');
        
        $today = Carbon::now();
        $currentHour = (int) $today->format('H');
        
        // Create 3-5 lessons for today
        $todayLessonsCount = rand(3, 5);
        
        for ($i = 0; $i < $todayLessonsCount; $i++) {
            $tutor = $tutors->random();
            $student = $students->random();
            
            // Some past lessons for today (completed)
            if ($i < 2 && $currentHour > 12) {
                $hour = rand(9, $currentHour - 2);
                Lesson::create([
                    'tutor_id' => $tutor->id,
                    'student_id' => $student->id,
                    'lesson_date' => $today->format('Y-m-d'),
                    'start_time' => sprintf('%02d:00:00', $hour),
                    'end_time' => sprintf('%02d:00:00', $hour + 1),
                    'status' => 'completed',
                    'topic' => $this->getRandomTopic(),
                    'notes' => 'Lekcja zakończona pomyślnie.',
                ]);
            } else {
                // Upcoming lessons for today
                $hour = rand(max($currentHour + 1, 9), 20);
                Lesson::create([
                    'tutor_id' => $tutor->id,
                    'student_id' => $student->id,
                    'lesson_date' => $today->format('Y-m-d'),
                    'start_time' => sprintf('%02d:00:00', $hour),
                    'end_time' => sprintf('%02d:00:00', $hour + 1),
                    'status' => 'scheduled',
                    'topic' => $this->getRandomTopic(),
                ]);
            }
        }
    }
    
    private function getRandomTopic(): string
    {
        $topics = [
            'Present Simple vs Present Continuous',
            'Past Tenses Review',
            'Business English - Meetings',
            'Conversation Practice - Travel',
            'Grammar - Conditionals',
            'Vocabulary - Technology',
            'Speaking Practice - Daily Routines',
            'Writing Skills - Formal Emails',
            'Listening Comprehension',
            'Pronunciation Workshop',
            'Future Forms',
            'Phrasal Verbs',
            'Reading Comprehension',
            'Job Interview Preparation',
            'IELTS Preparation',
        ];
        
        return $topics[array_rand($topics)];
    }
}