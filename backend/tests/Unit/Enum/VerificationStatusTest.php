<?php

namespace App\Tests\Unit\Enum;

use App\Enum\VerificationStatus;
use PHPUnit\Framework\TestCase;

class VerificationStatusTest extends TestCase
{
    public function testCaseValuesAreStrings(): void
    {
        $this->assertSame('NON_VERIFIE', VerificationStatus::NON_VERIFIE->value);
        $this->assertSame('EN_ATTENTE',  VerificationStatus::EN_ATTENTE->value);
        $this->assertSame('VERIFIE',     VerificationStatus::VERIFIE->value);
    }

    public function testFromValueReturnsCorrectCase(): void
    {
        $this->assertSame(VerificationStatus::NON_VERIFIE, VerificationStatus::from('NON_VERIFIE'));
        $this->assertSame(VerificationStatus::EN_ATTENTE,  VerificationStatus::from('EN_ATTENTE'));
        $this->assertSame(VerificationStatus::VERIFIE,     VerificationStatus::from('VERIFIE'));
    }

    public function testTryFromInvalidValueReturnsNull(): void
    {
        $this->assertNull(VerificationStatus::tryFrom('INVALIDE'));
        $this->assertNull(VerificationStatus::tryFrom(''));
    }

    public function testAllCasesArePresent(): void
    {
        $cases  = VerificationStatus::cases();
        $values = array_map(fn($c) => $c->value, $cases);

        $this->assertContains('NON_VERIFIE', $values);
        $this->assertContains('EN_ATTENTE',  $values);
        $this->assertContains('VERIFIE',     $values);
        $this->assertCount(3, $cases);
    }
}
