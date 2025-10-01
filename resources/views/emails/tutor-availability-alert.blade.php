@extends('emails.layout.app')

@section('title', 'Alert: Lektorzy z niewystarczającą dostępnością')

@section('content')
    <div class="content-section">
        <h2 style="color: #dc3545; margin-bottom: 20px;">
            ⚠️ Alert: Niewystarczająca dostępność lektorów
        </h2>

        <p style="margin-bottom: 20px;">
            Szanowni Państwo,
        </p>

        @if($tutorCount === 0)
            <p style="margin-bottom: 20px; color: #28a745; font-weight: 600;">
                ✅ Wszyscy lektorzy mają wystarczającą dostępność (minimum 20 godzin) w miesiącu <strong>{{ $monthName }}</strong>.
            </p>
            <p style="margin-bottom: 20px;">
                Gratulacje! Nie ma żadnych problemów z dostępnością lektorów w tym miesiącu.
            </p>
        @else
            <p style="margin-bottom: 20px;">
                <strong>{{ $tutorCount }}</strong> {{ $tutorCount === 1 ? 'lektor nie ustawił' : 'lektorów nie ustawiło' }} wymaganej minimalnej dostępności <strong>20 godzin</strong> w miesiącu <strong>{{ $monthName }}</strong>.
            </p>
        @endif

        @if($tutorCount > 0)
            <div style="margin: 25px 0;">
                <h3 style="color: #495057; margin-bottom: 15px;">Lista lektorów:</h3>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #f8f9fa;">
                            <th style="border: 1px solid #dee2e6; padding: 10px; text-align: left; font-weight: 600; width: 50%;">
                                Lektor
                            </th>
                            <th style="border: 1px solid #dee2e6; padding: 10px; text-align: center; font-weight: 600; width: 25%;">
                                Godziny
                            </th>
                            <th style="border: 1px solid #dee2e6; padding: 10px; text-align: center; font-weight: 600; width: 25%;">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($tutors as $tutor)
                            <tr>
                                <td style="border: 1px solid #dee2e6; padding: 10px;">
                                    <strong>{{ $tutor['tutor']->name }}</strong><br>
                                    <small style="color: #6c757d;">{{ $tutor['tutor']->email }}</small>
                                </td>
                                <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">
                                    <span style="color: #dc3545; font-weight: 600;">
                                        {{ $tutor['hours'] }} / 20
                                    </span>
                                </td>
                                <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">
                                    @if($tutor['hours'] === 0)
                                        <span style="background-color: #dc3545; color: white; padding: 4px 6px; border-radius: 4px; font-size: 11px;">
                                            BRAK DOSTĘPNOŚCI
                                        </span>
                                    @else
                                        <span style="background-color: #fd7e14; color: white; padding: 4px 6px; border-radius: 4px; font-size: 11px;">
                                            NIEWYSTARCZAJĄCA
                                        </span>
                                    @endif
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            </div>

            <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="color: #856404; margin-top: 0; margin-bottom: 10px;">
                    📊 Podsumowanie:
                </h4>
                <ul style="color: #856404; margin: 0; padding-left: 20px;">
                    <li>Okres: <strong>{{ $monthName }}</strong></li>
                    <li>Minimalna wymagana dostępność: <strong>20 godzin</strong></li>
                    <li>Liczba lektorów poniżej limitu: <strong>{{ $tutorCount }}</strong></li>
                    <li>Data wygenerowania alertu: <strong>{{ now()->format('d.m.Y H:i') }}</strong></li>
                </ul>
            </div>

            <div style="background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 6px; padding: 15px; margin: 20px 0;">
                <h4 style="color: #0c5460; margin-top: 0; margin-bottom: 10px;">
                    💡 Zalecane działania:
                </h4>
                <ul style="color: #0c5460; margin: 0; padding-left: 20px;">
                    <li>Skontaktuj się z lektorami w celu ustalenia przyczyn niskiej dostępności</li>
                    <li>Zachęć lektorów do ustawienia większej liczby godzin dostępności</li>
                    <li>Rozważ wysłanie przypomnienia o wymaganiach dostępności</li>
                    <li>Sprawdź czy lektorzy potrzebują pomocy technicznej z systemem</li>
                </ul>
            </div>

        @endif

        <!-- Unverified Tutors Section -->
        @if($unverifiedCount > 0)
            <div style="margin-top: 40px; border-top: 2px solid #ffc107; padding-top: 25px;">
                <h2 style="color: #856404; margin-bottom: 20px;">
                    ⚠️ Lektorzy niezweryfikowani ({{ $unverifiedCount }})
                </h2>

                <p style="margin-bottom: 20px; color: #856404;">
                    Poniżej znajdują się lektorzy którzy nie zostali jeszcze zweryfikowani, dlatego nie są sprawdzani pod kątem dostępności:
                </p>

                <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
                    <thead>
                        <tr style="background-color: #fff3cd;">
                            <th style="border: 1px solid #ffeaa7; padding: 10px; text-align: left; font-weight: 600; width: 40%;">
                                Lektor
                            </th>
                            <th style="border: 1px solid #ffeaa7; padding: 10px; text-align: center; font-weight: 600; width: 20%;">
                                Godziny
                            </th>
                            <th style="border: 1px solid #ffeaa7; padding: 10px; text-align: center; font-weight: 600; width: 20%;">
                                Data utworzenia
                            </th>
                            <th style="border: 1px solid #ffeaa7; padding: 10px; text-align: center; font-weight: 600; width: 20%;">
                                Status
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($unverifiedTutors as $tutor)
                            <tr>
                                <td style="border: 1px solid #ffeaa7; padding: 10px;">
                                    <strong>{{ $tutor->name }}</strong><br>
                                    <small style="color: #856404;">{{ $tutor->email }}</small>
                                </td>
                                <td style="border: 1px solid #ffeaa7; padding: 10px; text-align: center;">
                                    <span style="color: #6c757d; font-weight: 600;">
                                        0 / 20
                                    </span>
                                </td>
                                <td style="border: 1px solid #ffeaa7; padding: 10px; text-align: center;">
                                    {{ $tutor->created_at->format('d.m.Y') }}
                                </td>
                                <td style="border: 1px solid #ffeaa7; padding: 10px; text-align: center;">
                                    <span style="background-color: #ffc107; color: #856404; padding: 4px 6px; border-radius: 4px; font-size: 11px;">
                                        NIEZWERYFIKOWANY
                                    </span>
                                </td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>

                <div style="background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 6px; padding: 15px; margin: 20px 0;">
                    <h4 style="color: #856404; margin-top: 0; margin-bottom: 10px;">
                        📋 Zalecane działania dla niezweryfikowanych:
                    </h4>
                    <ul style="color: #856404; margin: 0; padding-left: 20px;">
                        <li>Sprawdź dokumenty lektorów oczekujących na weryfikację</li>
                        <li>Skontaktuj się z lektorami w sprawie kompletności profilu</li>
                        <li>Przeprowadź proces weryfikacji zgodnie z procedurami</li>
                        <li>Po weryfikacji lektorzy będą uwzględniani w sprawdzaniu dostępności</li>
                    </ul>
                </div>
            </div>
        @endif

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            Ten alert jest generowany automatycznie 1-go dnia każdego miesiąca.<br>
            System sprawdza dostępność lektorów na podstawie logów z poprzedniego miesiąca.
        </p>
    </div>
@endsection

@section('footer')
    <p style="color: #6c757d; font-size: 12px; margin: 0;">
        System automatycznych alertów - Platforma Lektorów<br>
        Wygenerowano: {{ now()->format('d.m.Y H:i:s') }}
    </p>
@endsection