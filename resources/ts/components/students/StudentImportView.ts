// resources/ts/components/students/StudentImportView.ts
import { api } from '@services/ApiService'
import { authService } from '@services/AuthService'
import { navigate } from '@utils/navigation'
import type { RouteComponent } from '@/router/routes'

interface ImportPreviewResult {
    total_rows: number
    valid_rows: number
    invalid_rows: number
    valid_data: Array<{ row: number; data: any }>
    invalid_data: Array<{ row: number; data: any; errors: string[] }>
    can_import: boolean
}

interface ImportResult {
    success_count: number
    failure_count: number
    total_rows: number
    errors: Array<{ row: number; message: string }>
}

export class StudentImportView implements RouteComponent {
    private container: HTMLElement | null = null
    private uploadForm: HTMLFormElement | null = null
    private fileInput: HTMLInputElement | null = null
    private previewContainer: HTMLElement | null = null
    private importButton: HTMLButtonElement | null = null
    private currentFile: File | null = null
    private previewData: ImportPreviewResult | null = null
    private isProcessing: boolean = false

    constructor() {
        // Check permissions
        if (!authService.hasAnyRole(['admin', 'moderator'])) {
            throw new Error('Brak uprawnień do importu studentów')
        }
    }

    async render(): Promise<HTMLElement> {
        const div = document.createElement('div')
        div.innerHTML = this.getTemplate()
        return div
    }

    private getTemplate(): string {
        return `
            <div class="student-import-view">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h2>Import studentów z CSV</h2>
                        <p class="text-muted">Importuj wielu studentów jednocześnie używając pliku CSV</p>
                    </div>
                    <button type="button" class="btn btn-secondary" id="back-btn">
                        <i class="fas fa-arrow-left me-2"></i>
                        Powrót do listy studentów
                    </button>
                </div>

                <!-- Instructions -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Instrukcje</h5>
                    </div>
                    <div class="card-body">
                        <div class="row">
                            <div class="col-md-6">
                                <h6>Wymagane pola:</h6>
                                <ul>
                                    <li><strong>name</strong> - Imię i nazwisko</li>
                                    <li><strong>email</strong> - Adres email</li>
                                    <li><strong>phone</strong> - Numer telefonu</li>
                                    <li><strong>birth_date</strong> - Data urodzenia (YYYY-MM-DD)</li>
                                </ul>
                            </div>
                            <div class="col-md-6">
                                <h6>Pola opcjonalne:</h6>
                                <ul>
                                    <li><strong>city</strong> - Miasto</li>
                                    <li><strong>country</strong> - Kraj</li>
                                    <li><strong>learning_languages</strong> - Języki (english,german)</li>
                                    <li><strong>learning_goals</strong> - Cele (conversation,business)</li>
                                    <li><strong>current_levels</strong> - Poziomy (english:B1,german:A2)</li>
                                </ul>
                            </div>
                        </div>
                        <div class="mt-3">
                            <button type="button" class="btn btn-outline-primary" id="download-template-btn">
                                <i class="fas fa-download me-2"></i>
                                Pobierz szablon CSV
                            </button>
                        </div>
                    </div>
                </div>

                <!-- Upload Form -->
                <div class="card mb-4">
                    <div class="card-header">
                        <h5 class="mb-0">Wybierz plik CSV</h5>
                    </div>
                    <div class="card-body">
                        <form id="upload-form" enctype="multipart/form-data">
                            <div class="mb-3">
                                <label for="csv-file" class="form-label">Plik CSV</label>
                                <input type="file" 
                                       class="form-control" 
                                       id="csv-file" 
                                       name="file" 
                                       accept=".csv,.txt" 
                                       required>
                                <div class="form-text">
                                    Maksymalnie 100 studentów na import. Plik musi być w formacie CSV z kodowaniem UTF-8.
                                </div>
                            </div>
                            <button type="submit" class="btn btn-primary" id="preview-btn">
                                <span class="spinner-border spinner-border-sm me-2 d-none" role="status"></span>
                                <i class="fas fa-search me-2"></i>
                                Podgląd importu
                            </button>
                        </form>
                    </div>
                </div>

                <!-- Preview Results -->
                <div id="preview-container" class="d-none">
                    <!-- Preview content will be inserted here -->
                </div>

                <!-- Import Results -->
                <div id="results-container" class="d-none">
                    <!-- Results content will be inserted here -->
                </div>
            </div>
        `
    }

    async mount(container: HTMLElement): Promise<void> {
        this.container = container
        this.uploadForm = container.querySelector('#upload-form')
        this.fileInput = container.querySelector('#csv-file')
        this.previewContainer = container.querySelector('#preview-container')
        this.importButton = container.querySelector('#import-btn')

        if (!this.uploadForm || !this.fileInput || !this.previewContainer) return

        this.setupEventListeners()
    }

    unmount(): void {
        this.container = null
        this.uploadForm = null
        this.fileInput = null
        this.previewContainer = null
        this.importButton = null
        this.currentFile = null
        this.previewData = null
    }

    private setupEventListeners(): void {
        // Back button
        const backBtn = this.container?.querySelector('#back-btn')
        backBtn?.addEventListener('click', () => {
            navigate.to('/admin/dashboard?section=uczniowie')
        })

        // Download template button
        const templateBtn = this.container?.querySelector('#download-template-btn')
        templateBtn?.addEventListener('click', this.downloadTemplate.bind(this))

        // Upload form submission
        this.uploadForm?.addEventListener('submit', this.handlePreview.bind(this))

        // File input change
        this.fileInput?.addEventListener('change', this.handleFileChange.bind(this))
    }

    private handleFileChange(): void {
        if (!this.fileInput) return

        const file = this.fileInput.files?.[0]
        if (!file) return

        // Validate file type
        const allowedTypes = ['text/csv', 'text/plain', 'application/vnd.ms-excel']
        if (!allowedTypes.includes(file.type) && !file.name.endsWith('.csv')) {
            this.showNotification('error', 'Nieprawidłowy typ pliku. Wybierz plik CSV.')
            this.fileInput.value = ''
            return
        }

        // Validate file size (2MB max)
        if (file.size > 2 * 1024 * 1024) {
            this.showNotification('error', 'Plik jest za duży. Maksymalny rozmiar to 2MB.')
            this.fileInput.value = ''
            return
        }

        this.currentFile = file
        this.previewContainer?.classList.add('d-none')
        this.hideResults()
    }

    private async downloadTemplate(): Promise<void> {
        try {
            const response = await fetch('/api/students/import/template', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${authService.getToken()}`,
                    'Accept': 'text/csv'
                }
            })

            if (!response.ok) {
                throw new Error('Nie udało się pobrać szablonu')
            }

            const blob = await response.blob()
            const url = window.URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = url
            a.download = 'szablon_importu_studentow.csv'
            document.body.appendChild(a)
            a.click()
            document.body.removeChild(a)
            window.URL.revokeObjectURL(url)

            this.showNotification('success', 'Szablon CSV został pobrany')
        } catch (error: any) {
            console.error('Error downloading template:', error)
            this.showNotification('error', 'Nie udało się pobrać szablonu CSV')
        }
    }

    private async handlePreview(event: Event): Promise<void> {
        event.preventDefault()

        if (!this.currentFile || this.isProcessing) return

        this.setProcessingState(true)
        this.hideResults()

        try {
            const formData = new FormData()
            formData.append('file', this.currentFile)

            const response = await api.post('/students/import/preview', formData)

            this.previewData = (response as any).data
            this.showPreview(this.previewData!)
        } catch (error: any) {
            console.error('Preview error:', error)
            this.showNotification('error', 'Nie udało się wygenerować podglądu: ' + (error.message || 'Nieznany błąd'))
        } finally {
            this.setProcessingState(false)
        }
    }

    private showPreview(data: ImportPreviewResult): void {
        if (!this.previewContainer) return

        const canImport = data.can_import && data.valid_rows > 0

        this.previewContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Podgląd importu</h5>
                </div>
                <div class="card-body">
                    <!-- Summary -->
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="text-center">
                                <div class="display-6">${data.total_rows}</div>
                                <div class="text-muted">Wszystkich wierszy</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <div class="display-6 text-success">${data.valid_rows}</div>
                                <div class="text-muted">Prawidłowych</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <div class="display-6 text-danger">${data.invalid_rows}</div>
                                <div class="text-muted">Z błędami</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <button type="button" 
                                        class="btn ${canImport ? 'btn-success' : 'btn-secondary'}" 
                                        id="import-btn"
                                        ${canImport ? '' : 'disabled'}>
                                    <span class="spinner-border spinner-border-sm me-2 d-none" role="status"></span>
                                    <i class="fas fa-upload me-2"></i>
                                    Importuj studentów
                                </button>
                            </div>
                        </div>
                    </div>

                    ${data.valid_rows > 0 ? `
                        <div class="mb-4">
                            <h6>Przykładowe prawidłowe wiersze:</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Wiersz</th>
                                            <th>Imię</th>
                                            <th>Email</th>
                                            <th>Telefon</th>
                                            <th>Data urodzenia</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.valid_data.map(row => `
                                            <tr>
                                                <td>${row.row}</td>
                                                <td>${row.data.name}</td>
                                                <td>${row.data.email}</td>
                                                <td>${row.data.phone}</td>
                                                <td>${row.data.birth_date}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}

                    ${data.invalid_rows > 0 ? `
                        <div class="mb-4">
                            <h6>Wiersze z błędami:</h6>
                            <div class="table-responsive">
                                <table class="table table-sm">
                                    <thead>
                                        <tr>
                                            <th>Wiersz</th>
                                            <th>Błędy</th>
                                            <th>Dane</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        ${data.invalid_data.map(row => `
                                            <tr>
                                                <td>${row.row}</td>
                                                <td>
                                                    <ul class="list-unstyled mb-0">
                                                        ${row.errors.map(error => `<li class="text-danger small">${error}</li>`).join('')}
                                                    </ul>
                                                </td>
                                                <td class="small">${row.data.name || ''} - ${row.data.email || ''}</td>
                                            </tr>
                                        `).join('')}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    ` : ''}

                    ${!canImport ? `
                        <div class="alert alert-warning">
                            <i class="fas fa-exclamation-triangle me-2"></i>
                            Import nie może być wykonany. Popraw błędy w pliku CSV i spróbuj ponownie.
                        </div>
                    ` : ''}
                </div>
            </div>
        `

        this.previewContainer.classList.remove('d-none')

        // Setup import button
        if (canImport) {
            const importBtn = this.previewContainer.querySelector('#import-btn')
            importBtn?.addEventListener('click', this.handleImport.bind(this))
        }
    }

    private async handleImport(): Promise<void> {
        if (!this.currentFile || this.isProcessing || !this.previewData) return

        this.setProcessingState(true)
        this.setImportButtonState(true)

        try {
            const formData = new FormData()
            formData.append('file', this.currentFile)

            const response = await api.post('/students/import', formData)

            this.showResults((response as any).data)
            this.showNotification('success', 'Import studentów zakończony')
        } catch (error: any) {
            console.error('Import error:', error)
            this.showNotification('error', 'Nie udało się zaimportować studentów: ' + (error.message || 'Nieznany błąd'))
        } finally {
            this.setProcessingState(false)
            this.setImportButtonState(false)
        }
    }

    private showResults(data: ImportResult): void {
        const resultsContainer = this.container?.querySelector('#results-container')
        if (!resultsContainer) return

        resultsContainer.innerHTML = `
            <div class="card">
                <div class="card-header">
                    <h5 class="mb-0">Wyniki importu</h5>
                </div>
                <div class="card-body">
                    <div class="row mb-4">
                        <div class="col-md-3">
                            <div class="text-center">
                                <div class="display-6">${data.total_rows}</div>
                                <div class="text-muted">Przetworzonych</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <div class="display-6 text-success">${data.success_count}</div>
                                <div class="text-muted">Zaimportowanych</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <div class="display-6 text-danger">${data.failure_count}</div>
                                <div class="text-muted">Błędów</div>
                            </div>
                        </div>
                        <div class="col-md-3">
                            <div class="text-center">
                                <button type="button" class="btn btn-primary" id="view-students-btn">
                                    <i class="fas fa-list me-2"></i>
                                    Zobacz studentów
                                </button>
                            </div>
                        </div>
                    </div>

                    ${data.errors.length > 0 ? `
                        <div class="alert alert-warning">
                            <h6>Błędy podczas importu:</h6>
                            <ul class="mb-0">
                                ${data.errors.map(error => `
                                    <li>Wiersz ${error.row}: ${error.message}</li>
                                `).join('')}
                            </ul>
                        </div>
                    ` : ''}

                    ${data.success_count > 0 ? `
                        <div class="alert alert-success">
                            <i class="fas fa-check-circle me-2"></i>
                            Pomyślnie zaimportowano ${data.success_count} studentów.
                        </div>
                    ` : ''}
                </div>
            </div>
        `

        resultsContainer.classList.remove('d-none')
        
        // Setup view students button
        const viewStudentsBtn = resultsContainer.querySelector('#view-students-btn')
        viewStudentsBtn?.addEventListener('click', () => {
            navigate.to('/admin/dashboard?section=uczniowie')
        })
    }

    private hideResults(): void {
        const resultsContainer = this.container?.querySelector('#results-container')
        resultsContainer?.classList.add('d-none')
    }

    private setProcessingState(processing: boolean): void {
        this.isProcessing = processing
        
        const previewBtn = this.container?.querySelector('#preview-btn')
        const spinner = previewBtn?.querySelector('.spinner-border')
        
        if (previewBtn && spinner) {
            if (processing) {
                previewBtn.setAttribute('disabled', 'true')
                spinner.classList.remove('d-none')
            } else {
                previewBtn.removeAttribute('disabled')
                spinner.classList.add('d-none')
            }
        }
    }

    private setImportButtonState(processing: boolean): void {
        const importBtn = this.container?.querySelector('#import-btn')
        const spinner = importBtn?.querySelector('.spinner-border')
        
        if (importBtn && spinner) {
            if (processing) {
                importBtn.setAttribute('disabled', 'true')
                spinner.classList.remove('d-none')
            } else {
                importBtn.removeAttribute('disabled')
                spinner.classList.add('d-none')
            }
        }
    }

    private showNotification(type: 'success' | 'error' | 'info' | 'warning', message: string): void {
        document.dispatchEvent(new CustomEvent('notification:show', {
            detail: {
                type,
                message,
                duration: 4000
            }
        }))
    }
}