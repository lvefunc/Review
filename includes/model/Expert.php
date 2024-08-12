<?php

namespace Review\Model;

use MiniORM\Entity;
use User;

/**
 * @Table(name: "review_expert")
 */
final class Expert extends Entity {
    /**
     * @Column(name: "user", type: "int", nullable: false)
     */
    private User $user;

    /**
     * @OneToMany(target: "Review\Model\Competence", mappedBy: "expert")
     */
    private array $competencies = [];

    public function __construct( User $user ) {
        parent::__construct();
        $this->setUser( $user );
    }

    public function getUser() : User {
        return $this->user;
    }

    public function setUser( User $user ) : void {
        $this->user = $user;
        $this->markAsDirty();
    }

    /**
     * @return Competence[]
     */
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