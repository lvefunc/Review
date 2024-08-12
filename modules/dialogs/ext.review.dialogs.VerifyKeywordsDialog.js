( function () {
    mw.review.dialogs.VerifyKeywordsDialog = function MwReviewDialogsVerifyKeywordsDialog( config ) {
        config = config || {};
        config.name = "verify-keywords-dialog" || config.name;
        config.title = mw.msg( "review-dialogs-verify-keywords-dialog-title" ) || config.title;
        config.classes = config.classes || [];
        config.classes.push( "ext-review-dialogs-verifyKeywordsDialog" );

        mw.review.dialogs.VerifyKeywordsDialog.super.call( this, config );

        mw.review.dialogs.VerifyKeywordsDialog.prototype.initialize = function () {
            mw.review.dialogs.VerifyKeywordsDialog.super.prototype.initialize.apply( this, arguments );

            this.showProgress();

            let indexLayout = new OO.ui.IndexLayout( {} );
            indexLayout.$element.addClass( "ext-review-dialogs-verifyKeywordsDialog-indexLayout" );

            config = {};
            config.label = mw.msg( "review-dialogs-verify-keywords-dialog-article-tab-label" );
            config.scrollable = true;

            let articleTab = new OO.ui.TabPanelLayout( "article", config );

            config = {};
            config.label = mw.msg( "review-dialogs-verify-keywords-dialog-diff-tab-label" );
            config.scrollable = true;

            let diffTab = new OO.ui.TabPanelLayout( "diff", config );

            indexLayout.addTabPanels( [ articleTab, diffTab ] );

            let params = {};

            params.action = "workflows";
            params.operation = "read";
            params.read = "runtime";
            params.readruntime = "task";
            params.id = this.getTaskID();

            mw.review.api.get( params )
                .then( ( taskData ) => OO.getProp( taskData, "result", "revision", "id" ) )
                .then( ( revisionID ) => mw.review.model.Revision.static.findByID( revisionID ) )
                .then( ( revision ) => {
                    config = {};
                    config.revision = revision;

                    let articleWidget = new mw.review.ui.ArticleWidget( config );
                    let diffWidget = new mw.review.ui.DiffWidget( config );

                    config = {};
                    config.taskID = this.getTaskID();

                    let assignKeywordsWidget = new mw.review.ui.AssignKeywordsWidget( config );
                    assignKeywordsWidget.$element.addClass( "ext-review-dialogs-verifyKeywordsDialog-assignKeywords" );

                    config = {};
                    config.taskID = this.getTaskID();
                    config.akw = assignKeywordsWidget;

                    let createKeywordWidget = new mw.review.ui.CreateKeywordWidget( config );
                    createKeywordWidget.$element.addClass( "ext-review-dialogs-verifyKeywordsDialog-createKeyword" );

                    Promise.all( [
                        articleWidget.load(),
                        diffWidget.load(),
                        assignKeywordsWidget.load()
                    ] ).then( () => {
                        articleTab.$element.html( articleWidget.$element );
                        diffTab.$element.html( diffWidget.$element );

                        this.$content.append( indexLayout.$element );
                        this.$content.append( assignKeywordsWidget.$element );
                        this.$content.append( createKeywordWidget.$element );

                        this.hideProgress();
                    } );
                } );
        };
    };

    OO.inheritClass( mw.review.dialogs.VerifyKeywordsDialog, mw.review.dialogs.Dialog );

    mw.hook( "mw.workflows.ui.TaskExecutor" ).add( function ( taskExecutor ) {
        taskExecutor.register(
            "Review\\Workflow\\Runtime\\Task\\RtVerifyKeywordsTask",
            mw.msg( "review-verify-keywords-task" ),
            mw.review.dialogs.VerifyKeywordsDialog
        )
    } );
}() );