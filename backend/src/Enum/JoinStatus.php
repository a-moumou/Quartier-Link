<?php

namespace App\Enum;

enum JoinStatus: string
{
    case EN_ATTENTE = 'EN_ATTENTE';
    case ACCEPTEE   = 'ACCEPTEE';
    case REFUSEE    = 'REFUSEE';
}
