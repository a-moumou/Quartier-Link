<?php

namespace App\Entity;

use App\Repository\CommentRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: CommentRepository::class)]
#[ORM\Table(name: 'comments')]
class Comment
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'post_id')]
    private int $postId;

    #[ORM\Column(name: 'user_id')]
    private int $userId;

    #[ORM\Column(type: 'text')]
    private string $content;

    #[ORM\Column(name: 'created_at', type: 'datetime')]
    private \DateTime $createdAt;

    public function __construct()
    {
        $this->createdAt = new \DateTime();
    }

    public function getId(): ?int { return $this->id; }

    public function getPostId(): int { return $this->postId; }
    public function setPostId(int $v): static { $this->postId = $v; return $this; }

    public function getUserId(): int { return $this->userId; }
    public function setUserId(int $v): static { $this->userId = $v; return $this; }

    public function getContent(): string { return $this->content; }
    public function setContent(string $v): static { $this->content = $v; return $this; }

    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
