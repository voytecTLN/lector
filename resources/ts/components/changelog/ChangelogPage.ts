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
            version: "1.3.0",
            releaseDate: "2025-09-18",
            sections: {
                student: [
                    "Dodano pełną historię zmian statusów lekcji - teraz każda zmiana jest zapisywana z dokładnym czasem i powodem",
                    "Poprawiono wyświetlanie historii statusów w szczegółach lekcji - pokazuje kompletny audyt trail",
                    "Naprawiono błąd z harmonogramem automatyki - lekcje są teraz właściwie kończone po 80 minutach"
                ],
                tutor: [
                    "Dodano możliwość zmiany statusu lekcji bezpośrednio z poziomu szczegółów lekcji",
                    "Wprowadzono dedykowany system logowania pokojów spotkań",
                    "Naprawiono konflikt z modalami - modal zmiany statusu poprawnie wyświetla się nad szczegółami lekcji",
                ],
                admin: [
                    "Wprowadzono śledzenie źródła konta (web, api, admin) dla lepszej analityki",
                    "Dodano zewnętrzne API dla integracji z systemami partnerów - umożliwia automatyczne tworzenie kont studentów",
                    "Utworzono External Student API z autentykacją API key dla systemów partnerów",
                    "Dodano nowe pole 'account_source' do tabeli users z migracją i seedowaniem istniejących danych",
                    "Wprowadzono kompletny system historii statusów lekcji z dedykowaną tabelą lesson_status_history",
                    "Naprawiono krytyczny problem z Laravel 11 scheduler - przeniesiono definicje z Kernel do routes/console.php",
                    "Utworzono nowe migracje dla śledzenia źródła kont i historii statusów lekcji",
                    "Poprawiono automatyczne kończenie lekcji po przekroczeniu 80 minut i pustych pokojach",
                    "Dodano logowanie tworzenia pokojów, wejść/wyjść użytkowników, i automatycznych operacji",
                    "Wprowadzono walidację regulaminu przy tworzeniu kont przez API i panel administracyjny"
                ]
            }
        },
        {
            version: "1.2.10",
            releaseDate: "2025-09-16",
            sections: {
                student: [
                    "Poprawiono obsługę błędów walidacji w formularzach edycji profilu - teraz wyświetlają się konkretne komunikaty błędów",
                    "Zaktualizowano emaile powitalane z informacją o 24-godzinnym czasie ważności linku resetowania hasła",
                    "Dodano instrukcje odzyskiwania dostępu w przypadku wygaśnięcia linku resetowania hasła"
                ],
                tutor: [
                    "Naprawiono wyświetlanie błędów walidacji w formularzu edycji profilu lektora",
                    "Poprawiono obsługę błędów przy zapisywaniu zmian w profilu - teraz pokazują się szczegółowe komunikaty",
                    "Usunięto mylące informacje o zasadach anulowania z emaili potwierdzających rezerwację lekcji"
                ],
                admin: [
                    "Wprowadzono kompletny system logowania emaili do dedykowanego pliku emails.log",
                    "Dodano automatyczne śledzenie wszystkich wysyłanych emaili z deduplicacją na podstawie hash",
                    "Utworzono LogEmailSent listener dla eventów MessageSending",
                    "Zaktualizowano szablony emaili z lepszymi instrukcjami odzyskiwania hasła",
                    "Poprawiono system walidacji formularzy z właściwą obsługą błędów ValidationException"
                ]
            }
        },
        {
            version: "1.2.9c",
            releaseDate: "2025-09-15",
            sections: {
                admin: [
                    "Zmieniono częstotliwość sprawdzania statusów lekcji z 5 na 8 minut dla optymalizacji wydajności",
                    "Wyczyszczono zbędne logi z komend automatycznych dla lepszej czytelności logów systemu"
                ]
            }
        },
        {
            version: "1.2.9",
            releaseDate: "2025-09-15",
            sections: {
                student: [
                    "Dodano sekcję 'Ważne informacje dla studentów' w dashboardzie z 5 kluczowymi wskazówkami",
                    "Dodano wizualnie atrakcyjną kartę powitalną w dashboardzie studenta",
                    "Przeprojektowano karty statystyk na nowoczesny design z ikonami i animacjami hover",
                    "Poprawiono responsywność dashboardu studenta na urządzeniach mobilnych",
                    "Dodano szczegółowe instrukcje dotyczące dostępnych godzin, rezerwacji lekcji, dołączania do pokojów i materiałów"
                ],
                tutor: [
                    "Wprowadzono automatyczne powiadomienia email dla lektorów 10 minut przed możliwością utworzenia pokoju lekcyjnego",
                    "Dodano sekcję 'Ważne informacje dla lektorów' w dashboardzie z 5 kluczowymi wskazówkami",
                    "Dostosowano czas utworzenia pokoju: lektorzy mogą teraz utworzyć pokój na 11 minut przed lekcją",
                    "Poprawiono formularz edycji profilu tutora - naprawiono błąd z polami wykształcenie i certyfikaty",
                    "Dodano szczegółowe instrukcje dotyczące podglądu profilu, powiadomień o rezerwacjach, rozpoczynania lekcji i zarządzania studentami"
                ],
                admin: [
                    "Dodano automatyczny system powiadomień email dla lektorów o możliwości utworzenia pokoju lekcyjnego",
                    "Wprowadzono scheduled command 'lessons:send-meeting-room-notifications' uruchamiany co minutę",
                    "Dodano nową kolumnę 'room_creation_notification_sent' w tabeli lessons z migracją",
                    "Rozszerzono NotificationService o powiadomienia dla lektorów",
                    "Utworzono nowy szablon email 'tutor-can-create-room' zgodny ze stylami systemu",
                    "Zoptymalizowano timing spotkań: studenci mogą dołączyć na 10 minut przed lekcją",
                    "Poprawiono monitorowanie i śledzenie wysyłania powiadomień o lekcjach"
                ]
            }
        },
        {
            version: "1.2.8",
            releaseDate: "2025-09-14",
            sections: {
                student: [
                    "Dodano automatyczne oznaczanie lekcji jako 'Nierozpocząte' po 15-minutowej karencji",
                    "Poprawiono modalny dialog anulowania lekcji - lepszy UX i walidacja",
                    "Naprawiono wyświetlanie godzin lekcji w emailach, modalach i listach",
                    "Dodano informacje o zwrocie godzin w komunikatach anulowania",
                    "Naprawiono błędy związane z formatowaniem czasu w komponentach lekcji",
                    "Dodano nowe statusy lekcji z odpowiednimi etykietami i kolorami",
                    "Wprowadzono zasady anulowania: studenci mogą anulować do momentu rozpoczęcia, z zwrotem godziny tylko przy ≥12h wyprzedzeniu",
                    "Po dodaniu konta ucznia przez panel administracyjny teraz wysyłany jest email z linkiem do ustawienia hasła"
                ],
                tutor: [
                    "Dodano modalny dialog anulowania lekcji z wymaganym polem powodu",
                    "Wprowadzono zasady anulowania dla lektorów: mogą anulować do momentu rozpoczęcia, zawsze z zwrotem godziny do studenta",
                    "Dodano informacje o statusie lekcji 'Nierozpoczęte' w historii lekcji",
                    "Poprawiono wyświetlanie statusów lekcji w kalendarzu i listach",
                    "Poprawiono godzinę lekcji w treści email, po rezerwacji lekcji przez studenta",
                    "Naprawiono błędy związane z formatowaniem czasu w dashboard tutora",
                    "Dodano lepszą obsługę automatycznego oznaczania pustych pokoi po 10 minutach",
                    "Dodano lepszą obsługę automatycznego zamykania pokoju po 80 minutach",
                    "Ulepszone komunikaty potwierdzające dla akcji na lekcjach"
                ],
                admin: [
                    "Wprowadzono system automatycznego sprawdzania statusów lekcji co 5 minut",
                    "Dodano nowy status lekcji 'not_started' do bazy danych",
                    "Skonfigurowano cron job w kontenerze Docker dla automatycznych zadań (supervisord)",
                    "Dodano obsługę statusu 'Nierozpoczęte' we wszystkich komponentach administracyjnych",
                    "Naprawiono walidację statusów lekcji w kontrolerach",
                    "Dodano komendę 'app:check-lesson-status' do automatycznego zarządzania statusami",
                    "Poprawiono system zarządzania CSV importem studentów - uproszczono wymagane pola do nazwy i emaila",
                    "Dodano pole 'Bio' do szczegółów studentów w panelu lektora",
                    "Usunięto niepotrzebne kolumny z tabel zarządzania studentami",
                    "Poprawiono filtrowanie historii lekcji według nazwy studenta via parametry URL",
                    "Zaktualizowano szablony CSV z przykładami minimalnymi i kompletnymi",
                    "Dodano migrację bazy danych dla nowego statusu lekcji"
                ]
            }
        },
        {
            version: "1.2.7",
            releaseDate: "2025-09-13",
            sections: {
                student: [
                    "Dodano właściwe logo i favicon do aplikacji",
                ],
                tutor: [
                    "Ograniczono nawigację kalendarza dostępności do maksymalnie 4 tygodni w przód",
                    "Poprawiono wygląd nagłówków w zakładkach",
                ],
                admin: [
                    "Naprawiono problem z uprawnieniami dla nawigacji tygodniowej w szczegółach tutora tab Kalendarz",
                    "Poprawiono błąd 403 przy używaniu przycisków 'Następny/Poprzedni tydzień' w panelu admina",
                    "Poprawiono wygląd nagłówków w zakładkach",
                    "Naprawiono paginację w logach dostępności",
                ]
            }
        },
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
                    "Naprawiono routing dashboard - teraz używa standardowego hash routing",
                    "Usunięto problemy z duplikowaniem URL",
                    "Naprawiono automatyczne odświeżanie danych profilu po zapisaniu zmian",
                    "Ulepszona nawigacja - menu działa płynnie bez błędów ładowania",
                    "Poprawiono zgodność między formularzem admina a formularzem tutora dla edycji profilu",
                    "Dodano przełącznik pokazuj/ukryj hasło w formularzach edycji profilu",
                    "Wprowadzono wymóg silnego hasła przy zmianie hasła w profilu"
                ],
                admin: [
                    "Naprawiono niekonsekwencję między endpoint-ami backend dla języków nauczania",
                    "Zunifikowano nazewnictwo pól formularzy",
                    "Poprawiono walidację w kontrolerze lektora",
                    "Uproszczono system przeładowywania stron",
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