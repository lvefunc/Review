<?php

namespace Review\Workflow\Runtime\Action;

use MiniORM\Expression\Condition;
use MiniORM\Expression\Conjunction;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Model\Keyword;
use Review\Model\KeywordMatch;
use Review\Workflow\Runtime\Task\RtAssignKeywordsTask;
use Review\Workflow\Runtime\Task\RtVerifyKeywordsTask;
use StatusValue;
use Workflows\Runtime\Action\TaskAction;
use Workflows\Runtime\Task\RtTask;

final class UnassignKeywordAction extends TaskAction {
    private Keyword $keyword;

    public function __construct( RtTask $task, Keyword $keyword ) {
        parent::__construct( $task );
        $this->setKeyword( $keyword );
    }

    /**
     * @throws MWException
     * @throws ReflectionException
     */
    public function execute() : StatusValue {
        $this->verifyUser();

        $task = $this->getTask();
        $isAssignKeywordsTask = $task instanceof RtAssignKeywordsTask;
        $isVerifyKeywordsTask = $task instanceof RtVerifyKeywordsTask;

        if ( !$isAssignKeywordsTask && !$isVerifyKeywordsTask ) {
            return StatusValue::newFatal( "review-error-unsupported-task" );
        }

        $revision = $this->getTask()->getRevision();
        $keyword = $this->getKeyword();

        $conjunction = new Conjunction();
        $conjunction->add( new Condition( "revision_id", Condition::EqualTo, $revision->getID() ) );
        $conjunction->add( new Condition( "keyword_id", Condition::EqualTo, $keyword->getID() ) );

        $unitOfWork = UnitOfWork::getInstance();
        $match = $unitOfWork->findSingle( KeywordMatch::class, $conjunction );

        if ( $match ) {
            $match->markAsRemoved();
            $unitOfWork->commit();

            return StatusValue::newGood();
        }

        return StatusValue::newFatal( "review-error-match-does-not-exist" );
    }

    public function getKeyword() : Keyword {
        return $this->keyword;
    }

    public function setKeyword( Keyword $keyword ) : void {
        $this->keyword = $keyword;
    }
}