<?php

namespace App\Entity;

use App\Enum\VerificationStatus;
use App\Repository\UserRepository;
use Doctrine\ORM\Mapping as ORM;
use Symfony\Component\Security\Core\User\PasswordAuthenticatedUserInterface;
use Symfony\Component\Security\Core\User\UserInterface;

#[ORM\Entity(repositoryClass: UserRepository::class)]
#[ORM\Table(name: 'users')]
class User implements UserInterface, PasswordAuthenticatedUserInterface
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'firstname', length: 100, nullable: true)]
    private ?string $firstName = null;

    #[ORM\Column(name: 'lastname', length: 100, nullable: true)]
    private ?string $lastName = null;

    #[ORM\Column(length: 150, unique: true)]
    private string $email;

    #[ORM\Column(type: 'text')]
    private string $password;

    #[ORM\Column(type: 'text', nullable: true)]
    private ?string $address = null;

    #[ORM\Column(
        name: 'status',
        type: 'string',
        length: 20,
        enumType: VerificationStatus::class,
        options: ['default' => 'NON_VERIFIE']
    )]
    private VerificationStatus $status = VerificationStatus::NON_VERIFIE;

    /** Valeurs métier : USER, ADMIN_QUARTIER (voir getRoles() pour les rôles Symfony). */
    #[ORM\Column(length: 50)]
    private string $role = 'USER';

    #[ORM\Column(name: 'proof_url', type: 'text', nullable: true)]
    private ?string $proofUrl = null;

    #[ORM\Column(name: 'reset_token', length: 6, nullable: true)]
    private ?string $resetToken = null;

    #[ORM\Column(name: 'reset_token_expires_at', type: 'datetime', nullable: true)]
    private ?\DateTime $resetTokenExpiresAt = null;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getFirstName(): ?string { return $this->firstName; }
    public function setFirstName(?string $v): static { $this->firstName = $v; return $this; }

    public function getLastName(): ?string { return $this->lastName; }
    public function setLastName(?string $v): static { $this->lastName = $v; return $this; }

    /** Nom affichable (prénom + nom). */
    public function getNom(): string
    {
        return trim(($this->firstName ?? '') . ' ' . ($this->lastName ?? ''));
    }

    /** Met à jour prénom / nom à partir d’une chaîne « Prénom Nom ». */
    public function setNom(string $nom): static
    {
        $nom = trim($nom);
        if ($nom === '') {
            return $this;
        }
        $space = strpos($nom, ' ');
        if ($space === false) {
            $this->firstName = $nom;
            $this->lastName = '';
        } else {
            $this->firstName = substr($nom, 0, $space);
            $this->lastName = trim(substr($nom, $space));
        }

        return $this;
    }

    public function getEmail(): string { return $this->email; }
    public function setEmail(string $v): static { $this->email = $v; return $this; }

    public function getUserIdentifier(): string { return $this->email; }

    public function getPassword(): string { return $this->password; }
    public function setPassword(string $v): static { $this->password = $v; return $this; }

    public function eraseCredentials(): void {}

    public function getRoles(): array
    {
        return match ($this->role) {
            'ADMIN_GENERAL'  => ['ROLE_ADMIN_GENERAL', 'ROLE_ADMIN_QUARTIER', 'ROLE_USER'],
            'ADMIN_QUARTIER' => ['ROLE_ADMIN_QUARTIER', 'ROLE_USER'],
            default          => ['ROLE_USER'],
        };
    }

    public function getRole(): string { return $this->role; }

    public function setRole(string $role): static
    {
        $this->role = $role;

        return $this;
    }

    public function getAddress(): ?string { return $this->address; }
    public function setAddress(?string $v): static { $this->address = $v; return $this; }

    /** @deprecated Utiliser getAddress() — alias pour l’API existante */
    public function getAdresse(): ?string { return $this->address; }
    public function setAdresse(?string $v): static { return $this->setAddress($v); }

    public function getStatus(): VerificationStatus { return $this->status; }
    public function setStatus(VerificationStatus $v): static { $this->status = $v; return $this; }

    public function getStatutVerification(): VerificationStatus { return $this->status; }
    public function setStatutVerification(VerificationStatus $v): static { return $this->setStatus($v); }

    public function getProofUrl(): ?string { return $this->proofUrl; }
    public function setProofUrl(?string $v): static { $this->proofUrl = $v; return $this; }

    public function getResetToken(): ?string { return $this->resetToken; }
    public function setResetToken(?string $v): static { $this->resetToken = $v; return $this; }

    public function getResetTokenExpiresAt(): ?\DateTime { return $this->resetTokenExpiresAt; }
    public function setResetTokenExpiresAt(?\DateTime $v): static { $this->resetTokenExpiresAt = $v; return $this; }

    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
