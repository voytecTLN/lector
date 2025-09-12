// resources/ts/components/admin/SystemSettings.ts
import { AuthService } from '@services/AuthService'

export class SystemSettings {
    private container: HTMLElement | null = null
    private authService: AuthService
    private currentSection: string = 'meetings'
    private unsavedChanges: boolean = false

    constructor() {
        this.authService = AuthService.getInstance()
    }

    render(): string {
        return `
            <div class="system-settings">
                <!-- Warning Header -->
                <div class="alert alert-warning mb-4">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-exclamation-triangle-fill me-3" style="font-size: 1.5rem;"></i>
                        <div>
                            <h5 class="alert-heading mb-1">⚠️ UWAGA: Pola konfiguracyjne w przygotowaniu</h5>
                            <p class="mb-0">To są pola do przyszłej integracji z systemem. Obecnie służą tylko do planowania i testowania interfejsu.</p>
                        </div>
                    </div>
                </div>

                <!-- Unsaved Changes Banner -->
                <div class="alert alert-info sticky-top" id="unsaved-banner" style="display: none;">
                    <div class="d-flex justify-content-between align-items-center">
                        <span><i class="bi bi-exclamation-circle me-2"></i>Masz niezapisane zmiany</span>
                        <div>
                            <button class="btn btn-sm btn-outline-info me-2" onclick="systemSettings.discardChanges()">Odrzuć</button>
                            <button class="btn btn-sm btn-info" onclick="systemSettings.saveChanges()">Zapisz</button>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <!-- Sidebar Navigation -->
                    <div class="col-lg-3">
                        <div class="settings-sidebar sticky-top">
                            <div class="list-group list-group-flush">
                                <button class="list-group-item list-group-item-action ${this.currentSection === 'meetings' ? 'active' : ''}" 
                                        data-section="meetings" onclick="systemSettings.switchSection('meetings')">
                                    <i class="bi bi-camera-video me-2"></i>
                                    <span>📅 Spotkania</span>
                                </button>
                                <button class="list-group-item list-group-item-action ${this.currentSection === 'lessons' ? 'active' : ''}" 
                                        data-section="lessons" onclick="systemSettings.switchSection('lessons')">
                                    <i class="bi bi-book me-2"></i>
                                    <span>📚 Lekcje</span>
                                </button>
                                <button class="list-group-item list-group-item-action ${this.currentSection === 'tutors-hours' ? 'active' : ''}" 
                                        data-section="tutors-hours" onclick="systemSettings.switchSection('tutors-hours')">
                                    <i class="bi bi-clock me-2"></i>
                                    <span>👨‍🏫 Lektorzy - Godziny</span>
                                </button>
                                <button class="list-group-item list-group-item-action ${this.currentSection === 'tutors-availability' ? 'active' : ''}" 
                                        data-section="tutors-availability" onclick="systemSettings.switchSection('tutors-availability')">
                                    <i class="bi bi-calendar-check me-2"></i>
                                    <span>👨‍🏫 Lektorzy - Dostępność</span>
                                </button>
                                <button class="list-group-item list-group-item-action ${this.currentSection === 'email' ? 'active' : ''}" 
                                        data-section="email" onclick="systemSettings.switchSection('email')">
                                    <i class="bi bi-envelope me-2"></i>
                                    <span>📧 Email</span>
                                </button>
                                <button class="list-group-item list-group-item-action ${this.currentSection === 'sms' ? 'active' : ''}" 
                                        data-section="sms" onclick="systemSettings.switchSection('sms')">
                                    <i class="bi bi-phone me-2"></i>
                                    <span>📱 SMS</span>
                                </button>
                                <button class="list-group-item list-group-item-action ${this.currentSection === 'payments' ? 'active' : ''}" 
                                        data-section="payments" onclick="systemSettings.switchSection('payments')">
                                    <i class="bi bi-credit-card me-2"></i>
                                    <span>💳 Płatności</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Main Content -->
                    <div class="col-lg-9">
                        <div class="settings-content card">
                            <div class="card-body" id="settings-main-content">
                                ${this.renderCurrentSection()}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    async mount(container: HTMLElement): Promise<void> {
        this.container = container
        container.innerHTML = this.render()

        // Make systemSettings globally available for onclick handlers
        ;(window as any).systemSettings = this

        // Check authentication
        if (!this.checkAuthentication()) {
            this.showAuthenticationError()
            return
        }

        // Setup form change detection
        this.setupChangeDetection()
    }

    private checkAuthentication(): boolean {
        const user = this.authService.getUser()
        return !!(user && user.role === 'admin')
    }

    private showAuthenticationError(): void {
        const contentArea = this.container!
        contentArea.innerHTML = `
            <div class="system-settings">
                <div class="alert alert-warning text-center" style="margin: 2rem;">
                    <h4><i class="bi bi-exclamation-triangle"></i> Brak dostępu</h4>
                    <p>Aby wyświetlić ustawienia systemu, musisz być zalogowany jako administrator.</p>
                    <p class="mb-0">
                        <a href="#/auth/login" class="btn btn-primary">Zaloguj się</a>
                    </p>
                </div>
            </div>
        `
    }

    private renderCurrentSection(): string {
        switch (this.currentSection) {
            case 'meetings':
                return this.renderMeetingsSection()
            case 'lessons':
                return this.renderLessonsSection()
            case 'tutors-hours':
                return this.renderTutorsHoursSection()
            case 'tutors-availability':
                return this.renderTutorsAvailabilitySection()
            case 'email':
                return this.renderEmailSection()
            case 'sms':
                return this.renderSmsSection()
            case 'payments':
                return this.renderPaymentsSection()
            default:
                return this.renderMeetingsSection()
        }
    }

    private renderMeetingsSection(): string {
        return `
            <div class="settings-section">
                <div class="section-header mb-4">
                    <h3 class="mb-2">📅 Spotkania (Daily.co Integration)</h3>
                    <p class="text-muted mb-0">Konfiguracja zachowania pokojów do wideorozmów</p>
                </div>

                <form id="meetings-form">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label" for="meeting_room_create_minutes_before">
                                Utworzenie pokoju przed lekcją (minuty)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile minut przed lekcją można utworzyć pokój"></i>
                            </label>
                            <input type="number" class="form-control" id="meeting_room_create_minutes_before" 
                                   value="15" min="0" max="60">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="meeting_join_minutes_before">
                                Dołączenie studenta przed lekcją (minuty)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile minut przed lekcją student może dołączyć"></i>
                            </label>
                            <input type="number" class="form-control" id="meeting_join_minutes_before" 
                                   value="5" min="0" max="30">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="meeting_join_minutes_after">
                                Dołączenie po rozpoczęciu (minuty)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile minut po rozpoczęciu można jeszcze dołączyć"></i>
                            </label>
                            <input type="number" class="form-control" id="meeting_join_minutes_after" 
                                   value="10" min="0" max="60">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="meeting_max_duration_minutes">
                                Maksymalna długość lekcji (minuty)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Maksymalna długość pojedynczej lekcji"></i>
                            </label>
                            <select class="form-select" id="meeting_max_duration_minutes">
                                <option value="45">45 minut</option>
                                <option value="60">60 minut (1 godzina)</option>
                                <option value="90" selected>90 minut (1.5 godziny)</option>
                                <option value="120">120 minut (2 godziny)</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="meeting_auto_end_minutes">
                                Auto-zakończenie po nieaktywności (minuty)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Auto-zakończ spotkanie po X minutach nieaktywności"></i>
                            </label>
                            <input type="number" class="form-control" id="meeting_auto_end_minutes" 
                                   value="5" min="1" max="30">
                        </div>

                        <div class="col-md-12">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="meeting_recording_enabled" checked>
                                        <label class="form-check-label" for="meeting_recording_enabled">
                                            Włącz nagrywanie lekcji
                                            <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                               title="Czy lekcje mają być automatycznie nagrywane"></i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="meeting_waiting_room_enabled">
                                        <label class="form-check-label" for="meeting_waiting_room_enabled">
                                            Poczekalnia przed lekcją
                                            <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                               title="Czy studenci czekają w poczekalni do rozpoczęcia"></i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4">
                        <button type="button" class="btn btn-primary" onclick="systemSettings.saveSection('meetings')">
                            <i class="bi bi-check-circle me-2"></i>Zapisz ustawienia spotkań
                        </button>
                        <button type="button" class="btn btn-outline-secondary ms-2" onclick="systemSettings.resetSection('meetings')">
                            <i class="bi bi-arrow-clockwise me-2"></i>Przywróć domyślne
                        </button>
                    </div>
                </form>
            </div>
        `
    }

    private renderLessonsSection(): string {
        return `
            <div class="settings-section">
                <div class="section-header mb-4">
                    <h3 class="mb-2">📚 Lekcje (Lesson Management)</h3>
                    <p class="text-muted mb-0">Zasady anulowania, przełożeń i zarządzania lekcjami</p>
                </div>

                <form id="lessons-form">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label" for="lesson_cancel_hours_before">
                                Anulowanie bez kary (godziny przed)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile godzin przed lekcją można anulować bez kary finansowej"></i>
                            </label>
                            <input type="number" class="form-control" id="lesson_cancel_hours_before" 
                                   value="24" min="1" max="168">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="lesson_cancel_hours_before_penalty">
                                Anulowanie z karą (godziny przed)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile godzin przed - anulowanie z karą finansową"></i>
                            </label>
                            <input type="number" class="form-control" id="lesson_cancel_hours_before_penalty" 
                                   value="4" min="1" max="48">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="lesson_reschedule_hours_before">
                                Przełożenie lekcji (godziny przed)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile godzin przed można przełożyć lekcję"></i>
                            </label>
                            <input type="number" class="form-control" id="lesson_reschedule_hours_before" 
                                   value="12" min="1" max="72">
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="lesson_auto_complete_minutes">
                                Auto-zakończ po czasie (minuty)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Auto-zakończ lekcję X minut po planowanym końcu"></i>
                            </label>
                            <select class="form-select" id="lesson_auto_complete_minutes">
                                <option value="15">15 minut</option>
                                <option value="30" selected>30 minut</option>
                                <option value="60">60 minut</option>
                                <option value="0">Wyłączone</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="lesson_reminder_hours_before">
                                Przypomnienie przed lekcją (godziny)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile godzin przed lekcją wysłać przypomnienie"></i>
                            </label>
                            <select class="form-select" id="lesson_reminder_hours_before">
                                <option value="1">1 godzina</option>
                                <option value="2" selected>2 godziny</option>
                                <option value="4">4 godziny</option>
                                <option value="24">24 godziny</option>
                            </select>
                        </div>

                        <div class="col-md-12">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="lesson_feedback_required">
                                        <label class="form-check-label" for="lesson_feedback_required">
                                            Opinie są obowiązkowe
                                            <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                               title="Czy studenci muszą wystawić opinię po lekcji"></i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="lesson_materials_upload_enabled" checked>
                                        <label class="form-check-label" for="lesson_materials_upload_enabled">
                                            Lektorzy mogą uploadować materiały
                                            <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                               title="Czy lektorzy mogą dodawać pliki do lekcji"></i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4">
                        <button type="button" class="btn btn-primary" onclick="systemSettings.saveSection('lessons')">
                            <i class="bi bi-check-circle me-2"></i>Zapisz ustawienia lekcji
                        </button>
                        <button type="button" class="btn btn-outline-secondary ms-2" onclick="systemSettings.resetSection('lessons')">
                            <i class="bi bi-arrow-clockwise me-2"></i>Przywróć domyślne
                        </button>
                    </div>
                </form>
            </div>
        `
    }

    private renderTutorsHoursSection(): string {
        return `
            <div class="settings-section">
                <div class="section-header mb-4">
                    <h3 class="mb-2">👨‍🏫 Lektorzy - Godziny pracy</h3>
                    <p class="text-muted mb-0">Globalne ustawienia godzin pracy i dostępności lektorów</p>
                </div>

                <form id="tutors-hours-form">
                    <div class="row g-3">
                        <div class="col-md-6">
                            <label class="form-label" for="tutor_day_start_hour">
                                Początek dnia pracy
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Najwcześniejsza godzina, o której lektorzy mogą ustawiać dostępność"></i>
                            </label>
                            <select class="form-select" id="tutor_day_start_hour">
                                <option value="6">06:00</option>
                                <option value="7">07:00</option>
                                <option value="8" selected>08:00</option>
                                <option value="9">09:00</option>
                                <option value="10">10:00</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="tutor_day_end_hour">
                                Koniec dnia pracy
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Najpóźniejsza godzina dostępności lektorów"></i>
                            </label>
                            <select class="form-select" id="tutor_day_end_hour">
                                <option value="20">20:00</option>
                                <option value="21">21:00</option>
                                <option value="22" selected>22:00</option>
                                <option value="23">23:00</option>
                                <option value="24">24:00</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="tutor_slot_duration_minutes">
                                Długość slotu dostępności
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Minimalna długość jednego slotu dostępności"></i>
                            </label>
                            <select class="form-select" id="tutor_slot_duration_minutes">
                                <option value="30">30 minut</option>
                                <option value="45">45 minut</option>
                                <option value="60" selected>60 minut</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="tutor_break_between_lessons">
                                Przerwa między lekcjami (minuty)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Minimalna przerwa między kolejnymi lekcjami"></i>
                            </label>
                            <select class="form-select" id="tutor_break_between_lessons">
                                <option value="0">Bez przerwy</option>
                                <option value="15" selected>15 minut</option>
                                <option value="30">30 minut</option>
                                <option value="60">60 minut</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="tutor_max_daily_lessons">
                                Maksymalna liczba lekcji dziennie
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile lekcji może przeprowadzić lektor w ciągu dnia"></i>
                            </label>
                            <select class="form-select" id="tutor_max_daily_lessons">
                                <option value="4">4 lekcje</option>
                                <option value="6">6 lekcji</option>
                                <option value="8" selected>8 lekcji</option>
                                <option value="10">10 lekcji</option>
                                <option value="0">Bez limitu</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="tutor_advance_booking_days">
                                Rezerwacja z wyprzedzeniem (dni)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile dni naprzód studenci mogą rezerwować lekcje"></i>
                            </label>
                            <select class="form-select" id="tutor_advance_booking_days">
                                <option value="7">7 dni</option>
                                <option value="14" selected>14 dni</option>
                                <option value="21">21 dni</option>
                                <option value="30">30 dni</option>
                            </select>
                        </div>
                    </div>

                    <div class="mt-4">
                        <button type="button" class="btn btn-primary" onclick="systemSettings.saveSection('tutors-hours')">
                            <i class="bi bi-check-circle me-2"></i>Zapisz ustawienia godzin
                        </button>
                        <button type="button" class="btn btn-outline-secondary ms-2" onclick="systemSettings.resetSection('tutors-hours')">
                            <i class="bi bi-arrow-clockwise me-2"></i>Przywróć domyślne
                        </button>
                    </div>
                </form>
            </div>
        `
    }

    private renderTutorsAvailabilitySection(): string {
        return `
            <div class="settings-section">
                <div class="section-header mb-4">
                    <h3 class="mb-2">👨‍🏫 Lektorzy - Rejestracja i dostępność</h3>
                    <p class="text-muted mb-0">Ustawienia rejestracji lektorów i zarządzania dostępnością</p>
                </div>

                <form id="tutors-availability-form">
                    <div class="row g-3">
                        <div class="col-md-12">
                            <div class="row g-3">
                                <div class="col-md-6">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="tutor_self_registration_enabled">
                                        <label class="form-check-label" for="tutor_self_registration_enabled">
                                            Lektorzy mogą się rejestrować sami
                                            <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                               title="Czy na stronie jest dostępny formularz rejestracji dla lektorów"></i>
                                        </label>
                                    </div>
                                </div>
                                <div class="col-md-6">
                                    <div class="form-check form-switch">
                                        <input class="form-check-input" type="checkbox" id="tutor_profile_auto_approval">
                                        <label class="form-check-label" for="tutor_profile_auto_approval">
                                            Auto-akceptacja profili lektorów
                                            <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                               title="Czy profile lektorów są automatycznie akceptowane"></i>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="tutor_availability_edit_days_ahead">
                                Edycja dostępności z wyprzedzeniem (dni)
                                <i class="bi bi-info-circle text-muted" data-bs-toggle="tooltip" 
                                   title="Ile dni naprzód lektorzy mogą edytować swoją dostępność"></i>
                            </label>
                            <select class="form-select" id="tutor_availability_edit_days_ahead">
                                <option value="14">14 dni</option>
                                <option value="21">21 dni</option>
                                <option value="30" selected>30 dni</option>
                                <option value="60">60 dni</option>
                            </select>
                        </div>

                        <div class="col-md-12">
                            <hr class="my-4">
                            <h5 class="mb-3">📅 Kalendarz blokad (święta i dni wolne)</h5>
                            
                            <div class="row">
                                <div class="col-md-8">
                                    <div class="blocked-dates-calendar">
                                        <div class="alert alert-info mb-3">
                                            <i class="bi bi-info-circle me-2"></i>
                                            Kliknij daty, które mają być zablokowane dla wszystkich lektorów (święta, dni wolne od pracy)
                                        </div>
                                        
                                        <!-- Mini Calendar Placeholder -->
                                        <div class="calendar-placeholder border rounded p-4 text-center text-muted">
                                            <i class="bi bi-calendar3 mb-2" style="font-size: 3rem;"></i>
                                            <p class="mb-0">Kalendarz blokad będzie tutaj<br><small>Funkcjonalność w przygotowaniu</small></p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div class="col-md-4">
                                    <h6>Predefiniowane polskie święta:</h6>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_new_year" checked>
                                        <label class="form-check-label" for="holiday_new_year">1 stycznia (Nowy Rok)</label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_epiphany" checked>
                                        <label class="form-check-label" for="holiday_epiphany">6 stycznia (Trzech Króli)</label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_easter" checked>
                                        <label class="form-check-label" for="holiday_easter">Wielkanoc (ruchome)</label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_may_1" checked>
                                        <label class="form-check-label" for="holiday_may_1">1 maja (Święto Pracy)</label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_may_3" checked>
                                        <label class="form-check-label" for="holiday_may_3">3 maja (Konstytucja)</label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_corpus_christi" checked>
                                        <label class="form-check-label" for="holiday_corpus_christi">Boże Ciało (ruchome)</label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_aug_15" checked>
                                        <label class="form-check-label" for="holiday_aug_15">15 sierpnia (Wniebowzięcie)</label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_nov_1" checked>
                                        <label class="form-check-label" for="holiday_nov_1">1 listopada (Wszystkich Świętych)</label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_nov_11" checked>
                                        <label class="form-check-label" for="holiday_nov_11">11 listopada (Niepodległość)</label>
                                    </div>
                                    <div class="form-check form-switch mb-2">
                                        <input class="form-check-input" type="checkbox" id="holiday_christmas" checked>
                                        <label class="form-check-label" for="holiday_christmas">24-26 grudnia (Boże Narodzenie)</label>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4">
                        <button type="button" class="btn btn-primary" onclick="systemSettings.saveSection('tutors-availability')">
                            <i class="bi bi-check-circle me-2"></i>Zapisz ustawienia dostępności
                        </button>
                        <button type="button" class="btn btn-outline-secondary ms-2" onclick="systemSettings.resetSection('tutors-availability')">
                            <i class="bi bi-arrow-clockwise me-2"></i>Przywróć domyślne
                        </button>
                    </div>
                </form>
            </div>
        `
    }

    private renderEmailSection(): string {
        return `
            <div class="settings-section">
                <div class="section-header mb-4">
                    <h3 class="mb-2">📧 Email (SMTP & Notifications)</h3>
                    <p class="text-muted mb-0">Konfiguracja serwera SMTP i powiadomień email</p>
                </div>

                <form id="email-form">
                    <div class="form-check form-switch mb-4">
                        <input class="form-check-input" type="checkbox" id="email_enabled" checked>
                        <label class="form-check-label" for="email_enabled">
                            <strong>Włącz powiadomienia email</strong>
                        </label>
                    </div>

                    <h5 class="mb-3">SMTP Server Configuration</h5>
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label" for="smtp_host">Host SMTP *</label>
                            <input type="text" class="form-control" id="smtp_host" 
                                   placeholder="smtp.gmail.com" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="smtp_port">Port SMTP *</label>
                            <select class="form-select" id="smtp_port" required>
                                <option value="25">25 (niebezpieczny)</option>
                                <option value="587" selected>587 (TLS - zalecane)</option>
                                <option value="465">465 (SSL)</option>
                                <option value="2525">2525 (alternatywny)</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="smtp_username">Login SMTP *</label>
                            <input type="email" class="form-control" id="smtp_username" 
                                   placeholder="twoj-email@gmail.com" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="smtp_password">Hasło SMTP *</label>
                            <input type="password" class="form-control" id="smtp_password" 
                                   placeholder="••••••••••••" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="smtp_encryption">Szyfrowanie</label>
                            <select class="form-select" id="smtp_encryption">
                                <option value="none">Brak szyfrowania</option>
                                <option value="tls" selected>TLS (zalecane)</option>
                                <option value="ssl">SSL</option>
                            </select>
                        </div>
                    </div>

                    <h5 class="mb-3">Dane nadawcy</h5>
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label" for="email_from_address">Adres email nadawcy *</label>
                            <input type="email" class="form-control" id="email_from_address" 
                                   placeholder="noreply@mojaplateforma.pl" required>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="email_from_name">Nazwa nadawcy *</label>
                            <input type="text" class="form-control" id="email_from_name" 
                                   placeholder="Platforma Lektorów" required>
                        </div>
                    </div>

                    <h5 class="mb-3">Typy powiadomień</h5>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="email_lesson_reminder" checked>
                                <label class="form-check-label" for="email_lesson_reminder">
                                    Przypomnienia o lekcjach
                                </label>
                            </div>
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="email_lesson_cancelled" checked>
                                <label class="form-check-label" for="email_lesson_cancelled">
                                    Anulowanie lekcji
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="email_new_message" checked>
                                <label class="form-check-label" for="email_new_message">
                                    Nowe wiadomości
                                </label>
                            </div>
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="email_payment_confirmation">
                                <label class="form-check-label" for="email_payment_confirmation">
                                    Potwierdzenie płatności
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4">
                        <button type="button" class="btn btn-primary" onclick="systemSettings.saveSection('email')">
                            <i class="bi bi-check-circle me-2"></i>Zapisz ustawienia email
                        </button>
                        <button type="button" class="btn btn-outline-secondary ms-2" onclick="systemSettings.testEmail()">
                            <i class="bi bi-envelope-check me-2"></i>Test połączenia
                        </button>
                        <button type="button" class="btn btn-outline-secondary ms-2" onclick="systemSettings.resetSection('email')">
                            <i class="bi bi-arrow-clockwise me-2"></i>Przywróć domyślne
                        </button>
                    </div>
                </form>
            </div>
        `
    }

    private renderSmsSection(): string {
        return `
            <div class="settings-section">
                <div class="section-header mb-4">
                    <h3 class="mb-2">📱 SMS (Future Integration)</h3>
                    <p class="text-muted mb-0">Konfiguracja powiadomień SMS - funkcjonalność w przygotowaniu</p>
                </div>

                <div class="alert alert-info mb-4">
                    <i class="bi bi-info-circle me-2"></i>
                    <strong>Funkcjonalność SMS będzie dostępna w przyszłych wersjach</strong><br>
                    Pola poniżej służą obecnie tylko do planowania interfejsu.
                </div>

                <form id="sms-form">
                    <div class="form-check form-switch mb-4">
                        <input class="form-check-input" type="checkbox" id="sms_enabled" disabled>
                        <label class="form-check-label" for="sms_enabled">
                            <strong>Włącz powiadomienia SMS</strong> <small class="text-muted">(niedostępne)</small>
                        </label>
                    </div>

                    <h5 class="mb-3">Konfiguracja dostawcy SMS</h5>
                    <div class="row g-3 mb-4">
                        <div class="col-md-6">
                            <label class="form-label" for="sms_provider">Dostawca SMS</label>
                            <select class="form-select" id="sms_provider" disabled>
                                <option value="">-- Wybierz dostawcę --</option>
                                <option value="twilio">Twilio</option>
                                <option value="messagebird">MessageBird</option>
                                <option value="vonage">Vonage (Nexmo)</option>
                                <option value="custom">Własna integracja</option>
                            </select>
                        </div>

                        <div class="col-md-6">
                            <label class="form-label" for="sms_sender_name">Nazwa nadawcy</label>
                            <input type="text" class="form-control" id="sms_sender_name" 
                                   placeholder="PLATFORMA" maxlength="11" disabled>
                            <div class="form-text">Maksymalnie 11 znaków alfanumerycznych</div>
                        </div>

                        <div class="col-md-12">
                            <label class="form-label" for="sms_api_key">Klucz API</label>
                            <input type="password" class="form-control" id="sms_api_key" 
                                   placeholder="••••••••••••••••••••••••••••••••" disabled>
                        </div>
                    </div>

                    <h5 class="mb-3">Typy powiadomień SMS</h5>
                    <div class="row g-3">
                        <div class="col-md-6">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="sms_lesson_reminder" disabled>
                                <label class="form-check-label" for="sms_lesson_reminder">
                                    Przypomnienia o lekcjach <small class="text-muted">(niedostępne)</small>
                                </label>
                            </div>
                        </div>
                        <div class="col-md-6">
                            <div class="form-check form-switch mb-2">
                                <input class="form-check-input" type="checkbox" id="sms_urgent_notifications" disabled>
                                <label class="form-check-label" for="sms_urgent_notifications">
                                    Pilne powiadomienia <small class="text-muted">(niedostępne)</small>
                                </label>
                            </div>
                        </div>
                    </div>

                    <div class="mt-4">
                        <button type="button" class="btn btn-secondary" disabled>
                            <i class="bi bi-check-circle me-2"></i>Zapisz ustawienia SMS
                        </button>
                        <button type="button" class="btn btn-outline-secondary ms-2" disabled>
                            <i class="bi bi-phone-vibrate me-2"></i>Test SMS
                        </button>
                    </div>
                </form>
            </div>
        `
    }

    private renderPaymentsSection(): string {
        return `
            <div class="settings-section">
                <div class="section-header mb-4">
                    <h3 class="mb-2">💳 Płatności (Future Payments)</h3>
                    <p class="text-muted mb-0">Konfiguracja bramek płatniczych - funkcjonalność w przygotowaniu</p>
                </div>

                <div class="alert alert-warning mb-4">
                    <div class="d-flex align-items-center">
                        <i class="bi bi-cone-striped me-3" style="font-size: 1.5rem;"></i>
                        <div>
                            <h5 class="alert-heading mb-1">🚧 Sekcja płatności w przygotowaniu</h5>
                            <p class="mb-0">Funkcjonalność płatności będzie dostępna w kolejnych wersjach systemu.</p>
                        </div>
                    </div>
                </div>

                <div class="row">
                    <div class="col-md-8">
                        <h5 class="mb-3">Planowane integracje:</h5>
                        
                        <div class="planned-integrations">
                            <div class="integration-item d-flex align-items-center p-3 border rounded mb-2">
                                <div class="integration-icon me-3">
                                    <i class="bi bi-credit-card text-primary" style="font-size: 1.5rem;"></i>
                                </div>
                                <div>
                                    <h6 class="mb-1">Stripe</h6>
                                    <small class="text-muted">Międzynarodowe płatności kartą, BLIK, przelewy</small>
                                </div>
                                <div class="ms-auto">
                                    <span class="badge bg-info">W planach</span>
                                </div>
                            </div>

                            <div class="integration-item d-flex align-items-center p-3 border rounded mb-2">
                                <div class="integration-icon me-3">
                                    <i class="bi bi-paypal text-warning" style="font-size: 1.5rem;"></i>
                                </div>
                                <div>
                                    <h6 class="mb-1">PayPal</h6>
                                    <small class="text-muted">Płatności PayPal i kartami kredytowymi</small>
                                </div>
                                <div class="ms-auto">
                                    <span class="badge bg-info">W planach</span>
                                </div>
                            </div>

                            <div class="integration-item d-flex align-items-center p-3 border rounded mb-2">
                                <div class="integration-icon me-3">
                                    <i class="bi bi-bank text-success" style="font-size: 1.5rem;"></i>
                                </div>
                                <div>
                                    <h6 class="mb-1">Przelewy24</h6>
                                    <small class="text-muted">Polska bramka płatnicza, BLIK, przelewy bankowe</small>
                                </div>
                                <div class="ms-auto">
                                    <span class="badge bg-info">W planach</span>
                                </div>
                            </div>

                            <div class="integration-item d-flex align-items-center p-3 border rounded mb-2">
                                <div class="integration-icon me-3">
                                    <i class="bi bi-phone text-danger" style="font-size: 1.5rem;"></i>
                                </div>
                                <div>
                                    <h6 class="mb-1">BLIK</h6>
                                    <small class="text-muted">Natywne płatności BLIK przez aplikacje bankowe</small>
                                </div>
                                <div class="ms-auto">
                                    <span class="badge bg-info">W planach</span>
                                </div>
                            </div>
                        </div>

                        <h5 class="mb-3 mt-4">Planowane funkcjonalności:</h5>
                        <ul class="list-unstyled">
                            <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i> Płatności za pojedyncze lekcje</li>
                            <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i> Płatności cykliczne za pakiety</li>
                            <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i> Automatyczne faktury</li>
                            <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i> System zwrotów</li>
                            <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i> Rabaty i kody promocyjne</li>
                            <li class="mb-2"><i class="bi bi-check-circle text-success me-2"></i> Rozliczenia z lektorami</li>
                        </ul>
                    </div>

                    <div class="col-md-4">
                        <div class="card bg-light">
                            <div class="card-body text-center">
                                <i class="bi bi-calendar-event text-muted mb-3" style="font-size: 3rem;"></i>
                                <h6 class="card-title">Timeline</h6>
                                <p class="card-text">
                                    <small class="text-muted">
                                        Planowane wdrożenie:<br>
                                        <strong>Q1 2025</strong>
                                    </small>
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    // Public methods for UI interactions
    switchSection(section: string): void {
        if (this.unsavedChanges) {
            if (!confirm('Masz niezapisane zmiany. Czy chcesz kontynuować bez zapisywania?')) {
                return
            }
        }

        this.currentSection = section
        this.unsavedChanges = false
        this.updateUnsavedBanner()

        // Update active nav link
        const navLinks = document.querySelectorAll('.settings-sidebar .list-group-item')
        navLinks.forEach(link => {
            link.classList.remove('active')
            if (link.getAttribute('data-section') === section) {
                link.classList.add('active')
            }
        })

        // Update main content
        const mainContent = document.getElementById('settings-main-content')
        if (mainContent) {
            mainContent.innerHTML = this.renderCurrentSection()
            this.setupChangeDetection()
            this.initializeTooltips()
        }
    }

    saveSection(section: string): void {
        // TODO: Implement actual saving logic
        this.unsavedChanges = false
        this.updateUnsavedBanner()
        
        // Show success notification (placeholder)
        alert(`Ustawienia sekcji "${section}" zostały zapisane!\n(To jest placeholder - rzeczywiste zapisywanie będzie zaimplementowane później)`)
    }

    resetSection(section: string): void {
        if (confirm('Czy na pewno chcesz przywrócić domyślne ustawienia tej sekcji?')) {
            // TODO: Implement reset logic
            this.switchSection(section) // Reload section with defaults
        }
    }

    saveChanges(): void {
        this.saveSection(this.currentSection)
    }

    discardChanges(): void {
        if (confirm('Czy na pewno chcesz odrzucić niezapisane zmiany?')) {
            this.switchSection(this.currentSection) // Reload current section
        }
    }

    testEmail(): void {
        // TODO: Implement email test
        alert('Test email będzie zaimplementowany w przyszłych wersjach')
    }

    private setupChangeDetection(): void {
        // Monitor form changes to show unsaved banner
        const forms = document.querySelectorAll('#settings-main-content form')
        forms.forEach(form => {
            const inputs = form.querySelectorAll('input, select, textarea')
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    this.unsavedChanges = true
                    this.updateUnsavedBanner()
                })
            })
        })
    }

    private updateUnsavedBanner(): void {
        const banner = document.getElementById('unsaved-banner')
        if (banner) {
            banner.style.display = this.unsavedChanges ? 'block' : 'none'
        }
    }

    private initializeTooltips(): void {
        // Initialize Bootstrap tooltips
        const tooltips = document.querySelectorAll('[data-bs-toggle="tooltip"]')
        tooltips.forEach(tooltip => {
            // Bootstrap 5 tooltip initialization would go here
            // For now, just a placeholder
        })
    }
}