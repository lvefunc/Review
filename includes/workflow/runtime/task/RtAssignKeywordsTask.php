<?php

namespace Review\Workflow\Runtime\Task;

use Review\Model\Revision;
use User;
use Workflows\Runtime\Element\Activity\RtUserActivity;
use Workflows\Runtime\Task\RtTask;

/**
 * @Table(name: "review_workflow_runtime_assign_keywords_task")
 * @BaseEntity(name: "Workflows\Runtime\Task\RtTask")
 */
final class RtAssignKeywordsTask extends RtTask {
    /**
     * @Column(name: "revision_id", type: "int", nullable: false)
     * @OneToOne(target: "Review\Model\Revision")
     */
    private Revision $revision;

    public function __construct( RtUserActivity $userActivity, User $assignee, Revision $revision ) {
        parent::__construct( $userActivity, $assignee );
        $this->setRevision( $revision );
    }

    public function getRevision() : Revision {
        return $this->revision;
    }

    public function setRevision( Revision $revision ) : void {
        $this->revision = $revision;
        $this->markAsDirty();
    }
}