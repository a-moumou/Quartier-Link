<?php

namespace App\Enum;

enum VerificationStatus: string
{
    case NON_VERIFIE = 'NON_VERIFIE';
    case EN_ATTENTE  = 'EN_ATTENTE';
    case VERIFIE     = 'VERIFIE';
}
