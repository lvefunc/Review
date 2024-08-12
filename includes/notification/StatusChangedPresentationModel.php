<?php

namespace Review\Notification;

use EchoEventPresentationModel;
use Message;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Enumeration\RevisionStatus;
use Review\Model\Revision;
use Title;

final class StatusChangedPresentationModel extends EchoEventPresentationModel {
    public function getIconType() : string {
        return "review-status-changed";
    }

    /**
     * @throws ReflectionException
     * @throws MWException
     */
    public function getHeaderMessage() : Message {
        $unitOfWork = UnitOfWork::getInstance();

        if ( $this->isBundled() ) {
            $message = $this->msg( "review-notification-status-changed-bundled" );
            $message->params( $this->getBundleCount() );
        } else {
            $revision = $unitOfWork->findByID( Revision::class, $this->event->getExtraParam( "id" ) );

            $message = $this->msg( "review-notification-status-changed" );
            $message->params( $revision->getEdit()->getTitle()->getText() );
            $message->params( $revision->getID() );
            $message->params( $this->getLocalisedRevisionStatus( $revision->getStatus() )->text() );
        }

        return $message;
    }

    /**
     * @throws MWException
     */
    public function getLocalisedRevisionStatus( int $status ) : Message {
        switch ( $status ) {
            case RevisionStatus::New:
                return $this->msg( "review-model-revision-new" );
            case RevisionStatus::Queried:
                return $this->msg( "review-model-revision-queried" );
            case RevisionStatus::Current:
                return $this->msg( "review-model-revision-current" );
            case RevisionStatus::Rejected:
                return $this->msg( "review-model-revision-rejected" );
            case RevisionStatus::Legacy:
                return $this->msg( "review-model-revision-legacy" );
            default:
                throw new MWException( "Unsupported status value" );
        }
    }

    public function getPrimaryLink() {
        return $this->getPageLink( Title::newFromText( "Special:Review" ), "", true );
    }
}