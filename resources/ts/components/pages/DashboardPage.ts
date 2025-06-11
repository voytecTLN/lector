// resources/ts/pages/DashboardPage.ts - Uniwersalna strona dashboard
export class DashboardPage {
    private element: HTMLElement
    private role: string

    constructor(role: string = 'student') {
        this.role = role
        this.element = this.createElement()
        this.init()
    }

    private createElement(): HTMLElement {
        const div = document.createElement('div')
        div.innerHTML = this.render()
        return div
    }

    public render(): string {
        const roleConfig = this.getRoleConfig()

        return `
            <div class="dashboard-container">
                <div class="container">
                    <!-- Dashboard Header -->
                    <div class="dashboard-header">
                        <div class="dashboard-title">
                            <h1><i class="${roleConfig.icon} text-primary me-2"></i>${roleConfig.title}</h1>
                            <p>${roleConfig.description}</p>
                        </div>
                        <div class="dashboard-actions">
                            <button class="btn btn-primary" onclick="showNotification('info', '${roleConfig.primaryAction} w budowie!')">
                                <i class="${roleConfig.primaryIcon} me-2"></i>${roleConfig.primaryAction}
                            </button>
                            <button class="btn btn-outline-primary" onclick="showNotification('info', 'Funkcja w budowie!')">
                                <i class="fas fa-cog me-2"></i>Ustawienia
                            </button>
                        </div>
                    </div>

                    <!-- Quick Stats -->
                    <div class="stats-grid">
                        ${this.renderStats()}
                    </div>

                    <!-- Main Content -->
                    <div class="dashboard-content">
                        <div class="welcome-card">
                            <h3>Witaj w swoim panelu!</h3>
                            <p>${roleConfig.welcomeMessage}</p>
                            <div class="quick-links">
                                ${roleConfig.quickLinks.map(link => `
                                    <a href="${link.href}" class="quick-link">
                                        <i class="${link.icon}"></i>
                                        <span>${link.label}</span>
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `
    }

    private getRoleConfig() {
        const configs = {
            admin: {
                title: 'Panel Administratora',
                description: 'Zarządzaj platformą i monitoruj jej działanie',
                icon: 'fas fa-tachometer-alt',
                primaryAction: 'Dodaj użytkownika',
                primaryIcon: 'fas fa-plus',
                welcomeMessage: 'Masz pełny dostęp do wszystkich funkcji platformy.',
                quickLinks: [
                    { href: '#/admin/users', icon: 'fas fa-users', label: 'Użytkownicy' },
                    { href: '#/admin/settings', icon: 'fas fa-cogs', label: 'Ustawienia' },
                    { href: '#/admin/analytics', icon: 'fas fa-chart-bar', label: 'Analityka' }
                ]
            },
            moderator: {
                title: 'Panel Moderatora',
                description: 'Moderuj treści i zarządzaj społecznością',
                icon: 'fas fa-shield-alt',
                primaryAction: 'Moderuj treści',
                primaryIcon: 'fas fa-eye',
                welcomeMessage: 'Dbaj o jakość treści i bezpieczeństwo platformy.',
                quickLinks: [
                    { href: '#/moderator/content', icon: 'fas fa-eye', label: 'Moderacja' },
                    { href: '#/moderator/reports', icon: 'fas fa-flag', label: 'Zgłoszenia' },
                    { href: '#/moderator/users', icon: 'fas fa-users', label: 'Użytkownicy' }
                ]
            },
            tutor: {
                title: 'Panel Lektora',
                description: 'Zarządzaj swoimi lekcjami i studentami',
                icon: 'fas fa-chalkboard-teacher',
                primaryAction: 'Dodaj lekcję',
                primaryIcon: 'fas fa-plus',
                welcomeMessage: 'Prowadź efektywne lekcje i rozwijaj swoje umiejętności nauczania.',
                quickLinks: [
                    { href: '#/tutor/lessons', icon: 'fas fa-calendar', label: 'Lekcje' },
                    { href: '#/tutor/students', icon: 'fas fa-users', label: 'Studenci' },
                    { href: '#/tutor/earnings', icon: 'fas fa-dollar-sign', label: 'Zarobki' }
                ]
            },
            student: {
                title: 'Panel Studenta',
                description: 'Twoja podróż w nauce języków',
                icon: 'fas fa-graduation-cap',
                primaryAction: 'Zarezerwuj lekcję',
                primaryIcon: 'fas fa-calendar-plus',
                welcomeMessage: 'Kontynuuj naukę i osiągaj swoje cele językowe.',
                quickLinks: [
                    { href: '#/student/lessons', icon: 'fas fa-book', label: 'Moje lekcje' },
                    { href: '#/student/tutors', icon: 'fas fa-search', label: 'Znajdź lektora' },
                    { href: '#/student/progress', icon: 'fas fa-chart-line', label: 'Postępy' }
                ]
            }
        }

        return configs[this.role as keyof typeof configs] || configs.student
    }

    private renderStats(): string {
        const statsConfig = {
            admin: [
                { icon: 'fas fa-users', title: 'Użytkownicy', value: '1,234', change: '+12%' },
                { icon: 'fas fa-calendar-check', title: 'Aktywne lekcje', value: '89', change: '+8%' },
                { icon: 'fas fa-dollar-sign', title: 'Przychód', value: '45,678 zł', change: '+15%' },
                { icon: 'fas fa-clock', title: 'Oczekujące', value: '23', change: '0%' }
            ],
            moderator: [
                { icon: 'fas fa-exclamation-triangle', title: 'Do przeglądu', value: '12', change: '+3' },
                { icon: 'fas fa-flag', title: 'Zgłoszenia', value: '5', change: '-2' },
                { icon: 'fas fa-check-circle', title: 'Rozwiązane', value: '34', change: '+8' },
                { icon: 'fas fa-users', title: 'Aktywni', value: '456', change: '+5%' }
            ],
            tutor: [
                { icon: 'fas fa-calendar-check', title: 'Nadchodzące', value: '8', change: 'Dzisiaj: 3' },
                { icon: 'fas fa-check-circle', title: 'Ukończone', value: '127', change: '+5' },
                { icon: 'fas fa-dollar-sign', title: 'Zarobki', value: '3,456 zł', change: '+12%' },
                { icon: 'fas fa-users', title: 'Studenci', value: '23', change: '+2' }
            ],
            student: [
                { icon: 'fas fa-calendar-check', title: 'Nadchodzące', value: '3', change: 'Jutro: 1' },
                { icon: 'fas fa-check-circle', title: 'Ukończone', value: '45', change: '+3' },
                { icon: 'fas fa-chart-line', title: 'Postęp', value: '75%', change: '+15%' },
                { icon: 'fas fa-heart', title: 'Lektorzy', value: '2', change: 'Anna, Piotr' }
            ]
        }

        const stats = statsConfig[this.role as keyof typeof statsConfig] || statsConfig.student

        return stats.map((stat, index) => `
            <div class="stat-card stat-${['primary', 'success', 'warning', 'info'][index]}">
                <div class="stat-icon">
                    <i class="${stat.icon}"></i>
                </div>
                <div class="stat-content">
                    <h3>${stat.value}</h3>
                    <p>${stat.title}</p>
                    <span class="stat-change positive">${stat.change}</span>
                </div>
            </div>
        `).join('')
    }

    public init(): void {
        // Initialize dashboard functionality
        this.setupEventListeners()
        this.loadDashboardData()
    }

    private setupEventListeners(): void {
        // Quick links
        this.element.querySelectorAll('.quick-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()
                const href = (link as HTMLAnchorElement).getAttribute('href')
                if (href && window.router) {
                    window.router.navigate(href)
                }
            })
        })
    }

    private async loadDashboardData(): Promise<void> {
        // Load dashboard statistics
        try {
            // This would be replaced with actual API calls
            console.log(`Loading ${this.role} dashboard data...`)
        } catch (error) {
            console.error('Error loading dashboard data:', error)
        }
    }

    public getElement(): HTMLElement {
        return this.element
    }
}