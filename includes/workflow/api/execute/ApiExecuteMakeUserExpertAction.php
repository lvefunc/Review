<?php

namespace Review\Workflow\Api\Execute;

use ApiUsageException;
use MediaWiki\MediaWikiServices;
use MiniORM\UnitOfWork;
use MWException;
use ReflectionException;
use Review\Workflow\Runtime\Action\MakeUserExpertAction;
use Wikimedia\ParamValidator\ParamValidator;
use Workflows\Api\Execute\ApiExecuteBase;
use Workflows\Runtime\Task\RtTask;

final class ApiExecuteMakeUserExpertAction extends ApiExecuteBase {
    /**
     * @inheritDoc
     * @throws ApiUsageException
     * @throws MWException
     * @throws ReflectionException
     */
    public function execute() {
        $params = $this->extractRequestParams();
        $unitOfWork = UnitOfWork::getInstance();
        $mwServices = MediaWikiServices::getInstance();

        $task = $unitOfWork->findByID( RtTask::class, $params["task_id"] );
        $user = $mwServices->getUserFactory()->newFromId( $params["user_id"] );

        $makeUserExpertAction = new MakeUserExpertAction( $task, $user );
        $status = $makeUserExpertAction->execute();

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
            "user_id" => [
                ParamValidator::PARAM_TYPE => "integer",
                ParamValidator::PARAM_REQUIRED => true
            ]
        ];
    }
}