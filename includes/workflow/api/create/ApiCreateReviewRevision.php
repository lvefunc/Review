<?php

namespace Review\Workflow\Api\Create;

use ApiUsageException;
use Exception;
use MiniORM\UnitOfWork;
use Review\Workflow\Definition\ReviewRevision;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Create\Definition\Element\ApiCreateElementBase;
use Workflows\Definition\Workflow;

final class ApiCreateReviewRevision extends ApiCreateElementBase {
    /**
     * @throws ApiUsageException
     * @throws Exception
     */
    public function execute() {
        $params = $this->extractRequestParams();
        $unitOfWork = UnitOfWork::getInstance();

        $reviewRevision = new ReviewRevision( $params["name"], $params["revision_variable_name"] );
        $workflow = $unitOfWork->findByID( Workflow::class, $params["workflow_id"] );
        $workflow->addElement( $reviewRevision );

        $unitOfWork->commit();
        $this->getResult()->addValue( null, "result", $reviewRevision->serialize() );
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