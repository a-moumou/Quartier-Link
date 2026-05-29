<?php

namespace App\Controller;

use App\Entity\JoinRequest;
use App\Entity\Membership;
use App\Entity\Quartier;
use App\Entity\User;
use App\Enum\QuartierStatus;
use App\Enum\VerificationStatus;
use App\Repository\JoinRequestRepository;
use App\Repository\MembershipRepository;
use App\Repository\QuartierRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/quartiers')]
class QuartierController extends AbstractController
{
    #[Route('', methods: ['GET'])]
    public function list(QuartierRepository $repo): JsonResponse
    {
        $quartiers = $repo->findBy(['status' => QuartierStatus::ACTIF]);

        $data = array_map(static fn (Quartier $q) => [
            'id'          => $q->getId(),
            'nom'         => $q->getName(),
            'name'        => $q->getName(),
            'description' => $q->getDescription(),
            'address'     => $q->getAddress(),
            'adresse'     => $q->getAddress(),
            'adminId'     => $q->getAdminId(),
            'bannerUrl'   => $q->getBannerUrl(),
            'latitude'    => $q->getLatitude(),
            'longitude'   => $q->getLongitude(),
        ], $quartiers);

        return $this->json($data);
    }

    #[Route('/{id}', methods: ['GET'])]
    public function show(int $id, QuartierRepository $repo, MembershipRepository $membershipRepo): JsonResponse
    {
        $quartier = $repo->find($id);
        if (!$quartier) {
            return $this->json(['message' => 'Quartier non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $memberships = $membershipRepo->findBy(['quartierId' => $id]);

        return $this->json([
            'id'          => $quartier->getId(),
            'nom'         => $quartier->getName(),
            'name'        => $quartier->getName(),
            'description' => $quartier->getDescription(),
            'address'     => $quartier->getAddress(),
            'adresse'     => $quartier->getAddress(),
            'adminId'     => $quartier->getAdminId(),
            'bannerUrl'   => $quartier->getBannerUrl(),
            'membres'     => count($memberships),
        ]);
    }

    #[Route('', methods: ['POST'])]
    public function create(Request $request, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        $name = $data['name'] ?? $data['nom'] ?? null;
        if ($name === null || $name === '') {
            return $this->json(['message' => "Le champ 'name' (ou 'nom') est requis."], Response::HTTP_BAD_REQUEST);
        }

        $quartier = new Quartier();
        $quartier->setName($name);
        $quartier->setDescription($data['description'] ?? null);
        $quartier->setAddress($data['address'] ?? $data['adresse'] ?? null);
        $quartier->setLatitude(isset($data['latitude'])  ? (float) $data['latitude']  : null);
        $quartier->setLongitude(isset($data['longitude']) ? (float) $data['longitude'] : null);
        $quartier->setAdminId((int) $user->getId());

        $quartier->setStatus(QuartierStatus::EN_ATTENTE);

        $em->persist($quartier);
        $em->flush();

        $membership = new Membership();
        $membership->setUserId((int) $user->getId());
        $membership->setQuartierId((int) $quartier->getId());
        $em->persist($membership);
        $em->flush();

        return $this->json([
            'id'          => $quartier->getId(),
            'nom'         => $quartier->getName(),
            'name'        => $quartier->getName(),
            'description' => $quartier->getDescription(),
            'address'     => $quartier->getAddress(),
            'status'      => $quartier->getStatus()->value,
        ], Response::HTTP_CREATED);
    }

    /** DELETE /api/quartiers/{id}/leave — quitter un quartier */
    #[Route('/{id}/leave', methods: ['DELETE'])]
    public function leave(
        int $id,
        QuartierRepository $repo,
        MembershipRepository $membershipRepo,
        JoinRequestRepository $joinRequestRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $quartier = $repo->find($id);
        if (!$quartier) {
            return $this->json(['message' => 'Quartier non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        // Le créateur/admin ne peut pas quitter son propre quartier
        if ($quartier->getAdminId() === $user->getId()) {
            return $this->json(['message' => 'Le créateur ne peut pas quitter son quartier.'], Response::HTTP_FORBIDDEN);
        }

        $membership = $membershipRepo->findOneBy(['userId' => $user->getId(), 'quartierId' => $id]);
        if (!$membership) {
            return $this->json(['message' => 'Vous n\'êtes pas membre de ce quartier.'], Response::HTTP_NOT_FOUND);
        }

        $em->remove($membership);

        // Supprimer aussi l'ancienne JoinRequest pour permettre de rejoindre à nouveau plus tard
        $oldRequest = $joinRequestRepo->findOneBy(['userId' => $user->getId(), 'quartierId' => $id]);
        if ($oldRequest) {
            $em->remove($oldRequest);
        }

        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    #[Route('/{id}/join', methods: ['POST'])]
    public function join(
        int $id,
        QuartierRepository $repo,
        MembershipRepository $membershipRepo,
        JoinRequestRepository $joinRequestRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        if ($user->getStatus() !== VerificationStatus::VERIFIE) {
            return $this->json(['message' => 'Votre compte doit être vérifié pour rejoindre un quartier.'], Response::HTTP_FORBIDDEN);
        }

        $quartier = $repo->find($id);
        if (!$quartier) {
            return $this->json(['message' => 'Quartier non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        // Déjà membre ?
        if ($membershipRepo->findOneBy(['userId' => $user->getId(), 'quartierId' => $id])) {
            return $this->json(['message' => 'Vous êtes déjà membre de ce quartier.'], Response::HTTP_CONFLICT);
        }

        // Demande EN_ATTENTE déjà existante ?
        $existing = $joinRequestRepo->findOneBy(['userId' => $user->getId(), 'quartierId' => $id, 'status' => \App\Enum\JoinStatus::EN_ATTENTE]);
        if ($existing) {
            return $this->json(['message' => 'Demande déjà envoyée.'], Response::HTTP_CONFLICT);
        }

        // Supprimer une ancienne demande (ACCEPTEE/REFUSEE) pour pouvoir refaire une demande propre
        $old = $joinRequestRepo->findOneBy(['userId' => $user->getId(), 'quartierId' => $id]);
        if ($old) {
            $em->remove($old);
            $em->flush();
        }

        $request = new JoinRequest();
        $request->setUserId($user->getId());
        $request->setQuartierId($id);
        $em->persist($request);
        $em->flush();

        return $this->json(['message' => 'Demande envoyée. En attente de validation.'], Response::HTTP_CREATED);
    }
}
