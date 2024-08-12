<?php

namespace Review\Model;

use MiniORM\Entity;
use Review\Enumeration\KeywordStatus;

/**
 * @Table(name: "review_keyword")
 */
final class Keyword extends Entity {
    /**
     * @Column(name: "name", type: "varbinary", length: 255, nullable: false)
     */
    private string $name;

    /**
     * @Column(name: "status", type: "int", nullable: false)
     */
    private int $status;

    /**
     * @OneToMany(target: "Review\Model\Synonym", mappedBy: "keyword")
     */
    private array $synonyms = [];

    /**
     * @OneToMany(target: "Review\Model\KeywordMatch", mappedBy: "keyword")
     */
    private array $matches = [];

    /**
     * @OneToMany(target: "Review\Model\Competence", mappedBy: "keyword")
     */
    private array $competencies = [];

    public function __construct( string $name ) {
        parent::__construct();
        $this->setName( $name );
        $this->setStatus( KeywordStatus::New );
    }

    public function getName() : string {
        return $this->name;
    }

    public function setName( string $name ) : void {
        $this->name = $name;
        $this->markAsDirty();
    }

    public function getStatus() : int {
        return $this->status;
    }

    public function setStatus( int $status ) : void {
        $this->status = $status;
        $this->markAsDirty();
    }

    public function getSynonyms() : array {
        return $this->synonyms;
    }

    public function addSynonym( Synonym $synonym ) {
        foreach ( $this->synonyms as $existing ) {
            if ( $existing->equals( $synonym ) ) {
                return;
            }
        }

        $this->synonyms[] = $synonym;
    }

    public function getMatches() : array {
        return $this->matches;
    }

    public function addMatch( KeywordMatch $match ) {
        foreach ( $this->matches as $existing ) {
            if ( $existing->equals( $match ) ) {
                return;
            }
        }

        $this->matches[] = $match;
    }

    public function getCompetencies() : array {
        return $this->competencies;
    }

    public function addCompetence( Competence $competence ) {
        foreach ( $this->competencies as $existing ) {
            if ( $existing->equals( $competence ) ) {
                return;
            }
        }

        $this->competencies[] = $competence;
    }
}