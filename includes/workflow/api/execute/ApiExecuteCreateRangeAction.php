<?php

namespace Review\Workflow\Api\Execute;

use ApiUsageException;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Model\Comment;
use Review\Workflow\Runtime\Action\CreateRangeAction;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Execute\ApiExecuteBase;
use Workflows\Runtime\Task\RtTask;

final class ApiExecuteCreateRangeAction extends ApiExecuteBase {
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
        $comment = $unitOfWork->findByID( Comment::class, $params["comment_id"] );

        $createRangeAction = new CreateRangeAction(
            $task,
            $comment,
            $params["start_container"],
            $params["end_container"],
            $params["start_offset"],
            $params["end_offset"]
        );
        $status = $createRangeAction->execute();

        if ( $status->isGood() ) {
            $this->getResult()->addValue( null, "result", $status->getValue()->serialize() );
        } else {
            $this->dieStatus( $status );
        }
    }

    public function getAllowedParams() : array {
        return [
            "task_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "comment_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "start_container" => [
                ParamValidator::PARAM_TYPE => "string",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "end_container" => [
                ParamValidator::PARAM_TYPE => "string",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "start_offset" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ],
            "end_offset" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ]
        ];
    }
}