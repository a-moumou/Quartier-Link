<?php

namespace App\Service;

/**
 * Chiffrement symétrique AES-256-GCM pour les messages privés.
 *
 * Format stocké en BDD : base64(IV[12] + TAG[16] + CIPHERTEXT)
 * La clé provient de MESSAGES_ENCRYPTION_KEY (32 octets en hexadécimal).
 */
class CryptoService
{
    private string $key;

    public function __construct(string $messagesEncryptionKey)
    {
        $this->key = hex2bin($messagesEncryptionKey);
    }

    public function encrypt(string $plaintext): string
    {
        $iv  = random_bytes(12);
        $tag = '';
        $ciphertext = openssl_encrypt($plaintext, 'aes-256-gcm', $this->key, OPENSSL_RAW_DATA, $iv, $tag, '', 16);

        if ($ciphertext === false) {
            throw new \RuntimeException('Échec du chiffrement.');
        }

        return base64_encode($iv . $tag . $ciphertext);
    }

    public function decrypt(string $stored): string
    {
        $raw        = base64_decode($stored, true);
        if ($raw === false || strlen($raw) < 28) {
            // Données corrompues ou ancienne valeur non chiffrée — retourner tel quel
            return $stored;
        }

        $iv         = substr($raw, 0, 12);
        $tag        = substr($raw, 12, 16);
        $ciphertext = substr($raw, 28);

        $plaintext = openssl_decrypt($ciphertext, 'aes-256-gcm', $this->key, OPENSSL_RAW_DATA, $iv, $tag);

        // Si le déchiffrement échoue (message ancien non chiffré), retourner brut
        return $plaintext !== false ? $plaintext : $stored;
    }
}
