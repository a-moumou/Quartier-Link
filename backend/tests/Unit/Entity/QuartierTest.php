<?php

namespace App\Tests\Unit\Entity;

use App\Entity\Quartier;
use App\Enum\QuartierStatus;
use PHPUnit\Framework\TestCase;

class QuartierTest extends TestCase
{
    private Quartier $quartier;

    protected function setUp(): void
    {
        $this->quartier = new Quartier();
        $this->quartier->setName('Montmartre');
        $this->quartier->setAdminId(1);
    }

    public function testSetAndGetName(): void
    {
        $this->assertSame('Montmartre', $this->quartier->getName());
    }

    public function testGetNomAliasWorks(): void
    {
        $this->assertSame('Montmartre', $this->quartier->getNom());
    }

    public function testSetNomAlias(): void
    {
        $this->quartier->setNom('Belleville');
        $this->assertSame('Belleville', $this->quartier->getName());
    }

    public function testDefaultStatusIsEnAttente(): void
    {
        $this->assertSame(QuartierStatus::EN_ATTENTE, $this->quartier->getStatus());
    }

    public function testSetStatusActif(): void
    {
        $this->quartier->setStatus(QuartierStatus::ACTIF);
        $this->assertSame(QuartierStatus::ACTIF, $this->quartier->getStatus());
    }

    public function testSetStatusRejete(): void
    {
        $this->quartier->setStatus(QuartierStatus::REJETE);
        $this->assertSame(QuartierStatus::REJETE, $this->quartier->getStatus());
    }

    public function testSetAndGetDescription(): void
    {
        $this->quartier->setDescription('Beau quartier historique.');
        $this->assertSame('Beau quartier historique.', $this->quartier->getDescription());
    }

    public function testSetAndGetAddress(): void
    {
        $this->quartier->setAddress('75018 Paris');
        $this->assertSame('75018 Paris', $this->quartier->getAddress());
    }

    public function testSetAndGetLatitudeLongitude(): void
    {
        $this->quartier->setLatitude(48.8867);
        $this->quartier->setLongitude(2.3431);
        $this->assertEqualsWithDelta(48.8867, $this->quartier->getLatitude(), 0.0001);
        $this->assertEqualsWithDelta(2.3431, $this->quartier->getLongitude(), 0.0001);
    }

    public function testDefaultHasPendingUpdateIsFalse(): void
    {
        $this->assertFalse($this->quartier->hasPendingUpdate());
    }

    public function testSetHasPendingUpdate(): void
    {
        $this->quartier->setHasPendingUpdate(true);
        $this->assertTrue($this->quartier->hasPendingUpdate());
    }

    public function testSetAndGetPendingFields(): void
    {
        $this->quartier->setPendingName('Nouveau Nom');
        $this->quartier->setPendingDescription('Nouvelle description');
        $this->quartier->setPendingAddress('75001 Paris');

        $this->assertSame('Nouveau Nom', $this->quartier->getPendingName());
        $this->assertSame('Nouvelle description', $this->quartier->getPendingDescription());
        $this->assertSame('75001 Paris', $this->quartier->getPendingAddress());
    }

    public function testAdminIdAlias(): void
    {
        $this->assertSame(1, $this->quartier->getCreateurId());
        $this->quartier->setCreateurId(42);
        $this->assertSame(42, $this->quartier->getAdminId());
    }

    public function testCreatedAtIsSetOnConstruct(): void
    {
        $before = new \DateTime('-1 second');
        $q      = new Quartier();
        $after  = new \DateTime('+1 second');

        $this->assertGreaterThanOrEqual($before, $q->getCreatedAt());
        $this->assertLessThanOrEqual($after, $q->getCreatedAt());
    }

    public function testNullableLatitudeLongitude(): void
    {
        $q = new Quartier();
        $this->assertNull($q->getLatitude());
        $this->assertNull($q->getLongitude());
    }
}
