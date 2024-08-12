<?php

namespace Review\Workflow\Api\Update;

use ApiUsageException;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Workflow\Definition\CreateCompetencies;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Update\Definition\Element\ApiUpdateElementBase;
use Workflows\Definition\Workflow;

final class ApiUpdateCreateCompetencies extends ApiUpdateElementBase {
    /**
     * @inheritDoc
     * @throws ApiUsageException
     * @throws MWException
     * @throws ReflectionException
     */
    public function execute() {
        $params = $this->extractRequestParams();
        $unitOfWork = UnitOfWork::getInstance();

        $createCompetencies = $unitOfWork->findByID( CreateCompetencies::class, $params["id"] );

        if ( isset( $params["name"] ) ) {
            $createCompetencies->setWord( $params["name"] );
        }

        if ( isset( $params["workflow_id"] ) ) {
            $workflow = $unitOfWork->findByID( Workflow::class, $params["workflow_id"] );
            $workflow->addElement( $createCompetencies );
        }

        if ( isset( $params["revision_variable_name"] ) ) {
            $createCompetencies->setRevisionVariableName( $params["revision_variable_name"] );
        }

        $unitOfWork->commit();
        $this->getResult()->addValue( null, "result", $createCompetencies->serialize() );
    }

    public function getAllowedParams() : array {
        return [
            "id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "name" => [
                ParamValidator::PARAM_TYPE => "string",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "workflow_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => false
            ],
            "revision_variable_name" => [
                ParamValidator::PARAM_TYPE => "string",
                ParamValidator::PARAM_REQUIRED => false
            ]
        ];
    }
}