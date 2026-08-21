<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Redirect to monitoring page.
     */
    public function index()
    {
        return redirect()->route('monitoring.index');
    }
}
