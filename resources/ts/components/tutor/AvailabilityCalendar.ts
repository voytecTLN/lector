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

export class AvailabilityCalendar {
    private container: HTMLElement | null = null
    private slots: Map<string, AvailabilitySlot> = new Map()
    private selectedSlots: Map<string, 'morning' | 'afternoon' | ''> = new Map()
    private weeklyLimit: number = 40
    private currentMonth: Date = new Date()

    constructor() {}

    mount(container: HTMLElement): void {
        this.container = container
        this.render()
        this.loadAvailability()
    }

    unmount(): void {
        this.container = null
        this.slots.clear()
        this.selectedSlots.clear()
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
            const response = await api.get<any>(`/tutor/availability-slots?${params.toString()}`)
            
            console.log('Loaded availability slots:', response)

            if (response.slots) {
                this.slots.clear()
                response.slots.forEach((slot: AvailabilitySlot) => {
                    // Handle date format - keep the date string as-is from API
                    let slotDate = slot.date
                    
                    // If date contains time component, extract just the date part
                    if (slotDate.includes('T')) {
                        slotDate = slotDate.split('T')[0]
                    }
                    
                    console.log('Processing slot:', { original: slot.date, processed: slotDate })
                    
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

        const user = JSON.parse(localStorage.getItem('auth_user') || '{}')
        this.weeklyLimit = user.tutor_profile?.weekly_contract_limit || 40

        this.container.innerHTML = `
            <div class="availability-calendar">
                <div class="calendar-header mb-4">
                    <h3>Zarządzaj dostępnością</h3>
                    <p class="text-muted">Wybierz dni i przedziały czasowe, w których jesteś dostępny. Każdy dzień = 8 godzin.</p>
                </div>

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

                <div class="calendar-container">
                    <div class="calendar-header-row">
                        ${this.renderCalendarHeader()}
                    </div>
                    <div class="calendar-grid">
                        ${this.renderCalendar()}
                    </div>
                </div>

                <div class="calendar-summary mt-4">
                    ${this.renderWeeklySummary()}
                </div>

                <div class="calendar-actions mt-4">
                    <button class="btn btn-primary" id="save-availability">
                        <i class="bi bi-check-circle me-2"></i>
                        Zapisz dostępność
                    </button>
                    <button class="btn btn-outline-secondary ms-2" id="clear-selection">
                        <i class="bi bi-x-circle me-2"></i>
                        Wyczyść wybór
                    </button>
                </div>
            </div>

            <style>
                .availability-calendar {
                    max-width: 100%;
                }
                
                .availability-calendar * {
                    box-sizing: border-box;
                }

                .calendar-header-row {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 10px;
                    margin-bottom: 10px;
                }
                
                .calendar-header-day {
                    text-align: center;
                    font-weight: bold;
                    color: #374151;
                    padding: 10px;
                    background-color: #f3f4f6;
                    border: 1px solid #e5e7eb;
                    border-radius: 8px;
                    box-sizing: border-box;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                
                .calendar-header-date {
                    font-size: 0.85em;
                    font-weight: normal;
                    margin-top: 2px;
                    color: #6b7280;
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
                    min-height: 120px;
                    background: #fff;
                    transition: all 0.2s;
                }

                .calendar-day.past {
                    opacity: 0.5;
                    pointer-events: none;
                }

                .calendar-day.selected-morning {
                    background: #e3f2fd;
                    border-color: #2196f3;
                }

                .calendar-day.selected-afternoon {
                    background: #fff3e0;
                    border-color: #ff9800;
                }


                .calendar-day-date {
                    font-size: 0.9em;
                    color: #666;
                }

                .time-slot-buttons {
                    margin-top: 10px;
                }

                .time-slot-btn {
                    font-size: 0.8em;
                    padding: 4px 8px;
                    margin: 2px;
                    border: 1px solid #ddd;
                    background: #f5f5f5;
                    border-radius: 4px;
                    cursor: pointer;
                    transition: all 0.2s;
                }

                .time-slot-btn:hover {
                    background: #e0e0e0;
                }

                .time-slot-btn.active {
                    background: #2196f3;
                    color: white;
                    border-color: #2196f3;
                }

                .time-slot-btn.morning.active {
                    background: #2196f3;
                }

                .time-slot-btn.afternoon.active {
                    background: #ff9800;
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

        this.attachEventListeners()
    }

    private renderCalendarHeader(): string {
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Start from the beginning of current week (Monday)
        const currentDayOfWeek = today.getDay()
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - daysFromMonday)
        
        const days = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
        
        return days.map((day, index) => {
            const date = new Date(startDate)
            date.setDate(startDate.getDate() + index)
            return `
                <div class="calendar-header-day">
                    <div>${day}</div>
                    <div class="calendar-header-date">${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}</div>
                </div>
            `
        }).join('')
    }

    private renderCalendar(): string {
        const weeks = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Start from the beginning of current week (Monday)
        const currentDayOfWeek = today.getDay()
        const daysFromMonday = currentDayOfWeek === 0 ? 6 : currentDayOfWeek - 1
        const startDate = new Date(today)
        startDate.setDate(today.getDate() - daysFromMonday)

        for (let week = 0; week < 4; week++) {
            for (let day = 0; day < 7; day++) {
                const date = new Date(startDate)
                date.setDate(startDate.getDate() + (week * 7) + day)
                date.setHours(12, 0, 0, 0) // Ustaw na południe aby uniknąć problemów ze strefą czasową
                
                const dateStr = formatDate(date)
                const isPast = date < today
                const slot = this.slots.get(dateStr)
                const selectedSlot = this.selectedSlots.get(dateStr)
                
                // Debug logging
                if (week === 0 && day < 7) {
                    console.log('Calendar date:', { 
                        dateObj: date.toISOString(), 
                        formatted: dateStr,
                        dayOfWeek: date.getDay(),
                        hasSlot: this.slots.has(dateStr)
                    })
                }
                
                // Determine the active slot (from DB or selected)
                const activeSlot = selectedSlot || slot?.time_slot
                
                let dayClass = 'calendar-day'
                if (isPast) dayClass += ' past'
                if (activeSlot === 'morning') dayClass += ' selected-morning'
                if (activeSlot === 'afternoon') dayClass += ' selected-afternoon'

                weeks.push(`
                    <div class="${dayClass}" data-date="${dateStr}">
                        <div class="calendar-day-date">
                            ${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}
                        </div>
                        ${!isPast ? `
                            <div class="time-slot-buttons">
                                <button class="time-slot-btn morning ${activeSlot === 'morning' ? 'active' : ''}" 
                                        data-date="${dateStr}" data-slot="morning">
                                    Rano
                                </button>
                                <button class="time-slot-btn afternoon ${activeSlot === 'afternoon' ? 'active' : ''}" 
                                        data-date="${dateStr}" data-slot="afternoon">
                                    Popołudnie
                                </button>
                            </div>
                            ${slot && slot.hours_booked > 0 ? `
                                <div class="mt-2 text-muted small">
                                    Zarezerwowane: ${slot.hours_booked}h
                                </div>
                            ` : ''}
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
            weekStart.setHours(12, 0, 0, 0) // Ustaw na południe
            
            let totalHours = 0
            
            // Count existing slots
            for (let day = 0; day < 7; day++) {
                const date = new Date(weekStart)
                date.setDate(weekStart.getDate() + day)
                date.setHours(12, 0, 0, 0) // Ustaw na południe aby uniknąć problemów ze strefą czasową
                const dateStr = formatDate(date)
                
                if (this.slots.has(dateStr) || this.selectedSlots.has(dateStr)) {
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
        // Days for calendar starting from Monday (index 0 = Monday)
        const days = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
        return days[dayIndex]
    }

    private attachEventListeners(): void {
        // Time slot selection
        this.container?.querySelectorAll('.time-slot-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const target = e.target as HTMLElement
                const date = target.dataset.date!
                const slot = target.dataset.slot as 'morning' | 'afternoon'
                
                this.toggleSlot(date, slot)
            })
        })

        // Save button
        this.container?.querySelector('#save-availability')?.addEventListener('click', () => {
            this.saveAvailability()
        })

        // Clear button
        this.container?.querySelector('#clear-selection')?.addEventListener('click', () => {
            this.selectedSlots.clear()
            this.render()
        })
    }

    private toggleSlot(date: string, slot: 'morning' | 'afternoon'): void {
        const existingSlot = this.slots.get(date)
        const currentSelectedSlot = this.selectedSlots.get(date)
        const activeSlot = currentSelectedSlot || existingSlot?.time_slot
        
        if (activeSlot === slot) {
            // If clicking the same slot, remove it
            if (existingSlot?.time_slot === slot) {
                // Mark for deletion by setting to empty string
                this.selectedSlots.set(date, '')
            } else {
                this.selectedSlots.delete(date)
            }
        } else {
            // Select the new slot
            this.selectedSlots.set(date, slot)
        }
        
        this.render()
    }

    private async saveAvailability(): Promise<void> {
        const slots = Array.from(this.selectedSlots.entries())
            .filter(([_, time_slot]) => time_slot !== '') // Filter out deletion markers
            .map(([date, time_slot]) => ({
                date,
                time_slot
            }))

        if (slots.length === 0) {
            this.showNotification('warning', 'Nie wybrano żadnych slotów')
            return
        }

        try {
            const response = await api.post<any>('/tutor/availability-slots', { slots })
            
            if (response.success) {
                this.showNotification('success', response.message || 'Dostępność została zapisana')
                this.selectedSlots.clear()
                await this.loadAvailability()
            }
        } catch (error: any) {
            console.error('Failed to save availability:', error)
            this.showNotification('error', error.message || 'Błąd podczas zapisywania dostępności')
        }
    }

    private showNotification(type: 'success' | 'error' | 'warning', message: string): void {
        const event = new CustomEvent('notification:show', {
            detail: { type, message, duration: 5000 }
        })
        document.dispatchEvent(event)
    }
}