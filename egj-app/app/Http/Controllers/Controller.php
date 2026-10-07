<?php

namespace App\Http\Controllers;

use Illuminate\Support\Str;
use Symfony\Component\HttpFoundation\HeaderUtils;

abstract class Controller
{
    /**
     * Serve file contents with a safely encoded Content-Disposition header.
     * File names come from user uploads / document numbers, so quotes, slashes or
     * non-ASCII characters must never be written into the header raw.
     */
    protected function fileResponse(string $content, string $mimeType, string $fileName, bool $download = false)
    {
        $fileName = str_replace(['/', '\\'], '_', $fileName);
        $fallback = str_replace(['"', '%'], '_', Str::ascii($fileName));

        return response($content, 200, [
            'Content-Type' => $mimeType,
            'Content-Disposition' => HeaderUtils::makeDisposition(
                $download ? HeaderUtils::DISPOSITION_ATTACHMENT : HeaderUtils::DISPOSITION_INLINE,
                $fileName,
                $fallback !== '' ? $fallback : 'file'
            ),
            'X-Content-Type-Options' => 'nosniff',
        ]);
    }
}
