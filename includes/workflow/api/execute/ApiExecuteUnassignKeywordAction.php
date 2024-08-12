<?php

namespace Review\Workflow\Api\Execute;

use ApiUsageException;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Model\Keyword;
use Review\Workflow\Runtime\Action\UnassignKeywordAction;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Execute\ApiExecuteBase;
use Workflows\Runtime\Task\RtTask;

final class ApiExecuteUnassignKeywordAction extends ApiExecuteBase {
    /**
     * @throws ApiUsageException
     * @throws MWException
     * @throws ReflectionException
     */
    public function execute() {
        $params = $this->extractRequestParams();
        $unitOfWork = UnitOfWork::getInstance();

        $task = $unitOfWork->findByID( RtTask::class, $params["task_id"] );
        $keyword = $unitOfWork->findByID( Keyword::class, $params["keyword_id"] );

        $unassignKeywordAction = new UnassignKeywordAction( $task, $keyword );
        $status = $unassignKeywordAction->execute();

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
            "keyword_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ]
        ];
    }
}