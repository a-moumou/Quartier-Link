<?php

namespace App\Controller;

use App\Entity\User;
use App\Enum\JoinStatus;
use App\Enum\VerificationStatus;
use App\Repository\JoinRequestRepository;
use App\Repository\MembershipRepository;
use App\Repository\QuartierRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Component\PasswordHasher\Hasher\UserPasswordHasherInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/user')]
class UserController extends AbstractController
{
    #[Route('/me', methods: ['GET'])]
    public function me(MembershipRepository $membershipRepo): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $memberships = $membershipRepo->findBy(['userId' => $user->getId()]);
        $quartiersIds = array_map(fn ($m) => $m->getQuartierId(), $memberships);

        return $this->json([
            'id'                 => $user->getId(),
            'firstName'          => $user->getFirstName(),
            'lastName'           => $user->getLastName(),
            'nom'                => $user->getNom(),
            'email'              => $user->getEmail(),
            'adresse'            => $user->getAddress(),
            'statutVerification' => $user->getStatus()->value,
            'proofUrl'           => $user->getProofUrl(),
            'roles'              => $user->getRoles(),
            'quartiers'          => $quartiersIds,
        ]);
    }

    #[Route('/upload-proof', methods: ['POST'])]
    public function uploadProof(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $file = $request->files->get('proof');
        if (!$file) {
            return $this->json(['message' => 'Aucun fichier fourni.'], Response::HTTP_BAD_REQUEST);
        }

        $allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
        if (!in_array($file->getMimeType(), $allowedMimes)) {
            return $this->json(
                ['message' => 'Format non supporté. JPG, PNG ou PDF requis.'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        if ($file->getSize() > 5 * 1024 * 1024) {
            return $this->json(
                ['message' => 'Fichier trop volumineux (max 5 Mo).'],
                Response::HTTP_UNPROCESSABLE_ENTITY
            );
        }

        $uploadDir = dirname(__DIR__, 2) . '/public/uploads/proofs';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0755, true);
        }

        $filename = uniqid('proof_', true) . '.' . $file->guessExtension();
        $file->move($uploadDir, $filename);

        $user->setProofUrl('/uploads/proofs/' . $filename);
        $user->setStatus(VerificationStatus::EN_ATTENTE);
        $em->flush();

        return $this->json([
            'message'  => 'Justificatif reçu. Votre dossier est en cours de vérification.',
            'proofUrl' => $user->getProofUrl(),
        ]);
    }

    #[Route('/profile', methods: ['PUT'])]
    public function updateProfile(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        if (!empty($data['firstName'])) {
            $user->setFirstName($data['firstName']);
        }
        if (!empty($data['lastName'])) {
            $user->setLastName($data['lastName']);
        }
        if (!empty($data['nom'])) {
            $user->setNom($data['nom']);
        }
        // Address can only be set once — ignored if already defined
        if ($user->getAddress() === null && !empty($data['address'] ?? $data['adresse'] ?? null)) {
            $user->setAddress($data['address'] ?? $data['adresse']);
        }

        $em->flush();

        return $this->json([
            'id'                 => $user->getId(),
            'firstName'          => $user->getFirstName(),
            'lastName'           => $user->getLastName(),
            'nom'                => $user->getNom(),
            'email'              => $user->getEmail(),
            'adresse'            => $user->getAddress(),
            'statutVerification' => $user->getStatus()->value,
        ]);
    }

    #[Route('/password', methods: ['PUT'])]
    public function changePassword(
        Request $request,
        EntityManagerInterface $em,
        UserPasswordHasherInterface $hasher
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        if (empty($data['currentPassword']) || empty($data['newPassword'])) {
            return $this->json(['message' => 'Champs requis manquants.'], Response::HTTP_BAD_REQUEST);
        }

        if (!$hasher->isPasswordValid($user, $data['currentPassword'])) {
            return $this->json(['message' => 'Mot de passe actuel incorrect.'], Response::HTTP_UNAUTHORIZED);
        }

        if (strlen($data['newPassword']) < 8) {
            return $this->json(['message' => 'Le nouveau mot de passe doit contenir au moins 8 caractères.'], Response::HTTP_BAD_REQUEST);
        }

        $user->setPassword($hasher->hashPassword($user, $data['newPassword']));
        $em->flush();

        return $this->json(['message' => 'Mot de passe mis à jour.']);
    }

    /** DELETE /api/user/account — supprimer son propre compte */
    #[Route('/account', methods: ['DELETE'])]
    public function deleteAccount(
        EntityManagerInterface $em,
        QuartierRepository $quartierRepo
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $uid  = $user->getId();

        // Bloquer si l'utilisateur est créateur d'un quartier
        $ownedQuartier = $quartierRepo->findOneBy(['adminId' => $uid]);
        if ($ownedQuartier) {
            return $this->json(
                ['message' => 'Vous êtes administrateur d\'un quartier. Transférez ou supprimez votre quartier avant de supprimer votre compte.'],
                Response::HTTP_CONFLICT
            );
        }

        $conn = $em->getConnection();
        $conn->beginTransaction();
        try {
            $conn->executeStatement('DELETE FROM post_likes         WHERE user_id = :uid', ['uid' => $uid]);
            $conn->executeStatement('DELETE FROM comments           WHERE user_id = :uid', ['uid' => $uid]);
            $conn->executeStatement('DELETE FROM posts              WHERE user_id = :uid', ['uid' => $uid]);
            $conn->executeStatement('DELETE FROM messages           WHERE sender_id = :uid OR receiver_id = :uid', ['uid' => $uid]);
            $conn->executeStatement('DELETE FROM membership_requests WHERE user_id = :uid', ['uid' => $uid]);
            $conn->executeStatement('DELETE FROM quartier_members   WHERE user_id = :uid', ['uid' => $uid]);
            $conn->executeStatement('DELETE FROM users              WHERE id = :uid', ['uid' => $uid]);
            $conn->commit();
        } catch (\Throwable $e) {
            $conn->rollBack();
            return $this->json(['message' => 'Erreur lors de la suppression.'], Response::HTTP_INTERNAL_SERVER_ERROR);
        }

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    /** GET /api/user/join-requests — demandes d'adhésion en attente de l'utilisateur */
    #[Route('/join-requests', methods: ['GET'])]
    public function myJoinRequests(JoinRequestRepository $joinRepo): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $requests = $joinRepo->findBy(['userId' => $user->getId(), 'status' => JoinStatus::EN_ATTENTE]);

        $data = array_map(fn($r) => [
            'id'         => $r->getId(),
            'quartierId' => $r->getQuartierId(),
            'status'     => $r->getStatus()->value,
        ], $requests);

        return $this->json($data);
    }

    /** GET /api/user/members — liste des membres des quartiers de l'utilisateur */
    #[Route('/members', methods: ['GET'])]
    public function members(
        MembershipRepository $membershipRepo,
        \App\Repository\UserRepository $userRepo,
        \App\Repository\QuartierRepository $quartierRepo
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $myMemberships = $membershipRepo->findBy(['userId' => $user->getId()]);
        $quartierIds   = array_map(fn($m) => $m->getQuartierId(), $myMemberships);

        if (empty($quartierIds)) {
            return $this->json([]);
        }

        // Tous les memberships dans ces quartiers
        $allMemberships = [];
        foreach ($quartierIds as $qid) {
            $allMemberships = array_merge($allMemberships, $membershipRepo->findBy(['quartierId' => $qid]));
        }

        // Construire un index quartier_id → Quartier
        $quartiersMap = [];
        foreach ($quartierIds as $qid) {
            $q = $quartierRepo->find($qid);
            if ($q) $quartiersMap[$qid] = $q;
        }

        $seen  = [];
        $data  = [];
        foreach ($allMemberships as $m) {
            $uid = $m->getUserId();
            if ($uid === $user->getId()) continue;

            $member = $userRepo->find($uid);
            if (!$member) continue;

            $qid      = $m->getQuartierId();
            $quartier = $quartiersMap[$qid] ?? null;
            $isAdmin  = $quartier && $quartier->getAdminId() === $uid;

            if (isset($seen[$uid])) {
                // Ajouter le quartier supplémentaire si déjà vu
                foreach ($data as &$entry) {
                    if ($entry['id'] === $uid) {
                        $entry['quartiers'][] = ['id' => $qid, 'name' => $quartier?->getName()];
                        if ($isAdmin) $entry['isAdmin'] = true;
                        break;
                    }
                }
                unset($entry);
                continue;
            }
            $seen[$uid] = true;

            $data[] = [
                'id'        => $member->getId(),
                'firstName' => $member->getFirstName(),
                'lastName'  => $member->getLastName(),
                'quartiers' => $quartier ? [['id' => $qid, 'name' => $quartier->getName()]] : [],
                'isAdmin'   => $isAdmin,
            ];
        }

        return $this->json($data);
    }
}
