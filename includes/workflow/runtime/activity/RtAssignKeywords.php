<?php

namespace Review\Workflow\Runtime\Activity;

use Exception;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Model\Revision;
use Review\Workflow\Runtime\Task\RtAssignKeywordsTask;
use Workflows\Runtime\Element\Activity\RtUserActivity;

/**
 * @Table(name: "review_workflow_runtime_assign_keywords")
 * @BaseEntity(name: "Workflows\Runtime\Element\Activity\RtUserActivity")
 */
final class RtAssignKeywords extends RtUserActivity {
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
    protected function initialize() {
        $unitOfWork = UnitOfWork::getInstance();
        $context = $this->getWorkflow()->getContext();
        $revisionID = $context->getVariableValue( $this->getRevisionVariableName() )->dereference();
        $revision = $unitOfWork->findByID( Revision::class, $revisionID );

        $this->addTask( new RtAssignKeywordsTask( $this, $revision->getOwner(), $revision ) );
        $this->setQuorum( 1 );
    }

    protected function postExecution() {
        // Nothing to do
    }

    public function getRevisionVariableName() : string {
        return $this->revisionVariableName;
    }

    public function setRevisionVariableName( string $revisionVariableName ) : void {
        $this->revisionVariableName = $revisionVariableName;
        $this->markAsDirty();
    }
}