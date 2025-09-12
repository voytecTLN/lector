// resources/ts/utils/PasswordToggleHelper.ts

export class PasswordToggleHelper {
    /**
     * Setup password visibility toggle for a single input
     */
    static setupPasswordToggle(inputSelector: string, toggleSelector: string): void {
        const input = document.querySelector(inputSelector) as HTMLInputElement
        const toggle = document.querySelector(toggleSelector) as HTMLButtonElement
        
        if (input && toggle) {
            toggle.addEventListener('click', () => {
                const isPassword = input.type === 'password'
                input.type = isPassword ? 'text' : 'password'
                const icon = toggle.querySelector('i')
                if (icon) {
                    icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye'
                }
            })
        }
    }

    /**
     * Setup password toggles for multiple inputs with automatic ID generation
     */
    static setupPasswordToggles(container: HTMLElement, inputSelectors: string[]): void {
        inputSelectors.forEach(selector => {
            const input = container.querySelector(selector) as HTMLInputElement
            if (input) {
                const inputId = input.id || input.name
                const toggleId = `${inputId}-toggle`
                const toggle = container.querySelector(`#${toggleId}`) as HTMLButtonElement
                
                if (toggle) {
                    this.setupPasswordToggle(`#${inputId}`, `#${toggleId}`)
                }
            }
        })
    }

    /**
     * Convert existing password inputs to have toggles
     */
    static convertPasswordInputsToToggleable(containerElement: HTMLElement): void {
        const passwordInputs = containerElement.querySelectorAll('input[type="password"]') as NodeListOf<HTMLInputElement>
        
        // Found password inputs to convert
        
        passwordInputs.forEach(input => {
            // Skip if already has a toggle
            if (input.parentElement?.querySelector('.password-toggle')) {
                // Already has toggle, skipping
                return
            }

            // Skip system password fields (SMTP, API keys, etc)
            if (input.id?.includes('smtp') || input.id?.includes('api') || input.id?.includes('sms')) {
                // System password field, skipping
                return
            }

            // Converting password input to have toggle

            // Create wrapper with password-input-container class
            const wrapper = document.createElement('div')
            wrapper.className = 'password-input-container'

            // Wrap input in wrapper
            input.parentNode?.insertBefore(wrapper, input)
            wrapper.appendChild(input)

            // Create toggle button (styles come from global CSS)
            const inputId = input.id || input.name || `password-${Math.random().toString(36).substr(2, 9)}`
            const toggleId = `${inputId}-toggle`
            // Creating toggle button
            const toggle = document.createElement('button')
            toggle.type = 'button'
            toggle.className = 'password-toggle'
            toggle.id = toggleId
            toggle.setAttribute('aria-label', 'Pokaż/ukryj hasło')
            toggle.innerHTML = '<i class="bi bi-eye"></i>'

            // Add toggle to wrapper
            wrapper.appendChild(toggle)

            // Setup functionality directly (more reliable than using selectors)
            toggle.addEventListener('click', () => {
                const isPassword = input.type === 'password'
                input.type = isPassword ? 'text' : 'password'
                const icon = toggle.querySelector('i')
                if (icon) {
                    icon.className = isPassword ? 'bi bi-eye-slash' : 'bi bi-eye'
                }
                // Password visibility toggled
            })
        })
    }

    /**
     * Generate HTML for password input with toggle
     */
    static generatePasswordInputHTML(
        name: string, 
        label: string, 
        required: boolean = false, 
        minlength: number = 12,
        helpText?: string,
        value?: string
    ): string {
        const id = name.replace(/[\[\]]/g, '').replace(/[_]/g, '-')
        const requiredAttr = required ? 'required' : ''
        const valueAttr = value ? `value="${value}"` : ''
        
        return `
            <label class="form-label">${label} ${required ? '<span class="text-danger">*</span>' : ''}</label>
            <div class="input-group">
                <input type="password" 
                       id="${id}" 
                       name="${name}" 
                       class="form-control" 
                       ${requiredAttr} 
                       minlength="${minlength}"
                       ${valueAttr}
                       autocomplete="new-password">
                <button type="button" class="btn btn-outline-secondary password-toggle" id="${id}-toggle" aria-label="Pokaż/ukryj hasło">
                    <i class="bi bi-eye"></i>
                </button>
            </div>
            ${helpText ? `<div class="form-text">${helpText}</div>` : ''}
        `
    }

    /**
     * Generate HTML for current password input (edit forms)
     */
    static generateCurrentPasswordInputHTML(): string {
        return this.generatePasswordInputHTML(
            'current_password',
            'Obecne hasło',
            false,
            0,
            undefined
        )
    }
}