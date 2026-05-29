<?php

namespace App\Entity;

use App\Repository\MessageRepository;
use Doctrine\ORM\Mapping as ORM;

/** Message privé entre deux utilisateurs (table messages). */
#[ORM\Entity(repositoryClass: MessageRepository::class)]
#[ORM\Table(name: 'messages')]
class Message
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'sender_id')]
    private int $senderId;

    #[ORM\Column(name: 'receiver_id')]
    private int $receiverId;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getSenderId(): int { return $this->senderId; }
    public function setSenderId(int $v): static { $this->senderId = $v; return $this; }

    public function getReceiverId(): int { return $this->receiverId; }
    public function setReceiverId(int $v): static { $this->receiverId = $v; return $this; }

    public function getContent(): string { return $this->content; }
    public function setContent(string $v): static { $this->content = $v; return $this; }

    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
