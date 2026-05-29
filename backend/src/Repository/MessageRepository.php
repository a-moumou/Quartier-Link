<?php

namespace App\Repository;

use App\Entity\Message;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MessageRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Message::class);
    }

    /** Messages échangés entre deux utilisateurs */
    public function findConversation(int $userA, int $userB): array
    {
        return $this->createQueryBuilder('m')
            ->where('(m.senderId = :a AND m.receiverId = :b) OR (m.senderId = :b AND m.receiverId = :a)')
            ->setParameter('a', $userA)
            ->setParameter('b', $userB)
            ->orderBy('m.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }

    /**
     * Retourne la liste des conversations : pour chaque interlocuteur du user,
     * le dernier message échangé.
     */
    public function findLastMessagesForUser(int $userId): array
    {
        $conn = $this->getEntityManager()->getConnection();

        $sql = "
            SELECT DISTINCT ON (other_user)
                CASE WHEN sender_id = :uid THEN receiver_id ELSE sender_id END AS other_user,
                id, sender_id, receiver_id, content, created_at
            FROM messages
            WHERE sender_id = :uid OR receiver_id = :uid
            ORDER BY other_user, created_at DESC
        ";

        return $conn->fetchAllAssociative($sql, ['uid' => $userId]);
    }
}
