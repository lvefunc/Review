<?php

namespace Review\Model;

use MiniORM\Entity;
use User;

/**
 * @Table(name: "review_comment")
 */
final class Comment extends Entity {
    /**
     * @Column(name: "revision_id", type: "int", nullable: false)
     * @ManyToOne(target: "Review\Model\Revision")
     */
    private Revision $revision;

    /**
     * @Column(name: "text", type: "varbinary", length: 255, nullable: false)
     */
    private string $text;

    /**
     * @Column(name: "commentator", type: "int", nullable: false)
     */
    private User $commentator;

    /**
     * @OneToMany(target: "Review\Model\Range", mappedBy: "comment")
     */
    private array $ranges = [];

    public function __construct( Revision $revision, string $text, User $commentator ) {
        parent::__construct();
        $this->setRevision( $revision );
        $this->setText( $text );
        $this->setCommentator( $commentator );
    }

    public function getRevision() : Revision {
        return $this->revision;
    }

    public function setRevision( Revision $revision ) : void {
        $this->revision = $revision;
        $this->revision->addComment( $this );
        $this->markAsDirty();
    }

    public function getText() : string {
        return $this->text;
    }

    public function setText( string $text ) : void {
        $this->text = $text;
        $this->markAsDirty();
    }

    public function getCommentator() : User {
        return $this->commentator;
    }

    public function setCommentator( User $commentator ) : void {
        $this->commentator = $commentator;
        $this->markAsDirty();
    }

    public function getRanges() : array {
        return $this->ranges;
    }

    public function addRange( Range $range ) : void {
        foreach ( $this->ranges as $existing ) {
            if ( $existing->equals( $range ) ) {
                return;
            }
        }

        $this->ranges[] = $range;
    }
}