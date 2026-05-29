<?php

namespace App\Controller;

use App\Entity\Comment;
use App\Entity\Post;
use App\Entity\PostLike;
use App\Entity\User;
use App\Repository\CommentRepository;
use App\Repository\MembershipRepository;
use App\Repository\PostLikeRepository;
use App\Repository\PostRepository;
use App\Repository\QuartierRepository;
use App\Repository\UserRepository;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;

#[Route('/api/posts')]
class PostController extends AbstractController
{
    private function format(
        Post $post,
        UserRepository $userRepo,
        QuartierRepository $quartierRepo,
        PostLikeRepository $likeRepo,
        CommentRepository $commentRepo,
        ?int $currentUserId = null
    ): array {
        $author   = $userRepo->find($post->getUserId());
        $quartier = $quartierRepo->find($post->getQuartierId());
        $likesCount    = $likeRepo->countByPostId($post->getId());
        $commentsCount = $commentRepo->countByPostId($post->getId());
        $likedByMe = $currentUserId
            ? (bool) $likeRepo->findOneBy(['postId' => $post->getId(), 'userId' => $currentUserId])
            : false;

        return [
            'id'            => $post->getId(),
            'content'       => $post->getContent(),
            'createdAt'     => $post->getCreatedAt()->format('c'),
            'quartierId'    => $post->getQuartierId(),
            'quartierNom'   => $quartier?->getName(),
            'likesCount'    => $likesCount,
            'commentsCount' => $commentsCount,
            'likedByMe'     => $likedByMe,
            'author'        => $author ? [
                'id'         => $author->getId(),
                'firstName'  => $author->getFirstName(),
                'lastName'   => $author->getLastName(),
                'isVerified' => $author->getStatutVerification()->value === 'VERIFIE',
                'isAdmin'    => $quartier && $quartier->getAdminId() === $author->getId(),
            ] : null,
        ];
    }

    /** GET /api/posts */
    #[Route('', methods: ['GET'])]
    public function feed(
        PostRepository $postRepo,
        MembershipRepository $membershipRepo,
        UserRepository $userRepo,
        QuartierRepository $quartierRepo,
        PostLikeRepository $likeRepo,
        CommentRepository $commentRepo
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $memberships = $membershipRepo->findBy(['userId' => $user->getId()]);
        $quartierIds = array_map(fn($m) => $m->getQuartierId(), $memberships);
        $posts = $postRepo->findByQuartierIds($quartierIds);

        return $this->json(array_map(
            fn(Post $p) => $this->format($p, $userRepo, $quartierRepo, $likeRepo, $commentRepo, $user->getId()),
            $posts
        ));
    }

    /** GET /api/posts/quartier/{id} */
    #[Route('/quartier/{id}', methods: ['GET'])]
    public function byQuartier(
        int $id,
        PostRepository $postRepo,
        UserRepository $userRepo,
        QuartierRepository $quartierRepo,
        PostLikeRepository $likeRepo,
        CommentRepository $commentRepo
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $posts = $postRepo->findByQuartierId($id);

        return $this->json(array_map(
            fn(Post $p) => $this->format($p, $userRepo, $quartierRepo, $likeRepo, $commentRepo, $user->getId()),
            $posts
        ));
    }

    /** POST /api/posts */
    #[Route('', methods: ['POST'])]
    public function create(
        Request $request,
        EntityManagerInterface $em,
        MembershipRepository $membershipRepo,
        UserRepository $userRepo,
        QuartierRepository $quartierRepo,
        PostLikeRepository $likeRepo,
        CommentRepository $commentRepo
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $data = json_decode($request->getContent(), true) ?? [];

        if (empty($data['content'])) {
            return $this->json(['message' => 'Le contenu est requis.'], Response::HTTP_BAD_REQUEST);
        }
        if (empty($data['quartierId'])) {
            return $this->json(['message' => 'quartierId est requis.'], Response::HTTP_BAD_REQUEST);
        }

        if (!$membershipRepo->findOneBy(['userId' => $user->getId(), 'quartierId' => $data['quartierId']])) {
            return $this->json(['message' => 'Vous n\'êtes pas membre de ce quartier.'], Response::HTTP_FORBIDDEN);
        }

        $post = new Post();
        $post->setUserId($user->getId());
        $post->setQuartierId((int) $data['quartierId']);
        $post->setContent($data['content']);
        $em->persist($post);
        $em->flush();

        return $this->json($this->format($post, $userRepo, $quartierRepo, $likeRepo, $commentRepo, $user->getId()), Response::HTTP_CREATED);
    }

    /** DELETE /api/posts/{id} */
    #[Route('/{id}', methods: ['DELETE'])]
    public function delete(int $id, PostRepository $repo, EntityManagerInterface $em): JsonResponse
    {
        /** @var User $user */
        $user = $this->getUser();
        $post = $repo->find($id);

        if (!$post) {
            return $this->json(['message' => 'Post non trouvé.'], Response::HTTP_NOT_FOUND);
        }
        if ($post->getUserId() !== $user->getId()) {
            return $this->json(['message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $em->remove($post);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }

    /** POST /api/posts/{id}/like — toggle like */
    #[Route('/{id}/like', methods: ['POST'])]
    public function toggleLike(
        int $id,
        PostRepository $postRepo,
        PostLikeRepository $likeRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $post = $postRepo->find($id);

        if (!$post) {
            return $this->json(['message' => 'Post non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $existing = $likeRepo->findOneBy(['postId' => $id, 'userId' => $user->getId()]);

        if ($existing) {
            $em->remove($existing);
            $em->flush();
            $liked = false;
        } else {
            $like = new PostLike();
            $like->setPostId($id);
            $like->setUserId($user->getId());
            $em->persist($like);
            $em->flush();
            $liked = true;
        }

        return $this->json([
            'liked' => $liked,
            'count' => $likeRepo->countByPostId($id),
        ]);
    }

    /** GET /api/posts/{id}/comments */
    #[Route('/{id}/comments', methods: ['GET'])]
    public function getComments(
        int $id,
        CommentRepository $commentRepo,
        UserRepository $userRepo
    ): JsonResponse {
        $comments = $commentRepo->findBy(['postId' => $id], ['createdAt' => 'ASC']);

        $data = array_map(function (Comment $c) use ($userRepo) {
            $author = $userRepo->find($c->getUserId());
            return [
                'id'        => $c->getId(),
                'content'   => $c->getContent(),
                'createdAt' => $c->getCreatedAt()->format('c'),
                'author'    => $author ? [
                    'id'        => $author->getId(),
                    'firstName' => $author->getFirstName(),
                    'lastName'  => $author->getLastName(),
                ] : null,
            ];
        }, $comments);

        return $this->json($data);
    }

    /** POST /api/posts/{id}/comments */
    #[Route('/{id}/comments', methods: ['POST'])]
    public function addComment(
        int $id,
        Request $request,
        PostRepository $postRepo,
        UserRepository $userRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $post = $postRepo->find($id);

        if (!$post) {
            return $this->json(['message' => 'Post non trouvé.'], Response::HTTP_NOT_FOUND);
        }

        $data = json_decode($request->getContent(), true) ?? [];
        if (empty($data['content'])) {
            return $this->json(['message' => 'Le contenu est requis.'], Response::HTTP_BAD_REQUEST);
        }

        $comment = new Comment();
        $comment->setPostId($id);
        $comment->setUserId($user->getId());
        $comment->setContent($data['content']);
        $em->persist($comment);
        $em->flush();

        return $this->json([
            'id'        => $comment->getId(),
            'content'   => $comment->getContent(),
            'createdAt' => $comment->getCreatedAt()->format('c'),
            'author'    => [
                'id'        => $user->getId(),
                'firstName' => $user->getFirstName(),
                'lastName'  => $user->getLastName(),
            ],
        ], Response::HTTP_CREATED);
    }

    /** DELETE /api/posts/{id}/comments/{commentId} */
    #[Route('/{id}/comments/{commentId}', methods: ['DELETE'])]
    public function deleteComment(
        int $id,
        int $commentId,
        CommentRepository $commentRepo,
        EntityManagerInterface $em
    ): JsonResponse {
        /** @var User $user */
        $user = $this->getUser();
        $comment = $commentRepo->find($commentId);

        if (!$comment || $comment->getPostId() !== $id) {
            return $this->json(['message' => 'Commentaire non trouvé.'], Response::HTTP_NOT_FOUND);
        }
        if ($comment->getUserId() !== $user->getId()) {
            return $this->json(['message' => 'Accès refusé.'], Response::HTTP_FORBIDDEN);
        }

        $em->remove($comment);
        $em->flush();

        return $this->json(null, Response::HTTP_NO_CONTENT);
    }
}
