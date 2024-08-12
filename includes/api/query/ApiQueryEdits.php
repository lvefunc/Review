<?php

namespace Review\Api\Query;

use ApiQueryBase;
use ApiUsageException;
use MediaWiki\MediaWikiServices;
use MiniORM\Expression\Condition;
use MiniORM\Expression\Conjunction;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use RequestContext;
use Review\Model\Edit;
use Review\Model\Revision;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Enumeration\Order;

final class ApiQueryEdits extends ApiQueryBase {
    /**
     * @inheritDoc
     * @throws ApiUsageException
     * @throws MWException
     * @throws ReflectionException
     */
    public function execute() {
        // TODO Костыль, добавить выборку через join в MiniORM
        $params = $this->extractRequestParams();
        $unitOfWork = UnitOfWork::getInstance();

        if ( isset( $params["id"] ) ) {
            $edit = $unitOfWork->findByID( Edit::class, $params["id"] );
            $this->getResult()->addValue( null, "result", $edit->serialize() );

            return;
        }

        $ordering = $params["ordering"] ?? Order::Ascending;
        $from = $params["from"] ?? 0;
        $limit = $params["limit"] ?? 10;

        $mwServices = MediaWikiServices::getInstance();

        $owner = $mwServices->getUserFactory()->newFromId( $params["owner"] ?? RequestContext::getMain()->getUser()->getId() );
        $currentUser = RequestContext::getMain()->getUser();

        if (
            !$owner->equals( $currentUser ) &&
            !$currentUser->isAllowed( "review-admin-powers" )
        ) {
            throw new MWException( "You are not allowed to view edits of given owner" );
        }

        $dbr = $mwServices->getDBLoadBalancer()->getConnection( DB_REPLICA );
        $rows = $dbr->newSelectQueryBuilder()
            ->select( [
                "id" => "review_edit.id",
                "title" => "review_edit.title"
            ] )
            ->distinct()
            ->from( "review_edit" )
            ->join( "review_revision", null, "review_edit.id = review_revision.edit_id" )
            ->where( [
                "review_edit.id " . ( $ordering === Order::Ascending ? ">=" : ( $from === 0 ? ">=" : "<=" ) ) . $from,
                "review_revision.owner = " . $owner->getId()
            ] )
            ->options( [
                "ORDER BY" => "review_edit.id " . ( $ordering === Order::Ascending ? "ASC" : "DESC" ),
                "LIMIT" => $limit + 1
            ] )
            ->caller( __METHOD__ )
            ->fetchResultSet();

        $i = 0;

        foreach ( $rows as $row ) {
            if ( $i === $limit ) {
                $this->setContinueEnumParameter( "from", $row->id );

                return;
            }

            $conjunction = new Conjunction();
            $conjunction->add( new Condition( "edit_id", Condition::EqualTo, $row->id ) );
            $conjunction->add( new Condition( "owner", Condition::EqualTo, $owner->getId() ) );

            $revisions = $unitOfWork->findMultiple( Revision::class, $conjunction );
            $serialization = [];

            foreach ( $revisions as $revision ) {
                $serialization[] = $revision->serialize();
            }

            $this->getResult()->addValue( "result", null, [
                "id" => $row->id,
                "title" => $row->title,
                "revisions" => $serialization
            ] );

            $i++;
        }
    }

    public function getAllowedParams() : array {
        return [
            "id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "owner" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "ordering" => [
                ParamValidator::PARAM_TYPE => [
                    Order::Ascending,
                    Order::Descending
                ],
                ParamValidator::PARAM_REQUIRED => false,
                ParamValidator::PARAM_DEFAULT => Order::Ascending
            ],
            "from" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false,
                ParamValidator::PARAM_DEFAULT => 0
            ],
            "limit" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false,
                ParamValidator::PARAM_DEFAULT => 10
            ]
        ];
    }
}