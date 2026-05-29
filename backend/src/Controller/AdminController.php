<?php

namespace App\Controller;

use App\Entity\User;
use App\Enum\JoinStatus;
use App\Enum\QuartierStatus;
use App\Enum\VerificationStatus;
use App\Entity\Membership;
use App\Repository\JoinRequestRepository;
use App\Repository\MembershipRepository;
use App\Repository\QuartierRepository;
use App\Repository\UserRepository;
use App\Service\MailerService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/admin')]
class AdminController extends AbstractController
{
    /** Retourne le quartier administré par l'utilisateur courant (créateur OU co-admin), ou null */
    private function getAdminQuartier(User $user, QuartierRepository $repo, MembershipRepository $memberRepo): ?object
    {
        // Créateur du quartier
        $quartier = $repo->findOneBy(['adminId' => $user->getId()]);
        if ($quartier) return $quartier;

        // Co-admin via membership
        $adminMemberships = $memberRepo->findBy(['userId' => $user->getId(), 'role' => 'ADMIN']);
        foreach ($adminMemberships as $m) {
            $q = $repo->find($m->getQuartierId());
            if ($q) return $q;
        }

        return null;
    }

    /** GET /api/admin/quartier — infos du quartier administré */
    #[Route('/quartier', methods: ['GET'])]
    public function myQuartier(
        QuartierRepository $quartierRepo,
        MembershipRepository $memberRepo
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $quartier = $this->getAdminQuartier($user, $quartierRepo, $memberRepo);

        if (!$quartier) {
            return $this->json(['message' => 'Aucun quartier administré.'], Response::HTTP_NOT_FOUND);
        }

        return $this->json([
            'id'                 => $quartier->getId(),
            'name'               => $quartier->getName(),
            'nom'                => $quartier->getName(),
            'description'        => $quartier->getDescription(),
            'address'            => $quartier->getAddress(),
            'adresse'            => $quartier->getAddress(),
            'status'             => $quartier->getStatus()->value,
            'createdAt'          => $quartier->getCreatedAt()->format('c'),
            'bannerUrl'          => $quartier->getBannerUrl(),
            'hasPendingUpdate'   => $quartier->hasPendingUpdate(),
            'pendingName'        => $quartier->getPendingName(),
            'pendingDescription' => $quartier->getPendingDescription(),
            'pendingAddress'     => $quartier->getPendingAddress(),
        ]);
    }

    /** PUT /api/admin/quartier — modifier les infos du quartier administré */
    #[Route('/quartier', methods: ['PUT'])]
    public function updateQuartier(
        Request $request,
        QuartierRepository $quartierRepo,
        MembershipRepository $memberRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $quartier = $this->getAdminQuartier($user, $quartierRepo, $memberRepo);

        if (!$quartier) {
            return $this->json(['message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $data = json_decode($request->getContent(), true) ?? [];

        // Stocker les modifications en attente sans écraser les données actuelles
        $quartier->setPendingName(!empty($data['name']) ? trim($data['name']) : $quartier->getName());
        $quartier->setPendingDescription(array_key_exists('description', $data) ? (trim($data['description'] ?? '') ?: null) : $quartier->getDescription());
        $quartier->setPendingAddress(array_key_exists('address', $data) ? (trim($data['address'] ?? '') ?: null) : $quartier->getAddress());
        $quartier->setHasPendingUpdate(true);

        $em->flush();

        return $this->json([
            'id'                 => $quartier->getId(),
            'name'               => $quartier->getName(),
            'nom'                => $quartier->getName(),
            'description'        => $quartier->getDescription(),
            'address'            => $quartier->getAddress(),
            'adresse'            => $quartier->getAddress(),
            'status'             => $quartier->getStatus()->value,
            'createdAt'          => $quartier->getCreatedAt()->format('c'),
            'bannerUrl'          => $quartier->getBannerUrl(),
            'hasPendingUpdate'   => $quartier->hasPendingUpdate(),
            'pendingName'        => $quartier->getPendingName(),
            'pendingDescription' => $quartier->getPendingDescription(),
            'pendingAddress'     => $quartier->getPendingAddress(),
        ]);
    }

    /** POST /api/admin/banner — upload/remplace la bannière du quartier administré */
    #[Route('/banner', methods: ['POST'])]
    public function uploadBanner(
        Request $request,
        QuartierRepository $quartierRepo,
        MembershipRepository $memberRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $quartier = $this->getAdminQuartier($user, $quartierRepo, $memberRepo);

        if (!$quartier) {
            return $this->json(['message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $file = $request->files->get('banner');
        if (!$file) {
            return $this->json(['message' => 'Aucun fichier fourni.'], Response::HTTP_BAD_REQUEST);
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return $this->json(['message' => 'Format non supporté. JPG, PNG ou WebP requis.'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        if ($file->getSize() > 8 * 1024 * 1024) {
            return $this->json(['message' => 'Fichier trop volumineux (max 8 Mo).'], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $uploadDir = dirname(__DIR__, 2) . '/public/uploads/banners';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filename = 'banner_' . $quartier->getId() . '_' . uniqid() . '.' . $file->guessExtension();
        $file->move($uploadDir, $filename);

        $quartier->setBannerUrl('/uploads/banners/' . $filename);
        $em->flush();

        return $this->json(['bannerUrl' => $quartier->getBannerUrl()]);
    }

    /** GET /api/admin/join-requests — demandes d'adhésion en attente */
    #[Route('/join-requests', methods: ['GET'])]
    public function joinRequests(
        QuartierRepository $quartierRepo,
        MembershipRepository $memberRepo,
        JoinRequestRepository $joinRepo,
        UserRepository $userRepo
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $quartier = $this->getAdminQuartier($user, $quartierRepo, $memberRepo);

        if (!$quartier) {
            return $this->json([], Response::HTTP_OK);
        }

        $requests = $joinRepo->findPendingByQuartierId($quartier->getId());

        $data = array_map(function ($req) use ($userRepo) {
            $requester = $userRepo->find($req->getUserId());
            return [
                'id'        => $req->getId(),
                'status'    => $req->getStatus()->value,
                'createdAt' => $req->getCreatedAt()->format('c'),
                'user'      => $requester ? [
                    'id'        => $requester->getId(),
                    'firstName' => $requester->getFirstName(),
                    'lastName'  => $requester->getLastName(),
                    'email'     => $requester->getEmail(),
                    'address'   => $requester->getAddress(),
                ] : null,
            ];
        }, $requests);

        return $this->json($data);
    }

    /** PUT /api/admin/join-requests/{id}/approve */
    #[Route('/join-requests/{id}/approve', methods: ['PUT'])]
    public function approveJoin(
        int $id,
        JoinRequestRepository $joinRepo,
        MembershipRepository $memberRepo,
        QuartierRepository $quartierRepo,
        UserRepository $userRepo,
        EntityManagerInterface $em,
        MailerService $mailer
    ): JsonResponse {
        $req = $joinRepo->find($id);
        if (!$req) {
            return $this->json(['message' => 'Demande non trouvée.'], Response::HTTP_NOT_FOUND);
        }

        $req->setStatus(JoinStatus::ACCEPTEE);

        $membership = new Membership();
        $membership->setUserId($req->getUserId());
        $membership->setQuartierId($req->getQuartierId());
        $em->persist($membership);
        $em->flush();

        $requester = $userRepo->find($req->getUserId());
        $quartier  = $quartierRepo->find($req->getQuartierId());
        if ($requester && $quartier) {
            $mailer->sendJoinApproved($requester->getEmail(), $requester->getFirstName() ?? $requester->getNom(), $quartier->getName());
        }

        return $this->json(['message' => 'Demande approuvée.']);
    }

    /** PUT /api/admin/join-requests/{id}/reject */
    #[Route('/join-requests/{id}/reject', methods: ['PUT'])]
    public function rejectJoin(
        int $id,
        JoinRequestRepository $joinRepo,
        QuartierRepository $quartierRepo,
        UserRepository $userRepo,
        EntityManagerInterface $em,
        MailerService $mailer
    ): JsonResponse {
        $req = $joinRepo->find($id);
        if (!$req) {
            return $this->json(['message' => 'Demande non trouvée.'], Response::HTTP_NOT_FOUND);
        }

        $req->setStatus(JoinStatus::REFUSEE);
        $em->flush();

        $requester = $userRepo->find($req->getUserId());
        $quartier  = $quartierRepo->find($req->getQuartierId());
        if ($requester && $quartier) {
            $mailer->sendJoinRejected($requester->getEmail(), $requester->getFirstName() ?? $requester->getNom(), $quartier->getName());
        }

        return $this->json(['message' => 'Demande refusée.']);
    }

    /** GET /api/admin/members — membres du quartier */
    #[Route('/members', methods: ['GET'])]
    public function members(
        QuartierRepository $quartierRepo,
        MembershipRepository $memberRepo,
        UserRepository $userRepo
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $quartier = $this->getAdminQuartier($user, $quartierRepo, $memberRepo);

        if (!$quartier) {
            return $this->json([], Response::HTTP_OK);
        }

        $memberships = $memberRepo->findBy(['quartierId' => $quartier->getId()]);

        $creatorId = $quartier->getAdminId();
        $isCreator = $user->getId() === $creatorId;

        $data = array_map(function ($m) use ($userRepo, $creatorId) {
            $member = $userRepo->find($m->getUserId());
            $role = $m->getUserId() === $creatorId ? 'CREATEUR' : $m->getRole();
            return [
                'membershipId' => $m->getId(),
                'role'         => $role,
                'joinedAt'     => $m->getJoinedAt()->format('c'),
                'user'         => $member ? [
                    'id'        => $member->getId(),
                    'firstName' => $member->getFirstName(),
                    'lastName'  => $member->getLastName(),
                    'email'     => $member->getEmail(),
                ] : null,
            ];
        }, $memberships);

        // Infos supplémentaires pour le frontend : est-ce que le current user est le créateur ?
        return $this->json(['members' => $data, 'isCreator' => $isCreator]);
    }

    /** PUT /api/admin/members/{userId}/promote — promouvoir un membre en co-admin (créateur uniquement) */
    #[Route('/members/{userId}/promote', methods: ['PUT'])]
    public function promoteMember(
        int $userId,
        QuartierRepository $quartierRepo,
        MembershipRepository $memberRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $quartier = $this->getAdminQuartier($user, $quartierRepo, $memberRepo);

        if (!$quartier || $quartier->getAdminId() !== $user->getId()) {
            return $this->json(['message' => 'Seul le créateur peut promouvoir des admins.'], Response::HTTP_FORBIDDEN);
        }

        $membership = $memberRepo->findOneBy(['userId' => $userId, 'quartierId' => $quartier->getId()]);
        if (!$membership) {
            return $this->json(['message' => 'Membre non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $membership->setRole('ADMIN');
        $em->flush();

        return $this->json(['message' => 'Membre promu co-admin.']);
    }

    /** PUT /api/admin/members/{userId}/demote — retirer le rôle admin (créateur uniquement) */
    #[Route('/members/{userId}/demote', methods: ['PUT'])]
    public function demoteMember(
        int $userId,
        QuartierRepository $quartierRepo,
        MembershipRepository $memberRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $quartier = $this->getAdminQuartier($user, $quartierRepo, $memberRepo);

        if (!$quartier || $quartier->getAdminId() !== $user->getId()) {
            return $this->json(['message' => 'Seul le créateur peut retirer des admins.'], Response::HTTP_FORBIDDEN);
        }

        if ($userId === $quartier->getAdminId()) {
            return $this->json(['message' => 'Impossible de rétrograder le créateur.'], Response::HTTP_FORBIDDEN);
        }

        $membership = $memberRepo->findOneBy(['userId' => $userId, 'quartierId' => $quartier->getId()]);
        if (!$membership) {
            return $this->json(['message' => 'Membre non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $membership->setRole('MEMBRE');
        $em->flush();

        return $this->json(['message' => 'Rôle admin retiré.']);
    }

    /** DELETE /api/admin/members/{userId} — exclure un membre */
    #[Route('/members/{userId}', methods: ['DELETE'])]
    public function removeMember(
        int $userId,
        QuartierRepository $quartierRepo,
        MembershipRepository $memberRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $quartier = $this->getAdminQuartier($user, $quartierRepo, $memberRepo);

        if (!$quartier) {
            return $this->json(['message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $membership = $memberRepo->findOneBy([
            'userId'     => $userId,
            'quartierId' => $quartier->getId(),
        ]);

        if (!$membership) {
            return $this->json(['message' => 'Membre non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        // On ne peut pas exclure le créateur
        if ($membership->getUserId() === $quartier->getAdminId()) {
            return $this->json(['message' => 'Impossible d\'exclure le créateur.'], Response::HTTP_FORBIDDEN);
        }

        $em->remove($membership);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    /** GET /api/admin/verifications — utilisateurs en attente de vérification d'adresse */
    #[Route('/verifications', methods: ['GET'])]
    public function verifications(UserRepository $userRepo): JsonResponse
    {
        $users = $userRepo->findBy(['status' => VerificationStatus::EN_ATTENTE]);

        $data = array_map(fn(User $u) => [
            'id'        => $u->getId(),
            'firstName' => $u->getFirstName(),
            'lastName'  => $u->getLastName(),
            'email'     => $u->getEmail(),
            'address'   => $u->getAddress(),
        ], $users);

        return $this->json($data);
    }

    /** PUT /api/admin/verifications/{userId}/approve */
    #[Route('/verifications/{userId}/approve', methods: ['PUT'])]
    public function approveVerification(int $userId, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $u = $userRepo->find($userId);
        if (!$u) return $this->json(['message' => 'Utilisateur non trouvé.'], Response::HTTP_NOT_FOUND);

        $u->setStatus(VerificationStatus::VERIFIE);
        $em->flush();

        return $this->json(['message' => 'Utilisateur vérifié.']);
    }

    /** PUT /api/admin/verifications/{userId}/reject */
    #[Route('/verifications/{userId}/reject', methods: ['PUT'])]
    public function rejectVerification(int $userId, UserRepository $userRepo, EntityManagerInterface $em): JsonResponse
    {
        $u = $userRepo->find($userId);
        if (!$u) return $this->json(['message' => 'Utilisateur non trouvé.'], Response::HTTP_NOT_FOUND);

        $u->setStatus(VerificationStatus::NON_VERIFIE);
        $em->flush();

        return $this->json(['message' => 'Vérification refusée.']);
    }
}
