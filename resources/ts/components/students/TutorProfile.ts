// resources/ts/components/students/TutorProfile.ts
import type { RouteComponent } from '@router/routes'
import { api } from '@services/ApiService'
import { navigate } from "@utils/navigation"

export class TutorProfile implements RouteComponent {
    private tutorId: string

    constructor(params: { id: string }) {
        this.tutorId = params.id
    }

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'container py-5'
        
        try {
            // Fetch tutor data using public endpoint
            const response = await api.get<any>(`/tutors/${this.tutorId}/public`)
            const tutor = response
            const profile = tutor.tutorProfile || {}
            
            el.innerHTML = `
                <nav aria-label="breadcrumb">
                    <ol class="breadcrumb">
                        <li class="breadcrumb-item"><a href="/student/dashboard">Panel</a></li>
                        <li class="breadcrumb-item"><a href="/student/dashboard?section=rezerwuj">Rezerwuj lekcję</a></li>
                        <li class="breadcrumb-item active">Profil lektora</li>
                    </ol>
                </nav>

                <div class="row">
                    <div class="col-lg-4 mb-4">
                        <div class="card">
                            <div class="card-body text-center">
                                <div class="avatar-placeholder mb-3" style="width: 150px; height: 150px; margin: 0 auto; background: #e9ecef; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 3rem; color: #6c757d;">
                                    <i class="bi bi-person-circle"></i>
                                </div>
                                <h3 class="card-title">${tutor.name}</h3>
                                <p class="text-muted">${tutor.city || 'Miasto nieznane'}</p>
                                
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
                                
                                <button class="btn btn-primary btn-lg w-100" onclick="window.location.href='/tutor/${this.tutorId}/book'">
                                    <i class="bi bi-calendar-check me-2"></i>Sprawdź terminy
                                </button>
                            </div>
                        </div>
                        
                        <!-- Quick Info Card -->
                        <div class="card mt-3">
                            <div class="card-body">
                                <h5 class="card-title">Szybkie informacje</h5>
                                <ul class="list-unstyled mb-0">
                                    <li class="mb-2">
                                        <i class="bi bi-award text-primary me-2"></i>
                                        <strong>Doświadczenie:</strong> ${profile.years_experience || 0} ${this.getYearsLabel(profile.years_experience || 0)}
                                    </li>
                                    ${profile.hourly_rate ? `
                                        <!--
                                        <li class="mb-2">
                                            <i class="bi bi-cash text-primary me-2"></i>
                                            <strong>Stawka:</strong> ${profile.hourly_rate} zł/h
                                        </li>
                                        -->
                                    ` : ''}
                                    <li class="mb-2">
                                        <i class="bi bi-people text-primary me-2"></i>
                                        <strong>Limit tygodniowy:</strong> ${profile.max_students_per_week || 'Bez limitu'} ${profile.max_students_per_week ? 'studentów' : ''}
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                    
                    <div class="col-lg-8">
                        <!-- Description -->
                        <div class="card mb-4">
                            <div class="card-body">
                                <h4 class="card-title">O mnie</h4>
                                <p class="card-text">${profile.description || 'Brak opisu'}</p>
                            </div>
                        </div>
                        
                        <!-- Languages -->
                        <div class="card mb-4">
                            <div class="card-body">
                                <h4 class="card-title">Języki nauczania</h4>
                                <div class="d-flex flex-wrap gap-2">
                                    ${(profile.languages || []).map((lang: string) => 
                                        `<span class="badge bg-primary fs-6">${this.getLanguageName(lang)}</span>`
                                    ).join('')}
                                    ${(profile.languages || []).length === 0 ? '<p class="text-muted mb-0">Brak informacji o językach</p>' : ''}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Specializations -->
                        <div class="card mb-4">
                            <div class="card-body">
                                <h4 class="card-title">Specjalizacje</h4>
                                <div class="d-flex flex-wrap gap-2">
                                    ${(profile.specializations || []).map((spec: string) => 
                                        `<span class="badge bg-info fs-6">${this.getSpecializationName(spec)}</span>`
                                    ).join('')}
                                    ${(profile.specializations || []).length === 0 ? '<p class="text-muted mb-0">Brak określonych specjalizacji</p>' : ''}
                                </div>
                            </div>
                        </div>
                        
                        <!-- Lesson Types -->
                        ${profile.lesson_types && profile.lesson_types.length > 0 ? `
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4 class="card-title">Rodzaje lekcji</h4>
                                    <div class="d-flex flex-wrap gap-2">
                                        ${profile.lesson_types.map((type: string) => 
                                            `<span class="badge bg-secondary fs-6">${this.getLessonTypeName(type)}</span>`
                                        ).join('')}
                                    </div>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Education -->
                        ${profile.education && profile.education.length > 0 ? `
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4 class="card-title">Wykształcenie</h4>
                                    <ul class="list-unstyled mb-0">
                                        ${profile.education.map((edu: any) => `
                                            <li class="mb-3">
                                                <h6 class="mb-1">${edu.degree || ''} - ${edu.field || ''}</h6>
                                                <p class="text-muted mb-0">${edu.school || ''} ${edu.year ? `(${edu.year})` : ''}</p>
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        ` : ''}
                        
                        <!-- Certifications -->
                        ${profile.certifications && profile.certifications.length > 0 ? `
                            <div class="card mb-4">
                                <div class="card-body">
                                    <h4 class="card-title">Certyfikaty</h4>
                                    <ul class="list-unstyled mb-0">
                                        ${profile.certifications.map((cert: any) => `
                                            <li class="mb-2">
                                                <i class="bi bi-patch-check text-success me-2"></i>
                                                <strong>${cert.name || ''}</strong> ${cert.issuer ? `- ${cert.issuer}` : ''} ${cert.year ? `(${cert.year})` : ''}
                                            </li>
                                        `).join('')}
                                    </ul>
                                </div>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `
        } catch (error) {
            console.error('Error loading tutor profile:', error)
            el.innerHTML = `
                <div class="alert alert-danger">
                    <h4 class="alert-heading">Błąd</h4>
                    <p>Nie udało się załadować profilu lektora.</p>
                    <hr>
                    <a href="/student/dashboard?section=rezerwuj" class="btn btn-primary">Wróć do listy lektorów</a>
                </div>
            `
        }
        
        return el
    }

    private getLanguageName(code: string): string {
        const languages: Record<string, string> = {
            'english': 'Angielski',
            'german': 'Niemiecki',
            'spanish': 'Hiszpański',
            'french': 'Francuski',
            'italian': 'Włoski',
            'polish': 'Polski',
            'russian': 'Rosyjski',
            'chinese': 'Chiński',
            'japanese': 'Japoński',
            'korean': 'Koreański'
        }
        return languages[code] || code
    }

    private getSpecializationName(code: string): string {
        const specializations: Record<string, string> = {
            'general': 'Język ogólny',
            'business': 'Biznesowy',
            'exams': 'Przygotowanie do egzaminów',
            'kids': 'Dla dzieci',
            'conversation': 'Konwersacje',
            'technical': 'Techniczny',
            'medical': 'Medyczny',
            'legal': 'Prawniczy'
        }
        return specializations[code] || code
    }

    private getLessonTypeName(type: string): string {
        const types: Record<string, string> = {
            'individual': 'Indywidualne',
            'group': 'Grupowe',
            'online': 'Online',
            'in_person': 'Stacjonarne'
        }
        return types[type] || type
    }

    private getYearsLabel(years: number): string {
        if (years === 0) return 'lat'
        if (years === 1) return 'rok'
        if (years >= 2 && years <= 4) return 'lata'
        return 'lat'
    }
}