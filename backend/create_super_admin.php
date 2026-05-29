#!/usr/bin/env php
<?php

require_once __DIR__ . '/vendor/autoload.php';

use App\Entity\User;
use App\Enum\VerificationStatus;
use App\Kernel;
use Symfony\Component\Dotenv\Dotenv;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;

(new Dotenv())->bootEnv(__DIR__ . '/.env');

$kernel = new Kernel($_SERVER['APP_ENV'] ?? 'dev', (bool) ($_SERVER['APP_DEBUG'] ?? true));
$kernel->boot();

$container = $kernel->getContainer();
$em        = $container->get('doctrine.orm.entity_manager');
/** @var UserPasswordHasherInterface $hasher */
$hasher = $container->get('app.cli_password_hasher');

echo "\n=== Créer un compte SUPER-ADMIN (ADMIN_GENERAL) ===\n\n";

echo "Prénom : ";
$firstName = trim(fgets(STDIN));

echo "Nom    : ";
$lastName = trim(fgets(STDIN));

echo "Email  : ";
$email = trim(fgets(STDIN));

echo "Mot de passe (min 8 caractères) : ";
if (PHP_OS_FAMILY !== 'Windows') {
    system('stty -echo');
}
$password = trim(fgets(STDIN));
if (PHP_OS_FAMILY !== 'Windows') {
    system('stty echo');
}
echo "\n";

if (empty($firstName) || empty($lastName) || empty($email) || empty($password)) {
    echo "❌ Tous les champs sont obligatoires.\n";
    exit(1);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "❌ Email invalide.\n";
    exit(1);
}

if (strlen($password) < 8) {
    echo "❌ Le mot de passe doit contenir au moins 8 caractères.\n";
    exit(1);
}

$existing = $em->getRepository(User::class)->findOneBy(['email' => $email]);
if ($existing) {
    echo "⚠️  Un compte avec cet email existe déjà (rôle actuel : {$existing->getRole()}).\n";
    echo "Voulez-vous le promouvoir en SUPER-ADMIN ? (o/n) : ";
    $choice = strtolower(trim(fgets(STDIN)));
    if ($choice === 'o') {
        $existing->setRole('ADMIN_GENERAL');
        $existing->setStatutVerification(VerificationStatus::VERIFIE);
        $em->flush();
        echo "✅ Compte promu SUPER-ADMIN avec succès.\n";
        echo "   Email : {$email}\n";
        echo "   Rôle  : ADMIN_GENERAL (ROLE_ADMIN_GENERAL + ROLE_ADMIN_QUARTIER + ROLE_USER)\n\n";
    } else {
        echo "⏭  Aucune modification effectuée.\n\n";
    }
    exit(0);
}

$user = new User();
$user->setFirstName($firstName);
$user->setLastName($lastName);
$user->setEmail($email);
$user->setPassword($hasher->hashPassword($user, $password));
$user->setRole('ADMIN_GENERAL');
$user->setStatutVerification(VerificationStatus::VERIFIE);

$em->persist($user);
$em->flush();

echo "✅ Compte SUPER-ADMIN créé avec succès !\n";
echo '   Nom   : ' . $user->getNom() . "\n";
echo "   Email : {$email}\n";
echo "   Rôle  : ADMIN_GENERAL (ROLE_ADMIN_GENERAL + ROLE_ADMIN_QUARTIER + ROLE_USER)\n\n";
