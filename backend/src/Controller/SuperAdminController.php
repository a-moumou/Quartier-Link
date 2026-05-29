<?php

namespace App\Controller;

use App\Entity\User;
use App\Enum\QuartierStatus;
use App\Enum\VerificationStatus;
use App\Repository\QuartierRepository;
use App\Repository\UserRepository;
use App\Service\GeocoderService;
use App\Service\MailerService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/super-admin')]
class SuperAdminController extends AbstractController
{
    // ─── Justificatifs ────────────────────────────────────────────────────────

    /** GET /api/super-admin/proofs — utilisateurs avec justificatif en attente */
    #[Route('/proofs', methods: ['GET'])]
    public function pendingProofs(UserRepository $userRepo): JsonResponse
    {
        $users = $userRepo->findBy(['status' => VerificationStatus::EN_ATTENTE]);

        $data = array_map(fn(User $u) => [
            'id'        => $u->getId(),
            'firstName' => $u->getFirstName(),
            'lastName'  => $u->getLastName(),
            'email'     => $u->getEmail(),
            'address'   => $u->getAddress(),
            'proofUrl'  => $u->getProofUrl(),
        ], $users);

        return $this->json($data);
    }

    /** PUT /api/super-admin/proofs/{userId}/approve — valider un justificatif */
    #[Route('/proofs/{userId}/approve', methods: ['PUT'])]
    public function approveProof(int $userId, UserRepository $userRepo, EntityManagerInterface $em, MailerService $mailer): JsonResponse
    {
        $u = $userRepo->find($userId);
        if (!$u) {
            return $this->json(['message' => 'Utilisateur non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $u->setStatus(VerificationStatus::VERIFIE);
        $em->flush();

        $mailer->sendAccountVerified($u->getEmail(), $u->getFirstName() ?? $u->getNom());

        return $this->json(['message' => 'Justificatif validé. Utilisateur vérifié.']);
    }

    /** PUT /api/super-admin/proofs/{userId}/reject — refuser un justificatif */
    #[Route('/proofs/{userId}/reject', methods: ['PUT'])]
    public function rejectProof(int $userId, UserRepository $userRepo, EntityManagerInterface $em, MailerService $mailer): JsonResponse
    {
        $u = $userRepo->find($userId);
        if (!$u) {
            return $this->json(['message' => 'Utilisateur non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $u->setStatus(VerificationStatus::NON_VERIFIE);
        $em->flush();

        $mailer->sendAccountRejected($u->getEmail(), $u->getFirstName() ?? $u->getNom());

        return $this->json(['message' => 'Justificatif refusé.']);
    }

    // ─── Quartiers ────────────────────────────────────────────────────────────

    /** GET /api/super-admin/quartiers — tous les quartiers */
    #[Route('/quartiers', methods: ['GET'])]
    public function pendingQuartiers(QuartierRepository $quartierRepo, UserRepository $userRepo): JsonResponse
    {
        $quartiers = $quartierRepo->findAll();

        $data = array_map(function ($q) use ($userRepo) {
            $creator = $userRepo->find($q->getAdminId());
            return [
                'id'          => $q->getId(),
                'name'        => $q->getName(),
                'description' => $q->getDescription(),
                'address'     => $q->getAddress(),
                'status'      => $q->getStatus()->value,
                'createdAt'   => $q->getCreatedAt()->format('c'),
                'creator'     => $creator ? [
                    'id'        => $creator->getId(),
                    'firstName' => $creator->getFirstName(),
                    'lastName'  => $creator->getLastName(),
                    'email'     => $creator->getEmail(),
                ] : null,
            ];
        }, $quartiers);

        return $this->json($data);
    }

    /** PUT /api/super-admin/quartiers/{id}/approve — valider un quartier */
    #[Route('/quartiers/{id}/approve', methods: ['PUT'])]
    public function approveQuartier(int $id, QuartierRepository $quartierRepo, UserRepository $userRepo, EntityManagerInterface $em, GeocoderService $geocoder, MailerService $mailer): JsonResponse
    {
        $q = $quartierRepo->find($id);
        if (!$q) {
            return $this->json(['message' => 'Quartier non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        if ($q->getLatitude() === null && $q->getAddress()) {
            $coords = $geocoder->geocode($q->getAddress());
            if ($coords) {
                $q->setLatitude($coords[0]);
                $q->setLongitude($coords[1]);
            }
        }

        $q->setStatus(QuartierStatus::ACTIF);

        // Promouvoir le créateur en ADMIN_QUARTIER
        $creator = $userRepo->find($q->getAdminId());
        if ($creator && $creator->getRole() === 'USER') {
            $creator->setRole('ADMIN_QUARTIER');
        }

        $em->flush();

        if ($creator) {
            $mailer->sendQuartierApproved($creator->getEmail(), $creator->getFirstName() ?? $creator->getNom(), $q->getName());
        }

        return $this->json(['message' => 'Quartier validé et activé.']);
    }

    /** PUT /api/super-admin/quartiers/{id}/reject — rejeter un quartier */
    #[Route('/quartiers/{id}/reject', methods: ['PUT'])]
    public function rejectQuartier(int $id, QuartierRepository $quartierRepo, UserRepository $userRepo, EntityManagerInterface $em, MailerService $mailer): JsonResponse
    {
        $q = $quartierRepo->find($id);
        if (!$q) {
            return $this->json(['message' => 'Quartier non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $q->setStatus(QuartierStatus::REJETE);
        $em->flush();

        $creator = $userRepo->find($q->getAdminId());
        if ($creator) {
            $mailer->sendQuartierRejected($creator->getEmail(), $creator->getFirstName() ?? $creator->getNom(), $q->getName());
        }

        return $this->json(['message' => 'Quartier rejeté.']);
    }

    // ─── Utilisateurs ─────────────────────────────────────────────────────────

    // ─── Modifications en attente de quartier ─────────────────────────────────

    /** GET /api/super-admin/quartier-updates — quartiers avec modifications en attente */
    #[Route('/quartier-updates', methods: ['GET'])]
    public function pendingQuartierUpdates(QuartierRepository $quartierRepo, UserRepository $userRepo): JsonResponse
    {
        $quartiers = $quartierRepo->findBy(['hasPendingUpdate' => true]);

        $data = array_map(function ($q) use ($userRepo) {
            $creator = $userRepo->find($q->getAdminId());
            return [
                'id'                 => $q->getId(),
                'currentName'        => $q->getName(),
                'currentDescription' => $q->getDescription(),
                'currentAddress'     => $q->getAddress(),
                'pendingName'        => $q->getPendingName(),
                'pendingDescription' => $q->getPendingDescription(),
                'pendingAddress'     => $q->getPendingAddress(),
                'admin'              => $creator ? [
                    'id'        => $creator->getId(),
                    'firstName' => $creator->getFirstName(),
                    'lastName'  => $creator->getLastName(),
                    'email'     => $creator->getEmail(),
                ] : null,
            ];
        }, $quartiers);

        return $this->json($data);
    }

    /** PUT /api/super-admin/quartier-updates/{id}/approve */
    #[Route('/quartier-updates/{id}/approve', methods: ['PUT'])]
    public function approveQuartierUpdate(int $id, QuartierRepository $quartierRepo, EntityManagerInterface $em, GeocoderService $geocoder): JsonResponse
    {
        $q = $quartierRepo->find($id);
        if (!$q) {
            return $this->json(['message' => 'Quartier non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $addressChanged = $q->getPendingAddress() !== null && $q->getPendingAddress() !== $q->getAddress();

        // Appliquer les modifications en attente
        if ($q->getPendingName() !== null)        $q->setName($q->getPendingName());
        if ($q->getPendingDescription() !== null)  $q->setDescription($q->getPendingDescription());
        if ($q->getPendingAddress() !== null)       $q->setAddress($q->getPendingAddress());

        // Re-geocode if address changed
        if ($addressChanged && $q->getAddress()) {
            $coords = $geocoder->geocode($q->getAddress());
            if ($coords) {
                $q->setLatitude($coords[0]);
                $q->setLongitude($coords[1]);
            }
        }

        // Réinitialiser les champs pending
        $q->setPendingName(null);
        $q->setPendingDescription(null);
        $q->setPendingAddress(null);
        $q->setHasPendingUpdate(false);

        $em->flush();

        return $this->json(['message' => 'Modifications approuvées et appliquées.']);
    }

    /** PUT /api/super-admin/quartier-updates/{id}/reject */
    #[Route('/quartier-updates/{id}/reject', methods: ['PUT'])]
    public function rejectQuartierUpdate(int $id, QuartierRepository $quartierRepo, EntityManagerInterface $em): JsonResponse
    {
        $q = $quartierRepo->find($id);
        if (!$q) {
            return $this->json(['message' => 'Quartier non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        // Supprimer les modifications en attente
        $q->setPendingName(null);
        $q->setPendingDescription(null);
        $q->setPendingAddress(null);
        $q->setHasPendingUpdate(false);

        $em->flush();

        return $this->json(['message' => 'Modifications refusées.']);
    }

    /** GET /api/super-admin/users — tous les utilisateurs */
    #[Route('/users', methods: ['GET'])]
    public function users(
        UserRepository $userRepo,
        \App\Repository\MembershipRepository $membershipRepo,
        QuartierRepository $quartierRepo
    ): JsonResponse {
        $users = $userRepo->findAll();

        $data = array_map(function (User $u) use ($membershipRepo, $quartierRepo) {
            $memberships = $membershipRepo->findBy(['userId' => $u->getId()]);
            $quartiers   = array_filter(array_map(
                fn($m) => $quartierRepo->find($m->getQuartierId()),
                $memberships
            ));
            $quartierList = array_map(fn($q) => [
                'id'   => $q->getId(),
                'name' => $q->getName(),
            ], array_values($quartiers));

            return [
                'id'        => $u->getId(),
                'firstName' => $u->getFirstName(),
                'lastName'  => $u->getLastName(),
                'email'     => $u->getEmail(),
                'role'      => $u->getRole(),
                'status'    => $u->getStatus()->value,
                'address'   => $u->getAddress(),
                'quartiers' => $quartierList,
            ];
        }, $users);

        return $this->json($data);
    }
}
