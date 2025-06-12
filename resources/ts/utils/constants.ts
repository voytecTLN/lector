// resources/ts/utils/constants.ts

// Application Configuration
export const APP_CONFIG = {
    NAME: 'Platforma Lektorów',
    VERSION: '1.0.0',
    API_BASE_URL: '/api',
    DEFAULT_LANGUAGE: 'pl',
    DEFAULT_THEME: 'light' as const,
    NOTIFICATION_DURATION: 5000,
    TOKEN_STORAGE_KEY: 'auth_token',
    USER_STORAGE_KEY: 'auth_user'
} as const

// Route Paths
export const ROUTES = {
    HOME: '/',
    LOGIN: '/login',
    REGISTER: '/register',
    FORGOT_PASSWORD: '/forgot-password',
    RESET_PASSWORD: '/reset-password',
    VERIFY_EMAIL: '/verify-email',
    PROFILE: '/profile',
    ADMIN_DASHBOARD: '/admin/dashboard',
    MODERATOR_DASHBOARD: '/moderator/dashboard',
    TUTOR_DASHBOARD: '/tutor/dashboard',
    STUDENT_DASHBOARD: '/student/dashboard',
    UNAUTHORIZED: '/unauthorized',
    NOT_FOUND: '/not-found'
} as const

// User Roles
export const USER_ROLES = {
    ADMIN: 'admin',
    MODERATOR: 'moderator',
    TUTOR: 'tutor',
    STUDENT: 'student'
} as const

// User Permissions
export const PERMISSIONS = {
    MANAGE_USERS: 'manage_users',
    MANAGE_CONTENT: 'manage_content',
    MANAGE_LESSONS: 'manage_lessons',
    VIEW_ANALYTICS: 'view_analytics',
    SYSTEM_SETTINGS: 'system_settings',
    CAN_TEACH: 'can_teach',
    CAN_LEARN: 'can_learn',
    MANAGE_OWN_LESSONS: 'manage_own_lessons',
    VIEW_OWN_ANALYTICS: 'view_own_analytics',
    BOOK_LESSONS: 'book_lessons',
    VIEW_OWN_PROGRESS: 'view_own_progress'
} as const

// Dashboard Routes by Role
export const DASHBOARD_ROUTES = {
    [USER_ROLES.ADMIN]: ROUTES.ADMIN_DASHBOARD,
    [USER_ROLES.MODERATOR]: ROUTES.MODERATOR_DASHBOARD,
    [USER_ROLES.TUTOR]: ROUTES.TUTOR_DASHBOARD,
    [USER_ROLES.STUDENT]: ROUTES.STUDENT_DASHBOARD
} as const

// Languages
export const LANGUAGES = {
    ENGLISH: 'english',
    GERMAN: 'german',
    FRENCH: 'french',
    SPANISH: 'spanish',
    ITALIAN: 'italian',
    PORTUGUESE: 'portuguese',
    RUSSIAN: 'russian',
    CHINESE: 'chinese',
    JAPANESE: 'japanese'
} as const

export const LANGUAGE_LABELS = {
    [LANGUAGES.ENGLISH]: 'Angielski',
    [LANGUAGES.GERMAN]: 'Niemiecki',
    [LANGUAGES.FRENCH]: 'Francuski',
    [LANGUAGES.SPANISH]: 'Hiszpański',
    [LANGUAGES.ITALIAN]: 'Włoski',
    [LANGUAGES.PORTUGUESE]: 'Portugalski',
    [LANGUAGES.RUSSIAN]: 'Rosyjski',
    [LANGUAGES.CHINESE]: 'Chiński',
    [LANGUAGES.JAPANESE]: 'Japoński'
} as const

// Language Levels
export const LANGUAGE_LEVELS = {
    A1: 'A1',
    A2: 'A2',
    B1: 'B1',
    B2: 'B2',
    C1: 'C1',
    C2: 'C2'
} as const

// Learning Goals
export const LEARNING_GOALS = {
    CONVERSATION: 'conversation',
    BUSINESS: 'business',
    EXAM: 'exam',
    TRAVEL: 'travel',
    ACADEMIC: 'academic',
    GRAMMAR: 'grammar',
    PRONUNCIATION: 'pronunciation'
} as const

export const LEARNING_GOAL_LABELS = {
    [LEARNING_GOALS.CONVERSATION]: 'Konwersacje',
    [LEARNING_GOALS.BUSINESS]: 'Język biznesowy',
    [LEARNING_GOALS.EXAM]: 'Przygotowanie do egzaminów',
    [LEARNING_GOALS.TRAVEL]: 'Język w podróży',
    [LEARNING_GOALS.ACADEMIC]: 'Język akademicki',
    [LEARNING_GOALS.GRAMMAR]: 'Gramatyka',
    [LEARNING_GOALS.PRONUNCIATION]: 'Wymowa'
} as const

// User Status
export const USER_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    BLOCKED: 'blocked'
} as const

export const USER_STATUS_LABELS = {
    [USER_STATUS.ACTIVE]: 'Aktywny',
    [USER_STATUS.INACTIVE]: 'Nieaktywny',
    [USER_STATUS.BLOCKED]: 'Zablokowany'
} as const

// Notification Types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
} as const

// Validation Rules
export const VALIDATION = {
    EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PASSWORD_MIN_LENGTH: 8,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    PHONE_REGEX: /^[+]?[0-9\s\-\(\)]+$/
} as const

// API Endpoints
export const API_ENDPOINTS = {
    // Auth
    LOGIN: '/auth/login',
    REGISTER: '/auth/register',
    LOGOUT: '/auth/logout',
    ME: '/auth/me',
    FORGOT_PASSWORD: '/auth/forgot-password',
    RESET_PASSWORD: '/auth/reset-password',
    VERIFY_EMAIL: '/auth/verify-email',
    RESEND_VERIFICATION: '/auth/resend-verification',
    CHANGE_PASSWORD: '/auth/change-password',

    // Students
    STUDENTS: '/students',
    STUDENT_PROFILE: '/student/profile',

    // Dashboard Stats
    ADMIN_STATS: '/admin/dashboard-stats',
    MODERATOR_STATS: '/moderator/dashboard-stats',
    TUTOR_STATS: '/tutor/dashboard-stats',
    STUDENT_STATS: '/student/dashboard-stats'
} as const

// Layout Types
export const LAYOUTS = {
    APP: 'app',
    AUTH: 'auth',
    GUEST: 'guest'
} as const

// CSS Classes
export const CSS_CLASSES = {
    LOADING: 'loading',
    FADE_IN: 'fade-in',
    FADE_OUT: 'fade-out',
    ACTIVE: 'active',
    DISABLED: 'disabled',
    HIDDEN: 'hidden',
    VISIBLE: 'visible'
} as const

// Local Storage Keys
export const STORAGE_KEYS = {
    AUTH_TOKEN: 'auth_token',
    AUTH_USER: 'auth_user',
    AUTH_PERMISSIONS: 'auth_permissions',
    APP_STATE: 'app_state',
    THEME: 'app_theme',
    LANGUAGE: 'app_language'
} as const

// HTTP Status Codes
export const HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500
} as const

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Błąd połączenia z serwerem. Sprawdź połączenie internetowe.',
    UNAUTHORIZED: 'Nie masz uprawnień do tej akcji.',
    FORBIDDEN: 'Dostęp zabroniony.',
    NOT_FOUND: 'Zasób nie został znaleziony.',
    VALIDATION_ERROR: 'Dane formularza zawierają błędy.',
    GENERIC_ERROR: 'Wystąpił nieoczekiwany błąd.'
} as const

// Success Messages
export const SUCCESS_MESSAGES = {
    LOGIN: 'Zalogowano pomyślnie!',
    LOGOUT: 'Wylogowano pomyślnie.',
    REGISTER: 'Konto zostało utworzone pomyślnie!',
    EMAIL_VERIFIED: 'Email został zweryfikowany pomyślnie!',
    PASSWORD_CHANGED: 'Hasło zostało zmienione pomyślnie.',
    PROFILE_UPDATED: 'Profil został zaktualizowany.',
    EMAIL_SENT: 'Email został wysłany.'
} as const

// Form Field Names
export const FORM_FIELDS = {
    EMAIL: 'email',
    PASSWORD: 'password',
    PASSWORD_CONFIRMATION: 'password_confirmation',
    NAME: 'name',
    PHONE: 'phone',
    CITY: 'city',
    ROLE: 'role',
    TERMS_ACCEPTED: 'terms_accepted'
} as const