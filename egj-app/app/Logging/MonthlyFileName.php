<?php

namespace App\Logging;

use Illuminate\Log\Logger;
use Monolog\Handler\RotatingFileHandler;

/**
 * Tap untuk channel "daily": ubah rotasi file log dari per-hari menjadi per-bulan
 * (laravel-2026-11.log, bukan laravel-2026-11-11.log).
 */
class MonthlyFileName
{
    public function __invoke(Logger $logger): void
    {
        foreach ($logger->getHandlers() as $handler) {
            if ($handler instanceof RotatingFileHandler) {
                $handler->setFilenameFormat('{filename}-{date}', RotatingFileHandler::FILE_PER_MONTH);
            }
        }
    }
}
