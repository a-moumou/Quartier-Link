<?php

namespace App\Tests\Unit\Entity;

use App\Entity\User;
use App\Enum\VerificationStatus;
use PHPUnit\Framework\TestCase;

class UserTest extends TestCase
{
    private User $user;

    protected function setUp(): void
    {
        $this->user = new User();
    }

    // ── Setters / Getters ──────────────────────────────────────

    public function testSetAndGetEmail(): void
    {
        $this->user->setEmail('alice@example.com');
        $this->assertSame('alice@example.com', $this->user->getEmail());
    }

    public function testSetAndGetFirstName(): void
    {
        $this->user->setFirstName('Alice');
        $this->assertSame('Alice', $this->user->getFirstName());
    }

    public function testSetAndGetLastName(): void
    {
        $this->user->setLastName('Dupont');
        $this->assertSame('Dupont', $this->user->getLastName());
    }

    public function testGetNomCombinesFirstAndLastName(): void
    {
        $this->user->setFirstName('Alice');
        $this->user->setLastName('Dupont');
        $this->assertSame('Alice Dupont', $this->user->getNom());
    }

    public function testGetNomWithNullFirstName(): void
    {
        $this->user->setFirstName(null);
        $this->user->setLastName('Dupont');
        $this->assertSame('Dupont', $this->user->getNom());
    }

    public function testSetNomSplitsOnFirstSpace(): void
    {
        $this->user->setNom('Alice Dupont');
        $this->assertSame('Alice', $this->user->getFirstName());
        $this->assertSame('Dupont', $this->user->getLastName());
    }

    public function testSetNomWithOnlyOneWord(): void
    {
        $this->user->setNom('Alice');
        $this->assertSame('Alice', $this->user->getFirstName());
        $this->assertSame('', $this->user->getLastName());
    }

    public function testSetNomEmptyStringDoesNothing(): void
    {
        $this->user->setFirstName('Before');
        $this->user->setNom('');
        $this->assertSame('Before', $this->user->getFirstName());
    }

    // ── Rôles ──────────────────────────────────────────────────

    public function testDefaultRoleIsUser(): void
    {
        $roles = $this->user->getRoles();
        $this->assertContains('ROLE_USER', $roles);
        $this->assertNotContains('ROLE_ADMIN_QUARTIER', $roles);
    }

    public function testAdminQuartierRoleIncludesRoleUser(): void
    {
        $this->user->setRole('ADMIN_QUARTIER');
        $roles = $this->user->getRoles();
        $this->assertContains('ROLE_ADMIN_QUARTIER', $roles);
        $this->assertContains('ROLE_USER', $roles);
        $this->assertNotContains('ROLE_ADMIN_GENERAL', $roles);
    }

    public function testAdminGeneralRoleIncludesAllRoles(): void
    {
        $this->user->setRole('ADMIN_GENERAL');
        $roles = $this->user->getRoles();
        $this->assertContains('ROLE_ADMIN_GENERAL', $roles);
        $this->assertContains('ROLE_ADMIN_QUARTIER', $roles);
        $this->assertContains('ROLE_USER', $roles);
    }

    // ── VerificationStatus ─────────────────────────────────────

    public function testDefaultStatusIsNonVerifie(): void
    {
        $this->assertSame(VerificationStatus::NON_VERIFIE, $this->user->getStatus());
    }

    public function testSetStatusVerifie(): void
    {
        $this->user->setStatus(VerificationStatus::VERIFIE);
        $this->assertSame(VerificationStatus::VERIFIE, $this->user->getStatus());
    }

    // ── UserInterface ──────────────────────────────────────────

    public function testGetUserIdentifierReturnsEmail(): void
    {
        $this->user->setEmail('test@test.com');
        $this->assertSame('test@test.com', $this->user->getUserIdentifier());
    }

    public function testEraseCredentialsDoesNothing(): void
    {
        $this->user->setPassword('hashed_password');
        $this->user->eraseCredentials();
        $this->assertSame('hashed_password', $this->user->getPassword());
    }

    // ── Address ────────────────────────────────────────────────

    public function testSetAndGetAddress(): void
    {
        $this->user->setAddress('10 rue de la Paix, Paris');
        $this->assertSame('10 rue de la Paix, Paris', $this->user->getAddress());
    }

    public function testGetAdresseAliasWorks(): void
    {
        $this->user->setAddress('12 boulevard Haussmann');
        $this->assertSame('12 boulevard Haussmann', $this->user->getAdresse());
    }

    // ── Timestamps ─────────────────────────────────────────────

    public function testCreatedAtIsSetOnConstruct(): void
    {
        $before = new \DateTime('-1 second');
        $user   = new User();
        $after  = new \DateTime('+1 second');

        $this->assertGreaterThanOrEqual($before, $user->getCreatedAt());
        $this->assertLessThanOrEqual($after, $user->getCreatedAt());
    }
}
