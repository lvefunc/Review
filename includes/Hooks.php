<?php

namespace Review;

use CommentStoreComment;
use EchoEvent;
use EditPage;
use Exception;
use MediaWiki\MediaWikiServices;
use MediaWiki\Revision\RenderedRevision;
use MediaWiki\Revision\RevisionRecord;
use MediaWiki\Revision\SlotRecord;
use MediaWiki\User\UserIdentity;
use MiniORM\Expression\Condition;
use MiniORM\Expression\Conjunction;
use MiniORM\Schema\SchemaUpdater;
use MiniORM\UnitOfWork;
use MWException;
use MWTimestamp;
use OutputPage;
use RawMessage;
use ReflectionException;
use RequestContext;
use Review\Enumeration\RevisionStatus;
use Review\Model\Comment;
use Review\Model\Competence;
use Review\Model\Edit;
use Review\Model\Expert;
use Review\Model\Keyword;
use Review\Model\KeywordMatch;
use Review\Model\Range;
use Review\Model\Revision;
use Review\Model\Synonym;
use Review\Notification\NewRevisionPresentationModel;
use Review\Notification\StatusChangedPresentationModel;
use Review\Workflow\Api\Create\ApiCreateCreateCompetencies;
use Review\Workflow\Api\Create\ApiCreateAssignKeywords;
use Review\Workflow\Api\Create\ApiCreateReviewRevision;
use Review\Workflow\Api\Create\ApiCreateVerifyKeywords;
use Review\Workflow\Api\Execute\ApiExecuteAssignKeywordAction;
use Review\Workflow\Api\Execute\ApiExecuteCreateCommentAction;
use Review\Workflow\Api\Execute\ApiExecuteCreateCompetenceAction;
use Review\Workflow\Api\Execute\ApiExecuteCreateKeywordAction;
use Review\Workflow\Api\Execute\ApiExecuteCreateRangeAction;
use Review\Workflow\Api\Execute\ApiExecuteDeleteCompetenceAction;
use Review\Workflow\Api\Execute\ApiExecuteMakeUserExpertAction;
use Review\Workflow\Api\Execute\ApiExecuteDeleteCommentAction;
use Review\Workflow\Api\Execute\ApiExecuteSetVerdictAction;
use Review\Workflow\Api\Execute\ApiExecuteUnassignKeywordAction;
use Review\Workflow\Api\Update\ApiUpdateCreateCompetencies;
use Review\Workflow\Api\Update\ApiUpdateAssignKeywords;
use Review\Workflow\Api\Update\ApiUpdateReviewRevision;
use Review\Workflow\Api\Update\ApiUpdateVerifyKeywords;
use Review\Workflow\Definition\CreateCompetencies;
use Review\Workflow\Definition\AssignKeywords;
use Review\Workflow\Definition\ReviewRevision;
use Review\Workflow\Definition\VerifyKeywords;
use Review\Workflow\Runtime\Activity\RtCreateCompetencies;
use Review\Workflow\Runtime\Activity\RtAssignKeywords;
use Review\Workflow\Runtime\Activity\RtReviewRevision;
use Review\Workflow\Runtime\Activity\RtVerifyKeywords;
use Review\Workflow\Runtime\Task\RtCreateCompetenceTask;
use Review\Workflow\Runtime\Task\RtAssignKeywordsTask;
use Review\Workflow\Runtime\Task\RtReviewRevisionTask;
use Review\Workflow\Runtime\Task\RtVerifyKeywordsTask;
use Skin;
use Status;
use TextContent;
use Workflows\Api\Create\Definition\Element\ApiCreateElement;
use Workflows\Api\Update\Definition\Element\ApiUpdateElement;
use Workflows\Api\Execute\ApiExecute;
use Workflows\Api\ModuleRegistry;

final class Hooks {
    /**
     * @throws ReflectionException
     * @throws MWException
     */
    public static function registerSchemaUpdates( SchemaUpdater $schemaUpdater ) {
        $schemaUpdater->register( Edit::class );
        $schemaUpdater->register( Revision::class );
        $schemaUpdater->register( Keyword::class );
        $schemaUpdater->register( Synonym::class );
        $schemaUpdater->register( KeywordMatch::class );
        $schemaUpdater->register( Expert::class );
        $schemaUpdater->register( Competence::class );
        $schemaUpdater->register( Comment::class );
        $schemaUpdater->register( Range::class );

        $schemaUpdater->register( AssignKeywords::class );
        $schemaUpdater->register( VerifyKeywords::class );
        $schemaUpdater->register( CreateCompetencies::class );
        $schemaUpdater->register( ReviewRevision::class );

        $schemaUpdater->register( RtAssignKeywords::class );
        $schemaUpdater->register( RtVerifyKeywords::class );
        $schemaUpdater->register( RtCreateCompetencies::class );
        $schemaUpdater->register( RtReviewRevision::class );

        $schemaUpdater->register( RtAssignKeywordsTask::class );
        $schemaUpdater->register( RtVerifyKeywordsTask::class );
        $schemaUpdater->register( RtCreateCompetenceTask::class );
        $schemaUpdater->register( RtReviewRevisionTask::class );
    }

    public static function registerWorkflowsModules( ModuleRegistry $moduleRegistry ) {
        $moduleRegistry->register( ApiCreateElement::class, "assignkeywords", ApiCreateAssignKeywords::class );
        $moduleRegistry->register( ApiCreateElement::class, "verifykeywords", ApiCreateVerifyKeywords::class );
        $moduleRegistry->register( ApiCreateElement::class, "createcompetencies", ApiCreateCreateCompetencies::class );
        $moduleRegistry->register( ApiCreateElement::class, "reviewrevision", ApiCreateReviewRevision::class );

        $moduleRegistry->register( ApiUpdateElement::class, "assignkeywords", ApiUpdateAssignKeywords::class );
        $moduleRegistry->register( ApiUpdateElement::class, "verifykeywords", ApiUpdateVerifyKeywords::class );
        $moduleRegistry->register( ApiUpdateElement::class, "createcompetencies", ApiUpdateCreateCompetencies::class );
        $moduleRegistry->register( ApiUpdateElement::class, "reviewrevision", ApiUpdateReviewRevision::class );

        $moduleRegistry->register( ApiExecute::class, "createkeyword", ApiExecuteCreateKeywordAction::class );
        $moduleRegistry->register( ApiExecute::class, "assignkeyword", ApiExecuteAssignKeywordAction::class );
        $moduleRegistry->register( ApiExecute::class, "unassignkeyword", ApiExecuteUnassignKeywordAction::class );
        $moduleRegistry->register( ApiExecute::class, "makeuserexpert", ApiExecuteMakeUserExpertAction::class );
        $moduleRegistry->register( ApiExecute::class, "createcompetence", ApiExecuteCreateCompetenceAction::class );
        $moduleRegistry->register( ApiExecute::class, "deletecompetence", ApiExecuteDeleteCompetenceAction::class );
        $moduleRegistry->register( ApiExecute::class, "createcomment", ApiExecuteCreateCommentAction::class );
        $moduleRegistry->register( ApiExecute::class, "deletecomment", ApiExecuteDeleteCommentAction::class );
        $moduleRegistry->register( ApiExecute::class, "createrange", ApiExecuteCreateRangeAction::class );
        $moduleRegistry->register( ApiExecute::class, "setverdict", ApiExecuteSetVerdictAction::class );
    }

    public static function registerWorkflowsResourceModules( $specialPage ) {
        $specialPage->getOutput()->addModules( "ext.review.dialogs" );
    }

    public static function onBeforeCreateEchoEvent(
        &$notifications, &$notificationCategories, &$icons
    ) {
        $notificationCategories[ "review" ] = [
            "priority" => 3,
            "tooltip" => "echo-pref-tooltip-review",
        ];

        $notifications[ "review-new-revision" ] = [
            "category" => "review",
            "section" => "message",
            "presentation-model" => NewRevisionPresentationModel::class,
            "user-locators" => [ "Review\\Utils::locateUsers" ],
            "bundle" => [
                "web" => true,
                "email" => true,
                "expandable" => true,
            ],
            "immediate" => true
        ];

        $notifications[ "review-status-changed" ] = [
            "category" => "review",
            "section" => "message",
            "presentation-model" => StatusChangedPresentationModel::class,
            "user-locators" => [ "Review\\Utils::locateUsers" ],
            "bundle" => [
                "web" => true,
                "email" => true,
                "expandable" => true,
            ],
        ];

        $icons[ "review-new-revision" ] = [];
        $icons[ "review-status-changed" ] = [];
    }

    public static function onEchoGetBundleRules( $event, &$bundleString ) : bool {
        switch ( $event->getType() ) {
            case "review-new-revision":
                $bundleString = "review-new-revision";
                break;
            case "review-status-changed":
                $bundleString = "review-status-changed";
                break;
        }

        return true;
    }

    /**
     * @throws Exception
     */
    public static function onMultiContentSave(
        RenderedRevision $renderedRevision, UserIdentity $userIdentity, CommentStoreComment $summary, $flag, Status $hookStatus
    ) : bool {
        $revision = $renderedRevision->getRevision();
        $namespace = $revision->getPage()->getNamespace();

        if ( $namespace !== NS_MAIN ) {
            return true;
        }

        $content = $revision->getContent( SlotRecord::MAIN, RevisionRecord::RAW );

        if ( !( $content instanceof TextContent ) ) {
            $hookStatus->fatal( "Something went wrong." );

            return false;
        }

        $unitOfWork = UnitOfWork::getInstance();
        $mwServices = MediaWikiServices::getInstance();
        $title = $mwServices->getWikiPageFactory()->newFromLinkTarget( $revision->getPageAsLinkTarget() )->getTitle();
        $owner = $mwServices->getUserFactory()->newFromId( $userIdentity->getId() );
        $timestamp = MWTimestamp::getInstance( $revision->getTimestamp() );

        $condition = new Condition( "title", Condition::EqualTo, $title->getText() );
        $edit = $unitOfWork->findSingle( Edit::class, $condition );

        if ( is_null( $edit ) ) {
            $edit = new Edit( $title );
        } else {
            $condition = ( new Conjunction() )
                ->add( new Condition( "edit_id", Condition::EqualTo, $edit->getID() ) )
                ->add( new Condition( "content", Condition::EqualTo, $content->getText() ) )
                ->add( new Condition( "status", Condition::EqualTo, RevisionStatus::Queried ) );
            $revision = $unitOfWork->findSingle( Revision::class, $condition );

            if ( !is_null( $revision ) ) {
                $revision->setStatus( RevisionStatus::Current );

                EchoEvent::create( [
                    "type" => "review-status-changed",
                    "extra" => [
                        "id" => $revision->getID()
                    ]
                ] );

                while ( !is_null( $revision->getParent() ) ) {
                    $revision = $revision->getParent();

                    if ( $revision->getStatus() !== RevisionStatus::Legacy ) {
                        $revision->setStatus( RevisionStatus::Legacy );

                        EchoEvent::create( [
                            "type" => "review-status-changed",
                            "extra" => [
                                "id" => $revision->getID()
                            ]
                        ] );
                    }
                }

                $unitOfWork->commit();

                return true;
            }
        }

        $context = RequestContext::getMain();
        $revID = $context->getRequest()->getInt( "revision" );

        if ( $revID === 0 ) {
            $revision = new Revision( $edit, $edit->getCurrentRevision(), $owner, $content->getText(), $timestamp, $summary->text );
        } else {
            $condition = new Condition( "id", Condition::EqualTo, $revID );
            $parent = $unitOfWork->findSingle( Revision::class, $condition );

            if ( $parent->getEdit()->equals( $edit ) ) {
                $revision = new Revision( $edit, $parent, $owner, $content->getText(), $timestamp, $summary->text );
            } else {
                throw new MWException( "Something went wrong." );
            }
        }

        $unitOfWork->commit();

        EchoEvent::create( [
            "type" => "review-new-revision",
            "extra" => [
                "id" => $revision->getID()
            ]
        ] );

        $hookStatus->fatal( new RawMessage( "review-intercepted" ) );

        return false;
    }

    /**
     * @throws ReflectionException
     * @throws MWException
     */
    public static function onEditFormInitialText( EditPage $editPage ) {
        Utils::preload( $editPage->textbox1 );
    }

    /**
     * @throws ReflectionException
     * @throws MWException
     */
    public static function onEditFormPreloadText( &$text, $title ) {
        Utils::preload( $text );
    }

    public static function onEditPage_showEditForm_fields( EditPage $editPage, OutputPage $output ) {
        $revID = RequestContext::getMain()->getRequest()->getInt( "revision" );

        if ( $revID !== 0 ) {
            Utils::addRevIDToEditForm( $output, $revID );
        }
    }

    public static function onBeforePageDisplay( OutputPage $out, Skin $skin ) {
        $out->addModules( "ext.review.hook" );
        $out->addModules( "ext.review.preload" );
    }
}