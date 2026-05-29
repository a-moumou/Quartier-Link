<?php

namespace App\Repository;

use App\Entity\JoinRequest;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class JoinRequestRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, JoinRequest::class);
    }

    public function findPendingByQuartierId(int $quartierId): array
    {
        return $this->createQueryBuilder('j')
            ->where('j.quartierId = :qid AND j.status = :status')
            ->setParameter('qid', $quartierId)
            ->setParameter('status', 'EN_ATTENTE')
            ->orderBy('j.createdAt', 'ASC')
            ->getQuery()
            ->getResult();
    }
}
