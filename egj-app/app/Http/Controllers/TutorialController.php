<?php

namespace App\Http\Controllers;

use App\Models\Tutorial;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class TutorialController extends Controller
{
    /**
     * Display user manual and list of tutorials.
     */
    public function index()
    {
        $tutorials = Tutorial::with('uploader')
            ->orderBy('created_at', 'desc')
            ->get();

        $manualExists = count($tutorials) > 0 
            || Storage::disk('local')->exists('manuals/user_manual.pdf')
            || file_exists(public_path('manuals/user_manual.pdf'));

        return Inertia::render('Tutorial/Index', [
            'tutorials' => $tutorials,
            'manualExists' => $manualExists,
        ]);
    }

    /**
     * Store a new tutorial PDF (Admin only).
     */
    public function store(Request $request)
    {
        if (!Auth::user()->hasRole('Admin')) {
            abort(403, 'Hanya Admin yang dapat mengunggah tutorial.');
        }

        $request->validate([
            'title' => ['required', 'string', 'max:255'],
            'description' => ['nullable', 'string', 'max:1000'],
            'file' => ['required', 'file', 'mimes:pdf', 'max:20480'], // max 20MB
        ]);

        $file = $request->file('file');
        $filePath = $file->store('tutorials', 'local');

        Tutorial::create([
            'title' => $request->title,
            'description' => $request->description,
            'file_path' => $filePath,
            'file_name' => $file->getClientOriginalName(),
            'file_size' => $file->getSize(),
            'uploaded_by' => Auth::id(),
        ]);

        return back()->with('success', 'Tutorial PDF berhasil diunggah.');
    }

    /**
     * Preview tutorial PDF inline.
     */
    public function preview(string $id)
    {
        $tutorial = Tutorial::findOrFail($id);

        if (!Storage::disk('local')->exists($tutorial->file_path)) {
            abort(404, 'File tutorial tidak ditemukan di server.');
        }

        return response(Storage::disk('local')->get($tutorial->file_path))
            ->header('Content-Type', 'application/pdf')
            ->header('Content-Disposition', 'inline; filename="' . $tutorial->file_name . '"');
    }

    /**
     * Download tutorial PDF.
     */
    public function download(?string $id = null)
    {
        if ($id) {
            $tutorial = Tutorial::findOrFail($id);
            if (!Storage::disk('local')->exists($tutorial->file_path)) {
                abort(404, 'File tutorial tidak ditemukan.');
            }
            return Storage::disk('local')->download($tutorial->file_path, $tutorial->file_name);
        }

        // Fallback: download first tutorial or static manual
        $firstTutorial = Tutorial::latest()->first();
        if ($firstTutorial && Storage::disk('local')->exists($firstTutorial->file_path)) {
            return Storage::disk('local')->download($firstTutorial->file_path, $firstTutorial->file_name);
        }

        if (file_exists(public_path('manuals/user_manual.pdf'))) {
            return response()->download(public_path('manuals/user_manual.pdf'), 'User_Manual_GJAS.pdf');
        }

        if (Storage::disk('local')->exists('manuals/user_manual.pdf')) {
            return Storage::disk('local')->download('manuals/user_manual.pdf', 'User_Manual_GJAS.pdf');
        }

        return back()->with('error', 'Belum ada file tutorial yang diunggah.');
    }

    /**
     * Delete a tutorial PDF (Admin only).
     */
    public function destroy(string $id)
    {
        if (!Auth::user()->hasRole('Admin')) {
            abort(403, 'Hanya Admin yang dapat menghapus tutorial.');
        }

        $tutorial = Tutorial::findOrFail($id);

        if (Storage::disk('local')->exists($tutorial->file_path)) {
            Storage::disk('local')->delete($tutorial->file_path);
        }

        $tutorial->delete();

        return back()->with('success', 'Tutorial berhasil dihapus.');
    }
}
