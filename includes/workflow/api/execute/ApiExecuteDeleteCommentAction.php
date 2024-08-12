<?php

namespace Review\Workflow\Api\Execute;

use ApiUsageException;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Model\Comment;
use Review\Workflow\Runtime\Action\DeleteCommentAction;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Execute\ApiExecuteBase;
use Workflows\Runtime\Task\RtTask;

final class ApiExecuteDeleteCommentAction extends ApiExecuteBase {
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

        $deleteCommentAction = new DeleteCommentAction( $task, $comment );
        $status = $deleteCommentAction->execute();

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
            "comment_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ]
        ];
    }
}