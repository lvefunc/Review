<?php

namespace Review\Model;

use MiniORM\Entity;

/**
 * @Table(name: "review_synonym")
 */
final class Synonym extends Entity {
    /**
     * @Column(name: "name", type: "varbinary", length: 255, nullable: false)
     */
    private string $name;

    /**
     * @Column(name: "keyword_id", type: "int", nullable: false)
     * @ManyToOne(target: "Review\Model\Keyword")
     */
    private Keyword $keyword;

    public function __construct( string $name, Keyword $keyword ) {
        parent::__construct();
        $this->setName( $name );
        $this->setKeyword( $keyword );
    }

    public function getName() : string {
        return $this->name;
    }

    public function setName( string $name ) : void {
        $this->name = $name;
        $this->markAsDirty();
    }

    public function getKeyword() : Keyword {
        return $this->keyword;
    }

    public function setKeyword( Keyword $keyword ) : void {
        $this->keyword = $keyword;
        $this->keyword->addSynonym( $this );
        $this->markAsDirty();
    }
}