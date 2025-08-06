// resources/ts/utils/FormDataParser.ts

export interface FieldConfig {
    name: string;
    type?: 'string' | 'number' | 'boolean' | 'array' | 'date';
    required?: boolean;
    defaultValue?: any;
    transform?: (value: any) => any;
}

export interface FormDataParserOptions {
    fields: FieldConfig[];
    isEditMode?: boolean;
    handlePasswords?: boolean;
    passwordField?: string;
    passwordConfirmField?: string;
    arrayFields?: string[];
    objectFields?: { [key: string]: string[] }; // e.g., { current_levels: ['english', 'german'] }
}

export class FormDataParser {
    private options: FormDataParserOptions;

    constructor(options: FormDataParserOptions) {
        this.options = {
            isEditMode: false,
            handlePasswords: true,
            passwordField: 'password',
            passwordConfirmField: 'password_confirmation',
            arrayFields: [],
            objectFields: {},
            ...options
        };
    }

    /**
     * Parse FormData into a structured object
     */
    public parse(formData: FormData): any {
        const data: any = {};

        // Parse basic fields
        this.parseBasicFields(formData, data);

        // Handle password fields specially
        if (this.options.handlePasswords) {
            this.handlePasswordFields(formData, data);
        }

        // Parse array fields
        this.parseArrayFields(formData, data);

        // Parse object fields
        this.parseObjectFields(formData, data);

        // Apply transformations and defaults
        this.applyTransformations(data);

        return data;
    }

    private parseBasicFields(formData: FormData, data: any): void {
        this.options.fields.forEach(field => {
            const value = formData.get(field.name);
            
            if (value !== null && value !== '') {
                data[field.name] = this.convertValue(value, field.type || 'string');
            } else if (field.defaultValue !== undefined) {
                data[field.name] = field.defaultValue;
            }
        });
    }

    private handlePasswordFields(formData: FormData, data: any): void {
        const passwordField = this.options.passwordField!;
        const confirmField = this.options.passwordConfirmField!;

        if (this.options.isEditMode) {
            // In edit mode, only include password if provided
            const password = formData.get(passwordField);
            if (!password) {
                // Remove password fields if empty (no change)
                delete data[passwordField];
                delete data[confirmField];
            } else {
                // Include password and confirmation
                data[passwordField] = password;
                data[confirmField] = formData.get(confirmField) || '';
            }
        } else {
            // In create mode, always include password confirmation if password exists
            if (data[passwordField]) {
                data[confirmField] = formData.get(confirmField) || '';
            }
        }
    }

    private parseArrayFields(formData: FormData, data: any): void {
        this.options.arrayFields?.forEach(fieldName => {
            const values = formData.getAll(fieldName);
            if (values.length > 0) {
                data[fieldName.replace('[]', '')] = values;
            }
        });
    }

    private parseObjectFields(formData: FormData, data: any): void {
        Object.entries(this.options.objectFields || {}).forEach(([objectName, fieldNames]) => {
            const objectData: any = {};
            
            fieldNames.forEach(fieldName => {
                // Look for fields like "current_levels[english]"
                const value = formData.get(`${objectName}[${fieldName}]`);
                if (value) {
                    objectData[fieldName] = value;
                }
            });

            if (Object.keys(objectData).length > 0) {
                data[objectName] = objectData;
            }
        });
    }

    private convertValue(value: FormDataEntryValue, type: string): any {
        const stringValue = String(value);

        switch (type) {
            case 'number':
                const num = Number(stringValue);
                return isNaN(num) ? 0 : num;
            
            case 'boolean':
                return stringValue === 'on' || stringValue === 'true' || stringValue === '1';
            
            case 'date':
                return stringValue || null;
            
            case 'array':
                return [stringValue];
            
            default:
                return stringValue;
        }
    }

    private applyTransformations(data: any): void {
        this.options.fields.forEach(field => {
            if (field.transform && data.hasOwnProperty(field.name)) {
                data[field.name] = field.transform(data[field.name]);
            }
        });
    }

    /**
     * Static method for quick parsing with common user fields
     */
    static parseUserForm(formData: FormData, isEditMode: boolean = false): any {
        const parser = new FormDataParser({
            fields: [
                { name: 'name', required: true },
                { name: 'email', required: true },
                { name: 'password' },
                { name: 'phone' },
                { name: 'birth_date', type: 'date' },
                { name: 'city' },
                { name: 'status', defaultValue: 'active' },
                { name: 'country', defaultValue: 'Polska' }
            ],
            isEditMode,
            handlePasswords: true
        });

        return parser.parse(formData);
    }

    /**
     * Static method for parsing student forms
     */
    static parseStudentForm(formData: FormData, isEditMode: boolean = false): any {
        const parser = new FormDataParser({
            fields: [
                { name: 'name', required: true },
                { name: 'email', required: true },
                { name: 'password' },
                { name: 'phone' },
                { name: 'birth_date', type: 'date' },
                { name: 'city' },
                { name: 'status', defaultValue: 'active' },
                { name: 'package_id', type: 'number' }
            ],
            isEditMode,
            handlePasswords: true,
            arrayFields: ['learning_languages[]', 'learning_goals[]'],
            objectFields: {
                current_levels: ['english', 'german', 'french', 'spanish', 'italian', 'portuguese', 'russian', 'chinese', 'japanese']
            }
        });

        return parser.parse(formData);
    }

    /**
     * Static method for parsing tutor forms
     */
    static parseTutorForm(formData: FormData, isEditMode: boolean = false): any {
        const parser = new FormDataParser({
            fields: [
                { name: 'name', required: true },
                { name: 'email', required: true },
                { name: 'password' },
                { name: 'phone' },
                { name: 'birth_date', type: 'date' },
                { name: 'city' },
                { name: 'status', defaultValue: 'active' },
                { name: 'hourly_rate', type: 'number' },
                { name: 'bio' },
                { name: 'experience_years', type: 'number' }
            ],
            isEditMode,
            handlePasswords: true,
            arrayFields: ['teaching_languages[]', 'specializations[]']
        });

        return parser.parse(formData);
    }

    /**
     * Static method for parsing package forms
     */
    static parsePackageForm(formData: FormData): any {
        const parser = new FormDataParser({
            fields: [
                { name: 'name', required: true },
                { name: 'price', type: 'number', transform: (value) => Math.round(value * 100) }, // Convert to cents
                { name: 'hours_count', type: 'number' },
                { name: 'validity_days', type: 'number' },
                { name: 'description' },
                { name: 'sort_order', type: 'number' },
                { name: 'color' },
                { name: 'is_active', type: 'boolean', defaultValue: true }
            ]
        });

        return parser.parse(formData);
    }
}