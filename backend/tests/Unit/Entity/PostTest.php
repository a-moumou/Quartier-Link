<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Post;
use PHPUnit\Framework\TestCase;

class PostTest extends TestCase
{
    private Post $post;

    protected function setUp(): void
    {
        $this->post = new Post();
    }

    public function testSetAndGetContent(): void
    {
        $this->post->setContent('Bonjour voisins !');
        $this->assertSame('Bonjour voisins !', $this->post->getContent());
    }

    public function testSetAndGetUserId(): void
    {
        $this->post->setUserId(42);
        $this->assertSame(42, $this->post->getUserId());
    }

    public function testSetAndGetQuartierId(): void
    {
        $this->post->setQuartierId(7);
        $this->assertSame(7, $this->post->getQuartierId());
    }

    public function testIdIsNullByDefault(): void
    {
        $this->assertNull($this->post->getId());
    }

    public function testCreatedAtIsSetOnConstruct(): void
    {
        $before = new \DateTime('-1 second');
        $post   = new Post();
        $after  = new \DateTime('+1 second');

        $this->assertGreaterThanOrEqual($before, $post->getCreatedAt());
        $this->assertLessThanOrEqual($after, $post->getCreatedAt());
    }

    public function testContentCanContainHtmlAsText(): void
    {
        $xss = '<script>alert("xss")</script>';
        $this->post->setContent($xss);
        // L'entité stocke le contenu tel quel — c'est React qui l'échappe à l'affichage
        $this->assertSame($xss, $this->post->getContent());
    }

    public function testFluentSetterReturnsPost(): void
    {
        $result = $this->post->setContent('test');
        $this->assertInstanceOf(Post::class, $result);
    }
}
