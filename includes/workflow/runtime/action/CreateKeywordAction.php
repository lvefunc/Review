<?php

namespace Review\Workflow\Runtime\Action;

use Exception;
use MediaWiki\MediaWikiServices;
use Message;
use MiniORM\Expression\Condition;
use MiniORM\Expression\Disjunction;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use RequestContext;
use Review\Model\Keyword;
use Review\Model\Synonym;
use Review\Utils;
use Review\Workflow\Runtime\Task\RtAssignKeywordsTask;
use Review\Workflow\Runtime\Task\RtVerifyKeywordsTask;
use StatusValue;
use Workflows\Runtime\Action\TaskAction;
use Workflows\Runtime\Task\RtTask;

final class CreateKeywordAction extends TaskAction {
    private string $keywordName;
    private array $synonymNames;

    public function __construct( RtTask $task, string $keywordName, array $synonymNames ) {
        parent::__construct( $task );
        $this->setKeywordName( $keywordName );
        $this->setSynonymNames( $synonymNames );
    }

    /**
     * @throws MWException
     * @throws ReflectionException
     * @throws Exception
     */
    public function execute() : StatusValue {
        $this->verifyUser();

        $task = $this->getTask();
        $isAssignKeywordsTask = $task instanceof RtAssignKeywordsTask;
        $isVerifyKeywordsTask = $task instanceof RtVerifyKeywordsTask;

        if ( !$isAssignKeywordsTask && !$isVerifyKeywordsTask ) {
            return StatusValue::newFatal( "review-error-unsupported-task" );
        }

        $condition = new Condition( "name", Condition::EqualTo, $this->getKeywordName() );

        $unitOfWork = UnitOfWork::getInstance();
        $keyword = $unitOfWork->findSingle( Keyword::class, $condition );

        if ( $keyword ) {
            return StatusValue::newFatal( "review-error-keyword-exists" );
        }

        if ( !empty( $this->getSynonymNames() ) ) {
            $disjunction = new Disjunction();

            foreach ( $this->getSynonymNames() as $synonymName ) {
                $disjunction->add( new Condition( "name", Condition::EqualTo, $synonymName ) );
            }

            $synonyms = $unitOfWork->findMultiple( Synonym::class, $disjunction );

            if ( $synonyms ) {
                return StatusValue::newFatal( "review-error-synonyms-exist" );
            }
        }

        $keyword = new Keyword( $this->getKeywordName() );

        new Synonym( $keyword->getName(), $keyword );

        foreach ( $this->getSynonymNames() as $synonymName ) {
            new Synonym( $synonymName, $keyword );
        }

        $unitOfWork->commit();

        return StatusValue::newGood( $keyword );
    }

    public function getKeywordName() : string {
        return $this->keywordName;
    }

    public function setKeywordName( string $keywordName ) : void {
        $this->keywordName = Utils::normalize( $keywordName );
    }

    public function getSynonymNames() : array {
        return $this->synonymNames;
    }

    public function setSynonymNames( array $synonymNames ) : void {
        $this->synonymNames = array_map( function ( $synonymName ) {
            return Utils::normalize( $synonymName );
        }, $synonymNames );
    }
}