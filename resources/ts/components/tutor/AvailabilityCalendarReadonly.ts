// resources/ts/components/tutor/AvailabilityCalendarReadonly.ts
import { api } from '@/services/ApiService'
import { formatDate } from '@/utils/date'
import type { AvailabilitySlot, WeeklyStats } from '@/types/models'

export class AvailabilityCalendarReadonly {
    private container: HTMLElement | null = null
    private slots: Map<string, AvailabilitySlot[]> = new Map()
    private tutorId: number
    private weeklyLimit: number = 40

    constructor(tutorId: number, weeklyLimit: number = 40) {
        this.tutorId = tutorId
        this.weeklyLimit = weeklyLimit
    }

    mount(container: HTMLElement): void {
        this.container = container
        this.render()
        this.loadAvailability()
    }

    unmount(): void {
        this.container = null
        this.slots.clear()
    }

    private async loadAvailability(): Promise<void> {
        const startDate = new Date()
        const endDate = new Date()
        endDate.setDate(endDate.getDate() + 28) // 4 weeks

        try {
            const params = new URLSearchParams({
                start_date: formatDate(startDate),
                end_date: formatDate(endDate)
            })
            const response = await api.get<any>(`/tutors/${this.tutorId}/availability-slots?${params.toString()}`)
            
            if (response.slots) {
                this.slots.clear()
                response.slots.forEach((slot: AvailabilitySlot) => {
                    const slotDate = typeof slot.date === 'string' ? slot.date : formatDate(new Date(slot.date))
                    
                    // Get existing slots for this date or initialize empty array
                    const existingSlots = this.slots.get(slotDate) || []
                    
                    // Add the new slot to the array
                    existingSlots.push({
                        ...slot,
                        date: slotDate
                    })
                    
                    // Update the map with the updated array
                    this.slots.set(slotDate, existingSlots)
                })
                this.render()
            }
        } catch (error) {
            console.error('Failed to load availability:', error)
        }
    }

    private render(): void {
        if (!this.container) return

        this.container.innerHTML = `
            <div class="availability-calendar-readonly">
                <div class="calendar-legend mb-4">
                    <div class="row">
                        <div class="col-md-4">
                            <div class="legend-item">
                                <span class="legend-box available"></span>
                                <span>Dostępny slot</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="legend-item">
                                <span class="legend-box booked"></span>
                                <span>Zarezerwowane</span>
                            </div>
                        </div>
                        <div class="col-md-4">
                            <div class="legend-item">
                                <span class="legend-box unavailable"></span>
                                <span>Niedostępny</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div class="calendar-grid">
                    ${this.renderCalendar()}
                </div>

                <div class="calendar-summary mt-4">
                    ${this.renderWeeklySummary()}
                </div>
            </div>

            <style>
                .availability-calendar-readonly {
                    max-width: 100%;
                }

                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 10px;
                    margin-bottom: 20px;
                }

                .calendar-day {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 10px;
                    min-height: 100px;
                    background: #fff;
                }

                .calendar-day.past {
                    opacity: 0.5;
                }

                .calendar-day.has-availability {
                    background: #f8fff9;
                    border-color: #28a745;
                }

                .calendar-day-header {
                    font-weight: bold;
                    margin-bottom: 5px;
                    font-size: 0.9em;
                }

                .calendar-day-date {
                    font-size: 0.85em;
                    color: #666;
                }

                .time-slot-display {
                    margin-top: 10px;
                    font-size: 0.8em;
                }

                .time-slots-display {
                    margin-top: 8px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 2px;
                }

                .slot-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75em;
                    margin-top: 4px;
                }

                .time-slot {
                    background: #f0f0f0;
                    border: 1px solid #ddd;
                    border-radius: 4px;
                    padding: 2px 6px;
                    margin: 1px;
                    font-size: 0.7rem;
                    display: inline-block;
                    min-width: 45px;
                    text-align: center;
                }

                .time-slot.available {
                    background: #d4edda;
                    border-color: #c3e6cb;
                    color: #155724;
                }

                .time-slot.booked {
                    background: #f8d7da;
                    border-color: #f5c6cb;
                    color: #721c24;
                }

                .legend-box {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    margin-right: 8px;
                    vertical-align: middle;
                }

                .legend-box.available {
                    background: #28a745;
                }

                .legend-box.booked {
                    background: #dc3545;
                }

                .legend-box.unavailable {
                    background: #6c757d;
                }

                .weekly-summary {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                    gap: 15px;
                }

                .week-card {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 15px;
                    background: #f8f9fa;
                }

                .week-card.over-limit {
                    border-color: #dc3545;
                    background: #f8d7da;
                }

                .hours-bar {
                    height: 20px;
                    background: #e0e0e0;
                    border-radius: 10px;
                    overflow: hidden;
                    margin: 10px 0;
                }

                .hours-fill {
                    height: 100%;
                    background: #4caf50;
                    transition: width 0.3s;
                }

                .hours-fill.warning {
                    background: #ff9800;
                }

                .hours-fill.danger {
                    background: #dc3545;
                }
            </style>
        `
    }

    private renderCalendar(): string {
        const weeks = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)

        for (let week = 0; week < 4; week++) {
            for (let day = 0; day < 7; day++) {
                const date = new Date()
                date.setDate(today.getDate() + (week * 7) + day)
                
                const dateStr = formatDate(date)
                const isPast = date < today
                const daySlots = this.getDaySlotsGrouped(dateStr)
                
                let dayClass = 'calendar-day'
                if (isPast) dayClass += ' past'
                if (daySlots.length > 0) dayClass += ' has-availability'

                weeks.push(`
                    <div class="${dayClass}">
                        <div class="calendar-day-header">
                            ${this.getDayName(date.getDay())}
                        </div>
                        <div class="calendar-day-date">
                            ${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}
                        </div>
                        <div class="time-slots-display">
                            ${daySlots.length > 0 ? this.renderDayTimeSlots(daySlots) : `
                                <div class="text-muted small mt-2">
                                    Lektor nie ustawił dostępności
                                </div>
                            `}
                        </div>
                    </div>
                `)
            }
        }

        return weeks.join('')
    }

    private getDaySlotsGrouped(dateStr: string): AvailabilitySlot[] {
        // Get slots for this specific date
        const daySlots = this.slots.get(dateStr) || []
        // Sort by start hour
        return daySlots.sort((a, b) => (a.start_hour || 0) - (b.start_hour || 0))
    }


    private renderDayTimeSlots(slots: AvailabilitySlot[]): string {
        return slots.map(slot => {
            const startHour = slot.start_hour || 0
            const endHour = slot.end_hour || startHour + 1
            const isBooked = (slot.hours_booked || 0) > 0
            const isAvailable = slot.is_available && !isBooked
            
            let slotClass = 'time-slot'
            if (isBooked) {
                slotClass += ' booked'
            } else if (isAvailable) {
                slotClass += ' available'
            }
            
            return `<span class="${slotClass}" title="${isBooked ? 'Zarezerwowane' : isAvailable ? 'Dostępne' : 'Niedostępne'}">${startHour.toString().padStart(2, '0')}:00</span>`
        }).join('')
    }

    private renderWeeklySummary(): string {
        const weeklyStats = this.calculateWeeklyStats()
        
        return `
            <h5 class="mb-3">Podsumowanie tygodniowe</h5>
            <div class="weekly-summary">
                ${weeklyStats.map(week => {
                    const percentage = (week.totalHours / week.limit) * 100
                    const isOverLimit = week.totalHours > week.limit
                    
                    return `
                        <div class="week-card ${isOverLimit ? 'over-limit' : ''}">
                            <h6>Tydzień od ${new Date(week.weekStart).toLocaleDateString('pl-PL')}</h6>
                            <div class="hours-bar">
                                <div class="hours-fill ${percentage > 100 ? 'danger' : percentage > 80 ? 'warning' : ''}" 
                                     style="width: ${Math.min(percentage, 100)}%"></div>
                            </div>
                            ${isOverLimit ? `
                                <div class="text-danger mt-2">
                                    Godziny dla tygodnia od ${new Date(week.weekStart).toLocaleDateString('pl-PL')} zostały wykorzystane
                                </div>
                            ` : ''}
                        </div>
                    `
                }).join('')}
            </div>
        `
    }

    private calculateWeeklyStats(): WeeklyStats[] {
        const stats: WeeklyStats[] = []
        const today = new Date()
        
        for (let week = 0; week < 4; week++) {
            const weekStart = new Date(today)
            weekStart.setDate(today.getDate() + (week * 7))
            weekStart.setDate(weekStart.getDate() - weekStart.getDay() + 1) // Monday
            
            let totalHours = 0
            
            // Count existing slots
            for (let day = 0; day < 7; day++) {
                const date = new Date(weekStart)
                date.setDate(weekStart.getDate() + day)
                const dateStr = formatDate(date)
                
                const daySlots = this.slots.get(dateStr) || []
                // Count actual available slots (each slot is 1 hour)
                daySlots.forEach(slot => {
                    if (slot.is_available) {
                        totalHours += 1
                    }
                })
            }
            
            stats.push({
                weekStart: formatDate(weekStart),
                totalHours,
                limit: this.weeklyLimit,
                remaining: Math.max(0, this.weeklyLimit - totalHours)
            })
        }
        
        return stats
    }

    private getDayName(dayIndex: number): string {
        const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']
        return days[dayIndex]
    }
}