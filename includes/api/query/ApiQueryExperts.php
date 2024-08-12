<?php

namespace Review\Api\Query;

use ApiQueryBase;
use ApiUsageException;
use MiniORM\Expression\Condition;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Model\Expert;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Enumeration\Order;

final class ApiQueryExperts extends ApiQueryBase {
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
            $expert = $unitOfWork->findByID( Expert::class, $params["id"] );

            if ( $expert ) {
                $this->getResult()->addValue( null, "result", $expert->serialize() );
            }

            return;
        }

        if ( isset( $params["user"] ) ) {
            $condition = new Condition( "user", Condition::EqualTo, $params["user"] );
            $expert = $unitOfWork->findSingle( Expert::class, $condition );

            if ( $expert ) {
                $this->getResult()->addValue( null, "result", $expert->serialize() );
            }

            return;
        }

        $ordering = $params["ordering"] ?? Order::Ascending;
        $from = $params["from"] ?? 0;
        $limit = $params["limit"] ?? 10;


        $condition = $ordering === Order::Ascending
            ? new Condition( "id", Condition::MoreThanOrEqualTo, $from )
            : new Condition( "id", $from === 0 ? Condition::MoreThanOrEqualTo : Condition::LessThanOrEqualTo, $from );

        $options = [];
        $options["ORDER BY"] = "id " . ( $ordering === Order::Ascending ? "ASC" : "DESC" );
        $options["LIMIT"] = ( $limit + 1 );

        $experts = $unitOfWork->findMultiple( Expert::class, $condition, $options );

        for ( $i = 0; $i <= $limit; $i++ ) {
            if ( !isset( $experts[$i] ) ) {
                return;
            }

            if ( $i === $limit ) {
                $this->setContinueEnumParameter( "from", $experts[$i]->getID() );

                return;
            }

            $this->getResult()->addValue( "result", null, $experts[$i]->serialize() );
        }
    }

    public function getAllowedParams() : array {
        return [
            "id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "user" => [
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