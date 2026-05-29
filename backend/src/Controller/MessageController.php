<?php

namespace App\Controller;

use App\Entity\Message;
use App\Entity\User;
use App\Repository\MembershipRepository;
use App\Repository\MessageRepository;
use App\Repository\UserRepository;
use App\Service\CryptoService;
use App\Service\MqttService;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/messages')]
class MessageController extends AbstractController
{
    /**
     * GET /api/messages/contacts — membres du même quartier (avec dernier message si existant).
     * Remplace /conversations : affiche tous les voisins contactables, pas seulement ceux déjà en conversation.
     */
    #[Route('/contacts', methods: ['GET'])]
    public function contacts(
        MembershipRepository $memberRepo,
        MessageRepository $msgRepo,
        UserRepository $userRepo,
        CryptoService $crypto
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();

        $mateIds = $memberRepo->findQuartierMateIds($user->getId());
        if (empty($mateIds)) {
            return $this->json([]);
        }

        // Index des derniers messages par interlocuteur
        $rows = $msgRepo->findLastMessagesForUser($user->getId());
        $lastByUser = [];
        foreach ($rows as $row) {
            $lastByUser[(int) $row['other_user']] = $row;
        }

        $data = [];
        foreach ($mateIds as $mateId) {
            $mate = $userRepo->find($mateId);
            if (!$mate) continue;

            $last = $lastByUser[$mateId] ?? null;
            $data[] = [
                'id'          => $mate->getId(),
                'firstName'   => $mate->getFirstName(),
                'lastName'    => $mate->getLastName(),
                'lastMessage' => $last ? [
                    'content'   => $crypto->decrypt($last['content']),
                    'createdAt' => $last['created_at'],
                    'isMe'      => (int) $last['sender_id'] === $user->getId(),
                ] : null,
            ];
        }

        // Trier : conversations récentes en premier, puis alphabétique
        usort($data, function ($a, $b) {
            if ($a['lastMessage'] && $b['lastMessage']) {
                return strtotime($b['lastMessage']['createdAt']) <=> strtotime($a['lastMessage']['createdAt']);
            }
            if ($a['lastMessage']) return -1;
            if ($b['lastMessage']) return 1;
            return strcmp((string) $a['firstName'], (string) $b['firstName']);
        });

        return $this->json($data);
    }

    /** GET /api/messages/{userId} — échange complet avec un utilisateur */
    #[Route('/{userId}', methods: ['GET'], requirements: ['userId' => '\d+'])]
    public function conversation(int $userId, MessageRepository $msgRepo, UserRepository $userRepo, CryptoService $crypto): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();

        $other = $userRepo->find($userId);
        if (!$other) {
            return $this->json(['message' => 'Utilisateur non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $messages = $msgRepo->findConversation($user->getId(), $userId);

        $data = array_map(fn(Message $m) => [
            'id'         => $m->getId(),
            'content'    => $crypto->decrypt($m->getContent()),
            'createdAt'  => $m->getCreatedAt()->format('c'),
            'isMe'       => $m->getSenderId() === $user->getId(),
            'senderId'   => $m->getSenderId(),
            'receiverId' => $m->getReceiverId(),
        ], $messages);

        return $this->json([
            'otherUser' => [
                'id'        => $other->getId(),
                'firstName' => $other->getFirstName(),
                'lastName'  => $other->getLastName(),
            ],
            'messages' => $data,
        ]);
    }

    /** POST /api/messages — envoyer un message privé */
    #[Route('', methods: ['POST'])]
    public function send(
        Request $request,
        EntityManagerInterface $em,
        UserRepository $userRepo,
        MembershipRepository $memberRepo,
        MqttService $mqtt,
        CryptoService $crypto
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        if (empty($data['receiverId'])) {
            return $this->json(['message' => 'receiverId est requis.'], Response::HTTP_BAD_REQUEST);
        }
        if (empty($data['content'])) {
            return $this->json(['message' => 'Le contenu est requis.'], Response::HTTP_BAD_REQUEST);
        }

        $receiver = $userRepo->find((int) $data['receiverId']);
        if (!$receiver) {
            return $this->json(['message' => 'Destinataire non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        // Vérifier que le destinataire est dans le même quartier
        $mateIds = $memberRepo->findQuartierMateIds($user->getId());
        if (!in_array($receiver->getId(), $mateIds, true)) {
            return $this->json(['message' => 'Vous ne pouvez envoyer des messages qu\'aux membres de votre quartier.'], Response::HTTP_FORBIDDEN);
        }

        $plainContent = $data['content'];

        $msg = new Message();
        $msg->setSenderId($user->getId());
        $msg->setReceiverId($receiver->getId());
        $msg->setContent($crypto->encrypt($plainContent));

        $em->persist($msg);
        $em->flush();

        $payload = [
            'id'         => $msg->getId(),
            'content'    => $plainContent, // contenu déchiffré pour MQTT et la réponse HTTP
            'createdAt'  => $msg->getCreatedAt()->format('c'),
            'senderId'   => $msg->getSenderId(),
            'receiverId' => $msg->getReceiverId(),
        ];

        // Notifie le destinataire en temps réel via MQTT
        $mqtt->publish('chat/' . $msg->getReceiverId(), $payload);

        return $this->json(array_merge($payload, ['isMe' => true]), Response::HTTP_CREATED);
    }
}
