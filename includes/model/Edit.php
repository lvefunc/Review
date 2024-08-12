<?php

namespace Review\Model;

use MiniORM\Entity;
use Review\Enumeration\RevisionStatus;
use Title;

/**
 * @Table(name: "review_edit")
 */
final class Edit extends Entity {
    /**
     * @Column(name: "title", type: "varbinary", length: 255, nullable: false)
     */
    private Title $title;

    /**
     * @OneToMany(target: "Review\Model\Revision", mappedBy: "edit")
     */
    private array $revisions = [];

    public function __construct( Title $title ) {
        parent::__construct();
        $this->setTitle( $title );
    }

    public function getTitle() : Title {
        return $this->title;
    }

    public function setTitle( Title $title ) : void {
        $this->title = $title;
        $this->markAsDirty();
    }

    /**
     * @return Revision[]
     */
    public function getRevisions() : array {
        return $this->revisions;
    }

    public function getCurrentRevision() : ?Revision {
        foreach ( $this->revisions as $revision ) {
            if ( $revision->getStatus() === RevisionStatus::Current ) {
                return $revision;
            }
        }

        return null;
    }
}