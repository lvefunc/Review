( function () {
    mw.review.dialogs.CreateCompetenceDialog = function MwReviewCreateCompetenceDialog( config ) {
        config = config || {};
        config.name = "create-competence-dialog" || config.name;
        config.title = mw.msg( "review-dialogs-create-competence-dialog-title" );
        config.classes = config.classes || [];
        config.classes.push( "ext-review-dialogs-createCompetenceDialog" );

        mw.review.dialogs.CreateCompetenceDialog.super.call( this, config );

        mw.review.dialogs.CreateCompetenceDialog.prototype.initialize = function () {
            mw.review.dialogs.CreateCompetenceDialog.super.prototype.initialize.apply( this, arguments );

            this.showProgress();

            config = {};
            config.taskID = this.getTaskID();

            let createCompetenceWidget = new mw.review.ui.CreateCompetenceWidget( config );
            createCompetenceWidget.$element.addClass( "ext-review-dialogs-createCompetenceDialog-createCompetence" );

            config = {};
            config.taskID = this.getTaskID();
            config.ccw = createCompetenceWidget;

            let makeUserExpertWidget = new mw.review.ui.MakeUserExpertWidget( config );
            makeUserExpertWidget.$element.addClass( "ext-review-dialogs-createCompetenceDialog-makeUserExpert" );

            Promise.all( [
                createCompetenceWidget.load(),
                makeUserExpertWidget.load()
            ] ).then( () => {
                this.$content.append( createCompetenceWidget.$element );
                this.$content.append( makeUserExpertWidget.$element );

                this.hideProgress();
            } );
        };
    };

    OO.inheritClass( mw.review.dialogs.CreateCompetenceDialog, mw.review.dialogs.Dialog );

    mw.hook( "mw.workflows.ui.TaskExecutor" ).add( function ( taskExecutor ) {
        taskExecutor.register(
            "Review\\Workflow\\Runtime\\Task\\RtCreateCompetenceTask",
            mw.msg( "review-create-competence-task" ),
            mw.review.dialogs.CreateCompetenceDialog
        )
    } );
}() );