<?php

namespace App\Repository;

use App\Entity\Post;
use Doctrine\Bundle\DoctrineBundle\Repository\ServiceEntityRepository;
use Doctrine\Persistence\ManagerRegistry;

class PostRepository extends ServiceEntityRepository
{
    public function __construct(ManagerRegistry $registry)
    {
        parent::__construct($registry, Post::class);
    }

    /** Retourne les posts des quartiers donnés, triés du plus récent au plus ancien */
    public function findByQuartierIds(array $ids): array
    {
        if (empty($ids)) return [];

        return $this->createQueryBuilder('p')
            ->where('p.quartierId IN (:ids)')
            ->setParameter('ids', $ids)
            ->orderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }

    /** Retourne les posts d'un quartier donné */
    public function findByQuartierId(int $quartierId): array
    {
        return $this->createQueryBuilder('p')
            ->where('p.quartierId = :qid')
            ->setParameter('qid', $quartierId)
            ->orderBy('p.createdAt', 'DESC')
            ->getQuery()
            ->getResult();
    }
}
