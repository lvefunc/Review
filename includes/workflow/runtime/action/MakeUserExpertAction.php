<?php

namespace Review\Workflow\Runtime\Action;

use Exception;
use MiniORM\Expression\Condition;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Model\Expert;
use Review\Workflow\Runtime\Task\RtCreateCompetenceTask;
use StatusValue;
use User;
use Workflows\Runtime\Action\TaskAction;
use Workflows\Runtime\Task\RtTask;

final class MakeUserExpertAction extends TaskAction {
    private User $user;

    public function __construct( RtTask $task, User $user ) {
        parent::__construct( $task );
        $this->setUser( $user );
    }

    /**
     * @throws MWException
     * @throws ReflectionException
     * @throws Exception
     */
    public function execute() : StatusValue {
        $this->verifyUser();

        if ( !( $this->getTask() instanceof RtCreateCompetenceTask ) ) {
            return StatusValue::newFatal( "review-error-unsupported-task" );
        }

        $condition = new Condition( "user", Condition::EqualTo, $this->getUser()->getId() );

        $unitOfWork = UnitOfWork::getInstance();
        $expert = $unitOfWork->findSingle( Expert::class, $condition );

        if ( $expert ) {
            return StatusValue::newFatal( "review-error-expert-exists" );
        }

        $expert = new Expert( $this->getUser() );

        $unitOfWork = UnitOfWork::getInstance();
        $unitOfWork->commit();

        return StatusValue::newGood( $expert );
    }

    public function getUser() : User {
        return $this->user;
    }

    public function setUser( User $user ) : void {
        $this->user = $user;
    }
}