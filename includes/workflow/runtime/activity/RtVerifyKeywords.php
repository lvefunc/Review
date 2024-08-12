<?php

namespace Review\Workflow\Runtime\Activity;

use Exception;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Enumeration\KeywordStatus;
use Review\Model\Keyword;
use Review\Model\Revision;
use Review\Workflow\Runtime\Task\RtVerifyKeywordsTask;
use Workflows\Enumeration\ExecutionState;
use Workflows\Runtime\Element\Activity\RtUserActivity;
use Workflows\Value\Boolean;

/**
 * @Table(name: "review_workflow_runtime_verify_keywords")
 * @BaseEntity(name: "Workflows\Runtime\Element\Activity\RtUserActivity")
 */
final class RtVerifyKeywords extends RtUserActivity {
    /**
     * @Column(name: "revision_variable_name", type: "varbinary", length: 255, nullable: false)
     */
    private string $revisionVariableName;

    /**
     * @Column(name: "new_keywords_exist_variable_name", type: "varbinary", length: 255, nullable: false)
     */
    private string $newKeywordsExistVariableName;

    public function __construct( string $name, string $revisionVariableName, string $newKeywordsExistVariableName ) {
        parent::__construct( $name );
        $this->setRevisionVariableName( $revisionVariableName );
        $this->setNewKeywordsExistVariableName( $newKeywordsExistVariableName );
    }

    /**
     * @throws ReflectionException
     * @throws MWException
     * @throws Exception
     */
    protected function initialize() : void {
        $unitOfWork = UnitOfWork::getInstance();
        $context = $this->getWorkflow()->getContext();
        $revisionID = $context->getVariableValue( $this->getRevisionVariableName() )->dereference();
        $revision = $unitOfWork->findByID( Revision::class, $revisionID );

        $matches = $revision->getMatches();

        $verified = [];

        foreach ( $matches as $match ) {
            $keyword = $match->getKeyword();

            if ( $keyword->getStatus() === KeywordStatus::Verified ) {
                $verified[] = $keyword;
            }
        }

        if ( count( $verified ) === 0 ) {
            $this->end();
        } else {
            foreach ( $verified as $keyword ) {
                $competencies = $keyword->getCompetencies();
                $competence = $competencies[array_rand( $competencies )];
                $assignee = $competence->getExpert()->getUser();
                $owner = $this->getWorkflow()->getOwner();

                if ( $owner->equals( $assignee ) ) {
                    array_splice( $competencies, array_search( $competence, $competencies ), 1 );

                    if ( count( $competencies ) ) {
                        $competence = $competencies[array_rand( $competencies )];
                        $assignee = $competence->getExpert()->getUser();
                    }
                }

                $this->addTask( new RtVerifyKeywordsTask( $this, $assignee, $revision, $competence ) );
            }

            $k = 0;

            foreach ( $this->getTasks() as $task ) {
                if ( $task->getState()->getExecutionState() === ExecutionState::InProgress ) {
                    $k++;
                }
            }

            $this->setQuorum( $k );
        }
    }

    /**
     * @throws ReflectionException
     * @throws MWException
     * @throws Exception
     */
    protected function postExecution() {
        $unitOfWork = UnitOfWork::getInstance();
        $context = $this->getWorkflow()->getContext();
        $revisionID = $context->getVariableValue( $this->getRevisionVariableName() )->dereference();
        $revision = $unitOfWork->findByID( Revision::class, $revisionID );

        $matches = $revision->getMatches();

        foreach ( $matches as $match ) {
            $keyword = $match->getKeyword();

            if ( $keyword->getStatus() === KeywordStatus::New ) {
                $context->createVariable( $this->getNewKeywordsExistVariableName(), new Boolean( true ) );

                return;
            }
        }

        $context->createVariable( $this->getNewKeywordsExistVariableName(), new Boolean( false ) );
    }

    public function getRevisionVariableName() : string {
        return $this->revisionVariableName;
    }

    public function setRevisionVariableName( string $revisionVariableName ) : void {
        $this->revisionVariableName = $revisionVariableName;
        $this->markAsDirty();
    }

    public function getNewKeywordsExistVariableName() : string {
        return $this->newKeywordsExistVariableName;
    }

    public function setNewKeywordsExistVariableName( string $newKeywordsExistVariableName ) : void {
        $this->newKeywordsExistVariableName = $newKeywordsExistVariableName;
        $this->markAsDirty();
    }
}