( function () {
    mw.review.dialogs.ReviewRevisionDialog = function MwReviewDialogsReviewRevisionDialog( config ) {
        config = config || {};
        config.name = "review-revision-dialog" || config.name;
        config.title = mw.msg( "review-dialogs-review-revision-dialog-title" ) || config.title;
        config.classes = config.classes || [];
        config.classes.push( "ext-review-dialogs-reviewRevisionDialog" );

        mw.review.dialogs.ReviewRevisionDialog.super.call( this, config );

        mw.review.dialogs.ReviewRevisionDialog.prototype.initialize = function () {
            mw.review.dialogs.ReviewRevisionDialog.super.prototype.initialize.apply( this, arguments );

            this.showProgress();

            let indexLayout = new OO.ui.IndexLayout( {} );
            indexLayout.$element.addClass( "ext-review-dialogs-reviewRevisionDialog-indexLayout" );

            config = {};
            config.label = mw.msg( "review-dialogs-review-revision-dialog-article-tab-label" );
            config.scrollable = true;

            let articleTab = new OO.ui.TabPanelLayout( "article", config );

            config = {};
            config.label = mw.msg( "review-dialogs-review-revision-dialog-diff-tab-label" );
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

                    let verdictWidget = new mw.review.ui.VerdictWidget( config );
                    verdictWidget.$element.addClass( "ext-review-dialogs-reviewRevisionDialog-verdict" );

                    Promise.all( [
                        articleWidget.load(),
                        diffWidget.load(),
                        verdictWidget.load()
                    ] ).then( () => {
                        articleWidget.$element.attr( "id", "article-root" );

                        config = {};

                        let contextMenuWidget = new mw.review.ui.ContextMenuWidget( config );
                        contextMenuWidget.$content.html( articleWidget.$element );

                        articleTab.$element.html( contextMenuWidget.$element );
                        diffTab.$element.html( diffWidget.$element );

                        this.$content.append( indexLayout.$element );
                        this.$content.append( verdictWidget.$element );

                        config = {};
                        config.taskID = this.getTaskID();
                        config.rootElementID = "article-root";

                        let commentSelectWidget = new mw.review.ui.CommentSelectWidget( config );

                        commentSelectWidget.load().then( () => {
                            let message = mw.msg( "review-dialogs-review-revision-dialog-context-menu-add-a-comment-option-label" );

                            contextMenuWidget.addOption( message, function () {
                                commentSelectWidget.add().then();
                            } );

                            config = {};
                            config.label = mw.msg( "review-dialogs-review-revision-dialog-comment-block-label" );

                            let commentBlock = new mw.review.ui.BlockWidget( config );
                            commentBlock.$element.addClass( "ext-review-dialogs-reviewRevisionDialog-commentBlock" );
                            commentBlock.$content.html( commentSelectWidget.$element );

                            this.$content.append( commentBlock.$element );

                            this.hideProgress();
                        } );
                    } );
                } );
        };
    };

    OO.inheritClass( mw.review.dialogs.ReviewRevisionDialog, mw.review.dialogs.Dialog );
}() );

mw.hook( "mw.workflows.ui.TaskExecutor" ).add( function ( taskExecutor ) {
    taskExecutor.register(
        "Review\\Workflow\\Runtime\\Task\\RtReviewRevisionTask",
        mw.msg( "review-review-revision-task" ),
        mw.review.dialogs.ReviewRevisionDialog
    )
} );