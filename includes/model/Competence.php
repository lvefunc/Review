<?php

namespace Review\Model;

use MiniORM\Entity;

/**
 * @Table(name: "review_competence")
 */
final class Competence extends Entity {
    /**
     * @Column(name: "expert_id", type: "int", nullable: false)
     * @ManyToOne(target: "Review\Model\Expert")
     */
    private Expert $expert;

    /**
     * @Column(name: "keyword_id", type: "int", nullable: false)
     * @ManyToOne(target: "Review\Model\Keyword")
     */
    private Keyword $keyword;

    public function __construct( Expert $expert, Keyword $keyword ) {
        parent::__construct();
        $this->setExpert( $expert );
        $this->setKeyword( $keyword );
    }

    public function getExpert() : Expert {
        return $this->expert;
    }

    public function setExpert( Expert $expert ) : void {
        $this->expert = $expert;
        $this->expert->addCompetence( $this );
        $this->markAsDirty();
    }

    public function getKeyword() : Keyword {
        return $this->keyword;
    }

    public function setKeyword( Keyword $keyword ) : void {
        $this->keyword = $keyword;
        $this->keyword->addCompetence( $this );
        $this->markAsDirty();
    }
}