<?php

namespace Review\Workflow\Runtime\Action;

use Exception;
use MiniORM\UnitOfWork;
use MWException;
use Review\Model\Comment;
use Review\Model\Range;
use Review\Workflow\Runtime\Task\RtReviewRevisionTask;
use StatusValue;
use Workflows\Runtime\Action\TaskAction;
use Workflows\Runtime\Task\RtTask;

final class CreateRangeAction extends TaskAction {
    private Comment $comment;
    private string $startContainer;
    private string $endContainer;
    private int $startOffset;
    private int $endOffset;

    public function __construct(
        RtTask $task, Comment $comment, string $startContainer, string $endContainer, int $startOffset, int $endOffset
    ) {
        parent::__construct( $task );
        $this->setComment( $comment );
        $this->setStartContainer( $startContainer );
        $this->setEndContainer( $endContainer );
        $this->setStartOffset( $startOffset );
        $this->setEndOffset( $endOffset );
    }

    /**
     * @throws MWException
     * @throws Exception
     */
    public function execute() : StatusValue {
        $this->verifyUser();

        if ( !( $this->getTask() instanceof RtReviewRevisionTask ) ) {
            return StatusValue::newFatal( "review-error-unsupported-task" );
        }

        $range = new Range(
            $this->getComment(),
            $this->getStartContainer(),
            $this->getEndContainer(),
            $this->getStartOffset(),
            $this->getEndOffset()
        );

        $unitOfWork = UnitOfWork::getInstance();
        $unitOfWork->commit();

        return StatusValue::newGood( $range );
    }

    public function getComment() : Comment {
        return $this->comment;
    }

    public function setComment( Comment $comment ) : void {
        $this->comment = $comment;
    }

    public function getStartContainer() : string {
        return $this->startContainer;
    }

    public function setStartContainer( string $startContainer ) : void {
        $this->startContainer = $startContainer;
    }

    public function getEndContainer() : string {
        return $this->endContainer;
    }

    public function setEndContainer( string $endContainer ) : void {
        $this->endContainer = $endContainer;
    }

    public function getStartOffset() : int {
        return $this->startOffset;
    }

    public function setStartOffset( int $startOffset ) : void {
        $this->startOffset = $startOffset;
    }

    public function getEndOffset() : int {
        return $this->endOffset;
    }

    public function setEndOffset( int $endOffset ) : void {
        $this->endOffset = $endOffset;
    }
}