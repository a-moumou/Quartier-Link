<?php

namespace App\Entity;

use App\Enum\QuartierStatus;
use App\Repository\QuartierRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: QuartierRepository::class)]
#[ORM\Table(name: 'quartiers')]
class Quartier
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(length: 150)]
    private string $name;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $description = null;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $address = null;

    #[ORM\Column(name: 'admin_id')]
    private int $adminId;

    #[ORM\Column(
        name: 'status',
        type: 'string',
        length: 20,
        enumType: QuartierStatus::class,
        options: ['default' => 'EN_ATTENTE']
    )]
    private QuartierStatus $status = QuartierStatus::EN_ATTENTE;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $latitude = null;

    #[ORM\Column(type: 'float', nullable: true)]
    private ?float $longitude = null;

    #[ORM\Column(name: 'banner_url', type: 'text', nullable: true)]
    private ?string $bannerUrl = null;

    #[ORM\Column(name: 'pending_name', length: 150, nullable: true)]
    private ?string $pendingName = null;

    #[ORM\Column(name: 'pending_description', type: 'text', nullable: true)]
    private ?string $pendingDescription = null;

    #[ORM\Column(name: 'pending_address', type: 'text', nullable: true)]
    private ?string $pendingAddress = null;

    #[ORM\Column(name: 'has_pending_update', type: 'boolean', options: ['default' => false])]
    private bool $hasPendingUpdate = false;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getName(): string { return $this->name; }
    public function setName(string $v): static { $this->name = $v; return $this; }

    /** @deprecated Utiliser getName() */
    public function getNom(): string { return $this->name; }
    public function setNom(string $v): static { return $this->setName($v); }

    public function getDescription(): ?string { return $this->description; }
    public function setDescription(?string $v): static { $this->description = $v; return $this; }

    public function getAddress(): ?string { return $this->address; }
    public function setAddress(?string $v): static { $this->address = $v; return $this; }

    public function getAdminId(): int { return $this->adminId; }
    public function setAdminId(int $v): static { $this->adminId = $v; return $this; }

    /** @deprecated Utiliser getAdminId() */
    public function getCreateurId(): int { return $this->adminId; }
    public function setCreateurId(int $v): static { return $this->setAdminId($v); }

    public function getStatus(): QuartierStatus { return $this->status; }
    public function setStatus(QuartierStatus $v): static { $this->status = $v; return $this; }

    public function getLatitude(): ?float { return $this->latitude; }
    public function setLatitude(?float $v): static { $this->latitude = $v; return $this; }

    public function getLongitude(): ?float { return $this->longitude; }
    public function setLongitude(?float $v): static { $this->longitude = $v; return $this; }

    public function getBannerUrl(): ?string { return $this->bannerUrl; }
    public function setBannerUrl(?string $v): static { $this->bannerUrl = $v; return $this; }

    public function getPendingName(): ?string { return $this->pendingName; }
    public function setPendingName(?string $v): static { $this->pendingName = $v; return $this; }

    public function getPendingDescription(): ?string { return $this->pendingDescription; }
    public function setPendingDescription(?string $v): static { $this->pendingDescription = $v; return $this; }

    public function getPendingAddress(): ?string { return $this->pendingAddress; }
    public function setPendingAddress(?string $v): static { $this->pendingAddress = $v; return $this; }

    public function hasPendingUpdate(): bool { return $this->hasPendingUpdate; }
    public function setHasPendingUpdate(bool $v): static { $this->hasPendingUpdate = $v; return $this; }

    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
