<?php

namespace Review\Api\Query;

use ApiQueryBase;
use ApiUsageException;
use MiniORM\Expression\Condition;
use MiniORM\Expression\Conjunction;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Enumeration\KeywordStatus;
use Review\Model\Keyword;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Enumeration\Order;

final class ApiQueryKeywords extends ApiQueryBase {
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
            $keyword = $unitOfWork->findByID( Keyword::class, $params["id"] );
            $this->getResult()->addValue( null, "result", $keyword->serialize() );

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

        if ( isset( $params["name"] ) ) {
            $conjunction->add( new Condition( "name", Condition::EqualTo, $params["name"] ) );
        }

        if ( isset( $params["status"] ) ) {
            $conjunction->add( new Condition( "status", Condition::EqualTo, KeywordStatus::valueOf( $params["status"] ) ) );
        }

        $options = [];
        $options["ORDER BY"] = "id " . ( $ordering === Order::Ascending ? "ASC" : "DESC" );
        $options["LIMIT"] = ( $limit + 1 );

        $keywords = $unitOfWork->findMultiple( Keyword::class, $conjunction, $options );

        for ( $i = 0; $i <= $limit; $i++ ) {
            if ( !isset( $keywords[$i] ) ) {
                return;
            }

            if ( $i === $limit ) {
                $this->setContinueEnumParameter( "from", $keywords[$i]->getID() );

                return;
            }

            $this->getResult()->addValue( "result", null, $keywords[$i]->serialize() );
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
            "name" => [
                ParamValidator::PARAM_TYPE => "string",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "status" => [
                ParamValidator::PARAM_TYPE => [
                    KeywordStatus::toString( KeywordStatus::New ),
                    KeywordStatus::toString( KeywordStatus::Verified )
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