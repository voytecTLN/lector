import { BookingService } from '@services/BookingService'
import { formatDate } from '@utils/date'
import { AvatarHelper } from '@/utils/AvatarHelper'

export class StudentBooking {
    private tutor: any = null
    private selectedDate: string = ''
    private selectedTime: string = ''
    private availableSlots: any[] = []
    private tutorAvailability: Map<string, any> = new Map()
    
    public async getTutorBookingContent(tutorId: string): Promise<string> {
        try {
            this.tutor = await BookingService.getTutorForBooking(tutorId)
            
            // Load tutor availability data first
            await this.loadTutorAvailability(tutorId)
            
            // Now render the calendar with availability data
            const calendarHTML = this.renderCalendar()
            
            return `
                <div class="student-content-area">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="#" onclick="document.querySelector('[data-section=rezerwuj]').click(); return false;">Rezerwuj lekcję</a></li>
                            <li class="breadcrumb-item active">Kalendarz - ${this.tutor.name}</li>
                        </ol>
                    </nav>

                    <div class="booking-calendar">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h4 class="mb-0">
                                    <i class="bi bi-calendar-week me-2"></i>
                                    Wybierz termin lekcji
                                </h4>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Kliknij dzień, aby zobaczyć dostępne godziny. Każda lekcja trwa 1 godzinę.
                                </div>
                                
                                <div class="calendar-legend mb-3">
                                    <div class="row">
                                        <div class="col-md-4 col-sm-6 mb-2">
                                            <div class="legend-item">
                                                <span class="legend-dot available">●</span>
                                                <span>Dostępny</span>
                                            </div>
                                        </div>
                                        <div class="col-md-4 col-sm-6 mb-2">
                                            <div class="legend-item">
                                                <span class="legend-dot partial">●</span>
                                                <span>Częściowo zajęty</span>
                                            </div>
                                        </div>
                                        <div class="col-md-4 col-sm-6 mb-2">
                                            <div class="legend-item">
                                                <span class="legend-dot full">●</span>
                                                <span>Zajęty</span>
                                            </div>
                                        </div>
                                        <div class="col-md-4 col-sm-6 mb-2">
                                            <div class="legend-item">
                                                <span class="legend-dot unavailable">●</span>
                                                <span>Niedostępny</span>
                                            </div>
                                        </div>
                                        <div class="col-md-4 col-sm-6 mb-2">
                                            <div class="legend-item">
                                                <span class="legend-dot past">●</span>
                                                <span>Przeszłość</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="calendar-wrapper">
                                    <div class="calendar-header-row">
                                        <div class="calendar-header-day">PN</div>
                                        <div class="calendar-header-day">WT</div>
                                        <div class="calendar-header-day">ŚR</div>
                                        <div class="calendar-header-day">CZ</div>
                                        <div class="calendar-header-day">PT</div>
                                        <div class="calendar-header-day">SB</div>
                                        <div class="calendar-header-day">ND</div>
                                    </div>
                                    <div class="calendar-grid">
                                        ${calendarHTML}
                                    </div>
                                </div>
                                
                                <div id="time-slots-container" class="mt-4" style="display: none;">
                                    <h5>Dostępne godziny na <span id="selected-date-display"></span>:</h5>
                                    <div id="time-slots" class="d-flex flex-wrap gap-2"></div>
                                    <div class="mt-3">
                                        <button class="btn btn-success" id="confirm-booking" style="display: none;">
                                            <i class="bi bi-check-circle me-2"></i>
                                            Zarezerwuj lekcję
                                        </button>
                                    </div>
                                </div>
                                
                                <div id="no-slots-message" class="alert alert-warning mt-3" style="display: none;">
                                    <i class="bi bi-exclamation-triangle me-2"></i>
                                    Brak dostępnych terminów w wybranym dniu.
                                </div>
                                
                                <div id="loading-slots" class="text-center py-3" style="display: none;">
                                    <div class="spinner-border text-primary" role="status">
                                        <span class="visually-hidden">Ładowanie...</span>
                                    </div>
                                    <p class="mt-2">Sprawdzanie dostępności...</p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    ${this.renderCalendarStyles()}
                </div>
            `
        } catch (error) {
            console.error('Error loading booking page:', error)
            return `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować strony rezerwacji.</p>
                    <hr>
                    <button class="btn btn-primary" onclick="document.querySelector('[data-section=rezerwuj]').click()">Wróć do listy lektorów</button>
                </div>
            `
        }
    }
    
    public setupLessonBookingEvents(): void {
        // Setup calendar day click events
        const calendarDays = document.querySelectorAll('.calendar-day')
        calendarDays.forEach(day => {
            day.addEventListener('click', (e) => {
                const target = e.currentTarget as HTMLElement
                const date = target.getAttribute('data-date')
                if (date && !target.classList.contains('past')) {
                    this.selectDate(date)
                }
            })
        })
        
        // Setup confirm booking button
        const confirmBookingBtn = document.getElementById('confirm-booking')
        if (confirmBookingBtn) {
            confirmBookingBtn.addEventListener('click', () => this.confirmBooking())
        }
    }
    
    private async loadTutorAvailability(tutorId: string): Promise<void> {
        // Load availability for all visible days (4 weeks)
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Get the start of the current week (Monday) - same calculation as in renderCalendar
        const currentDay = today.getDay()
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - daysFromMonday)
        
        const promises = []
        
        for (let week = 0; week < 4; week++) {
            for (let day = 0; day < 7; day++) {
                // Calculate date starting from Monday - same as renderCalendar
                const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + (week * 7) + day)
                
                if (date >= today) { // Only load for current and future dates
                    const dateStr = formatDate(date)
                    promises.push(this.loadAvailabilityForDate(tutorId, dateStr))
                }
            }
        }
        
        // Wait for all requests to complete
        await Promise.all(promises)
    }
    
    private async loadAvailabilityForDate(tutorId: string, date: string): Promise<void> {
        try {
            const slots = await BookingService.getAvailableSlots(tutorId, date)
            
            if (slots && slots.length >= 0) {
                
                // Store availability data for color coding
                const availability = {
                    date: date,
                    is_available: slots.length > 0,
                    total_slots: slots.length,
                    hours_booked: 8 - slots.length
                }
                this.tutorAvailability.set(date, availability)
            } else {
                // No slots available
                const availability = {
                    date: date,
                    is_available: false,
                    total_slots: 0,
                    hours_booked: 8
                }
                this.tutorAvailability.set(date, availability)
            }
        } catch (error) {
            console.error(`Error loading availability for ${date}:`, error)
            // Set as unavailable on error
            const availability = {
                date: date,
                is_available: false,
                total_slots: 0,
                hours_booked: 8
            }
            this.tutorAvailability.set(date, availability)
        }
    }
    
    private renderCalendarWithAvailability(): void {
        const calendarGrid = document.querySelector('.calendar-grid')
        if (calendarGrid) {
            calendarGrid.innerHTML = this.renderCalendar()
            this.setupLessonBookingEvents()
        }
    }
    
    private renderCalendar(): string {
        const weeks = []
        const today = new Date()
        today.setHours(0, 0, 0, 0)
        
        // Get the start of the current week (Monday)
        const currentDay = today.getDay()
        const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1
        const weekStart = new Date(today)
        weekStart.setDate(today.getDate() - daysFromMonday)
        
        // Render 4 weeks of calendar
        for (let week = 0; week < 4; week++) {
            for (let day = 0; day < 7; day++) {
                // Calculate date starting from Monday
                const date = new Date(weekStart.getFullYear(), weekStart.getMonth(), weekStart.getDate() + (week * 7) + day)
                
                const dateStr = formatDate(date)
                const isPast = date < today
                const availability = this.tutorAvailability.get(dateStr)
                
                let dayClass = 'calendar-day'
                if (isPast) dayClass += ' past'
                if (this.selectedDate === dateStr) dayClass += ' selected'
                
                // Add availability classes if we have data
                if (availability && !isPast) {
                    if (availability.is_available) {
                        if (availability.total_slots >= 6) {
                            dayClass += ' available-full'
                        } else if (availability.total_slots >= 3) {
                            dayClass += ' available-partial'
                        } else if (availability.total_slots > 0) {
                            dayClass += ' available-partial'
                        } else {
                            dayClass += ' available-full-booked'
                        }
                    }
                }
                
                // Show availability indicator
                let statusIndicator = ''
                if (!isPast) {
                    if (availability) {
                        if (availability.is_available) {
                            if (availability.total_slots >= 6) {
                                statusIndicator = '<div class="availability-indicator available">●</div>'
                            } else if (availability.total_slots >= 3) {
                                statusIndicator = '<div class="availability-indicator partial">●</div>'
                            } else if (availability.total_slots > 0) {
                                statusIndicator = '<div class="availability-indicator partial">●</div>'
                            } else {
                                statusIndicator = '<div class="availability-indicator full">●</div>'
                            }
                        } else {
                            // No availability for this day
                            statusIndicator = '<div class="availability-indicator unavailable">●</div>'
                        }
                    } else {
                        // Data not loaded yet - show loading state
                        statusIndicator = '<div class="availability-indicator loading">○</div>'
                    }
                }
                
                weeks.push(`
                    <div class="${dayClass}" data-date="${dateStr}">
                        <div class="calendar-day-date">
                            ${date.getDate()}.${(date.getMonth() + 1).toString().padStart(2, '0')}
                        </div>
                        ${statusIndicator}
                        ${!isPast && availability && availability.is_available ? `<div class="calendar-day-click">Kliknij</div>` : ''}
                    </div>
                `)
            }
        }
        
        return weeks.join('')
    }
    
    private async selectDate(date: string): Promise<void> {
        this.selectedDate = date
        this.selectedTime = ''
        
        // Update selected day styling
        const allDays = document.querySelectorAll('.calendar-day')
        allDays.forEach(day => day.classList.remove('selected'))
        
        const selectedDay = document.querySelector(`[data-date="${date}"]`)
        if (selectedDay) selectedDay.classList.add('selected')
        
        // Update date display
        const dateDisplay = document.getElementById('selected-date-display')
        const formattedDate = this.formatDisplayDate(date)
        if (dateDisplay) dateDisplay.textContent = formattedDate
        
        // Load available slots for this date
        await this.loadAvailableSlots(date)
    }
    
    private async loadAvailableSlots(date: string): Promise<void> {
        const timeSlotsContainer = document.getElementById('time-slots-container')
        const timeSlots = document.getElementById('time-slots')
        const noSlotsMessage = document.getElementById('no-slots-message')
        const loadingSlots = document.getElementById('loading-slots')
        const confirmBtn = document.getElementById('confirm-booking')
        
        // Show loading
        if (loadingSlots) loadingSlots.style.display = 'block'
        if (timeSlotsContainer) timeSlotsContainer.style.display = 'none'
        if (noSlotsMessage) noSlotsMessage.style.display = 'none'
        if (confirmBtn) confirmBtn.style.display = 'none'
        
        try {
            const tutorId = this.getCurrentTutorId()
            if (!tutorId) return
            
            // Check if we already have availability data for this date
            let slots: any[] = []
            if (this.tutorAvailability.has(date)) {
                const availability = this.tutorAvailability.get(date)
                if (availability?.is_available) {
                    // Get fresh slots data for this specific date
                    slots = await BookingService.getAvailableSlots(tutorId, date)
                }
            } else {
                // Load availability if not already loaded
                slots = await BookingService.getAvailableSlots(tutorId, date)
                
                // Store availability data for color coding
                const availability = {
                    date: date,
                    is_available: slots.length > 0,
                    total_slots: slots.length,
                    hours_booked: 8 - slots.length
                }
                this.tutorAvailability.set(date, availability)
                this.updateCalendarDayStyle(date, availability)
            }
            
            if (loadingSlots) loadingSlots.style.display = 'none'
            
            console.log('Final slots to use:', slots)
            
            if (slots && slots.length > 0) {
                // Filter out past time slots if this is today
                const filteredSlots = this.filterPastTimeSlots(slots, date)
                this.availableSlots = filteredSlots
                
                if (timeSlots) {
                    timeSlots.innerHTML = filteredSlots.map((slot: any) => 
                        `<button class="btn btn-outline-primary time-slot-btn" 
                                data-start-time="${slot.start_time}" 
                                data-end-time="${slot.end_time}">
                            ${slot.display}
                        </button>`
                    ).join('')
                    
                    // Add event listeners to time slot buttons
                    const timeSlotButtons = timeSlots.querySelectorAll('.time-slot-btn')
                    timeSlotButtons.forEach(btn => {
                        btn.addEventListener('click', (e) => this.selectTimeSlot(e.target as HTMLElement))
                    })
                }
                
                if (timeSlotsContainer) timeSlotsContainer.style.display = 'block'
            } else {
                if (noSlotsMessage) noSlotsMessage.style.display = 'block'
            }
            
        } catch (error) {
            console.error('Error loading available slots:', error)
            if (loadingSlots) loadingSlots.style.display = 'none'
            if (noSlotsMessage) {
                noSlotsMessage.style.display = 'block'
                noSlotsMessage.innerHTML = `
                    <i class="bi bi-exclamation-triangle me-2"></i>
                    Wystąpił błąd podczas ładowania dostępnych terminów.
                `
            }
        }
    }
    
    private filterPastTimeSlots(slots: any[], date: string): any[] {
        const today = new Date()
        const currentDate = formatDate(today)
        
        // If not today, return all slots
        if (date !== currentDate) {
            return slots
        }
        
        // If today, filter out past times
        const currentTime = new Date()
        const currentHour = currentTime.getHours()
        const currentMinutes = currentTime.getMinutes()
        
        return slots.filter((slot: any) => {
            const slotTime = slot.start_time.split(':')
            const slotHour = parseInt(slotTime[0])
            const slotMinutes = parseInt(slotTime[1] || '0')
            
            // Allow slots that start at least 1 hour from now
            if (slotHour > currentHour + 1) {
                return true
            } else if (slotHour === currentHour + 1) {
                return slotMinutes >= currentMinutes
            }
            return false
        })
    }
    
    private selectTimeSlot(button: HTMLElement): void {
        // Remove active class from all buttons
        const allButtons = document.querySelectorAll('.time-slot-btn')
        allButtons.forEach(btn => btn.classList.remove('active', 'btn-primary'))
        allButtons.forEach(btn => btn.classList.add('btn-outline-primary'))
        
        // Add active class to selected button
        button.classList.remove('btn-outline-primary')
        button.classList.add('btn-primary', 'active')
        
        // Store selected time
        this.selectedTime = button.dataset.startTime || ''
        
        // Show confirm button
        const confirmBtn = document.getElementById('confirm-booking')
        if (confirmBtn) confirmBtn.style.display = 'block'
    }
    
    private async confirmBooking(): Promise<void> {
        if (!this.selectedDate || !this.selectedTime) {
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'warning',
                    message: 'Proszę wybrać datę i godzinę lekcji',
                    duration: 3000
                }
            }))
            return
        }
        
        const tutorId = this.getCurrentTutorId()
        if (!tutorId) return
        
        const confirmBtn = document.getElementById('confirm-booking') as HTMLButtonElement
        
        // Disable button and show loading
        const originalText = confirmBtn.innerHTML
        confirmBtn.disabled = true
        confirmBtn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Rezerwowanie...'
        
        try {
            // Calculate end time (lessons are 1 hour = 60 minutes)
            const startTime = this.selectedTime
            const startHour = parseInt(startTime.split(':')[0])
            const endTime = `${(startHour + 1).toString().padStart(2, '0')}:00`
            
            const bookingData = {
                tutor_id: parseInt(tutorId),
                lesson_date: this.selectedDate,
                start_time: startTime,
                end_time: endTime,
                duration_minutes: 60,
                lesson_type: 'individual' as const
            }
            
            
            const response = await BookingService.bookLesson(bookingData)
            
            if (response.success) {
                // Show success message
                document.dispatchEvent(new CustomEvent('notification:show', {
                    detail: {
                        type: 'success',
                        message: 'Lekcja została zarezerwowana pomyślnie!',
                        duration: 3000
                    }
                }))
                
                // Navigate back to lessons view
                const navElement = document.querySelector('[data-section="nadchodzace"]') as HTMLElement
                navElement?.click()
            } else {
                throw new Error(response.message || 'Błąd podczas rezerwacji')
            }
            
        } catch (error: any) {
            console.error('Error booking lesson:', error)
            
            // Check if it's a slot conflict error (but not from cancelled lessons)
            const isConflictError = error.message?.includes('zajęty') || 
                                  (error.message?.includes('Duplicate entry') && !error.message?.includes('cancelled'))
            
            document.dispatchEvent(new CustomEvent('notification:show', {
                detail: {
                    type: 'error',
                    message: isConflictError 
                        ? 'Ten slot został właśnie zarezerwowany przez innego studenta. Wybierz inny termin.'
                        : error.message || 'Wystąpił błąd podczas rezerwacji lekcji',
                    duration: 5000
                }
            }))
            
            // If it's a conflict, refresh availability to show updated slots
            if (isConflictError) {
                this.loadTutorAvailability(tutorId)
                this.selectedDate = ''
                this.selectedTime = ''
                this.renderCalendar()
            }
        } finally {
            // Re-enable button
            confirmBtn.disabled = false
            confirmBtn.innerHTML = originalText
        }
    }
    
    private updateCalendarDayStyle(date: string, availability: any): void {
        const dayElement = document.querySelector(`[data-date="${date}"]`)
        if (!dayElement) return
        
        // Remove existing availability classes
        dayElement.classList.remove('available-full', 'available-partial', 'available-full-booked')
        
        // Add new availability class
        if (availability.is_available) {
            if (availability.total_slots >= 6) {
                dayElement.classList.add('available-full')
            } else if (availability.total_slots >= 3) {
                dayElement.classList.add('available-partial')
            } else if (availability.total_slots > 0) {
                dayElement.classList.add('available-partial')
            } else {
                dayElement.classList.add('available-full-booked')
            }
        } else {
            dayElement.classList.add('available-full-booked')
        }
        
        // Update status indicator
        const existingIndicator = dayElement.querySelector('.availability-indicator')
        if (existingIndicator) {
            existingIndicator.remove()
        }
        
        let statusIndicator = ''
        if (availability.is_available) {
            if (availability.total_slots >= 6) {
                statusIndicator = '<div class="availability-indicator available">●</div>'
            } else if (availability.total_slots >= 3) {
                statusIndicator = '<div class="availability-indicator partial">●</div>'
            } else if (availability.total_slots > 0) {
                statusIndicator = '<div class="availability-indicator partial">●</div>'
            } else {
                statusIndicator = '<div class="availability-indicator full">●</div>'
            }
        } else {
            statusIndicator = '<div class="availability-indicator full">●</div>'
        }
        
        if (statusIndicator) {
            const dateElement = dayElement.querySelector('.calendar-day-date')
            if (dateElement) {
                dateElement.insertAdjacentHTML('afterend', statusIndicator)
            }
        }
    }
    
    private getCurrentTutorId(): string | null {
        const urlParams = new URLSearchParams(window.location.search)
        return urlParams.get('tutor_id')
    }
    
    
    private formatDisplayDate(dateStr: string): string {
        const date = new Date(dateStr)
        return date.toLocaleDateString('pl-PL', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })
    }
    
    private getDayName(dayIndex: number): string {
        const days = ['ND', 'PN', 'WT', 'ŚR', 'CZ', 'PT', 'SB']
        return days[dayIndex]
    }
    
    private renderCalendarStyles(): string {
        return `
            <style>
                .booking-calendar {
                    max-width: 100%;
                }
                
                .calendar-wrapper {
                    width: 100%;
                }
                
                .calendar-header-row {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 10px;
                    margin-bottom: 10px;
                }
                
                .calendar-grid {
                    display: grid;
                    grid-template-columns: repeat(7, 1fr);
                    gap: 10px;
                    margin-bottom: 20px;
                }
                
                .calendar-header-day {
                    font-weight: bold;
                    text-align: center;
                    padding: 10px;
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 4px;
                }
                
                .calendar-legend {
                    background: #f8f9fa;
                    border: 1px solid #dee2e6;
                    border-radius: 6px;
                    padding: 15px;
                }
                
                .legend-item {
                    display: flex;
                    align-items: center;
                    margin-bottom: 5px;
                }
                
                .legend-dot {
                    font-size: 1.2em;
                    margin-right: 8px;
                }
                
                .legend-dot.available {
                    color: #28a745;
                }
                
                .legend-dot.partial {
                    color: #ffc107;
                }
                
                .legend-dot.full {
                    color: #dc3545;
                }
                
                .legend-dot.unavailable {
                    color: #dc3545;
                }
                
                .legend-dot.past {
                    color: #6c757d;
                }
                
                .calendar-day {
                    border: 1px solid #ddd;
                    border-radius: 8px;
                    padding: 10px;
                    min-height: 80px;
                    background: #fff;
                    cursor: pointer;
                    transition: all 0.2s;
                    display: flex;
                    flex-direction: column;
                    justify-content: center;
                    align-items: center;
                }
                
                .calendar-day:hover:not(.past) {
                    background: #f8f9fa;
                    border-color: #007bff;
                }
                
                .calendar-day.past {
                    opacity: 0.5;
                    cursor: not-allowed;
                    background: #f8f9fa;
                }
                
                .calendar-day.selected {
                    background: #e3f2fd;
                    border-color: #2196f3;
                    border-width: 2px;
                }
                
                .calendar-day.available-full {
                    background: #e8f5e8;
                    border-color: #28a745;
                }
                
                .calendar-day.available-partial {
                    background: #fff3cd;
                    border-color: #ffc107;
                }
                
                .calendar-day.available-full-booked {
                    background: #f8d7da;
                    border-color: #dc3545;
                    cursor: not-allowed;
                }
                
                .calendar-day.available-full:hover {
                    background: #d4edda;
                    border-color: #155724;
                }
                
                .calendar-day.available-partial:hover {
                    background: #ffeaa7;
                    border-color: #856404;
                }
                
                .calendar-day.selected.available-full {
                    background: #c3e6cb;
                    border-color: #155724;
                }
                
                .calendar-day.selected.available-partial {
                    background: #ffeaa7;
                    border-color: #856404;
                }
                
                .calendar-day-header {
                    font-weight: bold;
                    font-size: 0.9em;
                    margin-bottom: 5px;
                }
                
                .calendar-day-date {
                    font-size: 1.1em;
                    color: #333;
                    margin-bottom: 5px;
                }
                
                .calendar-day-click {
                    font-size: 0.8em;
                    color: #007bff;
                    text-decoration: underline;
                }
                
                .availability-indicator {
                    font-size: 1.2em;
                    margin: 2px 0;
                    line-height: 1;
                }
                
                .availability-indicator.available {
                    color: #28a745;
                }
                
                .availability-indicator.partial {
                    color: #ffc107;
                }
                
                .availability-indicator.full {
                    color: #dc3545;
                }
                
                .availability-indicator.unavailable {
                    color: #dc3545;
                }
                
                .availability-indicator.loading {
                    color: #6c757d;
                    opacity: 0.5;
                }
                
                .time-slot-btn {
                    margin: 2px;
                    font-size: 0.9em;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                
                .time-slot-btn:hover {
                    transform: translateY(-1px);
                }
                
                .time-slot-btn.active {
                    transform: translateY(-1px);
                    box-shadow: 0 2px 4px rgba(0,123,255,0.3);
                }
                
                #time-slots-container {
                    border-top: 1px solid #dee2e6;
                    padding-top: 20px;
                }
                
                @media (max-width: 768px) {
                    .calendar-grid {
                        gap: 5px;
                    }
                    
                    .calendar-day {
                        min-height: 60px;
                        padding: 5px;
                    }
                    
                    .calendar-day-header {
                        font-size: 0.8em;
                    }
                    
                    .calendar-day-date {
                        font-size: 1em;
                    }
                }
            </style>
        `
    }
    
}