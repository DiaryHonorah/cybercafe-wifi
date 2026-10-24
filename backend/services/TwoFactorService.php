<?php
/**
 * Service 2FA TOTP (compatible Google Authenticator, Authy, FreeOTP)
 * Implémentation RFC 6238
 */

class TwoFactorService {

    private $charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

    /**
     * Générer un secret TOTP
     */
    public function genererSecret($longueur = 32) {
        $secret = '';
        for ($i = 0; $i < $longueur; $i++) {
            $secret .= $this->charset[random_int(0, 31)];
        }
        return $secret;
    }

    /**
     * Générer l'URL otpauth:// pour QR Code
     */
    public function genererURL($secret, $email, $issuer = 'Cyber Famille') {
        $label = urlencode($issuer . ':' . $email);
        $issuerEnc = urlencode($issuer);
        return "otpauth://totp/{$label}?secret={$secret}&issuer={$issuerEnc}&algorithm=SHA1&digits=6&period=30";
    }

    /**
     * Vérifier un code TOTP
     */
    public function verifierCode($secret, $code, $fenetre = 1) {
        $code = str_pad($code, 6, '0', STR_PAD_LEFT);
        $timeSlice = floor(time() / 30);

        for ($i = -$fenetre; $i <= $fenetre; $i++) {
            if ($this->calculerCode($secret, $timeSlice + $i) === $code) {
                return true;
            }
        }
        return false;
    }

    /**
     * Calculer le code TOTP
     */
    private function calculerCode($secret, $timeSlice) {
        $secretKey = $this->base32Decode($secret);

        // Pack time en 64-bit big-endian
        $time = pack('N*', 0) . pack('N*', $timeSlice);

        // HMAC-SHA1
        $hmac = hash_hmac('sha1', $time, $secretKey, true);

        // Dynamic truncation
        $offset = ord(substr($hmac, -1)) & 0x0F;
        $hashPart = substr($hmac, $offset, 4);

        $value = unpack('N', $hashPart)[1];
        $value = $value & 0x7FFFFFFF;

        $code = $value % 1000000;

        return str_pad($code, 6, '0', STR_PAD_LEFT);
    }

    /**
     * Décoder base32
     */
    private function base32Decode($secret) {
        $secret = strtoupper($secret);
        $binary = '';

        foreach (str_split($secret) as $char) {
            $pos = strpos($this->charset, $char);
            if ($pos === false) continue;
            $binary .= str_pad(decbin($pos), 5, '0', STR_PAD_LEFT);
        }

        $result = '';
        foreach (str_split($binary, 8) as $byte) {
            if (strlen($byte) === 8) {
                $result .= chr(bindec($byte));
            }
        }

        return $result;
    }

    /**
     * Générer des codes de secours (backup codes)
     */
    public function genererBackupCodes($nombre = 8) {
        $codes = [];
        for ($i = 0; $i < $nombre; $i++) {
            $codes[] = strtoupper(bin2hex(random_bytes(4)));
        }
        return $codes;
    }

    /**
     * Vérifier un backup code
     */
    public function verifierBackupCode($codesStockes, $code) {
        $codes = json_decode($codesStockes, true) ?: [];
        $code = strtoupper(trim($code));
        $index = array_search($code, $codes);
        if ($index === false) return false;

        // Supprimer le code utilisé
        unset($codes[$index]);
        return ['valide' => true, 'codes_restants' => json_encode(array_values($codes))];
    }
}