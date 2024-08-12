<?php

namespace Review\Workflow\Api\Create;

use ApiUsageException;
use Exception;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Workflow\Definition\AssignKeywords;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Create\Definition\Element\ApiCreateElementBase;
use Workflows\Definition\Workflow;

final class ApiCreateAssignKeywords extends ApiCreateElementBase {
    /**
     * @inheritDoc
     * @throws ApiUsageException
     * @throws MWException
     * @throws ReflectionException
     * @throws Exception
     */
    public function execute() {
        $params = $this->extractRequestParams();
        $unitOfWork = UnitOfWork::getInstance();

        $assignKeywords = new AssignKeywords( $params["name"], $params["revision_variable_name"] );
        $workflow = $unitOfWork->findByID( Workflow::class, $params["workflow_id"] );
        $workflow->addElement( $assignKeywords );

        $unitOfWork->commit();
        $this->getResult()->addValue( null, "result", $assignKeywords->serialize() );
    }

    public function getAllowedParams() : array {
        return [
            "name" => [
                ParamValidator::PARAM_TYPE => "string",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "workflow_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "revision_variable_name" => [
                ParamValidator::PARAM_TYPE => "string",
                ParamValidator::PARAM_REQUIRED => true
            ]
        ];
    }
}