( function () {
    mw.review.ui.InspectRevisionDialog = function MwReviewDialogsInspectRevisionDialog( config ) {
        config = config || {};
        config.size = "full";
        config.name = "inspect-revision-dialog" || config.name;
        config.title = mw.msg( "review-ui-inspect-revision-dialog-title" ) || config.title;
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-inspectRevisionDialog" );

        if ( !config.revisionID ) {
            throw new Error( "Revision ID is not set" );
        } else {
            this.revisionID = config.revisionID;
        }

        mw.review.ui.InspectRevisionDialog.super.call( this, config );
        mw.review.ui.InspectRevisionDialog.static.name = config.name;
        mw.review.ui.InspectRevisionDialog.static.title = config.title;
        mw.review.ui.InspectRevisionDialog.static.actions = [
            {
                label: mw.msg( "review-dialogs-dialog-cancel-action-label" ),
                flags: "safe"
            }
        ];

        mw.review.ui.InspectRevisionDialog.prototype.initialize = function () {
            mw.review.ui.InspectRevisionDialog.super.prototype.initialize.apply( this, arguments );

            this.$progress = $( "<div>" );
            this.$progress.addClass( "ext-review-ui-inspectRevisionDialog-progress" );
            this.$progress.html( new OO.ui.ProgressBarWidget( {} ).$element );

            this.$content = $( "<div>" );
            this.$content.addClass( "ext-review-ui-inspectRevisionDialog-content" );

            this.$body.append( this.$progress );
            this.$body.append( this.$content );

            this.showProgress();

            let indexLayout = new OO.ui.IndexLayout( {} );
            indexLayout.$element.addClass( "ext-review-ui-inspectRevisionDialog-indexLayout" );

            config = {};
            config.label = mw.msg( "review-ui-inspect-revision-dialog-article-tab-label" );
            config.scrollable = true;

            let articleTab = new OO.ui.TabPanelLayout( "article", config );

            config = {};
            config.label = mw.msg( "review-ui-inspect-revision-dialog-diff-tab-label" );
            config.scrollable = true;

            let diffTab = new OO.ui.TabPanelLayout( "diff", config );

            indexLayout.addTabPanels( [ articleTab, diffTab ] );

            mw.review.model.Revision.static.findByID( this.revisionID )
                .then( ( revision ) => {
                    config = {};
                    config.revision = revision;

                    let articleWidget = new mw.review.ui.ArticleWidget( config );
                    let diffWidget = new mw.review.ui.DiffWidget( config );

                    Promise.all( [
                        articleWidget.load(),
                        diffWidget.load()
                    ] ).then( () => {
                        articleWidget.$element.attr( "id", "article-root" );

                        articleTab.$element.html( articleWidget.$element );
                        diffTab.$element.html( diffWidget.$element );

                        this.$content.append( indexLayout.$element );

                        config = {};
                        config.revisionID = this.revisionID;
                        config.rootElementID = "article-root";

                        let commentSelectWidget = new mw.review.ui.CommentSelectWidget( config );

                        commentSelectWidget.load().then( () => {
                            config = {};
                            config.label = mw.msg( "review-ui-inspect-revision-dialog-comment-block-label" );

                            let commentBlock = new mw.review.ui.BlockWidget( config );
                            commentBlock.$element.addClass( "ext-review-ui-inspectRevisionDialog-commentBlock" );
                            commentBlock.$content.html( commentSelectWidget.$element );

                            this.$content.append( commentBlock.$element );

                            this.hideProgress();
                        } );
                    } );
                } );

            mw.review.ui.InspectRevisionDialog.prototype.getActionProcess = function ( action ) {
                let dialog = this;

                if ( action ) {
                    dialog.close( { action: action } );
                }

                return mw.review.ui.InspectRevisionDialog.super.prototype.getActionProcess.call( this, action );
            };
        };

        mw.review.ui.InspectRevisionDialog.prototype.showProgress = function () {
            this.$content.hide();
            this.$progress.show();
        };

        mw.review.ui.InspectRevisionDialog.prototype.hideProgress = function () {
            this.$progress.hide();
            this.$content.show();
        };
    };

    OO.inheritClass( mw.review.ui.InspectRevisionDialog, OO.ui.ProcessDialog );
}() );