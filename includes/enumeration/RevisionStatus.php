<?php

namespace Review\Enumeration;

use Workflows\Enumeration\Enumeration;

final class RevisionStatus extends Enumeration {
    public const New        = 0;
    public const Queried    = 1;
    public const Current    = 2;
    public const Rejected   = 3;
    public const Legacy     = 4;
}