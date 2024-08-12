<?php

namespace Review;

use EchoEvent;
use MiniORM\UnitOfWork;
use MWException;
use OutputPage;
use ReflectionException;
use RequestContext;
use Review\Model\Revision;

final class Utils {
    private function __construct() {
    }

    public static function normalize( string $text ) {
        $text = preg_replace( "/[^A-Za-zА-Яа-я1-9]+/mu", "", $text );
        $text = preg_replace( "/\s+/mu", " ", $text );

        return mb_strtolower( $text );
    }

    /**
     * @throws ReflectionException
     * @throws MWException
     */
    public static function preload( &$text ) {
        $context = RequestContext::getMain();
        $revID = $context->getRequest()->getInt( "revision" );

        if ( $revID === 0 ) {
            return;
        }

        $revision = UnitOfWork::getInstance()->findByID( Revision::class, $revID );
        $user = $context->getUser();

        if ( $revision->getOwner()->equals( $user ) ) {
            $text = $revision->getContent();
        } else {
            throw new MWException( "You have no right to change this revision" );
        }
    }

    public static function addRevIDToEditForm( OutputPage $outputPage, int $revID ) {
        $pattern = "/(?<=action=\")[^\"]+(?=\")/m";
        $html = $outputPage->getHTML();

        preg_match_all( $pattern, $html, $matches, PREG_SET_ORDER );
        $html = preg_replace( $pattern, $matches[ 0 ][ 0 ] . "&amp;revision=" . $revID, $html );

        $outputPage->clearHTML();
        $outputPage->addHTML( $html );
    }

    /**
     * @throws ReflectionException
     * @throws MWException
     */
    public static function locateUsers( EchoEvent $event ) : array {
        $revision = UnitOfWork::getInstance()->findByID( Revision::class, $event->getExtraParam( "id" ) );

        return [ $revision->getOwner() ];
    }
}