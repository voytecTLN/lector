// resources/ts/components/students/TutorBooking.ts
import type { RouteComponent } from '@router/routes'
import { api } from '@services/ApiService'
import { navigate } from "@utils/navigation"

export class TutorBooking implements RouteComponent {
    private tutorId: string
    private selectedDate: Date | null = null
    private selectedSlot: any = null

    constructor(params: { id: string }) {
        this.tutorId = params.id
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'container py-5'
        
        try {
            // Fetch tutor data using public endpoint
            const tutorResponse = await api.get<any>(`/tutors/${this.tutorId}/public`)
            const tutor = tutorResponse
            
            el.innerHTML = `
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/student/dashboard">Panel</a></li>
                        <li class="breadcrumb-item"><a href="/student/dashboard?section=rezerwuj">Rezerwuj lekcję</a></li>
                        <li class="breadcrumb-item"><a href="/tutor/${this.tutorId}">Profil lektora</a></li>
                        <li class="breadcrumb-item active">Sprawdź terminy</li>
                    </ol>
                </nav>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header bg-primary text-white">
                                <h4 class="mb-0">Dostępne terminy - ${tutor.name}</h4>
                            </div>
                            <div class="card-body">
                                <div class="alert alert-info">
                                    <i class="bi bi-info-circle me-2"></i>
                                    Wybierz datę, aby zobaczyć dostępne terminy lekcji.
                                </div>
                                
                                <!-- Calendar placeholder -->
                                <div id="availability-calendar" class="mb-4">
                                    <div class="text-center py-5">
                                        <div class="spinner-border text-primary" role="status">
                                            <span class="visually-hidden">Ładowanie...</span>
                                        </div>
                                        <p class="mt-2">Ładowanie kalendarza...</p>
                                    </div>
                                </div>
                                
                                <!-- Available slots will be shown here -->
                                <div id="available-slots" class="mt-4" style="display: none;">
                                    <h5>Dostępne godziny</h5>
                                    <div id="slots-container" class="row g-2">
                                        <!-- Slots will be dynamically added here -->
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-4">
                        <!-- Booking summary -->
                        <div class="card sticky-top" style="top: 20px;">
                            <div class="card-header">
                                <h5 class="mb-0">Podsumowanie rezerwacji</h5>
                            </div>
                            <div class="card-body">
                                <div class="mb-3">
                                    <label class="text-muted small">Lektor</label>
                                    <p class="mb-0 fw-bold">${tutor.name}</p>
                                </div>
                                
                                <div class="mb-3" id="selected-date-info" style="display: none;">
                                    <label class="text-muted small">Wybrana data</label>
                                    <p class="mb-0 fw-bold" id="selected-date-text">-</p>
                                </div>
                                
                                <div class="mb-3" id="selected-time-info" style="display: none;">
                                    <label class="text-muted small">Wybrana godzina</label>
                                    <p class="mb-0 fw-bold" id="selected-time-text">-</p>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="text-muted small">Rodzaj lekcji</label>
                                    <select class="form-select" id="lesson-type">
                                        <option value="individual">Indywidualna</option>
                                        <option value="group">Grupowa</option>
                                    </select>
                                </div>
                                
                                <div class="mb-3">
                                    <label class="text-muted small">Uwagi (opcjonalne)</label>
                                    <textarea class="form-control" id="booking-notes" rows="3" placeholder="Dodaj uwagi do rezerwacji..."></textarea>
                                </div>
                                
                                <button class="btn btn-primary btn-lg w-100" id="confirm-booking-btn" disabled>
                                    <i class="bi bi-check-circle me-2"></i>Potwierdź rezerwację
                                </button>
                                
                                <div class="alert alert-warning mt-3 mb-0">
                                    <small>
                                        <i class="bi bi-exclamation-triangle me-1"></i>
                                        Funkcja rezerwacji jest obecnie w fazie rozwoju.
                                    </small>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
            
            // Initialize the calendar after DOM is ready
            setTimeout(() => {
                this.initializeCalendar()
            }, 100)
            
        } catch (error) {
            console.error('Error loading booking page:', error)
            el.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować strony rezerwacji.</p>
                    <hr>
                    <a href="/tutor/${this.tutorId}" class="btn btn-primary">Wróć do profilu lektora</a>
                </div>
            `
        }
        
        return el
    }

    private initializeCalendar(): void {
        const calendarEl = document.getElementById('availability-calendar')
        if (!calendarEl) return
        
        // For now, we'll create a simple calendar view
        // In a real implementation, you might use a library like FullCalendar
        const today = new Date()
        const currentMonth = today.getMonth()
        const currentYear = today.getFullYear()
        
        calendarEl.innerHTML = `
            <div class="calendar-header d-flex justify-content-between align-items-center mb-3">
                <button class="btn btn-sm btn-outline-primary" id="prev-month">
                    <i class="bi bi-chevron-left"></i>
                </button>
                <h5 class="mb-0">${this.getMonthName(currentMonth)} ${currentYear}</h5>
                <button class="btn btn-sm btn-outline-primary" id="next-month">
                    <i class="bi bi-chevron-right"></i>
                </button>
            </div>
            <div class="calendar-grid">
                ${this.generateCalendarGrid(currentYear, currentMonth)}
            </div>
        `
        
        // Add event listeners for date selection
        this.attachCalendarEventListeners()
    }

    private generateCalendarGrid(year: number, month: number): string {
        const firstDay = new Date(year, month, 1).getDay()
        const daysInMonth = new Date(year, month + 1, 0).getDate()
        const today = new Date()
        
        let html = '<div class="row g-1">'
        
        // Day headers
        const dayNames = ['Nd', 'Pn', 'Wt', 'Śr', 'Cz', 'Pt', 'Sb']
        dayNames.forEach(day => {
            html += `<div class="col text-center fw-bold small text-muted">${day}</div>`
        })
        html += '</div><div class="row g-1">'
        
        // Empty cells for days before month start
        for (let i = 0; i < firstDay; i++) {
            html += '<div class="col"></div>'
        }
        
        // Days of the month
        for (let day = 1; day <= daysInMonth; day++) {
            const date = new Date(year, month, day)
            const isToday = date.toDateString() === today.toDateString()
            const isPast = date < today
            const isWeekend = date.getDay() === 0 || date.getDay() === 6
            
            let classes = 'calendar-day p-2 text-center rounded'
            if (isToday) classes += ' bg-primary text-white'
            else if (isPast) classes += ' text-muted'
            else if (isWeekend) classes += ' bg-light'
            else classes += ' bg-light hover-bg-primary cursor-pointer'
            
            html += `
                <div class="col">
                    <div class="${classes}" 
                         data-date="${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}"
                         ${!isPast && !isWeekend ? 'role="button"' : ''}>
                        ${day}
                    </div>
                </div>
            `
            
            // New row after Saturday
            if ((firstDay + day) % 7 === 0 && day < daysInMonth) {
                html += '</div><div class="row g-1">'
            }
        }
        
        html += '</div>'
        
        // Add some custom CSS
        html += `
            <style>
                .calendar-day {
                    cursor: default;
                    transition: all 0.2s;
                }
                .calendar-day.cursor-pointer:hover {
                    background-color: #0d6efd !important;
                    color: white !important;
                }
                .calendar-day.selected {
                    background-color: #0d6efd !important;
                    color: white !important;
                }
            </style>
        `
        
        return html
    }

    private attachCalendarEventListeners(): void {
        // Date selection
        document.querySelectorAll('.calendar-day.cursor-pointer').forEach(dayEl => {
            dayEl.addEventListener('click', (e) => {
                const target = e.target as HTMLElement
                const date = target.getAttribute('data-date')
                if (date) {
                    this.selectDate(date)
                }
            })
        })
    }

    private selectDate(dateStr: string): void {
        // Remove previous selection
        document.querySelectorAll('.calendar-day').forEach(el => {
            el.classList.remove('selected')
        })
        
        // Add selection to clicked date
        const selectedEl = document.querySelector(`[data-date="${dateStr}"]`)
        if (selectedEl) {
            selectedEl.classList.add('selected')
        }
        
        // Update selected date info
        this.selectedDate = new Date(dateStr)
        const dateInfoEl = document.getElementById('selected-date-info')
        const dateTextEl = document.getElementById('selected-date-text')
        if (dateInfoEl && dateTextEl) {
            dateInfoEl.style.display = 'block'
            dateTextEl.textContent = this.formatDate(this.selectedDate)
        }
        
        // Load available slots for this date
        this.loadAvailableSlots(dateStr)
    }

    private async loadAvailableSlots(date: string): Promise<void> {
        const slotsContainer = document.getElementById('available-slots')
        const slotsEl = document.getElementById('slots-container')
        
        if (!slotsContainer || !slotsEl) return
        
        slotsContainer.style.display = 'block'
        slotsEl.innerHTML = '<div class="col-12 text-center"><div class="spinner-border spinner-border-sm"></div></div>'
        
        try {
            // In a real implementation, this would fetch actual availability
            // For now, we'll simulate some available slots
            
            const slots = [
                { time: '09:00', available: true },
                { time: '10:00', available: true },
                { time: '11:00', available: false },
                { time: '14:00', available: true },
                { time: '15:00', available: true },
                { time: '16:00', available: false },
                { time: '17:00', available: true }
            ]
            
            slotsEl.innerHTML = slots.map(slot => `
                <div class="col-6 col-md-4">
                    <button class="btn ${slot.available ? 'btn-outline-primary' : 'btn-secondary disabled'} w-100 time-slot"
                            data-time="${slot.time}"
                            ${!slot.available ? 'disabled' : ''}>
                        ${slot.time}
                    </button>
                </div>
            `).join('')
            
            // Add click handlers for time slots
            document.querySelectorAll('.time-slot:not(.disabled)').forEach(slotEl => {
                slotEl.addEventListener('click', (e) => {
                    const target = e.target as HTMLElement
                    this.selectTimeSlot(target)
                })
            })
            
        } catch (error) {
            console.error('Error loading slots:', error)
            slotsEl.innerHTML = '<div class="col-12"><div class="alert alert-danger">Błąd ładowania dostępnych terminów</div></div>'
        }
    }

    private selectTimeSlot(slotEl: HTMLElement): void {
        // Remove previous selection
        document.querySelectorAll('.time-slot').forEach(el => {
            el.classList.remove('btn-primary')
            el.classList.add('btn-outline-primary')
        })
        
        // Add selection
        slotEl.classList.remove('btn-outline-primary')
        slotEl.classList.add('btn-primary')
        
        // Update selected time info
        const time = slotEl.getAttribute('data-time')
        const timeInfoEl = document.getElementById('selected-time-info')
        const timeTextEl = document.getElementById('selected-time-text')
        const confirmBtn = document.getElementById('confirm-booking-btn') as HTMLButtonElement
        
        if (timeInfoEl && timeTextEl && time) {
            timeInfoEl.style.display = 'block'
            timeTextEl.textContent = time
            
            if (confirmBtn) {
                confirmBtn.disabled = false
            }
        }
    }

    private formatDate(date: Date): string {
        const days = ['Niedziela', 'Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota']
        const months = ['stycznia', 'lutego', 'marca', 'kwietnia', 'maja', 'czerwca', 
                       'lipca', 'sierpnia', 'września', 'października', 'listopada', 'grudnia']
        
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`
    }

    private getMonthName(month: number): string {
        const months = ['Styczeń', 'Luty', 'Marzec', 'Kwiecień', 'Maj', 'Czerwiec',
                       'Lipiec', 'Sierpień', 'Wrzesień', 'Październik', 'Listopad', 'Grudzień']
        return months[month]
    }
}