<?php

namespace Review;

use Html;
use SpecialPage;

class Special extends SpecialPage {
    public function __construct() {
        parent::__construct( "Review" );
    }

    public function execute( $subPage ) {
        $this->setHeaders();
        $this->getOutput()->enableOOUI();
        $this->getOutput()->addModules( "ext.review.special" );
    }
}