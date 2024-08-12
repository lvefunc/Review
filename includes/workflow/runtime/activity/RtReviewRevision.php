<?php

namespace Review\Workflow\Runtime\Activity;

use EchoEvent;
use Exception;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Enumeration\RevisionStatus;
use Review\Model\Revision;
use Review\Workflow\Runtime\Task\RtReviewRevisionTask;
use Workflows\Enumeration\ExecutionState;
use Workflows\Runtime\Element\Activity\RtUserActivity;

/**
 * @Table(name: "review_workflow_runtime_review_revision")
 * @BaseEntity(name: "Workflows\Runtime\Element\Activity\RtUserActivity")
 */
final class RtReviewRevision extends RtUserActivity {
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

            $this->addTask( new RtReviewRevisionTask( $this, $assignee, $revision, $competence ) );
        }

        $k = 0;

        foreach ( $this->getTasks() as $task ) {
            if ( $task->getState()->getExecutionState() === ExecutionState::InProgress ) {
                $k++;
            }
        }

        $this->setQuorum( $k );
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

        $verdict = true;

        foreach ( $this->getTasks() as $task ) {
            $verdict &= $task->getVerdict();
        }

        if ( $verdict ) {
            $revision->setStatus( RevisionStatus::Current );
            $revision->publish();
        } else {
            $revision->setStatus( RevisionStatus::Rejected );

            EchoEvent::create( [
                "type" => "review-status-changed",
                "extra" => [
                    "id" => $revision->getID()
                ]
            ] );
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