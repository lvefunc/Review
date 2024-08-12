<?php

namespace Review\Workflow\Runtime\Action;

use Exception;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use RequestContext;
use Review\Model\Comment;
use Review\Workflow\Runtime\Task\RtReviewRevisionTask;
use StatusValue;
use Workflows\Runtime\Action\TaskAction;
use Workflows\Runtime\Task\RtTask;

final class CreateCommentAction extends TaskAction {
    private string $commentText;

    public function __construct( RtTask $task, string $commentText ) {
        parent::__construct( $task );
        $this->setCommentText( $commentText );
    }

    /**
     * @throws MWException
     * @throws ReflectionException
     * @throws Exception
     */
    public function execute() : StatusValue {
        $this->verifyUser();

        if ( !( $this->getTask() instanceof RtReviewRevisionTask ) ) {
            return StatusValue::newFatal( "review-error-unsupported-task" );
        }

        $comment = new Comment( $this->getTask()->getRevision(), $this->getCommentText(), RequestContext::getMain()->getUser() );

        $unitOfWork = UnitOfWork::getInstance();
        $unitOfWork->commit();

        return StatusValue::newGood( $comment );
    }

    public function getCommentText() : string {
        return $this->commentText;
    }

    public function setCommentText( string $commentText ) : void {
        $this->commentText = $commentText;
    }
}