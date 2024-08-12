<?php

namespace Review\Workflow\Runtime\Action;

use Exception;
use MiniORM\Expression\Condition;
use MiniORM\Expression\Conjunction;
use MiniORM\UnitOfWork;
use MWException;
use Review\Model\Competence;
use Review\Model\Expert;
use Review\Workflow\Runtime\Task\RtCreateCompetenceTask;
use StatusValue;
use Workflows\Runtime\Action\TaskAction;
use Workflows\Runtime\Task\RtTask;

final class CreateCompetenceAction extends TaskAction {
    private Expert $expert;

    public function __construct( RtTask $task, Expert $expert ) {
        parent::__construct( $task );
        $this->setExpert( $expert );
    }

    /**
     * @throws MWException
     * @throws Exception
     */
    public function execute() : StatusValue {
        $this->verifyUser();

        if ( !( $this->getTask() instanceof RtCreateCompetenceTask ) ) {
            return StatusValue::newFatal( "review-error-unsupported-task" );
        }

        $conjunction = new Conjunction();
        $conjunction->add( new Condition( "expert_id", Condition::EqualTo, $this->getExpert()->getID() ) );
        $conjunction->add( new Condition( "keyword_id", Condition::EqualTo, $this->getTask()->getKeyword()->getID() ) );

        $unitOfWork = UnitOfWork::getInstance();
        $competence = $unitOfWork->findSingle( Competence::class, $conjunction );

        if ( $competence ) {
            return StatusValue::newFatal( "review-error-competence-exists" );
        }

        $competence = new Competence( $this->getExpert(), $this->getTask()->getKeyword() );
        $unitOfWork->commit();

        return StatusValue::newGood( $competence );
    }

    public function getExpert() : Expert {
        return $this->expert;
    }

    public function setExpert( Expert $expert ) : void {
        $this->expert = $expert;
    }
}