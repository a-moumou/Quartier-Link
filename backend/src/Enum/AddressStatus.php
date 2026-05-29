<?php

namespace App\Enum;

enum AddressStatus: string
{
    case EN_ANALYSE = 'EN_ANALYSE';
    case VALIDE     = 'VALIDE';
    case REFUSE     = 'REFUSE';
}
