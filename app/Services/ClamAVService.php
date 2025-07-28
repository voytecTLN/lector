<?php

namespace App\Services;

use Exception;
use Illuminate\Support\Facades\Log;

class ClamAVService
{
    private string $socketPath;
    private bool $enabled;
    private int $timeout;

    public function __construct()
    {
        $this->socketPath = config('clamav.socket_path', '/var/run/clamav/clamd.ctl');
        $this->enabled = config('clamav.enabled', false);
        $this->timeout = config('clamav.timeout', 30);
    }

    /**
     * Scan a file for viruses
     * 
     * @param string $filePath
     * @return array ['clean' => bool, 'message' => string]
     */
    public function scanFile(string $filePath): array
    {
        if (!$this->enabled) {
            return ['clean' => true, 'message' => 'Antivirus scanning disabled'];
        }

        if (!file_exists($filePath)) {
            return ['clean' => false, 'message' => 'File not found'];
        }

        try {
            $socket = @fsockopen('unix://' . $this->socketPath, 0, $errno, $errstr, $this->timeout);
            
            if (!$socket) {
                Log::warning('ClamAV socket connection failed', ['error' => $errstr]);
                return ['clean' => true, 'message' => 'Antivirus unavailable, allowing upload'];
            }

            // Send SCAN command
            fwrite($socket, "SCAN " . $filePath . "\n");
            
            $response = fgets($socket);
            fclose($socket);

            // Parse response
            if (strpos($response, 'OK') !== false) {
                return ['clean' => true, 'message' => 'File is clean'];
            } elseif (strpos($response, 'FOUND') !== false) {
                // Extract virus name
                preg_match('/(.+): (.+) FOUND/', $response, $matches);
                $virusName = $matches[2] ?? 'Unknown threat';
                
                Log::warning('Virus detected in file', [
                    'file' => $filePath,
                    'virus' => $virusName
                ]);
                
                return ['clean' => false, 'message' => 'Threat detected: ' . $virusName];
            }

            return ['clean' => false, 'message' => 'Unknown scan result'];
            
        } catch (Exception $e) {
            Log::error('ClamAV scan error', ['error' => $e->getMessage()]);
            
            // In production, you might want to fail safe (allow) or fail secure (deny)
            // This depends on your security requirements
            return ['clean' => true, 'message' => 'Scan error, allowing upload'];
        }
    }

    /**
     * Alternative scan method using command line
     */
    public function scanFileViaCli(string $filePath): array
    {
        if (!$this->enabled) {
            return ['clean' => true, 'message' => 'Antivirus scanning disabled'];
        }

        $command = escapeshellcmd("clamdscan --no-summary " . escapeshellarg($filePath));
        $output = [];
        $returnCode = 0;
        
        exec($command, $output, $returnCode);
        
        // Return codes: 0 = clean, 1 = virus found, 2 = error
        switch ($returnCode) {
            case 0:
                return ['clean' => true, 'message' => 'File is clean'];
            case 1:
                $message = implode(' ', $output);
                preg_match('/(.+): (.+) FOUND/', $message, $matches);
                $virusName = $matches[2] ?? 'Unknown threat';
                return ['clean' => false, 'message' => 'Threat detected: ' . $virusName];
            default:
                Log::warning('ClamAV CLI scan error', ['output' => $output]);
                return ['clean' => true, 'message' => 'Scan error, allowing upload'];
        }
    }
}