<?php

namespace App\Entity;

use App\Enum\JoinStatus;
use App\Repository\JoinRequestRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: JoinRequestRepository::class)]
#[ORM\Table(name: 'membership_requests')]
class JoinRequest
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'user_id')]
    private int $userId;

    #[ORM\Column(name: 'quartier_id')]
    private int $quartierId;

    #[ORM\Column(
        name: 'status',
        type: 'string',
        length: 20,
        enumType: JoinStatus::class,
        options: ['default' => 'EN_ATTENTE']
    )]
    private JoinStatus $status = JoinStatus::EN_ATTENTE;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getUserId(): int { return $this->userId; }
    public function setUserId(int $v): static { $this->userId = $v; return $this; }

    public function getQuartierId(): int { return $this->quartierId; }
    public function setQuartierId(int $v): static { $this->quartierId = $v; return $this; }

    public function getStatus(): JoinStatus { return $this->status; }
    public function setStatus(JoinStatus $v): static { $this->status = $v; return $this; }

    public function getStatut(): JoinStatus { return $this->status; }
    public function setStatut(JoinStatus $v): static { return $this->setStatus($v); }

    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
