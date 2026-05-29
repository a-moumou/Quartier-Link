<?php

namespace App\Entity;

use App\Repository\MembershipRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: MembershipRepository::class)]
#[ORM\Table(name: 'quartier_members')]
class Membership
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'user_id')]
    private int $userId;

    #[ORM\Column(name: 'quartier_id')]
    private int $quartierId;

    #[ORM\Column(length: 20, options: ['default' => 'MEMBRE'])]
    private string $role = 'MEMBRE';

    #[ORM\Column(name: 'joined_at', type: 'datetime')]
    private \DateTime $joinedAt;

    public function __construct()
    {
        $this->joinedAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getRole(): string { return $this->role; }
    public function setRole(string $v): static { $this->role = $v; return $this; }

    public function getUserId(): int { return $this->userId; }
    public function setUserId(int $v): static { $this->userId = $v; return $this; }

    public function getQuartierId(): int { return $this->quartierId; }
    public function setQuartierId(int $v): static { $this->quartierId = $v; return $this; }

    public function getJoinedAt(): \DateTime { return $this->joinedAt; }
}
