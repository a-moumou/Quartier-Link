<?php

namespace App\Controller;

use App\Entity\User;
use App\Repository\UserRepository;
use App\Service\MailerService;
use Doctrine\ORM\EntityManagerInterface;
use Lexik\Bundle\JWTAuthenticationBundle\Services\JWTTokenManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/auth')]
class AuthController extends AbstractController
{
    #[Route('/register', methods: ['POST'])]
    public function register(
        Request $request,
        UserPasswordHasherInterface $hasher,
        EntityManagerInterface $em,
        UserRepository $userRepo,
        MailerService $mailer
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);
        if (!is_array($data)) {
            return $this->json(['message' => 'Corps JSON invalide.'], Response::HTTP_BAD_REQUEST);
        }

        $firstName = $data['firstName'] ?? $data['firstname'] ?? null;
        $lastName = $data['lastName'] ?? $data['lastname'] ?? null;

        foreach (['email', 'password'] as $field) {
            if (empty($data[$field])) {
                return $this->json(['message' => "Le champ '$field' est requis."], Response::HTTP_BAD_REQUEST);
            }
        }
        if ($firstName === null || $firstName === '' || $lastName === null || $lastName === '') {
            return $this->json(['message' => 'Les champs firstName et lastName sont requis.'], Response::HTTP_BAD_REQUEST);
        }

        if ($userRepo->findOneBy(['email' => $data['email']])) {
            return $this->json(['message' => 'Cet email est déjà utilisé.'], Response::HTTP_CONFLICT);
        }

        if (strlen($data['password']) < 8) {
            return $this->json(['message' => 'Le mot de passe doit contenir au moins 8 caractères.'], Response::HTTP_BAD_REQUEST);
        }

        $user = new User();
        $user->setFirstName(trim((string) $firstName));
        $user->setLastName(trim((string) $lastName));
        $user->setEmail($data['email']);
        $user->setPassword($hasher->hashPassword($user, $data['password']));
        $user->setRole('USER');
        if (!empty($data['address'] ?? $data['adresse'] ?? null)) {
            $user->setAddress(trim($data['address'] ?? $data['adresse']));
        }

        $em->persist($user);
        $em->flush();

        $mailer->sendWelcome($user->getEmail(), $user->getFirstName() ?? $user->getNom());

        return $this->json(['message' => 'Compte créé avec succès.'], Response::HTTP_CREATED);
    }

    #[Route('/forgot-password', methods: ['POST'])]
    public function forgotPassword(
        Request $request,
        UserRepository $userRepo,
        EntityManagerInterface $em,
        MailerService $mailer
    ): JsonResponse {
        $data  = json_decode($request->getContent(), true);
        $email = trim($data['email'] ?? '');

        // Toujours répondre OK pour ne pas révéler si l'email existe
        $user = $userRepo->findOneBy(['email' => $email]);
        if ($user) {
            $code = str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT);
            $user->setResetToken($code);
            $user->setResetTokenExpiresAt(new \DateTime('+15 minutes'));
            $em->flush();

            $mailer->sendPasswordReset($user->getEmail(), $user->getFirstName() ?? $user->getNom(), $code);
        }

        return $this->json(['message' => 'Si cet email existe, un code a été envoyé.']);
    }

    #[Route('/reset-password', methods: ['POST'])]
    public function resetPassword(
        Request $request,
        UserRepository $userRepo,
        UserPasswordHasherInterface $hasher,
        EntityManagerInterface $em
    ): JsonResponse {
        $data     = json_decode($request->getContent(), true);
        $email    = trim($data['email'] ?? '');
        $code     = trim($data['code'] ?? '');
        $password = $data['password'] ?? '';

        $user = $userRepo->findOneBy(['email' => $email, 'resetToken' => $code]);

        if (!$user || !$user->getResetTokenExpiresAt() || $user->getResetTokenExpiresAt() < new \DateTime()) {
            return $this->json(['message' => 'Code invalide ou expiré.'], Response::HTTP_BAD_REQUEST);
        }

        if (strlen($password) < 8) {
            return $this->json(['message' => 'Le mot de passe doit contenir au moins 8 caractères.'], Response::HTTP_BAD_REQUEST);
        }

        $user->setPassword($hasher->hashPassword($user, $password));
        $user->setResetToken(null);
        $user->setResetTokenExpiresAt(null);
        $em->flush();

        return $this->json(['message' => 'Mot de passe réinitialisé avec succès.']);
    }

    #[Route('/login', methods: ['POST'])]
    public function login(
        Request $request,
        UserRepository $userRepo,
        UserPasswordHasherInterface $hasher,
        JWTTokenManagerInterface $jwtManager
    ): JsonResponse {
        $data = json_decode($request->getContent(), true);

        $user = $userRepo->findOneBy(['email' => $data['email'] ?? '']);

        if (!$user || !$hasher->isPasswordValid($user, $data['password'] ?? '')) {
            return $this->json(['message' => 'Email ou mot de passe incorrect.'], Response::HTTP_UNAUTHORIZED);
        }

        $token = $jwtManager->create($user);

        return $this->json([
            'token' => $token,
            'user'  => [
                'id'                 => $user->getId(),
                'firstName'          => $user->getFirstName(),
                'lastName'           => $user->getLastName(),
                'nom'                => $user->getNom(),
                'email'              => $user->getEmail(),
                'roles'              => $user->getRoles(),
                'statutVerification' => $user->getStatus()->value,
            ],
        ]);
    }
}
