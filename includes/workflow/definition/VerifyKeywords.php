<?php

namespace Review\Workflow\Definition;

use Exception;
use Review\Workflow\Runtime\Activity\RtVerifyKeywords;
use Workflows\Definition\Element\Activity\UserActivity;
use Workflows\Runtime\Element\RtElement;

/**
 * @Table(name: "review_workflow_definition_verify_keywords")
 * @BaseEntity(name: "Workflows\Definition\Element\Activity\UserActivity")
 */
final class VerifyKeywords extends UserActivity {
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
     * @throws Exception
     */
    public function createRuntimeInstance() : RtElement {
        return new RtVerifyKeywords(
            $this->getName(),
            $this->getRevisionVariableName(),
            $this->getNewKeywordsExistVariableName()
        );
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