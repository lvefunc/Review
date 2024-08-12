<?php

namespace Review\Workflow\Api\Create;

use ApiUsageException;
use Exception;
use MiniORM\UnitOfWork;
use Review\Workflow\Definition\CreateCompetencies;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Create\Definition\Element\ApiCreateElementBase;
use Workflows\Definition\Workflow;

final class ApiCreateCreateCompetencies extends ApiCreateElementBase {
    /**
     * @inheritDoc
     * @throws ApiUsageException
     * @throws Exception
     */
    public function execute() {
        $params = $this->extractRequestParams();
        $unitOfWork = UnitOfWork::getInstance();

        $createCompetencies = new CreateCompetencies( $params["name"], $params["revision_variable_name"] );
        $workflow = $unitOfWork->findByID( Workflow::class, $params["workflow_id"] );
        $workflow->addElement( $createCompetencies );

        $unitOfWork->commit();
        $this->getResult()->addValue( null, "result", $createCompetencies->serialize() );
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