<?php

namespace Review\Workflow\Api\Execute;

use ApiUsageException;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Workflow\Runtime\Action\CreateCommentAction;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Execute\ApiExecuteBase;
use Workflows\Runtime\Task\RtTask;

final class ApiExecuteCreateCommentAction extends ApiExecuteBase {
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

        $createCommentAction = new CreateCommentAction( $task, $params["comment_text"] );
        $status = $createCommentAction->execute();

        if ( $status->isGood() ) {
            $this->getResult()->addValue( null, "result", $status->getValue()->serialize() );
        } else {
            $this->dieWithError( $status->getErrors() );
            $this->dieStatus( $status );
        }
    }

    public function getAllowedParams() : array {
        return [
            "task_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "comment_text" => [
                ParamValidator::PARAM_TYPE => "string",
                ParamValidator::PARAM_REQUIRED => true
            ]
        ];
    }
}