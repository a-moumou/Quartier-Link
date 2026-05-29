<?php

namespace App\Entity;

use App\Repository\PostLikeRepository;
use Doctrine\ORM\Mapping as ORM;

#[ORM\Entity(repositoryClass: PostLikeRepository::class)]
#[ORM\Table(name: 'post_likes')]
#[ORM\UniqueConstraint(name: 'uniq_post_user_like', columns: ['post_id', 'user_id'])]
class PostLike
{
    #[ORM\Id]
    #[ORM\GeneratedValue]
    #[ORM\Column]
    private ?int $id = null;

    #[ORM\Column(name: 'post_id')]
    private int $postId;

    #[ORM\Column(name: 'user_id')]
    private int $userId;

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

    public function getCreatedAt(): \DateTime { return $this->createdAt; }
}
