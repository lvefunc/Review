<?php

namespace Review\Model;

use MiniORM\Entity;

/**
 * @Table(name: "review_range")
 */
final class Range extends Entity {
    /**
     * @Column(name: "comment_id", type: "int", nullable: false)
     * @ManyToOne(target: "Review\Model\Comment")
     */
    private Comment $comment;

    /**
     * @Column(name: "start_container", type: "varbinary", length: 255, nullable: false)
     */
    private string $startContainer;

    /**
     * @Column(name: "end_container", type: "varbinary", length: 255, nullable: false)
     */
    private string $endContainer;

    /**
     * @Column(name: "start_offset", type: "int", nullable: false)
     */
    private int $startOffset;

    /**
     * @Column(name: "end_offset", type: "int", nullable: false)
     */
    private int $endOffset;

    public function __construct( Comment $comment, string $startContainer, string $endContainer, int $startOffset, int $endOffset ) {
        parent::__construct();
        $this->setComment( $comment );
        $this->setStartContainer( $startContainer );
        $this->setEndContainer( $endContainer );
        $this->setStartOffset( $startOffset );
        $this->setEndOffset( $endOffset );
    }

    public function getComment() : Comment {
        return $this->comment;
    }

    public function setComment( Comment $comment ) : void {
        $this->comment = $comment;
        $this->comment->addRange( $this );
        $this->markAsDirty();
    }

    public function getStartContainer() : string {
        return $this->startContainer;
    }

    public function setStartContainer( string $startContainer ) : void {
        $this->startContainer = $startContainer;
        $this->markAsDirty();
    }

    public function getEndContainer() : string {
        return $this->endContainer;
    }

    public function setEndContainer( string $endContainer ) : void {
        $this->endContainer = $endContainer;
        $this->markAsDirty();
    }

    public function getStartOffset() : int {
        return $this->startOffset;
    }

    public function setStartOffset( int $startOffset ) : void {
        $this->startOffset = $startOffset;
        $this->markAsDirty();
    }

    public function getEndOffset() : int {
        return $this->endOffset;
    }

    public function setEndOffset( int $endOffset ) : void {
        $this->endOffset = $endOffset;
        $this->markAsDirty();
    }
}