// resources/ts/components/StudentFormValidator.ts
import { FormValidator } from '@components/FormValidator'
import type { StudentFormData } from '@/types/forms'

export class StudentFormValidator extends FormValidator {
    protected validateStudentSpecific(data: StudentFormData): Record<string, string> {
        const errors: Record<string, string> = {}

        // Learning languages validation
        if (data.learning_languages && data.learning_languages.length > 5) {
            errors.learning_languages = 'Maksymalnie 5 języków do nauki'
        }

        // // Package hours validation
        // if (data.package_hours) {
        //     const hours = parseFloat(data.package_hours.toString())
        //     if (hours < 1 || hours > 100) {
        //         errors.package_hours = 'Pakiet musi zawierać od 1 do 100 godzin'
        //     }
        // }
        //
        // // Package expiration validation
        // if (data.package_expires) {
        //     const expiryDate = new Date(data.package_expires)
        //     const today = new Date()
        //
        //     if (expiryDate <= today) {
        //         errors.package_expires = 'Data wygaśnięcia musi być w przyszłości'
        //     }
        // }

        return errors
    }
}