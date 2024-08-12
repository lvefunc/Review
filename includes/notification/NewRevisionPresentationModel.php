<?php

namespace Review\Notification;

use EchoEventPresentationModel;
use Message;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Model\Revision;
use Title;

final class NewRevisionPresentationModel extends EchoEventPresentationModel {
    public function getIconType() : string {
        return "review-new-revision";
    }

    /**
     * @throws ReflectionException
     * @throws MWException
     */
    public function getHeaderMessage() : Message {
        $unitOfWork = UnitOfWork::getInstance();

        if ( $this->isBundled() ) {
            $message = $this->msg( "review-notification-new-revision-bundled" );
            $message->params( $this->getBundleCount() );
        } else {
            $revision = $unitOfWork->findByID( Revision::class, $this->event->getExtraParam( "id" ) );

            $message = $this->msg( "review-notification-new-revision" );
            $message->params( $revision->getEdit()->getTitle()->getText() );
            $message->params( $revision->getID() );
        }

        return $message;
    }

    public function getPrimaryLink() {
        return $this->getPageLink( Title::newFromText( "Special:Review" ), "", true );
    }
}