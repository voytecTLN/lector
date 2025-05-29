@extends('layouts.app')

@section('content')
<div class="container">
    <div class="d-flex justify-content-between align-items-center mb-4">
        <h2><i class="fas fa-tachometer-alt text-primary me-2"></i>Panel Administratora</h2>
        <div>
            <button class="btn btn-primary" onclick="showNotification('info', 'Panel administratora w budowie!')">
                <i class="fas fa-plus me-2"></i>Dodaj użytkownika
            </button>
        </div>
    </div>

    <!-- Quick Stats -->
    <div class="row g-4 mb-4">
        <div class="col-md-3">
            <div class="card bg-primary text-white">
                <div class="card-body text-center">
                    <i class="fas fa-users fa-2x mb-2"></i>
                    <h4>0</h4>
                    <small>Użytkownicy</small>
                </div>
            </div>
        </div>
        <!-- TODO: Add more stat cards -->
    </div>

    <!-- Management Cards -->
    <div class="row g-4">
        <div class="col-md-6">
            <div class="card">
                <div class="card-header">
                    <h5><i class="fas fa-chalkboard-teacher me-2"></i>Lektorzy</h5>
                </div>
                <div class="card-body">
                    <p>Zarządzanie profilami lektorów</p>
                    <button class="btn btn-outline-primary">Zarządzaj</button>
                </div>
            </div>
        </div>
        <!-- TODO: Add more management cards -->
    </div>
</div>
@endsection
