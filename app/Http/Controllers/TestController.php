<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class TestController extends Controller
{
    public function checkAuth(Request $request)
    {
        $data = [
            'web_check' => Auth::guard('web')->check(),
            'web_id' => Auth::guard('web')->id(),
            'sanctum_check' => Auth::guard('sanctum')->check(),
            'sanctum_id' => Auth::guard('sanctum')->id(),
            'default_check' => Auth::check(),
            'default_id' => Auth::id(),
            'session_id' => session()->getId(),
            'session_data' => session()->all(),
            'cookies' => $request->cookies->all(),
            'headers' => [
                'X-Requested-With' => $request->header('X-Requested-With'),
                'Authorization' => $request->header('Authorization'),
            ],
            'is_ajax' => $request->ajax(),
            'is_json' => $request->wantsJson(),
        ];
        
        return response()->json($data);
    }
}