<?php

namespace Review\Model;

use CommentStoreComment;
use ContentHandler;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\SlotRecord;
use MiniORM\Entity;
use MiniORM\UnitOfWork;
use MWException;
use MWTimestamp;
use ParserOptions;
use ReflectionException;
use Review\Enumeration\RevisionStatus;
use User;

/**
 * @Table(name: "review_revision")
 */
final class Revision extends Entity {
    /**
     * @Column(name: "edit_id", type: "int", nullable: false)
     * @ManyToOne(target: "Review\Model\Edit")
     */
    private Edit $edit;

    /**
     * @Column(name: "parent_id", type: "int", nullable: true)
     * @OneToOne(target: "Review\Model\Revision")
     */
    private ?Revision $parent = null;

    /**
     * @Column(name: "owner", type: "int", nullable: false)
     */
    private User $owner;

    /**
     * @Column(name: "status", type: "int", nullable: false)
     */
    private int $status;

    /**
     * @OneToMany(target: "Review\Model\KeywordMatch", mappedBy: "revision")
     */
    private array $matches = [];

    /**
     * @OneToMany(target: "Review\Model\Comment", mappedBy: "revision")
     */
    private array $comments = [];

    /**
     * @Column(name: "content", type: "mediumblob", nullable: false)
     */
    private string $content;

    /**
     * @Column(name: "timestamp", type: "varbinary", length: 14, nullable: false)
     */
    private MWTimestamp $timestamp;

    /**
     * @Column(name: "summary", type: "varbinary", length: 255, nullable: false)
     */
    private string $summary;

    public function __construct(
        Edit $edit, ?Revision $parent, User $owner, string $content, MWTimestamp $timestamp, string $summary
    ) {
        parent::__construct();
        $this->setEdit( $edit );
        $this->setParent( $parent );
        $this->setOwner( $owner );
        $this->setStatus( RevisionStatus::New );
        $this->setContent( $content );
        $this->setTimestamp( $timestamp );
        $this->setSummary( $summary );

        if ( !is_null( $parent ) ) {
            foreach ( $parent->getMatches() as $match ) {
                $this->addMatch( new KeywordMatch( $this, $match->getKeyword() ) );
            }
        }
    }

    /**
     * @throws ReflectionException
     * @throws MWException
     */
    public function publish() {
        $unitOfWork = UnitOfWork::getInstance();
        $mwServices = MediaWikiServices::getInstance();

        $this->setStatus( RevisionStatus::Queried );
        $unitOfWork->commit();

        $wikiPage = $mwServices->getWikiPageFactory()->newFromTitle( $this->edit->getTitle() );
        $content = ContentHandler::makeContent( $this->content, $this->edit->getTitle() );
        $parserOptions = ParserOptions::newFromUser( $this->owner );
        $contentTransformer = $mwServices->getContentTransformer();
        $content = $contentTransformer->preSaveTransform( $content, $wikiPage, $this->owner, $parserOptions );
        $comment = CommentStoreComment::newUnsavedComment( $this->summary );
        $pageUpdater = $wikiPage->newPageUpdater( $this->owner );
        $pageUpdater->setContent( SlotRecord::MAIN, $content );
        $pageUpdater->saveRevision( $comment );
    }

    public function getEdit() : Edit {
        return $this->edit;
    }

    public function setEdit( Edit $edit ) : void {
        $this->edit = $edit;
        $this->markAsDirty();
    }

    public function getParent() : ?Revision {
        return $this->parent;
    }

    public function setParent( ?Revision $parent ) : void {
        $this->parent = $parent;
        $this->markAsDirty();
    }

    public function getOwner() : User {
        return $this->owner;
    }

    public function setOwner( User $owner ) : void {
        $this->owner = $owner;
        $this->markAsDirty();
    }

    public function getStatus() : int {
        return $this->status;
    }

    /**
     * @throws MWException
     */
    public function setStatus( int $status ) : void {
        RevisionStatus::verify( $status );
        $this->status = $status;
        $this->markAsDirty();
    }

    /**
     * @return KeywordMatch[]
     */
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

    public function getComments() : array {
        return $this->comments;
    }

    public function addComment( Comment $comment ) {
        foreach ( $this->comments as $existing ) {
            if ( $existing->equals( $comment ) ) {
                return;
            }
        }

        $this->comments[] = $comment;
    }

    public function getContent() : string {
        return $this->content;
    }

    public function setContent( string $content ) : void {
        $this->content = $content;
        $this->markAsDirty();
    }

    public function getTimestamp() : MWTimestamp {
        return $this->timestamp;
    }

    public function setTimestamp( MWTimestamp $timestamp ) : void {
        $this->timestamp = $timestamp;
        $this->markAsDirty();
    }

    public function getSummary() : string {
        return $this->summary;
    }

    public function setSummary( string $summary ) : void {
        $this->summary = $summary;
        $this->markAsDirty();
    }
}