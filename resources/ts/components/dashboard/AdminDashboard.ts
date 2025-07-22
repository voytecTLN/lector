// resources/ts/components/dashboard/AdminDashboard.ts
import type { RouteComponent } from '@router/routes'
import { authService } from '@services/AuthService'
import { api } from '@services/ApiService'
import { navigate } from "@utils/navigation";
import { AdminLessons } from './admin/AdminLessons'
import { LessonDetailsModal } from '../modals/LessonDetailsModal'

export class AdminDashboard implements RouteComponent {
    private activeSection: string = 'dashboard'
    private container: HTMLElement | null = null
    private statsInterval: number | null = null
    private isLoadingStats: boolean = false

    async render(): Promise<HTMLElement> {
        const user = authService.getUser()
        const el = document.createElement('div')
        el.className = 'admin-container'
        el.innerHTML = `
            <!-- Sidebar -->
            <nav class="admin-sidebar" id="sidebar">
                <div class="admin-logo-dashboard">
                    <h2>🎓 Platforma Lektorów</h2>
                    <p style="font-size: 0.875rem; color: #64748b; margin-top: 0.25rem;">Panel Administratora</p>
                </div>

                <ul class="admin-nav-menu">
                    <li class="admin-nav-item">
                        <a href="#dashboard" class="admin-nav-link active" data-section="dashboard">
                            <span class="admin-nav-icon">📊</span>
                            Dashboard
                        </a>
                    </li>

                    <div class="admin-nav-section">Zarządzanie Użytkownikami</div>

                    <li class="admin-nav-item">
                        <a href="#lektorzy" class="admin-nav-link" data-section="lektorzy">
                            <span class="admin-nav-icon">👨‍🏫</span>
                            Lektorzy
<!--                            <span class="admin-nav-badge" id="tutors-count">0</span>-->
                        </a>
                    </li>

                    <li class="admin-nav-item">
                        <a href="#uczniowie" class="admin-nav-link" data-section="uczniowie">
                            <span class="admin-nav-icon">👥</span>
                            Uczniowie
<!--                            <span class="admin-nav-badge" id="students-count">0</span>-->
                        </a>
                    </li>

                    <li class="admin-nav-item">
                        <a href="#moderatorzy" class="admin-nav-link" data-section="moderatorzy">
                            <span class="admin-nav-icon">👮‍♂️</span>
                            Moderatorzy
<!--                            <span class="admin-nav-badge" id="moderators-count">0</span>-->
                        </a>
                    </li>

                    <li class="admin-nav-item">
                        <a href="#administratorzy" class="admin-nav-link" data-section="administratorzy">
                            <span class="admin-nav-icon">🔑</span>
                            Administratorzy
<!--                            <span class="admin-nav-badge" id="admins-count">0</span>-->
                        </a>
                    </li>

                    <div class="admin-nav-section">Lekcje i Harmonogram</div>

                    <li class="admin-nav-item">
                        <a href="#lekcje" class="admin-nav-link" data-section="lekcje">
                            <span class="admin-nav-icon">📚</span>
                            Wszystkie lekcje
<!--                            <span class="admin-nav-badge admin-nav-badge-success" id="active-lessons">0</span>-->
                        </a>
                    </li>

<!--                    <li class="admin-nav-item">-->
<!--                        <a href="#harmonogram" class="admin-nav-link" data-section="harmonogram">-->
<!--                            <span class="admin-nav-icon">📅</span>-->
<!--                            Harmonogram-->
<!--                        </a>-->
<!--                    </li>-->

                    <div class="admin-nav-section">Pakiety i Płatności</div>

                    <li class="admin-nav-item">
                        <a href="#pakiety" class="admin-nav-link" data-section="pakiety">
                            <span class="admin-nav-icon">📦</span>
                            Pakiety
                        </a>
                    </li>

                    <div class="admin-nav-section">Monitoring i Logi</div>

<!--                    <li class="admin-nav-item">-->
<!--                        <a href="#aktywnosc" class="admin-nav-link" data-section="aktywnosc">-->
<!--                            <span class="admin-nav-icon">👁️</span>-->
<!--                            Aktywność użytkowników-->
<!--                        </a>-->
<!--                    </li>-->

                    <li class="admin-nav-item">
                        <a href="#logi-systemu" class="admin-nav-link" data-section="logi">
                            <span class="admin-nav-icon">📝</span>
                            Logi systemowe
                        </a>
                    </li>

                    <div class="admin-nav-section">System</div>

                    <li class="admin-nav-item">
                        <a href="#raporty" class="admin-nav-link" data-section="raporty">
                            <span class="admin-nav-icon">👁</span>
                            Raporty
                        </a>
                    </li>
                    
                    <li class="admin-nav-item">
                        <a href="#ustawienia" class="admin-nav-link" data-section="ustawienia">
                            <span class="admin-nav-icon">⚙️</span>
                            Ustawienia systemu
                        </a>
                    </li>
             
<!--                    <li class="admin-nav-item">-->
<!--                        <a href="#pomoc" class="admin-nav-link" data-section="pomoc">-->
<!--                            <span class="admin-nav-icon">❓</span>-->
<!--                            Pomoc i dokumentacja-->
<!--                        </a>-->
<!--                    </li>-->
                </ul>
            </nav>

            <!-- Main Content -->
            <main class="admin-main-content">
                <header class="admin-header">
                    <div>
                        <button class="admin-mobile-menu-btn" id="mobile-menu-btn">☰</button>
                        <h1 id="page-title">Dashboard</h1>
                    </div>
                    <div class="admin-user-info">
                        <div class="admin-user-avatar">${user?.name?.charAt(0).toUpperCase() || 'A'}</div>
                        <div>
                            <div style="font-weight: 600;">${user?.name || 'Administrator'}</div>
                            <div style="font-size: 0.75rem; color: #64748b;">${user?.email || ''}</div>
                        </div>
                        <button class="logout-btn" id="logout-btn">Wyloguj</button>
                    </div>
                </header>

                <div id="content-area">
                    <!-- Content will be loaded here -->
                </div>
            </main>
        `

        return el
    }

    mount(container: HTMLElement): void {
        this.container = container

        // Make LessonDetailsModal available globally
        ;(window as any).LessonDetailsModal = LessonDetailsModal

        // Setup navigation
        this.setupNavigation()

        // Setup mobile menu
        this.setupMobileMenu()

        // Setup logout
        this.setupLogout()

        // NOWE: Odczytaj sekcję z URL
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section') || 'dashboard'

        // NOWE: Ustaw aktywną klasę na podstawie URL
        this.setActiveNavLink(section)

        // Load initial content
        this.loadContent(section)

        // NOWE: Obsługa przycisku wstecz
        window.addEventListener('popstate', this.handlePopState.bind(this))

        // Start auto-refresh stats
        this.startStatsRefresh()
    }

    private handlePopState = (event: PopStateEvent): void => {
        const urlParams = new URLSearchParams(window.location.search)
        const section = urlParams.get('section') || 'dashboard'

        this.setActiveNavLink(section)
        this.loadContent(section)
    }

    private setActiveNavLink(section: string): void {
        const navLinks = this.container?.querySelectorAll('.admin-nav-link')
        navLinks?.forEach(link => {
            const linkSection = link.getAttribute('data-section')
            if (linkSection === section) {
                link.classList.add('active')
            } else {
                link.classList.remove('active')
            }
        })
    }

    private updateURL(section: string): void {
        const url = new URL(window.location.href)
        url.searchParams.set('section', section)

        // Używamy pushState zamiast replaceState dla historii
        window.history.pushState({ section }, '', url.toString())
    }

    unmount(): void {
        if (this.statsInterval) {
            clearInterval(this.statsInterval)
        }

        window.removeEventListener('popstate', this.handlePopState)
    }

    private setupNavigation(): void {
        const navLinks = this.container?.querySelectorAll('.admin-nav-link')

        navLinks?.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault()

                const section = link.getAttribute('data-section')
                if (section) {
                    // NOWE: Aktualizuj URL
                    this.updateURL(section)

                    // Update active state
                    navLinks.forEach(l => l.classList.remove('active'))
                    link.classList.add('active')

                    // Load content
                    this.loadContent(section)
                }
            })
        })
    }

    private setupMobileMenu(): void {
        const menuBtn = this.container?.querySelector('#mobile-menu-btn')
        const sidebar = this.container?.querySelector('#sidebar')

        menuBtn?.addEventListener('click', () => {
            sidebar?.classList.toggle('open')
        })

        // Close sidebar on outside click
        document.addEventListener('click', (e) => {
            const target = e.target as HTMLElement
            if (window.innerWidth <= 768 &&
                !sidebar?.contains(target) &&
                !menuBtn?.contains(target)) {
                sidebar?.classList.remove('open')
            }
        })
    }

    private setupLogout(): void {
        const logoutBtn = this.container?.querySelector('#logout-btn')
        logoutBtn?.addEventListener('click', async () => {
            await authService.logout()
            navigate.to('/')
            //TODO
        })
    }

    private async loadContent(section: string): Promise<void> {
        const contentArea = this.container?.querySelector('#content-area')
        const pageTitle = this.container?.querySelector('#page-title')

        if (!contentArea || !pageTitle) return

        this.activeSection = section

        switch(section) {
            case 'dashboard':
                pageTitle.textContent = 'Dashboard'
                // contentArea.innerHTML = await this.getDashboardContent()
                // break

                // Ustaw loading state
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()

                // Załaduj prawdziwe dane
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
                break

            case 'lektorzy':
                pageTitle.textContent = 'Zarządzanie Lektorami'
                contentArea.innerHTML = this.getTutorsContent()

                // Mount TutorList component
                import('@/components/tutors/TutorList').then(async (module) => {
                    const tutorList = new module.TutorList()
                    const container = contentArea.querySelector('#tutors-list-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await tutorList.render()
                        container.appendChild(element)
                        tutorList.mount(container)
                    } else {
                        console.error('Tutors list container not found or not HTMLElement')
                    }
                })
                break

            case 'uczniowie':
                pageTitle.textContent = 'Zarządzanie Uczniami'
                contentArea.innerHTML = this.getStudentsContent()

                // Mount StudentList component
                import('@/components/students/StudentList').then(async (module) => {
                    const studentList = new module.StudentList()
                    const container = contentArea.querySelector('#students-list-container')

                    // Type guard to ensure it's HTMLElement
                    if (container && container instanceof HTMLElement) {
                        const element = await studentList.render()
                        container.appendChild(element)
                        studentList.mount(container)
                    } else {
                        console.error('Students list container not found or not HTMLElement')
                    }
                })
                break

            case 'pakiety':
                pageTitle.textContent = 'Zarządzanie Pakietami'
                contentArea.innerHTML = this.getPackagesContent()

                // Mount PackageList component
                import('@/components/packages/PackageList').then(async (module) => {
                    const packageList = new module.PackageList()
                    const container = contentArea.querySelector('#packages-list-container')

                    // Type guard to ensure it's HTMLElement
                    if (container && container instanceof HTMLElement) {
                        const element = await packageList.render()
                        container.appendChild(element)
                        packageList.mount(container)
                    } else {
                        console.error('Packages list container not found or not HTMLElement')
                    }
                })
                break

            case 'dodaj-pakiet':
                pageTitle.textContent = 'Dodaj Pakiet'
                contentArea.innerHTML = this.getAddPackageContent()
                
                // Mount PackageForm component
                import('@/components/packages/PackageForm').then(async (module) => {
                    const packageForm = new module.PackageForm()
                    const container = contentArea.querySelector('#add-package-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await packageForm.render()
                        container.appendChild(element)
                        packageForm.mount && packageForm.mount(container)
                    } else {
                        console.error('Add package container not found or not HTMLElement')
                    }
                })
                break

            case 'package-details':
                pageTitle.textContent = 'Szczegóły Pakietu'
                contentArea.innerHTML = this.getPackageDetailsContent()
                
                // Mount PackageDetails component
                import('@/components/packages/PackageDetails').then(async (module) => {
                    const packageDetails = new module.PackageDetails()
                    const container = contentArea.querySelector('#package-details-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await packageDetails.render()
                        container.appendChild(element)
                        packageDetails.mount && packageDetails.mount(container)
                    } else {
                        console.error('Package details container not found or not HTMLElement')
                    }
                })
                break

            case 'edytuj-pakiet':
                pageTitle.textContent = 'Edytuj Pakiet'
                contentArea.innerHTML = this.getEditPackageContent()
                
                // Mount PackageForm component
                import('@/components/packages/PackageForm').then(async (module) => {
                    const packageForm = new module.PackageForm()
                    const container = contentArea.querySelector('#edit-package-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await packageForm.render()
                        container.appendChild(element)
                        packageForm.mount && packageForm.mount(container)
                    } else {
                        console.error('Edit package container not found or not HTMLElement')
                    }
                })
                break

            case 'lekcje':
                pageTitle.textContent = 'Wszystkie Lekcje'
                contentArea.innerHTML = this.getLessonsContent()
                break

            case 'aktywnosc':
                pageTitle.textContent = 'Aktywność Użytkowników'
                contentArea.innerHTML = this.getActivityContent()
                break

            case 'ustawienia':
                pageTitle.textContent = 'Ustawienia Systemu'
                contentArea.innerHTML = this.getSettingsContent()
                break

            case 'logi':
                pageTitle.textContent = 'Logi'
                contentArea.innerHTML = this.getLogsContent()
                break

            case 'raporty':
                pageTitle.textContent = 'Raporty'
                contentArea.innerHTML = this.getReportsContent()
                break

            case 'import-csv':
                pageTitle.textContent = 'Import Studentów z CSV'
                contentArea.innerHTML = this.getImportCsvContent()
                
                // Mount StudentImportView component
                import('@/components/students/StudentImportView').then(async (module) => {
                    const importView = new module.StudentImportView()
                    const container = contentArea.querySelector('#import-csv-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await importView.render()
                        container.appendChild(element)
                        importView.mount(container)
                    } else {
                        console.error('Import CSV container not found or not HTMLElement')
                    }
                })
                break

            case 'dodaj-studenta':
                pageTitle.textContent = 'Dodaj Studenta'
                contentArea.innerHTML = this.getAddStudentContent()
                
                // Mount StudentForm component
                import('@/components/students/StudentForm').then(async (module) => {
                    const studentForm = new module.StudentForm()
                    const container = contentArea.querySelector('#add-student-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await studentForm.render()
                        container.appendChild(element)
                        studentForm.mount(container)
                    } else {
                        console.error('Add student container not found or not HTMLElement')
                    }
                })
                break

            case 'student-details':
                const studentId = this.getStudentIdFromUrl()
                if (studentId) {
                    pageTitle.textContent = 'Profil Studenta'
                    contentArea.innerHTML = this.getStudentDetailsContent()
                    
                    // Mount StudentDetails component
                    import('@/components/students/StudentDetails').then(async (module) => {
                        const studentDetails = new module.StudentDetails()
                        const container = contentArea.querySelector('#student-details-container')

                        if (container && container instanceof HTMLElement) {
                            const element = await studentDetails.render()
                            container.appendChild(element)
                            studentDetails.mount(container)
                        } else {
                            console.error('Student details container not found or not HTMLElement')
                        }
                    })
                } else {
                    // Redirect back to students list if no ID
                    navigate.to('/admin/dashboard?section=uczniowie')
                }
                break

            case 'edytuj-studenta':
                const editStudentId = this.getStudentIdFromUrl()
                if (editStudentId) {
                    pageTitle.textContent = 'Edytuj Studenta'
                    contentArea.innerHTML = this.getEditStudentContent()
                    
                    // Mount StudentForm component in edit mode
                    import('@/components/students/StudentForm').then(async (module) => {
                        const studentForm = new module.StudentForm()
                        const container = contentArea.querySelector('#edit-student-container')

                        if (container && container instanceof HTMLElement) {
                            const element = await studentForm.render()
                            container.appendChild(element)
                            studentForm.mount(container)
                        } else {
                            console.error('Edit student container not found or not HTMLElement')
                        }
                    })
                } else {
                    // Redirect back to students list if no ID
                    navigate.to('/admin/dashboard?section=uczniowie')
                }
                break

            case 'moderatorzy':
                pageTitle.textContent = 'Zarządzanie Moderatorami'
                contentArea.innerHTML = this.getComingSoonContent('Moderatorzy', 'Funkcjonalność zarządzania moderatorami będzie dostępna wkrótce.')
                break

            case 'administratorzy':
                pageTitle.textContent = 'Zarządzanie Administratorami'
                contentArea.innerHTML = this.getAdministratorsContent()

                // Mount AdminList component
                import('@/components/admins/AdminList').then(async (module) => {
                    const adminList = new module.AdminList()
                    const container = contentArea.querySelector('#admins-list-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await adminList.render()
                        container.appendChild(element)
                        adminList.mount(container)
                    } else {
                        console.error('Admins list container not found or not HTMLElement')
                    }
                }).catch(() => {
                    // Fallback if AdminList doesn't exist yet
                    contentArea.innerHTML = this.getComingSoonContent('Administratorzy', 'Funkcjonalność zarządzania administratorami będzie dostępna wkrótce.')
                })
                break

            case 'dodaj-administratora':
                pageTitle.textContent = 'Dodaj Administratora'
                contentArea.innerHTML = this.getAddAdminContent()
                
                // Mount AdminForm component
                import('@/components/admins/AdminForm').then(async (module) => {
                    const adminForm = new module.AdminForm()
                    const container = contentArea.querySelector('#add-admin-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await adminForm.render()
                        container.appendChild(element)
                        adminForm.mount(container)
                    } else {
                        console.error('Add admin container not found or not HTMLElement')
                    }
                })
                break

            case 'admin-details':
                const adminId = this.getAdminIdFromUrl()
                if (adminId) {
                    pageTitle.textContent = 'Szczegóły Administratora'
                    contentArea.innerHTML = this.getAdminDetailsContent()
                    
                    // Mount AdminDetails component
                    import('@/components/admins/AdminDetails').then(async (module) => {
                        const adminDetails = new module.AdminDetails()
                        const container = contentArea.querySelector('#admin-details-container')

                        if (container && container instanceof HTMLElement) {
                            const element = await adminDetails.render()
                            container.appendChild(element)
                            adminDetails.mount(container)
                        } else {
                            console.error('Admin details container not found or not HTMLElement')
                        }
                    })
                } else {
                    // Redirect back to admins list if no ID
                    navigate.to('/admin/dashboard?section=administratorzy')
                }
                break

            case 'edytuj-administratora':
                const editAdminId = this.getAdminIdFromUrl()
                if (editAdminId) {
                    pageTitle.textContent = 'Edytuj Administratora'
                    contentArea.innerHTML = this.getEditAdminContent()
                    
                    // Mount AdminForm component in edit mode
                    import('@/components/admins/AdminForm').then(async (module) => {
                        const adminForm = new module.AdminForm()
                        const container = contentArea.querySelector('#edit-admin-container')

                        if (container && container instanceof HTMLElement) {
                            const element = await adminForm.render()
                            container.appendChild(element)
                            adminForm.mount(container)
                        } else {
                            console.error('Edit admin container not found or not HTMLElement')
                        }
                    })
                } else {
                    // Redirect back to admins list if no ID
                    navigate.to('/admin/dashboard?section=administratorzy')
                }
                break

            case 'profil-administratora':
                const profileAdminId = this.getAdminIdFromUrl()
                if (profileAdminId) {
                    pageTitle.textContent = 'Edytuj Profil Administratora'
                    contentArea.innerHTML = this.getAdminProfileEditContent()
                    
                    // Mount AdminProfileEdit component
                    import('@/components/admins/AdminProfileEdit').then(async (module) => {
                        const adminProfileEdit = new module.AdminProfileEdit()
                        const container = contentArea.querySelector('#admin-profile-edit-container')

                        if (container && container instanceof HTMLElement) {
                            const element = await adminProfileEdit.render()
                            container.appendChild(element)
                            adminProfileEdit.mount(container)
                        } else {
                            console.error('Admin profile edit container not found or not HTMLElement')
                        }
                    })
                } else {
                    // Redirect back to admins list if no ID
                    navigate.to('/admin/dashboard?section=administratorzy')
                }
                break

            case 'dodaj-lektora':
                pageTitle.textContent = 'Dodaj Lektora'
                contentArea.innerHTML = this.getAddTutorContent()
                
                // Mount TutorForm component
                import('@/components/tutors/TutorForm').then(async (module) => {
                    const tutorForm = new module.TutorForm()
                    const container = contentArea.querySelector('#add-tutor-container')

                    if (container && container instanceof HTMLElement) {
                        const element = await tutorForm.render()
                        container.appendChild(element)
                        tutorForm.mount(container)
                    } else {
                        console.error('Add tutor container not found or not HTMLElement')
                    }
                }).catch(error => {
                    console.error('Failed to load TutorForm:', error)
                    contentArea.innerHTML = '<div class="alert alert-danger">Błąd ładowania formularza lektora</div>'
                })
                break

            case 'tutor-details':
                const tutorId = this.getTutorIdFromUrl()
                if (tutorId) {
                    pageTitle.textContent = 'Szczegóły Lektora'
                    contentArea.innerHTML = this.getTutorDetailsContent()
                    
                    // Mount TutorDetails component
                    import('@/components/tutors/TutorDetails').then(async (module) => {
                        const tutorDetails = new module.TutorDetails()
                        const container = contentArea.querySelector('#tutor-details-container')

                        if (container && container instanceof HTMLElement) {
                            const element = await tutorDetails.render()
                            container.appendChild(element)
                            tutorDetails.mount(container)
                        } else {
                            console.error('Tutor details container not found or not HTMLElement')
                        }
                    }).catch(error => {
                        console.error('Failed to load TutorDetails:', error)
                        contentArea.innerHTML = '<div class="alert alert-danger">Błąd ładowania szczegółów lektora</div>'
                    })
                } else {
                    // Redirect back to tutors list if no ID
                    navigate.to('/admin/dashboard?section=lektorzy')
                }
                break

            case 'edytuj-lektora':
                const editTutorId = this.getTutorIdFromUrl()
                if (editTutorId) {
                    pageTitle.textContent = 'Edytuj Lektora'
                    contentArea.innerHTML = this.getEditTutorContent()
                    
                    // Mount TutorForm component in edit mode
                    import('@/components/tutors/TutorForm').then(async (module) => {
                        const tutorForm = new module.TutorForm()
                        const container = contentArea.querySelector('#edit-tutor-container')

                        if (container && container instanceof HTMLElement) {
                            const element = await tutorForm.render()
                            container.appendChild(element)
                            tutorForm.mount(container)
                        } else {
                            console.error('Edit tutor container not found or not HTMLElement')
                        }
                    }).catch(error => {
                        console.error('Failed to load TutorForm for editing:', error)
                        contentArea.innerHTML = '<div class="alert alert-danger">Błąd ładowania formularza edycji lektora</div>'
                    })
                } else {
                    // Redirect back to tutors list if no ID
                    navigate.to('/admin/dashboard?section=lektorzy')
                }
                break

            default:
                pageTitle.textContent = 'Dashboard'
                this.isLoadingStats = true
                contentArea.innerHTML = await this.getDashboardContent()
                this.isLoadingStats = false
                contentArea.innerHTML = await this.getDashboardContent()
        }
    }

    private async getDashboardContent(): Promise<string> {

        if (this.isLoadingStats) {
            return `
            <div class="admin-content-area">
                <div class="admin-loading-container">
                    <div class="admin-loading-spinner"></div>
                    <p class="admin-loading-text">Ładowanie statystyk...</p>
                </div>
            </div>
        `
        }

        // Fetch stats
        const stats = await this.fetchDashboardStats()

        return `
        <div class="admin-quick-actions">
            <div class="admin-action-card">
                <div class="admin-action-icon">👨‍🏫</div>
                <h3>Zarządzaj Lektorami</h3>
                <p>Lista i edycja kont lektorów</p>
                <a href="/#/admin/dashboard?section=lektorzy" class="admin-action-btn">
                    Przejdź
                </a>
            </div>

            <div class="admin-action-card">
                <div class="admin-action-icon">👥</div>
                <h3>Zarządzaj Studentami</h3>
                <p>Lista i edycja kont studentów</p>
                <a href="/#/admin/dashboard?section=uczniowie" class="admin-action-btn">
                    Przejdź
                </a>
            </div>

            <div class="admin-action-card">
                <div class="admin-action-icon">📊</div>
                <h3>Raporty</h3>
                <p>Generuj szczegółowe raporty</p>
                <button class="admin-action-btn coming-soon" onclick="this.showComingSoon('Moduł raportów')">
                    Wkrótce
                </button>
            </div>

            <div class="admin-action-card">
                <div class="admin-action-icon">⚙️</div>
                <h3>Ustawienia</h3>
                <p>Konfiguracja platformy</p>
                <button class="admin-action-btn coming-soon" onclick="this.showComingSoon('Panel ustawień')">
                    Wkrótce
                </button>
            </div>
        </div>

        <!-- Main Content Area - POPRAWIONE statystyki -->
        <div class="admin-content-area">
            <div class="welcome-section">
                <h2>Panel Administratora</h2>
                <p>Zarządzaj platformą, monitoruj statystyki i dodawaj nowych użytkowników.</p>

                <div class="system-info">
                    <div class="info-item">
                        <span class="info-number">${stats.students || 0}</span>
                        <div class="info-label">Studentów</div>
                    </div>
                    <div class="info-item">
                        <span class="info-number">${stats.tutors || 0}</span>
                        <div class="info-label">Lektorów</div>
                    </div>
                    <div class="info-item ${stats.total_lessons === null ? 'placeholder' : ''}">
                        <span class="info-number">${stats.total_lessons ?? '—'}</span>
                        <div class="info-label">Lekcje (wkrótce)</div>
                    </div>
                </div>
            </div>
        </div>`
    }

    private getTutorsContent(): string {
        return `
            <div class="admin-content-area">
                <div id="tutors-list-container">
                    <!-- TutorList component will be mounted here -->
                </div>
            </div>
        `
    }

    private getLogsContent(): string {
        return `
            <div class="admin-content-area">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Logi</h2>
                </div>
                <p>Logi dostępne wkrótce.</p>
                
                <!-- Tu będzie tabela z logami -->
                <div class="table-container">
                    <p class="admin-text-muted">Logi</p>
                </div>
            </div>
        `
    }

    private getReportsContent(): string {
        return `
            <div class="admin-content-area">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                    <h2>Raporty</h2>
                </div>
                <p>Raporty dostępne wkrótce.</p>
                
                <!-- Tu będzie tabela z raportami -->
                <div class="table-container">
                    <p class="admin-text-muted">Raporty</p>
                </div>
            </div>
        `
    }

    private getStudentsContent(): string {
        return `
        <div class="admin-content-area">
            <div id="students-list-container">
                <!-- StudentList component will be mounted here -->
            </div>
        </div>
    `
    }

    private getImportCsvContent(): string {
        return `
        <div class="admin-content-area">
            <div id="import-csv-container">
                <!-- StudentImportView component will be mounted here -->
            </div>
        </div>
    `
    }

    private getAddStudentContent(): string {
        return `
        <div class="admin-content-area">
            <div id="add-student-container">
                <!-- StudentForm component will be mounted here -->
            </div>
        </div>
    `
    }

    private getStudentDetailsContent(): string {
        return `
        <div class="admin-content-area">
            <div id="student-details-container">
                <!-- StudentDetails component will be mounted here -->
            </div>
        </div>
    `
    }

    private getEditStudentContent(): string {
        return `
        <div class="admin-content-area">
            <div id="edit-student-container">
                <!-- StudentForm component will be mounted here -->
            </div>
        </div>
    `
    }

    private getPackagesContent(): string {
        return `
        <div class="admin-content-area">
            <div id="packages-list-container">
                <!-- PackageList component will be mounted here -->
            </div>
        </div>
    `
    }

    private getAddPackageContent(): string {
        return `
        <div class="admin-content-area">
            <div id="add-package-container">
                <!-- PackageForm component will be mounted here -->
            </div>
        </div>
    `
    }

    private getPackageDetailsContent(): string {
        return `
        <div class="admin-content-area">
            <div id="package-details-container">
                <!-- PackageDetails component will be mounted here -->
            </div>
        </div>
    `
    }

    private getEditPackageContent(): string {
        return `
        <div class="admin-content-area">
            <div id="edit-package-container">
                <!-- PackageForm component will be mounted here -->
            </div>
        </div>
    `
    }

    private getStudentIdFromUrl(): string | null {
        const urlParams = new URLSearchParams(window.location.search)
        const hash = window.location.hash
        
        // Check for student_id in URL params
        const studentId = urlParams.get('student_id')
        if (studentId) {
            return studentId
        }
        
        // Check for student_id in hash fragment
        const hashParams = new URLSearchParams(hash.split('?')[1] || '')
        return hashParams.get('student_id')
    }

    private getLessonsContent(): string {
        return AdminLessons.instance.getLessonsContent()
    }

    private getActivityContent(): string {
        return `
            <div class="admin-content-area">
                <h2>Monitor Aktywności</h2>
                <p>Śledzenie aktywności użytkowników w czasie rzeczywistym.</p>
                
                <!-- Tu będzie lista aktywności -->
                <div class="activity-log">
                    <p class="admin-text-muted">Ładowanie logów aktywności...</p>
                </div>
            </div>
        `
    }

    private getSettingsContent(): string {
        return `
            <div class="admin-content-area">
                <h2>Konfiguracja Platformy</h2>
                <p>Globalne ustawienia systemu, integracje i konfiguracja.</p>
                
                <!-- Tu będą ustawienia -->
                <div class="settings-form">
                    <p class="admin-text-muted">Ładowanie ustawień...</p>
                </div>
            </div>
        `
    }

    private async fetchDashboardStats(): Promise<any> {
        try {
            /*
            * Dodać typy np.:
            * type DashboardStats = {
            * users: number
            * revenue: number
            * activeSessions: number
            // dodaj inne pola według API
            *}
             */
            const response = await api.get('/admin/dashboard-stats')
            // return response.data || {}
            return (response as any).data || {}
        } catch (error) {
            console.error('Failed to fetch dashboard stats:', error)
            return {}
        }
    }

    private startStatsRefresh(): void {
        // Refresh stats every 30 seconds
        this.statsInterval = window.setInterval(() => {
            if (this.activeSection === 'dashboard') {
                this.fetchDashboardStats().then(stats => {
                    this.updateStats(stats)
                })
            }
        }, 30000)
    }

    private showComingSoon(feature: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type: 'info',
                message: `${feature} będzie dostępny w następnej wersji.`,
                duration: 4000
            }
        }))
    }

    private updateStats(stats: any): void {
        // Update dashboard numbers
        const updateElement = (id: string, value: any) => {
            const el = this.container?.querySelector(`#${id}`)
            if (el) el.textContent = String(value)
        }

        updateElement('stat-tutors', stats.tutors || 0)
        updateElement('stat-students', stats.students || 0)
        updateElement('stat-lessons', stats.total_lessons || 0)
        updateElement('stat-revenue', `${stats.total_revenue || 0} zł`)

        // Update badges
        updateElement('tutors-count', stats.tutors || 0)
        updateElement('students-count', stats.students || 0)
        updateElement('moderators-count', stats.moderators || 0)
        updateElement('active-lessons', stats.active_lessons || 0)
    }

    private getComingSoonContent(title: string, description: string): string {
        return `
            <div class="admin-content-area">
                <div class="text-center py-5">
                    <div class="mb-4">
                        <i class="bi bi-clock-history" style="font-size: 4rem; color: #6c757d;"></i>
                    </div>
                    <h2 class="text-muted mb-3">${title}</h2>
                    <p class="text-muted mb-4">${description}</p>
                    <div class="alert alert-info d-inline-block">
                        <i class="bi bi-info-circle me-2"></i>
                        Ta funkcjonalność zostanie udostępniona w najbliższych aktualizacjach.
                    </div>
                </div>
            </div>
        `
    }

    private getAdministratorsContent(): string {
        return `
            <div class="admin-content-area">
                <div id="admins-list-container">
                    <!-- AdminList component will be mounted here -->
                </div>
            </div>
        `
    }

    private getAddAdminContent(): string {
        return `
            <div class="admin-content-area">
                <div id="add-admin-container">
                    <!-- AdminForm component will be mounted here -->
                </div>
            </div>
        `
    }

    private getAdminDetailsContent(): string {
        return `
            <div class="admin-content-area">
                <div id="admin-details-container">
                    <!-- AdminDetails component will be mounted here -->
                </div>
            </div>
        `
    }

    private getEditAdminContent(): string {
        return `
            <div class="admin-content-area">
                <div id="edit-admin-container">
                    <!-- AdminForm component will be mounted here -->
                </div>
            </div>
        `
    }

    private getAdminProfileEditContent(): string {
        return `
            <div class="admin-content-area">
                <div id="admin-profile-edit-container">
                    <!-- AdminProfileEdit component will be mounted here -->
                </div>
            </div>
        `
    }

    private getAdminIdFromUrl(): string | null {
        const urlParams = new URLSearchParams(window.location.search)
        const hash = window.location.hash
        
        // Check for admin_id in URL params
        const adminId = urlParams.get('admin_id')
        if (adminId) {
            return adminId
        }
        
        // Check for admin_id in hash fragment
        const hashParams = new URLSearchParams(hash.split('?')[1] || '')
        return hashParams.get('admin_id')
    }

    private getAddTutorContent(): string {
        return `
            <div class="admin-content-area">
                <div id="add-tutor-container">
                    <!-- TutorForm component will be mounted here -->
                </div>
            </div>
        `
    }

    private getTutorDetailsContent(): string {
        return `
            <div class="admin-content-area">
                <div id="tutor-details-container">
                    <!-- TutorDetails component will be mounted here -->
                </div>
            </div>
        `
    }

    private getEditTutorContent(): string {
        return `
            <div class="admin-content-area">
                <div id="edit-tutor-container">
                    <!-- TutorForm component will be mounted here -->
                </div>
            </div>
        `
    }

    private getTutorIdFromUrl(): string | null {
        const urlParams = new URLSearchParams(window.location.search)
        const hash = window.location.hash
        
        // Check for tutor_id in URL params
        const tutorId = urlParams.get('tutor_id')
        if (tutorId) {
            return tutorId
        }
        
        // Check for tutor_id in hash fragment
        const hashParams = new URLSearchParams(hash.split('?')[1] || '')
        return hashParams.get('tutor_id')
    }
}