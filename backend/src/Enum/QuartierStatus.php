<?php

namespace App\Enum;

enum QuartierStatus: string
{
    case EN_ATTENTE = 'EN_ATTENTE';
    case ACTIF      = 'ACTIF';
    case REJETE     = 'REJETE';
}
