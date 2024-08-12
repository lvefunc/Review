<?php

namespace Review\Workflow\Runtime\Activity;

use Exception;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Enumeration\KeywordStatus;
use Review\Model\Revision;
use Review\Workflow\Runtime\Task\RtCreateCompetenceTask;
use Workflows\Enumeration\ExecutionState;
use Workflows\Enumeration\RuntimeUserExpressionType;
use Workflows\Expression\RuntimeUserExpression;
use Workflows\Runtime\Element\Activity\RtUserActivity;

/**
 * @Table(name: "review_workflow_runtime_create_competencies")
 * @BaseEntity(name: "Workflows\Runtime\Element\Activity\RtUserActivity")
 */
final class RtCreateCompetencies extends RtUserActivity {
    /**
     * @Column(name: "revision_variable_name", type: "varbinary", length: 255, nullable: false)
     */
    private string $revisionVariableName;

    public function __construct( string $name, string $revisionVariableName ) {
        parent::__construct( $name );
        $this->setRevisionVariableName( $revisionVariableName );
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

        foreach ( $matches as $match ) {
            $keyword = $match->getKeyword();

            if ( $keyword->getStatus() === KeywordStatus::New ) {
                $assignee = ( new RuntimeUserExpression( RuntimeUserExpressionType::Sysop ) )->evaluate( $context );
                $this->addTask( new RtCreateCompetenceTask( $this, $assignee, $keyword ) );
            }
        }

        if ( count( $this->tasks ) === 0 ) {
            $this->end();
        } else {
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
                $keyword->setStatus( KeywordStatus::Verified );
            }
        }
    }

    public function getRevisionVariableName() : string {
        return $this->revisionVariableName;
    }

    public function setRevisionVariableName( string $revisionVariableName ) : void {
        $this->revisionVariableName = $revisionVariableName;
        $this->markAsDirty();
    }
}