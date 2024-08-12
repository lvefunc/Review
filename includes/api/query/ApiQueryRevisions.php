<?php

namespace Review\Api\Query;

use ApiQueryBase;
use ApiUsageException;
use MiniORM\Expression\Condition;
use MiniORM\Expression\Conjunction;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Enumeration\RevisionStatus;
use Review\Model\Revision;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Enumeration\Order;

final class ApiQueryRevisions extends ApiQueryBase {
    /**
     * @inheritDoc
     * @throws ApiUsageException
     * @throws MWException
     * @throws ReflectionException
     */
    public function execute() {
        $params = $this->extractRequestParams();
        $unitOfWork = UnitOfWork::getInstance();

        if ( isset( $params["id"] ) ) {
            $revision = $unitOfWork->findByID( Revision::class, $params["id"] );
            $this->getResult()->addValue( null, "result", $revision->serialize() );

            return;
        }

        $ordering = $params["ordering"] ?? Order::Ascending;
        $from = $params["from"] ?? 0;
        $limit = $params["limit"] ?? 10;

        $conjunction = new Conjunction();

        switch ( $ordering ) {
            case Order::Ascending:
                $conjunction->add( new Condition( "id", Condition::MoreThanOrEqualTo, $from ) );
                break;
            case Order::Descending:
                $operand = $from === 0 ? Condition::MoreThanOrEqualTo : Condition::LessThanOrEqualTo;
                $conjunction->add( new Condition( "id", $operand, $from ) );
                break;
        }

        if ( isset( $params["edit_id"] ) ) {
            $conjunction->add( new Condition( "edit_id", Condition::EqualTo, $params["edit_id"] ) );
        }

        if ( isset( $params["parent_id"] ) ) {
            $conjunction->add( new Condition( "parent_id", Condition::EqualTo, $params["parent_id"] ) );
        }

        if ( isset( $params["owner"] ) ) {
            $conjunction->add( new Condition( "owner", Condition::EqualTo, $params["owner"] ) );
        }

        if ( isset( $params["status"] ) ) {
            $conjunction->add( new Condition( "status", Condition::EqualTo, RevisionStatus::valueOf( $params["status"] ) ) );
        }

        $options = [];
        $options["ORDER BY"] = "id " . ( $ordering === Order::Ascending ? "ASC" : "DESC" );
        $options["LIMIT"] = ( $limit + 1 );

        $revisions = $unitOfWork->findMultiple( Revision::class, $conjunction, $options );

        for ( $i = 0; $i <= $limit; $i++ ) {
            if ( !isset( $revisions[$i] ) ) {
                return;
            }

            if ( $i === $limit ) {
                $this->setContinueEnumParameter( "from", $revisions[$i]->getID() );

                return;
            }

            $this->getResult()->addValue( "result", null, $revisions[$i]->serialize() );
        }
    }

    /**
     * @throws MWException
     */
    public function getAllowedParams() : array {
        return [
            "id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "edit_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "parent_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "owner" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "status" => [
                ParamValidator::PARAM_TYPE => [
                    RevisionStatus::toString( RevisionStatus::New ),
                    RevisionStatus::toString( RevisionStatus::Queried ),
                    RevisionStatus::toString( RevisionStatus::Current ),
                    RevisionStatus::toString( RevisionStatus::Rejected ),
                    RevisionStatus::toString( RevisionStatus::Legacy )
                ],
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