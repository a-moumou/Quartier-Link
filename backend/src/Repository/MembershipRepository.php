<?php

namespace App\Repository;

use App\Entity\Membership;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class MembershipRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Membership::class);
    }

    /** Retourne le membership ADMIN d'un user pour un quartier donné, ou null. */
    public function findAdminMembership(int $userId, int $quartierId): ?object
    {
        return $this->findOneBy(['userId' => $userId, 'quartierId' => $quartierId, 'role' => 'ADMIN']);
    }

    /** Retourne les IDs de tous les membres des quartiers auxquels appartient $userId (sauf lui-même). */
    public function findQuartierMateIds(int $userId): array
    {
        $conn = $this->getEntityManager()->getConnection();
        $sql = '
            SELECT DISTINCT m2.user_id
            FROM quartier_members m1
            JOIN quartier_members m2 ON m1.quartier_id = m2.quartier_id
            WHERE m1.user_id = :uid AND m2.user_id != :uid
        ';
        return array_map('intval', $conn->fetchFirstColumn($sql, ['uid' => $userId]));
    }
}
