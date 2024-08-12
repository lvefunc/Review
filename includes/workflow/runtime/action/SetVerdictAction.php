<?php

namespace Review\Workflow\Runtime\Action;

use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Workflow\Runtime\Task\RtReviewRevisionTask;
use StatusValue;
use Workflows\Runtime\Action\TaskAction;
use Workflows\Runtime\Task\RtTask;

final class SetVerdictAction extends TaskAction {
    private bool $verdict;

    public function __construct( RtTask $task, bool $verdict ) {
        parent::__construct( $task );
        $this->setVerdict( $verdict );
    }

    /**
     * @throws MWException
     * @throws ReflectionException
     */
    public function execute() : StatusValue {
        $this->verifyUser();

        if ( !( $this->getTask() instanceof RtReviewRevisionTask ) ) {
            return StatusValue::newFatal( "review-error-unsupported-task" );
        }

        $this->getTask()->setVerdict( $this->getVerdict() );

        $unitOfWork = UnitOfWork::getInstance();
        $unitOfWork->commit();

        return StatusValue::newGood();
    }

    public function getVerdict() : bool {
        return $this->verdict;
    }

    public function setVerdict( bool $verdict ) : void {
        $this->verdict = $verdict;
    }
}