<?php

namespace App\Tests\Unit\Enum;

use App\Enum\QuartierStatus;
use PHPUnit\Framework\TestCase;

class QuartierStatusTest extends TestCase
{
    public function testCaseValues(): void
    {
        $this->assertSame('EN_ATTENTE', QuartierStatus::EN_ATTENTE->value);
        $this->assertSame('ACTIF',      QuartierStatus::ACTIF->value);
        $this->assertSame('REJETE',     QuartierStatus::REJETE->value);
    }

    public function testFromValue(): void
    {
        $this->assertSame(QuartierStatus::ACTIF,      QuartierStatus::from('ACTIF'));
        $this->assertSame(QuartierStatus::EN_ATTENTE, QuartierStatus::from('EN_ATTENTE'));
        $this->assertSame(QuartierStatus::REJETE,     QuartierStatus::from('REJETE'));
    }

    public function testTryFromInvalidReturnsNull(): void
    {
        $this->assertNull(QuartierStatus::tryFrom('UNKNOWN'));
    }

    public function testExactlyThreeCases(): void
    {
        $this->assertCount(3, QuartierStatus::cases());
    }
}
