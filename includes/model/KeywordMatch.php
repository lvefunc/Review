<?php

namespace Review\Model;

use MiniORM\Entity;

/**
 * @Table(name: "review_match")
 */
final class KeywordMatch extends Entity {
    /**
     * @Column(name: "revision_id", type: "int", nullable: false)
     * @ManyToOne(target: "Review\Model\Revision")
     */
    private Revision $revision;

    /**
     * @Column(name: "keyword_id", type: "int", nullable: false)
     * @ManyToOne(target: "Review\Model\Keyword")
     */
    private Keyword $keyword;

    public function __construct( Revision $revision, Keyword $keyword ) {
        parent::__construct();
        $this->setRevision( $revision );
        $this->setKeyword( $keyword );
    }

    public function getRevision() : Revision {
        return $this->revision;
    }

    public function setRevision( Revision $revision ) : void {
        $this->revision = $revision;
        $this->revision->addMatch( $this );
        $this->markAsDirty();
    }

    public function getKeyword() : Keyword {
        return $this->keyword;
    }

    public function setKeyword( Keyword $keyword ) : void {
        $this->keyword = $keyword;
        $this->keyword->addMatch( $this );
        $this->markAsDirty();
    }
}