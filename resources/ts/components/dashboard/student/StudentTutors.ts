import { studentService } from '@services/StudentService'

export class StudentTutors {
    private tutors: any[] = []
    private filteredTutors: any[] = []
    
    public async getBookLessonContent(): Promise<string> {
        try {
            this.tutors = await studentService.getAvailableTutors()
            this.filteredTutors = [...this.tutors]
            
            console.log('Tutors loaded:', this.tutors) // Debug log
            
            return this.renderTutorsList()
        } catch (error) {
            console.error('Error loading tutors:', error)
            return this.renderTutorsError()
        }
    }
    
    
    private renderTutorsList(): string {
        if (this.filteredTutors.length === 0) {
            return `
                <div class="student-content-area">
                    <h2>Dostępni lektorzy</h2>
                    <div class="text-center py-5">
                        <div class="mb-3">
                            <i class="bi bi-person-x" style="font-size: 3rem; color: #6c757d;"></i>
                        </div>
                        <h5>Brak dostępnych lektorów</h5>
                        <p class="text-muted">Nie znaleziono lektorów spełniających kryteria wyszukiwania.</p>
                    </div>
                </div>
            `
        }
        
        const tutorsCards = this.filteredTutors.map(tutor => this.renderTutorCard(tutor)).join('')
        
        return `
            <div class="student-content-area">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <h2>Dostępni lektorzy</h2>
                    <span class="badge bg-primary">${this.filteredTutors.length} lektorów</span>
                </div>
                
                ${this.renderFilters()}
                
                <div class="row">
                    ${tutorsCards}
                </div>
            </div>
        `
    }
    
    private renderFilters(): string {
        return `
            <div class="card mb-4">
                <div class="card-body">
                    <div class="row">
                        <div class="col-md-3">
                            <label for="language-filter" class="form-label">Język</label>
                            <select class="form-select" id="language-filter">
                                <option value="">Wszystkie języki</option>
                                <option value="english">Angielski</option>
                                <option value="german">Niemiecki</option>
                                <option value="french">Francuski</option>
                                <option value="spanish">Hiszpański</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="specialization-filter" class="form-label">Specjalizacja</label>
                            <select class="form-select" id="specialization-filter">
                                <option value="">Wszystkie specjalizacje</option>
                                <option value="business">Język biznesowy</option>
                                <option value="conversation">Konwersacje</option>
                                <option value="exam">Przygotowanie do egzaminów</option>
                                <option value="grammar">Gramatyka</option>
                                <option value="pronunciation">Wymowa</option>
                                <option value="academic">Język akademicki</option>
                                <option value="travel">Język w podróży</option>
                                <option value="kids">Zajęcia dla dzieci</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="experience-filter" class="form-label">Doświadczenie</label>
                            <select class="form-select" id="experience-filter">
                                <option value="">Dowolne</option>
                                <option value="1-2">1-2 lata</option>
                                <option value="3-5">3-5 lat</option>
                                <option value="6-10">6-10 lat</option>
                                <option value="10+">Ponad 10 lat</option>
                            </select>
                        </div>
                        <div class="col-md-3">
                            <label for="city-filter" class="form-label">Miasto</label>
                            <input type="text" class="form-control" id="city-filter" placeholder="Wpisz miasto">
                        </div>
                    </div>
                    <div class="row mt-3">
                        <div class="col-md-12">
                            <button class="btn btn-primary me-2" id="filter-tutors-btn">
                                <i class="bi bi-funnel me-2"></i>Filtruj
                            </button>
                            <button class="btn btn-outline-secondary" id="reset-filters-btn">
                                <i class="bi bi-arrow-clockwise me-2"></i>Resetuj filtry
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    private renderTutorCard(tutor: any): string {
        // Debug log for tutor data structure
        console.log('Rendering tutor card:', tutor)
        
        const profile = tutor.tutor_profile || {}
        const languages = (profile.languages || []).map((lang: string) => this.getLanguageName(lang)).join(', ')
        const specializations = (profile.specializations || []).map((spec: string) => this.getSpecializationName(spec)).join(', ')
        const hourlyRate = profile.hourly_rate ? `${Math.round(profile.hourly_rate)} zł/h` : 'Do uzgodnienia'
        
        return `
            <div class="col-md-6 col-lg-4 mb-4">
                <div class="card h-100">
                    <div class="card-body">
                        <div class="d-flex align-items-center mb-3">
                            <div class="avatar-placeholder me-3" style="width: 60px; height: 60px; background: #e9ecef; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.5rem; color: #6c757d;">
                                ${tutor.avatar_url ? 
                                    `<img src="${tutor.avatar_url}" alt="${tutor.name}" class="rounded-circle" style="width: 100%; height: 100%; object-fit: cover;">` : 
                                    `<i class="bi bi-person-circle"></i>`
                                }
                            </div>
                            <div class="flex-grow-1">
                                <h5 class="card-title mb-1">${tutor.name}</h5>
                                <p class="card-text text-muted small">${tutor.city || 'Miasto nieznane'}</p>
                            </div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="small text-muted">Języki:</div>
                            <div class="text-primary">${languages || 'Brak informacji'}</div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="small text-muted">Specjalizacje:</div>
                            <div class="text-info">${specializations || 'Brak informacji'}</div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="small text-muted">Doświadczenie:</div>
                            <div>${profile.years_experience || 0} ${this.getYearsLabel(profile.years_experience || 0)}</div>
                        </div>
                        
                        <div class="mb-3">
                            <div class="d-flex gap-1">
                                ${profile.is_accepting_students ? 
                                    '<span class="badge bg-success">Przyjmuje</span>' : 
                                    '<span class="badge bg-secondary">Nie przyjmuje</span>'
                                }
                                ${profile.is_verified ? 
                                    '<span class="badge bg-primary">Zweryfikowany</span>' : 
                                    ''
                                }
                            </div>
                        </div>
                        
                        <div class="mt-auto">
                            <div class="d-grid gap-2">
                                <button class="btn btn-outline-primary btn-sm" onclick="window.location.href='/#/student/dashboard?section=tutor-profile&tutor_id=${tutor.id}'">
                                    <i class="bi bi-person me-2"></i>Zobacz profil
                                </button>
                                <button class="btn btn-primary btn-sm" onclick="window.location.href='/#/student/dashboard?section=tutor-booking&tutor_id=${tutor.id}'">
                                    <i class="bi bi-calendar-check me-2"></i>Sprawdź terminy
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }
    
    private renderTutorsError(): string {
        return `
            <div class="student-content-area">
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować listy lektorów.</p>
                    <hr>
                    <button class="btn btn-primary" onclick="location.reload()">Odśwież stronę</button>
                </div>
            </div>
        `
    }
    
    public async getTutorProfileContent(tutorId: string): Promise<string> {
        try {
            const tutor = await studentService.getTutorProfile(Number(tutorId))
            const profile = tutor.tutor_profile || {}
            
            // Format hourly rate
            const hourlyRate = profile.hourly_rate ? `${Math.round(profile.hourly_rate)} zł/h` : 'Do uzgodnienia'
            
            // Rating removed for MVP
            
            // Format statistics
            const stats = `
                <div class="row text-center mb-3">
                    <!--
                    <div class="col-4">
                        <div class="small text-muted">Przeprowadzone lekcje</div>
                        <div class="fw-bold">${profile.total_lessons || 0}</div>
                    </div>
                    <div class="col-4">
                        <div class="small text-muted">Liczba uczniów</div>
                        <div class="fw-bold">${profile.total_students || 0}</div>
                    </div>
                    -->
                    <div class="col-4">
                        <div class="small text-muted">Doświadczenie</div>
                        <div class="fw-bold">${profile.years_experience || 0} lat</div>
                    </div>
                </div>
            `
            
            return `
                <div class="student-content-area">
                    <nav aria-label="breadcrumb">
                        <ol class="breadcrumb">
                            <li class="breadcrumb-item"><a href="#" onclick="document.querySelector('[data-section=rezerwuj]').click(); return false;">Rezerwuj lekcję</a></li>
                            <li class="breadcrumb-item active">Profil lektora</li>
                        </ol>
                    </nav>

                    <div class="row">
                        <div class="col-lg-4 mb-4">
                            <div class="card">
                                <div class="card-body text-center">
                                    <div class="avatar-placeholder mb-3" style="width: 150px; height: 150px; margin: 0 auto; background: #e9ecef; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #6c757d;">
                                        ${tutor.avatar_url 
                                            ? `<img src="${tutor.avatar_url}" alt="${tutor.name}" class="rounded-circle" style="width: 100%; height: 100%; object-fit: cover;">`
                                            : '<i class="bi bi-person-circle"></i>'
                                        }
                                    </div>
                                    <h3 class="card-title">${tutor.name}</h3>
                                    <p class="text-muted mb-2">${tutor.city || 'Miasto nieznane'}</p>
                                    
                                    <div class="mb-3">
                                        ${profile.is_accepting_students 
                                            ? '<span class="badge bg-success">Przyjmuje studentów</span>'
                                            : '<span class="badge bg-secondary">Nie przyjmuje studentów</span>'
                                        }
                                        ${profile.is_verified 
                                            ? '<span class="badge bg-primary ms-1">Zweryfikowany</span>'
                                            : ''
                                        }
                                    </div>
                                    
                                    <!--
                                    <div class="mb-3 p-3 bg-light rounded">
                                        <div class="h5 mb-0 text-primary">${hourlyRate}</div>
                                        <div class="small text-muted">Stawka godzinowa</div>
                                    </div>
                                    -->
                                    
                                    ${stats}
                                    
                                    <button class="btn btn-primary btn-lg w-100" data-tutor-id="${tutorId}" data-action="book-lesson">
                                        <i class="bi bi-calendar-check me-2"></i>Sprawdź terminy
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="col-lg-8">
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4 class="card-title">O mnie</h4>
                                    <p class="card-text">${profile.description || 'Brak opisu'}</p>
                                </div>
                            </div>
                            
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4 class="card-title">Języki nauczania</h4>
                                    <div class="d-flex flex-wrap gap-2">
                                        ${(profile.languages || []).map((lang: string) => 
                                            `<span class="badge bg-primary fs-6">${this.getLanguageName(lang)}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                            
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4 class="card-title">Specjalizacje</h4>
                                    <div class="d-flex flex-wrap gap-2">
                                        ${(profile.specializations || []).map((spec: string) => 
                                            `<span class="badge bg-info fs-6">${this.getSpecializationName(spec)}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            `
        } catch (error) {
            console.error('Error loading tutor profile:', error)
            return `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować profilu lektora.</p>
                    <hr>
                    <button class="btn btn-primary" onclick="document.querySelector('[data-section=rezerwuj]').click()">Wróć do listy lektorów</button>
                </div>
            `
        }
    }
    
    public async filterTutors(): Promise<void> {
        const languageFilter = (document.getElementById('language-filter') as HTMLSelectElement)?.value || ''
        const specializationFilter = (document.getElementById('specialization-filter') as HTMLSelectElement)?.value || ''
        const experienceFilter = (document.getElementById('experience-filter') as HTMLSelectElement)?.value || ''
        const cityFilter = (document.getElementById('city-filter') as HTMLInputElement)?.value?.toLowerCase() || ''
        
        this.filteredTutors = this.tutors.filter(tutor => {
            const profile = tutor.tutor_profile || {}
            
            // Language filter
            if (languageFilter && (!profile.languages || !profile.languages.includes(languageFilter))) {
                return false
            }
            
            // Specialization filter
            if (specializationFilter && (!profile.specializations || !profile.specializations.includes(specializationFilter))) {
                return false
            }
            
            // Experience filter
            if (experienceFilter) {
                const years = profile.years_experience || 0
                switch (experienceFilter) {
                    case '1-2':
                        if (years < 1 || years > 2) return false
                        break
                    case '3-5':
                        if (years < 3 || years > 5) return false
                        break
                    case '6-10':
                        if (years < 6 || years > 10) return false
                        break
                    case '10+':
                        if (years < 10) return false
                        break
                }
            }
            
            // City filter
            if (cityFilter && (!tutor.city || !tutor.city.toLowerCase().includes(cityFilter))) {
                return false
            }
            
            return true
        })
        
        // Re-render the tutors list
        const contentArea = document.querySelector('.student-content-area')
        if (contentArea) {
            contentArea.innerHTML = this.renderTutorsList()
            this.setupBookingEventListeners()
        }
    }
    
    public resetFilters(): void {
        const languageSelect = document.getElementById('language-filter') as HTMLSelectElement
        const specializationSelect = document.getElementById('specialization-filter') as HTMLSelectElement
        const experienceSelect = document.getElementById('experience-filter') as HTMLSelectElement
        const cityInput = document.getElementById('city-filter') as HTMLInputElement
        
        if (languageSelect) languageSelect.value = ''
        if (specializationSelect) specializationSelect.value = ''
        if (experienceSelect) experienceSelect.value = ''
        if (cityInput) cityInput.value = ''
        
        this.filteredTutors = [...this.tutors]
        this.filterTutors()
    }
    
    public setupBookingEventListeners(): void {
        const filterBtn = document.getElementById('filter-tutors-btn')
        if (filterBtn) {
            filterBtn.addEventListener('click', () => this.filterTutors())
        }
        
        const resetBtn = document.getElementById('reset-filters-btn')
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFilters())
        }
    }
    
    private getLanguageName(code: string): string {
        const languages: { [key: string]: string } = {
            'english': 'Angielski',
            'german': 'Niemiecki',
            'french': 'Francuski',
            'spanish': 'Hiszpański',
        }
        return languages[code] || code
    }

    private getSpecializationName(code: string): string {
        const specializations: { [key: string]: string } = {
            'general': 'Język ogólny',
            'business': 'Biznesowy',
            'exams': 'Egzaminy',
            'kids': 'Dla dzieci',
            'conversation': 'Konwersacje',
            'grammar': 'Gramatyka',
            'pronunciation': 'Wymowa',
            'writing': 'Pisanie',
            'reading': 'Czytanie',
            'listening': 'Słuchanie'
        }
        return specializations[code] || code
    }
    
    private getYearsLabel(years: number): string {
        if (years === 0) return 'lat'
        if (years === 1) return 'rok'
        if (years >= 2 && years <= 4) return 'lata'
        return 'lat'
    }
}