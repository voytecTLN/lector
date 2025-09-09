@component('mail::message')
# Nowe zgłoszenie od użytkownika

**Od:** {{ $user->name }} ({{ $user->email }})  
**Rola:** {{ ucfirst($user->role) }}  
**Typ zgłoszenia:** {{ $issueType === 'technical' ? 'Techniczne' : 'Biznesowe' }}  
**Priorytet:** {{ match($priority) { 'high' => '🔴 Wysoki', 'medium' => '🟡 Średni', default => '🟢 Niski' } }}  

---

## {{ $issueSubject }}

{{ $description }}

---

### Informacje techniczne

@if(!empty($issueMetadata['url']))
**Strona:** {{ $issueMetadata['url'] }}
@endif

@if(!empty($issueMetadata['user_agent']))
**Przeglądarka:** {{ $issueMetadata['user_agent'] }}
@endif

@if(!empty($issueMetadata['timestamp']))
**Czas zgłoszenia:** {{ $issueMetadata['timestamp'] }}
@endif

**User ID:** {{ $user->id }}  
**Data utworzenia konta:** {{ $user->created_at->format('Y-m-d H:i') }}  

@if($user->role === 'tutor' && $user->tutor_profile)
**Profil tutora:** Aktywny ({{ $user->tutor_profile->specializations ? implode(', ', $user->tutor_profile->specializations) : 'Brak specjalizacji' }})
@endif

@if($user->role === 'student' && $user->student_profile)
**Profil studenta:** Aktywny
@endif

---

@component('mail::button', ['url' => config('app.url') . '/admin/dashboard?section=users&user_id=' . $user->id])
Zobacz profil użytkownika
@endcomponent

*To zgłoszenie zostało wysłane automatycznie z Platformy Lektorów.*

**Odpowiedz na tego emaila, aby skontaktować się bezpośrednio z użytkownikiem.**

Zespół Platformy Lektorów
@endcomponent