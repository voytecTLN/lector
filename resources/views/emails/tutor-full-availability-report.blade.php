@extends('emails.layout.app')

@section('title', 'Raport dostępności wszystkich lektorów')

@section('content')
    <div class="content-section">
        <h2 style="color: #0d6efd; margin-bottom: 20px;">
            📊 Raport dostępności wszystkich lektorów
        </h2>

        <p style="margin-bottom: 20px;">
            Szanowni Państwo,
        </p>

        <p style="margin-bottom: 20px;">
            Poniżej znajduje się kompletny raport dostępności wszystkich <strong>{{ $tutorCount }}</strong> zweryfikowanych lektorów w miesiącu <strong>{{ $monthName }}</strong>.
        </p>

        <!-- Summary Stats -->
        <div style="background-color: #e7f3ff; border: 1px solid #b3d9ff; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #0d6efd; margin-top: 0; margin-bottom: 10px;">
                📈 Podsumowanie statystyk:
            </h4>
            <ul style="color: #0d6efd; margin: 0; padding-left: 20px;">
                <li>Całkowita liczba lektorów: <strong>{{ $tutorCount }}</strong></li>
                <li>Lektorzy poniżej 20h: <strong>{{ $lowAvailabilityCount }}</strong></li>
                <li>Lektorzy z wystarczającą dostępnością: <strong>{{ $tutorCount - $lowAvailabilityCount }}</strong></li>
                <li>Łączna suma godzin: <strong>{{ $totalHours }}</strong></li>
                <li>Średnia godzin na lektora: <strong>{{ $tutorCount > 0 ? round($totalHours / $tutorCount, 1) : 0 }}</strong></li>
            </ul>
        </div>

        <!-- Full Tutors Table -->
        <div style="margin: 25px 0;">
            <h3 style="color: #495057; margin-bottom: 15px;">Wszyscy lektorzy:</h3>

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
                    @foreach($tutorReports as $report)
                        <tr style="{{ $report['hours'] < 20 ? 'background-color: #fff5f5;' : '' }}">
                            <td style="border: 1px solid #dee2e6; padding: 10px;">
                                <strong>{{ $report['tutor']->name }}</strong><br>
                                <small style="color: #6c757d;">{{ $report['tutor']->email }}</small>
                            </td>
                            <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">
                                <span style="font-weight: 600; color: {{ $report['hours'] < 20 ? '#dc3545' : ($report['hours'] >= 30 ? '#28a745' : '#0d6efd') }};">
                                    {{ $report['hours'] }} / 20
                                </span>
                            </td>
                            <td style="border: 1px solid #dee2e6; padding: 10px; text-align: center;">
                                @if($report['hours'] === 0)
                                    <span style="background-color: #dc3545; color: white; padding: 4px 6px; border-radius: 4px; font-size: 11px;">
                                        BRAK
                                    </span>
                                @elseif($report['hours'] < 20)
                                    <span style="background-color: #fd7e14; color: white; padding: 4px 6px; border-radius: 4px; font-size: 11px;">
                                        NIEWYSTARCZAJĄCA
                                    </span>
                                @elseif($report['hours'] >= 30)
                                    <span style="background-color: #28a745; color: white; padding: 4px 6px; border-radius: 4px; font-size: 11px;">
                                        WYSOKA
                                    </span>
                                @else
                                    <span style="background-color: #0d6efd; color: white; padding: 4px 6px; border-radius: 4px; font-size: 11px;">
                                        WYSTARCZAJĄCA
                                    </span>
                                @endif
                            </td>
                        </tr>
                    @endforeach
                </tbody>
            </table>
        </div>

        <!-- Legend -->
        <div style="background-color: #f8f9fa; border: 1px solid #dee2e6; border-radius: 6px; padding: 15px; margin: 20px 0;">
            <h4 style="color: #495057; margin-top: 0; margin-bottom: 10px;">
                🏷️ Legenda statusów:
            </h4>
            <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                <span style="background-color: #dc3545; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    BRAK (0h)
                </span>
                <span style="background-color: #fd7e14; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    NIEWYSTARCZAJĄCA (1-19h)
                </span>
                <span style="background-color: #0d6efd; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    WYSTARCZAJĄCA (20-29h)
                </span>
                <span style="background-color: #28a745; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px;">
                    WYSOKA (30h+)
                </span>
            </div>
        </div>

        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #dee2e6; color: #6c757d; font-size: 14px;">
            Ten raport został wygenerowany ręcznie przez administratora.<br>
            Dane obejmują wszystkich zweryfikowanych lektorów z dokładnym obliczeniem godzin (dodane minus usunięte).
        </p>
    </div>
@endsection

@section('footer')
    <p style="color: #6c757d; font-size: 12px; margin: 0;">
        Raport dostępności lektorów - Platforma Lektorów<br>
        Wygenerowano: {{ now()->format('d.m.Y H:i:s') }}
    </p>
@endsection