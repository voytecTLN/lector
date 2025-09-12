// resources/ts/components/changelog/ChangelogPage.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'

interface ChangelogEntry {
    version: string
    releaseDate: string
    sections: {
        student?: string[]
        tutor?: string[]
        admin?: string[]
    }
}

export class ChangelogPage implements RouteComponent {
    private container: HTMLElement | null = null
    
    // Example changelog data - in real app this would come from API or config
    private changelog: ChangelogEntry[] = [
        {
            version: "1.2.6",
            releaseDate: "2025-09-12",
            sections: {
                student: [
                    "Naprawiono podwójne ładowanie treści w menu dashboard - teraz każdy klik wykonuje tylko jeden request",
                    "Ulepszone nawigowanie między sekcjami - bardziej płynne przejścia", 
                    "Poprawiono stabilność routingu przy używaniu przycisku Wstecz w przeglądarce",
                    "Dodano przełącznik pokazuj/ukryj hasło we wszystkich formularzach z hasłami",
                    "Wprowadzono wymóg silnego hasła we wszystkich formularzach rejestracji i zmiany hasła"
                ],
                tutor: [
                    "Naprawiono zapisywanie języków nauczania w profilu lektora",
                    "Zwiększono limity walidacji: maksymalnie 4 języki nauczania (poprzednio bez limitu)",
                    "Naprawiono routing dashboard - teraz używa standardowego hash routing jak inne role",
                    "Usunięto problemy z duplikowaniem URL typu '/tutor/dashboard?section=profile?section=profile'",
                    "Naprawiono automatyczne odświeżanie danych profilu po zapisaniu zmian",
                    "Ulepszona nawigacja - menu działa płynnie bez błędów ładowania",
                    "Poprawiono zgodność między formularzem admina a formularzem tutora dla edycji profilu",
                    "Dodano przełącznik pokazuj/ukryj hasło w formularzach edycji profilu",
                    "Wprowadzono wymóg silnego hasła przy zmianie hasła w profilu"
                ],
                admin: [
                    "Naprawiono inconsistency między endpoint-ami backend dla języków nauczania",
                    "Zunifikowano nazewnictwo pól formularzy (languages zamiast teaching_languages)",
                    "Poprawiono walidację w TutorController::updateOwnProfile",
                    "Uprościono routing system - usunięto skomplikowane blokady specyficzne dla tutorów",
                    "Poprawiono stabilność routingu w całej aplikacji", 
                    "Naprawiono problemy z cache-owaniem danych profilu po aktualizacji",
                    "Zwiększono spójność między różnymi dashboardami (admin, tutor, student)",
                    "Naprawiono problem z navigation queue w router system",
                    "Dodano PasswordToggleHelper utility - zunifikowane zarządzanie przełącznikami hasła",
                    "Wprowadzono wymóg silnego hasła we wszystkich formularzach użytkowników",
                    "Ulepszone UX dla pól hasła - jednolite zachowanie w całej aplikacji"
                ]
            }
        },
        {
            version: "1.2.5",
            releaseDate: "2025-09-11",
            sections: {
                student: [
                    "Dodano nową opcję 'Rozwój kariery' w celach nauki", 
                    "Poprawiono wyświetlanie statusów pakietów godzinowych",
                    "Dodano lepsze formatowanie tekstu w opisie profilu (pogrubienie, kursywa, nowe linie)",
                    "Dodano podgląd na żywo tekstu w opisie profilu",
                    "Dodano przyjazne strony błędów 404 i 403 z zabawną animacją",
                    "Dodano system wykazu zmian dostępny z menu dashboard"
                ],
                tutor: [
                    "Dodano pole 'Wykształcenie' w profilu lektora",
                    "Dodano funkcję 'Podgląd profilu' - zobacz jak widzą Cię uczniowie", 
                    "Poprawiono wyświetlanie specjalizacji w profilu publicznym",
                    "Dodano możliwość formatowania biografii HTML (pogrubienie, kursywa)",
                    "Zwiększono limit specjalizacji z 6 do 8",
                    "Poprawiono zapisywanie specjalizacji w profilu lektora",
                    "Dodano wyświetlanie wykształcenia na profilu publicznym lektora",
                    "Dodano certyfikacje na profilu publicznym lektora",
                    "Dodano system wykazu zmian dostępny z menu dashboard"
                ],
                admin: [
                    "Naprawiono problem z duplikowaniem pakietów przy edycji studentów",
                    "Dodano wszystkie 8 opcji celów nauki (w tym 'Rozwój kariery' i 'Kultura')",
                    "Poprawiono logikę przypisywania pakietów - teraz sprawdza istniejące przypisania",
                    "Naprawiono błąd bazy danych przy aktualizacji statusu pakietów",
                    "Poprawiono walidację celów nauki w formularzach (zwiększono limit do 8)",
                    "Dodano system wykazu zmian pakietów z filtrowaniem według ról użytkowników",
                    "Poprawiono synchronizację pola certyfikacji między frontendem a backendem",
                    "Dodano pole wykształcenia dla lektorów w panelu administracyjnym"
                ]
            }
        },
        {
            version: "1.2.4", 
            releaseDate: "2025-09-10",
            sections: {
                student: [
                    "Dodano stronę FAQ z często zadawanymi pytaniami",
                    "Zaktualizowano stronę kontaktową z informacjami o firmie",
                    "Poprawiono wyświetlanie awatarów użytkowników",
                    "Ulepszono bezpieczeństwo resetowania hasła - wymagane 12 znaków z dużymi/małymi literami, cyframi i znakami specjalnymi",
                    "Dodano wizualną walidację siły hasła w czasie rzeczywistym"
                ],
                tutor: [
                    "Naprawiono zapisywanie specjalizacji lektora w profilu",
                    "Poprawiono wyświetlanie informacji kontaktowych na stronie głównej"
                ],
                admin: [
                    "Wyczyszczono logi produkcyjne z niebezpiecznych informacji deweloperskich", 
                    "Poprawiono wykrywanie środowiska produkcyjnego w systemie logowania",
                    "Lepsza synchronizacja między Laravel a frontendem",
                    "Dodano zaawansowany system walidacji hasła w backend",
                    "Poprawiono konfigurację wdrażania zmian dla środowiska produkcyjnego",
                    "Kompletnie przepisano stronę resetowania hasła z nowoczesnymi wzorcami UX",
                    "Dodano Logger utility z filtrowaniem logów według środowiska"
                ]
            }
        },
    ]

    async render(): Promise<HTMLElement> {
        const el = document.createElement('div')
        el.className = 'changelog-page'
        
        el.innerHTML = `
            <div class="container mt-4">
                <div class="row justify-content-center">
                    <div class="col-lg-10">
                        <!-- Header -->
                        <div class="mb-4">
                            <h1 class="display-5 fw-bold text-primary">
                                <i class="bi bi-journal-text me-3"></i>
                                Wykaz zmian
                            </h1>
                            <p class="lead text-muted">
                                Historia rozwoju i aktualizacji platformy lektorów
                            </p>
                        </div>

                        <!-- Filter Info 
                        <div class="alert alert-info mb-4">
                            <i class="bi bi-info-circle me-2"></i>
                            <strong>Widoczność zmian:</strong> ${this.getVisibilityInfo()}
                        </div>
-->
                        <!-- Changelog Content -->
                        <div id="changelog-content">
                            ${this.renderChangelog()}
                        </div>
                    </div>
                </div>
            </div>
        `

        return el
    }

    mount(container: HTMLElement): void {
        this.container = container
        // Add any event listeners if needed
    }

    unmount(): void {
        this.container = null
    }

    private getVisibilityInfo(): string {
        const user = authService.getUser()
        if (!user) return 'Niezalogowany użytkownik'
        
        switch (user.role) {
            case 'admin':
                return 'Widzisz wszystkie zmiany (Uczeń, Lektor, Admin)'
            case 'tutor':
                return 'Widzisz zmiany dla: Uczeń i Lektor'
            case 'student':
                return 'Widzisz zmiany dla: Uczeń i Lektor'
            default:
                return 'Widzisz zmiany dostępne dla Twojej roli'
        }
    }

    private renderChangelog(): string {
        const user = authService.getUser()
        if (!user) return '<div class="alert alert-warning">Musisz być zalogowany, aby zobaczyć wykaz zmian.</div>'

        return this.changelog.map(entry => this.renderChangelogEntry(entry, user.role)).join('')
    }

    private renderChangelogEntry(entry: ChangelogEntry, userRole: string): string {
        const sections = this.getVisibleSections(entry.sections, userRole)
        
        if (Object.keys(sections).length === 0) {
            return '' // No visible sections for this user
        }

        const formattedDate = new Date(entry.releaseDate).toLocaleDateString('pl-PL', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        })

        return `
            <div class="card mb-4 shadow-sm">
                <div class="card-header bg-primary text-white">
                    <div class="d-flex justify-content-between align-items-center">
                        <h3 class="h4 mb-0">
                            <i class="bi bi-tag me-2"></i>
                            Wersja ${entry.version}
                        </h3>
                        <span class="badge bg-light text-primary">
                            <i class="bi bi-calendar3 me-1"></i>
                            ${formattedDate}
                        </span>
                    </div>
                </div>
                <div class="card-body">
                    ${Object.entries(sections).map(([sectionName, changes]) => 
                        this.renderSection(sectionName, changes)
                    ).join('')}
                </div>
            </div>
        `
    }

    private getVisibleSections(sections: ChangelogEntry['sections'], userRole: string): Record<string, string[]> {
        const visibleSections: Record<string, string[]> = {}

        switch (userRole) {
            case 'admin':
                // Admin sees all sections
                if (sections.student) visibleSections['student'] = sections.student
                if (sections.tutor) visibleSections['tutor'] = sections.tutor
                if (sections.admin) visibleSections['admin'] = sections.admin
                break
            case 'tutor':
                // Tutor sees student and tutor sections
                if (sections.student) visibleSections['student'] = sections.student
                if (sections.tutor) visibleSections['tutor'] = sections.tutor
                break
            case 'student':
                // Student sees student and tutor sections
                if (sections.student) visibleSections['student'] = sections.student
                if (sections.tutor) visibleSections['tutor'] = sections.tutor
                break
            default:
                // Other roles see only student section
                if (sections.student) visibleSections['student'] = sections.student
                break
        }

        return visibleSections
    }

    private renderSection(sectionName: string, changes: string[]): string {
        const sectionInfo = this.getSectionInfo(sectionName)
        
        return `
            <div class="mb-4">
                <h5 class="d-flex align-items-center mb-3">
                    <span class="badge ${sectionInfo.badgeClass} me-2">
                        ${sectionInfo.icon}
                    </span>
                    ${sectionInfo.title}
                </h5>
                <ul class="list-group list-group-flush">
                    ${changes.map(change => `
                        <li class="list-group-item border-0 px-0">
                            <i class="bi bi-check-circle-fill text-success me-2"></i>
                            ${change}
                        </li>
                    `).join('')}
                </ul>
            </div>
        `
    }

    private getSectionInfo(sectionName: string): { title: string, icon: string, badgeClass: string } {
        switch (sectionName) {
            case 'student':
                return {
                    title: 'Dla uczniów',
                    icon: '👨‍🎓',
                    badgeClass: 'bg-success'
                }
            case 'tutor':
                return {
                    title: 'Dla lektorów',
                    icon: '👨‍🏫',
                    badgeClass: 'bg-info'
                }
            case 'admin':
                return {
                    title: 'Dla administratorów',
                    icon: '⚙️',
                    badgeClass: 'bg-warning text-dark'
                }
            default:
                return {
                    title: sectionName,
                    icon: '📋',
                    badgeClass: 'bg-secondary'
                }
        }
    }
}