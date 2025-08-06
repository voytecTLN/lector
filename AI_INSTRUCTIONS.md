# AI Instructions - Laravel + TypeScript SPA Project

## CORE PRINCIPLES

### Architecture
- Laravel Backend (RESTful API) + TypeScript Frontend (SPA)
- Laravel Sanctum session-based auth
- Service layer pattern (mandatory)
- Event-driven communication

### Project Structure
```
app/Services/           # Business logic (mandatory)
resources/ts/
├── components/
│   ├── dashboard/     # Only composition, no business logic
│   └── forms/         # Separate component for each form
├── services/          # All API communication
└── utils/            # Helpers (date, navigation)
## CRITICAL RULES

### Service Layer (MANDATORY)
```typescript
// NEVER: Direct API calls in components
const response = await fetch('/api/users'); // WRONG

// ALWAYS: Use services
const users = await UserService.getAllUsers(); // CORRECT
```

### Dashboard Pattern
```typescript
// Dashboards = composition only, NO business logic
class TutorDashboard implements RouteComponent {
    private loadCalendarContent(): void {
        const tutorLessons = new TutorLessons()
        contentDiv.innerHTML = tutorLessons.getCalendarContent()
    }
}
```

### Form Components
```typescript
// Each form = separate component
// components/forms/TutorProfileEdit.ts
// components/forms/StudentForm.ts
```

## NOTIFICATIONS
```typescript
document.dispatchEvent(new CustomEvent('notification:show', {
    detail: { type: 'success', message: 'Done', duration: 3000 }
}));
```

## ROUTING
```typescript
// ALWAYS: Use await with navigate.to() (returns Promise<boolean>)
await navigate.to('/path')

// NEVER: Missing await
navigate.to('/path') // WRONG

// NEVER: Direct window manipulation
window.location.href = '/path' // WRONG
```

## NAMING
- Files: PascalCase (UserService.ts)
- CSS: kebab-case or BEM
- API: kebab-case (/api/tutor/dashboard-stats)

## TECHNICAL DEBT
Fix these issues ONLY in files you're working on:
1. API calls in components -> move to services
2. Inline forms -> extract to components
3. Mixed concerns in dashboards -> separate business logic
4. Missing interfaces -> add TypeScript types
5. Duplicated code fragments -> use utilities and base classes

## CODE DUPLICATION PATTERNS
Common duplications to refactor with utilities:
```typescript
// Form validation - USE: FormValidationHandler
// Notifications - USE: NotificationService  
// Pagination - USE: PaginationRenderer
// Password validation - USE: PasswordValidator
// Status badges - USE: BadgeRenderer
// Loading states - USE: LoadingStateManager
```

## KEY FILES
- routes/api.php - all API endpoints
- resources/ts/services/ - API communication
- resources/ts/components/dashboard/ - main dashboards
- app/Services/ - backend business logic

## DASHBOARD STRUCTURE
```
/admin/dashboard?section=dashboard    # AdminDashboard.ts
/tutor/dashboard?section=calendar     # TutorLessons.ts calendar
/tutor/dashboard?section=availability # HourlyAvailabilityCalendar.ts
```

## DEBUG
- Frontend: browser console
- Backend: storage/logs/laravel.log  
- Permissions: chmod -R 775 storage/