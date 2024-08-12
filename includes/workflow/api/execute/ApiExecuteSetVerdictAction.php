<?php

namespace Review\Workflow\Api\Execute;

use ApiUsageException;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Workflow\Runtime\Action\SetVerdictAction;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Execute\ApiExecuteBase;
use Workflows\Runtime\Task\RtTask;

final class ApiExecuteSetVerdictAction extends ApiExecuteBase {
    /**
     * @inheritDoc
     * @throws ApiUsageException
     * @throws MWException
     * @throws ReflectionException
     */
    public function execute() {
        $params = $this->extractRequestParams();
        $unitOfWork = UnitOfWork::getInstance();

        $task = $unitOfWork->findByID( RtTask::class, $params["task_id"] );

        $setVerdictAction = new SetVerdictAction( $task, $params["verdict"] );
        $status = $setVerdictAction->execute();

        if ( !$status->isGood() ) {
            $this->dieStatus( $status );
        }
    }

    public function getAllowedParams() : array {
        return [
            "task_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "verdict" => [
                ParamValidator::PARAM_TYPE => "boolean",
                ParamValidator::PARAM_REQUIRED => true
            ]
        ];
    }
}