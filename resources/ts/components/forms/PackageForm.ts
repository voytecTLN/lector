import type { RouteComponent } from '@router/routes'
import { PackageService, PackageFormData } from '@services/PackageService'
import type { Package } from '@/types/models'
import { navigate } from '@/utils/navigation'
import { ValidationError } from '@/types/models'

export class PackageForm implements RouteComponent {
    private packageService: PackageService
    private packageId: number | null = null
    private package: Package | null = null
    private container: HTMLElement | null = null
    private isEditing = false

    constructor() {
        this.packageService = new PackageService()
    }

    async render(): Promise<HTMLElement> {
        // Get package ID from URL params if editing
        const urlParams = new URLSearchParams(window.location.search)
        this.packageId = parseInt(urlParams.get('package_id') || '0', 10) || null
        this.isEditing = this.packageId !== null

        if (this.isEditing) {
            try {
                this.package = await this.packageService.getPackage(this.packageId!)
            } catch (error) {
                console.error('Error loading package:', error)
                await navigate.to('/admin/dashboard?section=pakiety')
                return document.createElement('div')
            }
        }

        const el = document.createElement('div')
        el.className = 'package-form-page'
        el.innerHTML = `
            <div class="container mt-4">
                <div class="d-flex justify-content-between align-items-center mb-4">
                    <div>
                        <h1>${this.isEditing ? 'Edytuj pakiet' : 'Dodaj nowy pakiet'}</h1>
                        <p class="text-muted">
                            ${this.isEditing ? 'Aktualizuj informacje o pakiecie' : 'Utwórz nowy pakiet lekcji'}
                        </p>
                    </div>
                    <button id="back-btn" class="btn btn-outline-secondary">
                        <i class="bi bi-arrow-left me-1"></i> Powrót do listy
                    </button>
                </div>

                <div class="row">
                    <div class="col-lg-8">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Informacje o pakiecie</h5>
                            </div>
                            <div class="card-body">
                                <form id="package-form">
                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="name" class="form-label">Nazwa pakietu *</label>
                                                <input type="text" class="form-control" id="name" name="name" 
                                                    value="${this.package?.name || ''}" required>
                                                <div class="invalid-feedback" id="name-error"></div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="price" class="form-label">Cena (zł) *</label>
                                                <input type="number" class="form-control" id="price" name="price" 
                                                    value="${this.package ? (this.package.price / 100).toFixed(2) : ''}" 
                                                    step="0.01" min="0" required>
                                                <div class="invalid-feedback" id="price-error"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="hours_count" class="form-label">Liczba godzin *</label>
                                                <input type="number" class="form-control" id="hours_count" name="hours_count" 
                                                    value="${this.package?.hours_count || ''}" min="1" required>
                                                <div class="invalid-feedback" id="hours_count-error"></div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="validity_days" class="form-label">Okres ważności (dni) *</label>
                                                <input type="number" class="form-control" id="validity_days" name="validity_days" 
                                                    value="${this.package?.validity_days || ''}" min="1" required>
                                                <div class="invalid-feedback" id="validity_days-error"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="row">
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="sort_order" class="form-label">Kolejność sortowania</label>
                                                <input type="number" class="form-control" id="sort_order" name="sort_order" 
                                                    value="${this.package?.sort_order || ''}" min="0">
                                                <div class="form-text">Określa kolejność wyświetlania pakietów</div>
                                                <div class="invalid-feedback" id="sort_order-error"></div>
                                            </div>
                                        </div>
                                        <div class="col-md-6">
                                            <div class="mb-3">
                                                <label for="color" class="form-label">Kolor</label>
                                                <input type="color" class="form-control form-control-color" id="color" name="color" 
                                                    value="${this.package?.color || '#007bff'}">
                                                <div class="form-text">Kolor używany do oznaczenia pakietu</div>
                                                <div class="invalid-feedback" id="color-error"></div>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="mb-3">
                                        <label for="description" class="form-label">Opis</label>
                                        <textarea class="form-control" id="description" name="description" rows="3" 
                                            placeholder="Opcjonalny opis pakietu...">${this.package?.description || ''}</textarea>
                                        <div class="form-text">Maksymalnie 1000 znaków</div>
                                        <div class="invalid-feedback" id="description-error"></div>
                                    </div>

                                    <div class="mb-3">
                                        <div class="form-check">
                                            <input class="form-check-input" type="checkbox" id="is_active" name="is_active" 
                                                ${this.package?.is_active !== false ? 'checked' : ''}>
                                            <label class="form-check-label" for="is_active">
                                                Pakiet aktywny
                                            </label>
                                        </div>
                                        <div class="form-text">Nieaktywne pakiety nie są dostępne dla nowych przypisań</div>
                                    </div>

                                    <div class="d-flex justify-content-end gap-2">
                                        <button type="button" id="cancel-btn" class="btn btn-secondary">
                                            Anuluj
                                        </button>
                                        <button type="submit" class="btn btn-primary" id="submit-btn">
                                            <span class="spinner-border spinner-border-sm me-2 d-none" id="submit-spinner"></span>
                                            ${this.isEditing ? 'Aktualizuj pakiet' : 'Utwórz pakiet'}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>

                    <div class="col-lg-4">
                        <div class="card">
                            <div class="card-header">
                                <h5 class="card-title mb-0">Podgląd pakietu</h5>
                            </div>
                            <div class="card-body">
                                <div id="package-preview">
                                    <div class="d-flex align-items-center mb-3">
                                        <div class="badge me-2" id="preview-color" style="background-color: ${this.package?.color || '#007bff'}">&nbsp;</div>
                                        <h6 class="mb-0" id="preview-name">${this.package?.name || 'Nazwa pakietu'}</h6>
                                    </div>
                                    <div class="mb-2">
                                        <small class="text-muted">Cena:</small>
                                        <span class="fw-bold" id="preview-price">${this.package ? (this.package.price / 100).toFixed(2) : '0.00'} zł</span>
                                    </div>
                                    <div class="mb-2">
                                        <small class="text-muted">Godziny:</small>
                                        <span id="preview-hours">${this.package?.hours_count || '0'}</span>h
                                    </div>
                                    <div class="mb-2">
                                        <small class="text-muted">Ważność:</small>
                                        <span id="preview-validity">${this.package?.validity_days || '0'}</span> dni
                                    </div>
                                    <div class="mb-2">
                                        <small class="text-muted">Status:</small>
                                        <span class="badge" id="preview-status">
                                            ${this.package?.is_active !== false ? 'Aktywny' : 'Nieaktywny'}
                                        </span>
                                    </div>
                                    <div id="preview-description" class="mt-3">
                                        <small class="text-muted">Opis:</small>
                                        <p class="small mb-0">${this.package?.description || 'Brak opisu'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `

        return el
    }

    private setupEventListeners(): void {
        const form = this.container?.querySelector('#package-form') as HTMLFormElement
        const backBtn = this.container?.querySelector('#back-btn')
        const cancelBtn = this.container?.querySelector('#cancel-btn')

        form?.addEventListener('submit', (e) => this.handleSubmit(e))
        backBtn?.addEventListener('click', () => navigate.to('/admin/dashboard?section=pakiety'))
        cancelBtn?.addEventListener('click', () => navigate.to('/admin/dashboard?section=pakiety'))
    }

    private setupPreviewUpdates(): void {
        const inputs = ['name', 'price', 'hours_count', 'validity_days', 'description', 'color', 'is_active']
        
        inputs.forEach(inputName => {
            const input = this.container?.querySelector(`#${inputName}`) as HTMLInputElement
            if (input) {
                input.addEventListener('input', () => this.updatePreview())
            }
        })
    }

    private updatePreview(): void {
        const getName = () => (this.container?.querySelector('#name') as HTMLInputElement)?.value || 'Nazwa pakietu'
        const getPrice = () => {
            const price = parseFloat((this.container?.querySelector('#price') as HTMLInputElement)?.value || '0')
            return price.toFixed(2)
        }
        const getHours = () => (this.container?.querySelector('#hours_count') as HTMLInputElement)?.value || '0'
        const getValidity = () => (this.container?.querySelector('#validity_days') as HTMLInputElement)?.value || '0'
        const getDescription = () => (this.container?.querySelector('#description') as HTMLTextAreaElement)?.value || 'Brak opisu'
        const getColor = () => (this.container?.querySelector('#color') as HTMLInputElement)?.value || '#007bff'
        const getIsActive = () => (this.container?.querySelector('#is_active') as HTMLInputElement)?.checked

        const previewName = this.container?.querySelector('#preview-name')
        const previewPrice = this.container?.querySelector('#preview-price')
        const previewHours = this.container?.querySelector('#preview-hours')
        const previewValidity = this.container?.querySelector('#preview-validity')
        const previewDescription = this.container?.querySelector('#preview-description p')
        const previewColor = this.container?.querySelector('#preview-color') as HTMLElement
        const previewStatus = this.container?.querySelector('#preview-status')

        if (previewName) previewName.textContent = getName()
        if (previewPrice) previewPrice.textContent = `${getPrice()} zł`
        if (previewHours) previewHours.textContent = getHours()
        if (previewValidity) previewValidity.textContent = getValidity()
        if (previewDescription) previewDescription.textContent = getDescription()
        if (previewColor) previewColor.style.backgroundColor = getColor()
        if (previewStatus) {
            previewStatus.textContent = getIsActive() ? 'Aktywny' : 'Nieaktywny'
            previewStatus.className = `badge ${getIsActive() ? 'bg-success' : 'bg-secondary'}`
        }
    }

    private async handleSubmit(e: Event): Promise<void> {
        e.preventDefault()
        
        const form = e.target as HTMLFormElement
        const formData = new FormData(form)
        const submitBtn = this.container?.querySelector('#submit-btn') as HTMLButtonElement
        const spinner = this.container?.querySelector('#submit-spinner')

        this.clearErrors()

        try {
            submitBtn.disabled = true
            spinner?.classList.remove('d-none')

            const data: PackageFormData = {
                name: formData.get('name') as string,
                is_active: formData.get('is_active') === 'on',
                price: parseFloat(formData.get('price') as string),
                hours_count: parseInt(formData.get('hours_count') as string),
                validity_days: parseInt(formData.get('validity_days') as string),
                description: formData.get('description') as string || undefined,
                sort_order: formData.get('sort_order') ? parseInt(formData.get('sort_order') as string) : undefined,
                color: formData.get('color') as string || undefined
            }

            if (this.isEditing) {
                await this.packageService.updatePackage(this.packageId!, data)
            } else {
                await this.packageService.createPackage(data)
            }

            await navigate.to('/admin/dashboard?section=pakiety')

        } catch (error) {
            console.error('Error saving package:', error)
            
            if (error instanceof ValidationError) {
                this.showErrors(error.errors)
            } else {
                alert('Nie udało się zapisać pakietu. Spróbuj ponownie.')
            }
        } finally {
            submitBtn.disabled = false
            spinner?.classList.add('d-none')
        }
    }

    private showErrors(errors: Record<string, string[]>): void {
        for (const [field, messages] of Object.entries(errors)) {
            const input = this.container?.querySelector(`#${field}`) as HTMLInputElement
            const errorDiv = this.container?.querySelector(`#${field}-error`)
            
            if (input && errorDiv) {
                input.classList.add('is-invalid')
                errorDiv.textContent = messages[0]
            }
        }
    }

    private clearErrors(): void {
        const inputs = this.container?.querySelectorAll('.form-control, .form-check-input')
        inputs?.forEach(input => {
            input.classList.remove('is-invalid')
        })

        const errorDivs = this.container?.querySelectorAll('.invalid-feedback')
        errorDivs?.forEach(div => {
            div.textContent = ''
        })
    }

    async mount(container: HTMLElement): Promise<void> {
        this.container = container
        this.setupEventListeners()
        this.setupPreviewUpdates()
    }

    destroy(): void {
        // Cleanup if needed
    }
}