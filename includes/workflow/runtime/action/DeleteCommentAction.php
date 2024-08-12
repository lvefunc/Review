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

final class DeleteCommentAction extends TaskAction {
    private Comment $comment;

    public function __construct( RtTask $task, Comment $comment ) {
        parent::__construct( $task );
        $this->setComment( $comment );
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

        $comment = $this->getComment();

        if ( !RequestContext::getMain()->getUser()->equals( $comment->getCommentator() ) ) {
            return StatusValue::newFatal( "review-error-insufficient-rights" );
        }

        foreach ( $comment->getRanges() as $range ) {
            $range->markAsRemoved();
        }

        $comment->markAsRemoved();

        $unitOfWork = UnitOfWork::getInstance();
        $unitOfWork->commit();

        return StatusValue::newGood();
    }

    public function getComment() : Comment {
        return $this->comment;
    }

    public function setComment( Comment $comment ) : void {
        $this->comment = $comment;
    }
}