<?php

namespace Review\Workflow\Runtime\Task;

use Review\Model\Keyword;
use User;
use Workflows\Runtime\Element\Activity\RtUserActivity;
use Workflows\Runtime\Task\RtTask;

/**
 * @Table(name: "review_workflow_runtime_create_competence_task")
 * @BaseEntity(name: "Workflows\Runtime\Task\RtTask")
 */
final class RtCreateCompetenceTask extends RtTask {
    /**
     * @Column(name: "keyword_id", type: "int", nullable: false)
     * @OneToOne(target: "Review\Model\Keyword")
     */
    private Keyword $keyword;

    public function __construct( RtUserActivity $userActivity, User $assignee, Keyword $keyword) {
        parent::__construct( $userActivity, $assignee );
        $this->setKeyword( $keyword );
    }

    public function getKeyword() : Keyword {
        return $this->keyword;
    }

    public function setKeyword( Keyword $keyword ) : void {
        $this->keyword = $keyword;
        $this->markAsDirty();
    }
}