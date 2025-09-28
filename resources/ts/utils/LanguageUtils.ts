export interface LanguageOption {
    value: string
    label: string
}

export class LanguageUtils {
    static readonly SUPPORTED_LANGUAGES: LanguageOption[] = [
        { value: 'english', label: 'Angielski' },
        { value: 'german', label: 'Niemiecki' },
        { value: 'spanish', label: 'Hiszpański' }
    ]

    static getLanguageLabel(value: string): string {
        const lang = this.SUPPORTED_LANGUAGES.find(l => l.value === value)
        return lang?.label || value
    }

    static generateLanguageCheckboxes(selectedLanguages: string[] = [], namePrefix: string = 'learning_languages'): string {
        return this.SUPPORTED_LANGUAGES.map(lang => `
            <div class="form-check">
                <input 
                    class="form-check-input" 
                    type="checkbox" 
                    id="${namePrefix}_${lang.value}" 
                    name="${namePrefix}[]" 
                    value="${lang.value}"
                    ${selectedLanguages.includes(lang.value) ? 'checked' : ''}
                >
                <label class="form-check-label" for="${namePrefix}_${lang.value}">
                    ${lang.label}
                </label>
            </div>
        `).join('')
    }

    static generateLanguageSelect(selectedLanguage: string = '', includeEmpty: boolean = true, nameAttribute: string = 'language'): string {
        let options = ''
        
        if (includeEmpty) {
            options += '<option value="">Wybierz język</option>'
        }
        
        options += this.SUPPORTED_LANGUAGES.map(lang => `
            <option value="${lang.value}" ${selectedLanguage === lang.value ? 'selected' : ''}>
                ${lang.label}
            </option>
        `).join('')

        return `<select class="form-select" name="${nameAttribute}">${options}</select>`
    }

    static generateLanguageOptions(selectedLanguage: string = '', includeEmpty: boolean = true): string {
        let options = ''
        
        if (includeEmpty) {
            options += '<option value="">Wszystkie języki</option>'
        }
        
        options += this.SUPPORTED_LANGUAGES.map(lang => `
            <option value="${lang.value}" ${selectedLanguage === lang.value ? 'selected' : ''}>
                ${lang.label}
            </option>
        `).join('')

        return options
    }

    static formatLanguageList(languages: string[]): string {
        return languages
            .map(lang => this.getLanguageLabel(lang))
            .join(', ') || 'Brak'
    }

    static validateLanguages(languages: string[]): boolean {
        const validLanguages = this.SUPPORTED_LANGUAGES.map(l => l.value)
        return languages.every(lang => validLanguages.includes(lang))
    }
}