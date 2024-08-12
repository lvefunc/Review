<?php

namespace Review\Workflow\Runtime\Task;

use Review\Model\Competence;
use Review\Model\Revision;
use User;
use Workflows\Runtime\Element\Activity\RtUserActivity;
use Workflows\Runtime\Task\RtTask;

/**
 * @Table(name: "review_workflow_runtime_verify_keywords_task")
 * @BaseEntity(name: "Workflows\Runtime\Task\RtTask")
 */
final class RtVerifyKeywordsTask extends RtTask {
    /**
     * @Column(name: "revision_id", type: "int", nullable: false)
     * @OneToOne(target: "Review\Model\Revision")
     */
    private Revision $revision;

    /**
     * @Column(name: "competence_id", type: "int", nullable: false)
     * @OneToOne(target: "Review\Model\Competence")
     */
    private Competence $competence;

    public function __construct( RtUserActivity $userActivity, User $assignee, Revision $revision, Competence $competence ) {
        parent::__construct( $userActivity, $assignee );
        $this->setRevision( $revision );
        $this->setCompetence( $competence );
    }

    public function getRevision() : Revision {
        return $this->revision;
    }

    public function setRevision( Revision $revision ) : void {
        $this->revision = $revision;
        $this->markAsDirty();
    }

    public function getCompetence() : Competence {
        return $this->competence;
    }

    public function setCompetence( Competence $competence ) : void {
        $this->competence = $competence;
        $this->markAsDirty();
    }
}