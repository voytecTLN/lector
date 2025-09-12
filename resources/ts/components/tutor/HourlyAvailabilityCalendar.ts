import { tutorAvailabilityService, type HourlySlot } from '@services/TutorAvailabilityService'
import { formatDate } from '@utils/date'

interface WeeklyStats {
    weekStart: string
    totalHours: number
    limit: number
    remaining: number
}

export class HourlyAvailabilityCalendar {
    private container: HTMLElement | null = null
    private slots: Map<string, HourlySlot> = new Map()
    private selectedHours: Set<string> = new Set() // format: "2024-11-15-14" (date-hour)
    private weeklyLimit: number = 40
    private currentWeekOffset: number = 0
    private isDragging: boolean = false
    private dragStartCell: string | null = null

    constructor() {}

    mount(container: HTMLElement): void {
        this.container = container
        this.render()
        this.loadAvailability()
    }

    unmount(): void {
        this.container = null
        this.slots.clear()
        this.selectedHours.clear()
    }

    private async loadAvailability(): Promise<void> {
        const startDate = this.getWeekStart()
        const endDate = new Date(startDate)
        endDate.setDate(endDate.getDate() + 27) // 4 weeks

        try {
            const response = await tutorAvailabilityService.getAvailabilitySlots(
                formatDate(startDate),
                formatDate(endDate)
            )
            

            if (response.slots) {
                this.slots.clear()
                response.slots.forEach((slot: HourlySlot) => {
                    // Create key for each hour in the slot
                    for (let hour = slot.start_hour; hour < slot.end_hour; hour++) {
                        const key = `${slot.date}-${hour}`
                        this.slots.set(key, slot)
                    }
                })
                this.render()
            }
        } catch (error) {
            console.error('Failed to load availability:', error)
        }
    }

    private getWeekStart(): Date {
        const today = new Date()
        const dayOfWeek = today.getDay()
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) // Monday
        const weekStart = new Date(today.setDate(diff))
        weekStart.setDate(weekStart.getDate() + (this.currentWeekOffset * 7))
        weekStart.setHours(0, 0, 0, 0)
        return weekStart
    }

    private render(): void {
        if (!this.container) return

        const user = JSON.parse(localStorage.getItem('auth_user') || '{}')
        this.weeklyLimit = user.tutor_profile?.weekly_contract_limit || 40

        this.container.innerHTML = `
            <div class="hourly-availability-calendar">
                <div class="calendar-header mb-4">
                    <h3>Zarządzaj dostępnością</h3>
                    <p class="text-muted">Kliknij pojedyncze godziny lub przeciągnij aby zaznaczyć zakres. Każda komórka = 1 godzina.</p>
                </div>

                <div class="calendar-navigation mb-3">
                    <div class="d-flex justify-content-between align-items-center">
                        <button class="btn btn-outline-primary" id="prev-week">
                            <i class="bi bi-chevron-left"></i> Poprzedni tydzień
                        </button>
                        <h4>${this.getWeekRangeText()}</h4>
                        <button class="btn btn-outline-primary" id="next-week" ${this.currentWeekOffset >= 3 ? 'disabled' : ''}>
                            Następny tydzień <i class="bi bi-chevron-right"></i>
                        </button>
                    </div>
                </div>

                <div class="calendar-container">
                    <div class="hourly-grid">
                        ${this.renderHourlyGrid()}
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
<!--
                    <button class="btn btn-outline-secondary ms-2" id="clear-selection">
                        <i class="bi bi-x-circle me-2"></i>
                        Wyczyść wybór
                    </button>
                    -->
                </div>
            </div>

            <style>
                .hourly-availability-calendar {
                    max-width: 100%;
                }
                
                .hourly-grid {
                    display: grid;
                    grid-template-columns: 80px repeat(7, 1fr);
                    gap: 1px;
                    background-color: #dee2e6;
                    border: 1px solid #dee2e6;
                    border-radius: 8px;
                    overflow: hidden;
                }
                
                .hour-header, .day-header, .hour-cell {
                    background-color: white;
                    padding: 8px;
                    text-align: center;
                    user-select: none;
                }
                
                .hour-header {
                    background-color: #f8f9fa;
                    font-weight: 500;
                    color: #495057;
                    text-align: right;
                    padding-right: 12px;
                }
                
                .day-header {
                    background-color: #f8f9fa;
                    font-weight: bold;
                    color: #495057;
                    padding: 12px 8px;
                    border-bottom: 2px solid #dee2e6;
                }
                
                .day-header.today {
                    background-color: #e3f2fd;
                    color: #1976d2;
                }
                
                .hour-cell {
                    cursor: pointer;
                    transition: all 0.2s;
                    position: relative;
                    min-height: 40px;
                }
                
                .hour-cell:hover:not(.past):not(.booked) {
                    background-color: #f0f0f0;
                }
                
                .hour-cell.available {
                    background-color: #e8f5e9;
                    border: 1px solid #4caf50;
                }
                
                .hour-cell.selected {
                    background-color: #bbdefb !important;
                    border: 2px solid #2196f3 !important;
                }
                
                .hour-cell.booked {
                    background-color: #ffebee;
                    border: 1px solid #f44336;
                    cursor: not-allowed;
                    opacity: 0.8;
                }
                
                .hour-cell.past {
                    background-color: #f5f5f5;
                    cursor: not-allowed;
                    opacity: 0.5;
                }
                
                .hour-cell.dragging {
                    background-color: #e1f5fe;
                    border: 1px dashed #0288d1;
                }
                
                .week-stats {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
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
                
                .tooltip-content {
                    position: absolute;
                    background: rgba(0,0,0,0.8);
                    color: white;
                    padding: 4px 8px;
                    border-radius: 4px;
                    font-size: 12px;
                    z-index: 1000;
                    pointer-events: auto;
                    white-space: nowrap;
                    display: none;
                }
                
                .hour-cell:hover .tooltip-content,
                .hour-cell.show-tooltip .tooltip-content {
                    display: block;
                    top: -25px;
                    left: 50%;
                    transform: translateX(-50%);
                    z-index: 1000;
                }

                /* Adjust position for tooltips with buttons */
                .hour-cell.available:hover .tooltip-content {
                    top: -45px;
                }

                .tooltip-content .withdraw-btn {
                    font-size: 0.75rem;
                    padding: 4px 8px;
                    white-space: nowrap;
                    border-radius: 3px;
                    margin-top: 3px;
                    cursor: pointer;
                    position: relative;
                    z-index: 1001;
                    display: block;
                    width: 100%;
                }

                .tooltip-content .withdraw-btn:hover {
                    background-color: #c82333 !important;
                    border-color: #bd2130 !important;
                }

                .tooltip-text {
                    margin-bottom: 2px;
                }
            </style>
        `

        this.attachEventListeners()
        this.attachWithdrawButtonListeners()
    }

    private renderHourlyGrid(): string {
        const weekStart = this.getWeekStart()
        const days = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela']
        const hours = Array.from({length: 14}, (_, i) => i + 8) // 8:00 to 21:00
        
        let grid = '<div class="hour-header"></div>' // Empty top-left corner
        
        // Day headers
        for (let d = 0; d < 7; d++) {
            const date = new Date(weekStart)
            date.setDate(weekStart.getDate() + d)
            const isToday = this.isToday(date)
            
            grid += `
                <div class="day-header ${isToday ? 'today' : ''}">
                    <div>${days[d]}</div>
                    <div class="small">${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}</div>
                </div>
            `
        }
        
        // Hour rows
        for (const hour of hours) {
            // Hour label
            grid += `<div class="hour-header">${hour}:00</div>`
            
            // Hour cells for each day
            for (let d = 0; d < 7; d++) {
                const date = new Date(weekStart)
                date.setDate(weekStart.getDate() + d)
                const dateStr = formatDate(date)
                const cellKey = `${dateStr}-${hour}`
                
                const isPast = this.isPastHour(date, hour)
                const existingSlot = this.slots.get(cellKey)
                const isAvailable = existingSlot?.is_available && !existingSlot?.hours_booked
                const isBooked = (existingSlot?.hours_booked ?? 0) > 0
                const isSelected = this.selectedHours.has(cellKey)
                
                let cellClass = 'hour-cell'
                if (isPast) cellClass += ' past'
                else if (isBooked) cellClass += ' booked'
                else if (isSelected) cellClass += ' selected'
                else if (isAvailable) cellClass += ' available'
                
                let tooltip = ''
                if (!isPast) { // Only show tooltips for non-past cells
                    if (isBooked) {
                        tooltip = '<div class="tooltip-content">Zajęte</div>'
                    } else if (isAvailable && existingSlot) {
                        tooltip = `
                            <div class="tooltip-content">
                                <div class="tooltip-text">Dostępne</div>
                                <button class="withdraw-btn btn btn-danger btn-sm mt-1" 
                                        data-slot-id="${existingSlot.id}" 
                                        data-date="${dateStr}"
                                        data-hour="${hour}">
                                    <i class="bi bi-x-circle me-1"></i> Wycofaj
                                </button>
                            </div>
                        `
                    }
                }
                
                grid += `
                    <div class="${cellClass}" 
                         data-date="${dateStr}" 
                         data-hour="${hour}"
                         data-key="${cellKey}">
                        ${tooltip}
                    </div>
                `
            }
        }
        
        return grid
    }

    private renderWeeklySummary(): string {
        const stats = this.calculateWeeklyStats()
        
        return `
            <h5 class="mb-3">Podsumowanie tygodniowe</h5>
            <div class="week-stats">
                ${stats.map((week, index) => {
                    const percentage = (week.totalHours / week.limit) * 100
                    const isOverLimit = week.totalHours > week.limit
                    
                    return `
                        <div class="week-card ${isOverLimit ? 'over-limit' : ''}">
                            <h6>Tydzień ${index + 1} (od ${new Date(week.weekStart).toLocaleDateString('pl-PL')})</h6>
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
        const baseWeekStart = this.getWeekStart()
        
        for (let week = 0; week < 4; week++) {
            const weekStart = new Date(baseWeekStart)
            weekStart.setDate(baseWeekStart.getDate() + (week * 7))
            
            let totalHours = 0
            
            // Count hours for this week
            for (let day = 0; day < 7; day++) {
                const date = new Date(weekStart)
                date.setDate(weekStart.getDate() + day)
                const dateStr = formatDate(date)
                
                for (let hour = 8; hour < 22; hour++) {
                    const key = `${dateStr}-${hour}`
                    if (this.slots.has(key) || this.selectedHours.has(key)) {
                        totalHours++
                    }
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

    private getWeekRangeText(): string {
        const weekStart = this.getWeekStart()
        const weekEnd = new Date(weekStart)
        weekEnd.setDate(weekStart.getDate() + 6)
        
        const startMonth = weekStart.toLocaleDateString('pl-PL', { month: 'long' })
        const endMonth = weekEnd.toLocaleDateString('pl-PL', { month: 'long' })
        const year = weekStart.getFullYear()
        
        if (startMonth === endMonth) {
            return `${weekStart.getDate()} - ${weekEnd.getDate()} ${startMonth} ${year}`
        } else {
            return `${weekStart.getDate()} ${startMonth} - ${weekEnd.getDate()} ${endMonth} ${year}`
        }
    }

    private isToday(date: Date): boolean {
        const today = new Date()
        return date.toDateString() === today.toDateString()
    }

    private isPastHour(date: Date, hour: number): boolean {
        const now = new Date()
        const cellTime = new Date(date)
        cellTime.setHours(hour, 0, 0, 0)
        return cellTime < now
    }

    private attachEventListeners(): void {
        
        // Navigation
        this.container?.querySelector('#prev-week')?.addEventListener('click', () => {
            this.currentWeekOffset--
            this.render()
            this.loadAvailability()
        })
        
        this.container?.querySelector('#next-week')?.addEventListener('click', () => {
            // Limit to 4 weeks in advance
            if (this.currentWeekOffset < 3) {
                this.currentWeekOffset++
                this.render()
                this.loadAvailability()
            }
        })
        
        // Hour cell selection with drag support
        const hourCells = this.container?.querySelectorAll('.hour-cell:not(.past):not(.booked)')
        
        hourCells?.forEach(cell => {
            // Use click for simple selection (like in the old calendar)
            cell.addEventListener('click', (e) => {
                // Don't preventDefault here - let the event bubble for button clicks
                const target = e.currentTarget as HTMLElement
                const clickedElement = e.target as HTMLElement
                const key = target.dataset.key
                
                // If clicked on withdraw button, don't handle cell logic
                if (clickedElement.closest('.withdraw-btn')) {
                    return
                }
                
                e.preventDefault()
                e.stopPropagation()
                
                if (key && !this.isDragging) {
                    // Check if this cell has an available slot (green)
                    if (target.classList.contains('available')) {
                        // Show tooltip for available slots
                        target.classList.add('show-tooltip')
                        
                        // Hide tooltip after 10 seconds (longer time)
                        setTimeout(() => {
                            target.classList.remove('show-tooltip')
                        }, 10000)
                    } else {
                        // Normal selection for empty cells
                        this.toggleHour(key)
                    }
                }
            })
            
            // Mouse events for drag selection
            cell.addEventListener('mousedown', (e) => {
                e.preventDefault()
                const target = e.currentTarget as HTMLElement
                const key = target.dataset.key
                if (key) {
                    this.isDragging = true
                    this.dragStartCell = key
                    // Don't toggle on mousedown - wait for click or drag
                }
            })
            
            cell.addEventListener('mouseenter', (e) => {
                if (!this.isDragging || !this.dragStartCell) return
                
                const target = e.currentTarget as HTMLElement
                const key = target.dataset.key
                if (!key) return
                
                // Clear previous selection and select range
                this.selectedHours.clear()
                // Update all cells visually
                this.container?.querySelectorAll('.hour-cell.selected').forEach(cell => {
                    cell.classList.remove('selected')
                    ;(cell as HTMLElement).style.backgroundColor = ''
                    ;(cell as HTMLElement).style.border = ''
                })
                this.selectRange(this.dragStartCell, key)
            })
            
            // Touch events for mobile
            cell.addEventListener('touchstart', (e) => this.handleCellTouchStart(e as TouchEvent))
            cell.addEventListener('touchmove', (e) => this.handleCellTouchMove(e as TouchEvent))
            cell.addEventListener('touchend', (e) => this.handleCellTouchEnd(e as TouchEvent))
        })
        
        // Global mouse up to end drag
        document.addEventListener('mouseup', () => {
            this.isDragging = false
            this.dragStartCell = null
        })
        
        // Actions
        this.container?.querySelector('#save-availability')?.addEventListener('click', () => {
            this.saveAvailability()
        })
        
        this.container?.querySelector('#clear-selection')?.addEventListener('click', () => {
            this.selectedHours.clear()
            // Clear visual selection without re-rendering
            this.container?.querySelectorAll('.hour-cell.selected').forEach(cell => {
                cell.classList.remove('selected')
            })
        })
        
        this.container?.querySelector('#copy-prev-week')?.addEventListener('click', () => {
            this.copyFromPreviousWeek()
        })

        // Withdraw buttons - use multiple approaches for maximum compatibility
        
        // Method 1: Event delegation on container
        this.container?.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            
            // Check if clicked element is a withdraw button or child of one
            const withdrawBtn = target.closest('.withdraw-btn') as HTMLButtonElement
            
            if (withdrawBtn) {
                e.preventDefault()
                e.stopPropagation()
                e.stopImmediatePropagation()
                
                const slotId = parseInt(withdrawBtn.dataset.slotId!)
                const date = withdrawBtn.dataset.date!
                const hour = parseInt(withdrawBtn.dataset.hour!)
                
                this.withdrawSlot(slotId, date, hour)
                return false
            }
        })

        // Method 2: Direct event listeners (add after DOM is updated)
        setTimeout(() => {
            const withdrawButtons = this.container?.querySelectorAll('.withdraw-btn')
            
            withdrawButtons?.forEach(btn => {
                const button = btn as HTMLButtonElement
                button.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.stopImmediatePropagation()
                    
                    const slotId = parseInt(button.dataset.slotId!)
                    const date = button.dataset.date!
                    const hour = parseInt(button.dataset.hour!)
                    
                    this.withdrawSlot(slotId, date, hour)
                })
            })
        }, 100)
    }

    private attachWithdrawButtonListeners(): void {
        // Wait for DOM to be fully rendered, then attach direct listeners
        setTimeout(() => {
            const withdrawButtons = this.container?.querySelectorAll('.withdraw-btn')
            
            withdrawButtons?.forEach(btn => {
                const button = btn as HTMLButtonElement
                button.addEventListener('click', (e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    e.stopImmediatePropagation()
                    
                    const slotId = parseInt(button.dataset.slotId!)
                    const date = button.dataset.date!
                    const hour = parseInt(button.dataset.hour!)
                    
                    this.withdrawSlot(slotId, date, hour)
                })
            })
        }, 200) // Slightly longer delay to ensure DOM is ready
    }

    private handleCellTouchStart(e: TouchEvent): void {
        e.preventDefault()
        const touch = e.touches[0]
        const cell = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement
        const key = cell?.dataset?.key
        if (!key) return
        
        this.isDragging = true
        this.dragStartCell = key
        this.toggleHour(key)
    }

    private handleCellTouchMove(e: TouchEvent): void {
        if (!this.isDragging || !this.dragStartCell) return
        e.preventDefault()
        
        const touch = e.touches[0]
        const cell = document.elementFromPoint(touch.clientX, touch.clientY) as HTMLElement
        const key = cell?.dataset?.key
        if (!key || !cell.classList.contains('hour-cell')) return
        
        // Clear previous selection and select range
        this.selectedHours.clear()
        // Update all cells visually
        this.container?.querySelectorAll('.hour-cell.selected').forEach(cell => {
            cell.classList.remove('selected')
        })
        this.selectRange(this.dragStartCell, key)
    }

    private handleCellTouchEnd(e: TouchEvent): void {
        this.isDragging = false
        this.dragStartCell = null
    }

    private toggleHour(key: string): void {
        if (this.selectedHours.has(key)) {
            this.selectedHours.delete(key)
        } else {
            this.selectedHours.add(key)
        }
        // Instead of full re-render, just update the cell class
        this.updateCellVisual(key)
    }
    
    private updateCellVisual(key: string): void {
        const cell = this.container?.querySelector(`[data-key="${key}"]`) as HTMLElement
        
        if (cell) {
            if (this.selectedHours.has(key)) {
                cell.classList.add('selected')
                // Also set inline style as fallback
                cell.style.backgroundColor = '#bbdefb'
                cell.style.border = '2px solid #2196f3'
            } else {
                cell.classList.remove('selected')
                // Remove inline styles
                cell.style.backgroundColor = ''
                cell.style.border = ''
            }
        } else {
            console.error('❗ Could not find cell with key:', key)
        }
    }

    private selectRange(startKey: string, endKey: string): void {
        // Extract date and hour from keys like "2025-08-05-15"
        const startLastDash = startKey.lastIndexOf('-')
        const endLastDash = endKey.lastIndexOf('-')
        
        const startDate = startKey.substring(0, startLastDash)
        const startHour = parseInt(startKey.substring(startLastDash + 1))
        
        const endDate = endKey.substring(0, endLastDash)
        const endHour = parseInt(endKey.substring(endLastDash + 1))
        
        const start = {
            date: new Date(startDate),
            hour: startHour
        }
        const end = {
            date: new Date(endDate),
            hour: endHour
        }
        
        // Ensure start is before end
        let finalStart = start
        let finalEnd = end
        if (start.date > end.date || (start.date.getTime() === end.date.getTime() && start.hour > end.hour)) {
            finalStart = end
            finalEnd = start
        }
        
        // Select all hours in range
        const current = new Date(finalStart.date)
        while (current <= finalEnd.date) {
            const dateStr = formatDate(current)
            const startHourForDay = current.getTime() === finalStart.date.getTime() ? finalStart.hour : 8
            const endHourForDay = current.getTime() === finalEnd.date.getTime() ? finalEnd.hour : 21
            
            for (let hour = startHourForDay; hour <= endHourForDay; hour++) {
                const key = `${dateStr}-${hour}`
                const cell = this.container?.querySelector(`[data-key="${key}"]`)
                if (cell && !cell.classList.contains('past') && !cell.classList.contains('booked')) {
                    this.selectedHours.add(key)
                    cell.classList.add('selected')
                }
            }
            
            current.setDate(current.getDate() + 1)
        }
    }

    private async copyFromPreviousWeek(): Promise<void> {
        // This would load slots from previous week and apply to current week
        // Implementation depends on backend support
        this.showNotification('info', 'Funkcja w przygotowaniu')
    }

    private async saveAvailability(): Promise<void> {
        
        // Prepare slots data
        const slots: any[] = []
        const processedKeys = new Set<string>()
        
        // Convert selected hours to slots
        this.selectedHours.forEach(key => {
            if (processedKeys.has(key)) return
            
            // Key format is "YYYY-MM-DD-HH" so we need to extract the last part as hour
            const lastDashIndex = key.lastIndexOf('-')
            if (lastDashIndex === -1) {
                console.error('Invalid key format:', key)
                return
            }
            
            const date = key.substring(0, lastDashIndex) // YYYY-MM-DD
            const hour = parseInt(key.substring(lastDashIndex + 1))
            
            
            // Check if this is a new slot or modification
            const existingSlot = this.slots.get(key)
            if (!existingSlot) {
                // New slot - for now just create 1-hour slots
                slots.push({
                    date,
                    start_hour: hour,
                    end_hour: hour + 1,
                    is_available: true
                })
            }
            
            processedKeys.add(key)
        })
        
        // Only process slots that were explicitly deselected (not just unselected)
        // This prevents sending all unselected slots as is_available: false
        // TODO: Implement proper tracking of explicitly removed slots if needed
        // For now, we only send the newly selected slots
        
        
        if (slots.length === 0) {
            this.showNotification('warning', 'Nie wybrano żadnych zmian')
            return
        }
        
        try {
            const response = await tutorAvailabilityService.saveAvailabilitySlots(slots)
            
            if (response.success) {
                this.showNotification('success', response.message || 'Dostępność została zapisana')
                this.selectedHours.clear()
                await this.loadAvailability()
            } else {
                throw new Error(response.message || 'Nie udało się zapisać dostępności')
            }
        } catch (error: any) {
            console.error('Failed to save availability:', error)
            this.showNotification('error', error.message || 'Błąd podczas zapisywania dostępności')
        }
    }

    private async withdrawSlot(slotId: number, date: string, hour: number): Promise<void> {
        
        // Import SweetAlert2 for confirmation dialog
        const { default: Swal } = await import('sweetalert2')

        const result = await Swal.fire({
            title: 'Czy na pewno chcesz wycofać dostępność?',
            html: `
                <p>Dostępność na dzień <strong>${new Date(date).toLocaleDateString('pl-PL')}</strong> o godzinie <strong>${hour}:00</strong> zostanie usunięta.</p>
                <p class="text-muted">Ta operacja nie może być cofnięta.</p>
            `,
            icon: 'warning',
            showCancelButton: true,
            confirmButtonColor: '#dc3545',
            cancelButtonColor: '#6c757d',
            confirmButtonText: 'Tak, wycofaj',
            cancelButtonText: 'Anuluj'
        })

        if (!result.isConfirmed) return

        try {
            // Use api service directly since tutorAvailabilityService might not have withdraw method
            const { api } = await import('@services/ApiService')
            await api.delete(`/tutor/availability-slots/${slotId}`)
            
            this.showNotification('success', 'Dostępność została wycofana')
            
            // Reload availability data
            await this.loadAvailability()
            
        } catch (error: any) {
            console.error('Failed to withdraw slot:', error)
            const message = error.response?.data?.message || 'Wystąpił błąd podczas wycofywania dostępności'
            this.showNotification('error', message)
        }
    }

    private showNotification(type: 'success' | 'error' | 'warning' | 'info', message: string): void {
        const event = new CustomEvent('notification:show', {
            detail: { type, message, duration: 5000 }
        })
        document.dispatchEvent(event)
    }
}