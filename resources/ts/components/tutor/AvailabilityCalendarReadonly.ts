// resources/ts/components/tutor/AvailabilityCalendarReadonly.ts
import { api } from '@/services/ApiService'
import { formatDate } from '@/utils/date'

interface AvailabilitySlot {
    id?: number
    date: string
    time_slot: 'morning' | 'afternoon'
    is_available: boolean
    hours_booked: number
}

interface WeeklyStats {
    weekStart: string
    totalHours: number
    limit: number
    remaining: number
}

export class AvailabilityCalendarReadonly {
    private container: HTMLElement | null = null
    private slots: Map<string, AvailabilitySlot> = new Map()
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
                    this.slots.set(slotDate, {
                        ...slot,
                        date: slotDate
                    })
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
                        <div class="col-md-6">
                            <div class="legend-item">
                                <span class="legend-box morning"></span>
                                <span>Rano (8:00 - 16:00)</span>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="legend-item">
                                <span class="legend-box afternoon"></span>
                                <span>Popołudnie (14:00 - 22:00)</span>
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

                .calendar-day.has-morning {
                    background: #e3f2fd;
                    border-color: #2196f3;
                }

                .calendar-day.has-afternoon {
                    background: #fff3e0;
                    border-color: #ff9800;
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

                .slot-badge {
                    display: inline-block;
                    padding: 2px 8px;
                    border-radius: 12px;
                    font-size: 0.75em;
                    margin-top: 4px;
                }

                .slot-badge.morning {
                    background: #2196f3;
                    color: white;
                }

                .slot-badge.afternoon {
                    background: #ff9800;
                    color: white;
                }

                .legend-box {
                    display: inline-block;
                    width: 20px;
                    height: 20px;
                    border-radius: 4px;
                    margin-right: 8px;
                    vertical-align: middle;
                }

                .legend-box.morning {
                    background: #2196f3;
                }

                .legend-box.afternoon {
                    background: #ff9800;
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
                const slot = this.slots.get(dateStr)
                
                let dayClass = 'calendar-day'
                if (isPast) dayClass += ' past'
                if (slot?.time_slot === 'morning') dayClass += ' has-morning'
                if (slot?.time_slot === 'afternoon') dayClass += ' has-afternoon'

                weeks.push(`
                    <div class="${dayClass}">
                        <div class="calendar-day-header">
                            ${this.getDayName(date.getDay())}
                        </div>
                        <div class="calendar-day-date">
                            ${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}
                        </div>
                        ${slot ? `
                            <div class="time-slot-display">
                                ${slot.time_slot === 'morning' 
                                    ? '<span class="slot-badge morning">Rano</span>'
                                    : '<span class="slot-badge afternoon">Popołudnie</span>'}
                                ${slot.hours_booked > 0 ? `
                                    <div class="text-muted small mt-1">
                                        Zarezerwowane: ${slot.hours_booked}h
                                    </div>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>
                `)
            }
        }

        return weeks.join('')
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
                            <div class="d-flex justify-content-between">
                                <span>${week.totalHours}h / ${week.limit}h</span>
                                <span class="${isOverLimit ? 'text-danger' : 'text-success'}">
                                    ${isOverLimit ? 'Przekroczony limit!' : `Pozostało: ${week.remaining}h`}
                                </span>
                            </div>
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
                
                if (this.slots.has(dateStr)) {
                    totalHours += 8
                }
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