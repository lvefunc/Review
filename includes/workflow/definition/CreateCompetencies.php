<?php

namespace Review\Workflow\Definition;

use Exception;
use Review\Workflow\Runtime\Activity\RtCreateCompetencies;
use Workflows\Definition\Element\Activity\UserActivity;
use Workflows\Runtime\Element\RtElement;

/**
 * @Table(name: "review_workflow_definition_create_competencies")
 * @BaseEntity(name: "Workflows\Definition\Element\Activity\UserActivity")
 */
final class CreateCompetencies extends UserActivity {
    /**
     * @Column(name: "revision_variable_name", type: "varbinary", length: 255, nullable: false)
     */
    private string $revisionVariableName;

    public function __construct( string $name, string $revisionVariableName ) {
        parent::__construct( $name );
        $this->setRevisionVariableName( $revisionVariableName );
    }

    /**
     * @throws Exception
     */
    public function createRuntimeInstance() : RtElement {
        return new RtCreateCompetencies( $this->getName(), $this->getRevisionVariableName() );
    }

    public function getRevisionVariableName() : string {
        return $this->revisionVariableName;
    }

    public function setRevisionVariableName( string $revisionVariableName ) : void {
        $this->revisionVariableName = $revisionVariableName;
        $this->markAsDirty();
    }
}