<?php

namespace App\Logging;

use Monolog\Handler\DeduplicationHandler;
use Monolog\Handler\RotatingFileHandler;
use Monolog\Level;
use Monolog\Logger;

class DedupLoggerFactory
{
    public function __invoke(array $config): Logger
    {
        $inner = new RotatingFileHandler($config['path'], $config['days']);
        $dedup = new DeduplicationHandler(
            $inner,
            $config['dedup_store'],
            Level::Error,
            60
        );

        return new Logger('dedup', [$dedup]);
    }
}
