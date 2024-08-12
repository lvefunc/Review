( function () {
    mw.review.dialogs.Dialog = function MwReviewDialogsDialog( config ) {
        config = config || {};
        config.size = "full";
        config.classes = config.classes || [];
        config.classes.push( "ext-review-dialogs-dialog" );

        if ( !config.taskID ) {
            throw new Error( "Task ID is not set" );
        } else {
            this.taskID = config.taskID;
        }

        mw.review.dialogs.Dialog.super.call( this, config );
        mw.review.dialogs.Dialog.static.name = config.name;
        mw.review.dialogs.Dialog.static.title = config.title;
        mw.review.dialogs.Dialog.static.actions = [
            {
                action: "save",
                label: mw.msg( "review-dialogs-dialog-finish-action-label" ),
                flags: "primary"
            },
            {
                label: mw.msg( "review-dialogs-dialog-cancel-action-label" ),
                flags: "safe"
            }
        ];

        mw.review.dialogs.Dialog.prototype.initialize = function () {
            mw.review.dialogs.Dialog.super.prototype.initialize.apply( this, arguments );

            this.$progress = $( "<div>" );
            this.$progress.addClass( "ext-review-dialogs-dialog-progress" );
            this.$progress.html( new OO.ui.ProgressBarWidget( {} ).$element );

            this.$content = $( "<div>" );
            this.$content.addClass( "ext-review-dialogs-dialog-content" );

            this.$body.append( this.$progress );
            this.$body.append( this.$content );

            mw.review.dialogs.Dialog.prototype.getActionProcess = function ( action ) {
                let dialog = this;

                if ( action ) {
                    this.showProgress();
                    this.actions.get().forEach( action => action.setDisabled( true ) );

                    let params = {};

                    params.action = "workflows";
                    params.operation = "execute";
                    params.execute = "finishtask";
                    params.id = this.getTaskID();

                    mw.review.api.get( params ).done( () => {
                        dialog.close( { action: action } );
                    } ).fail( error => {
                        console.log( error );
                    } );
                }

                return mw.review.dialogs.Dialog.super.prototype.getActionProcess.call( this, action );
            };
        };

        mw.review.dialogs.Dialog.prototype.getTaskID = function () {
            return this.taskID;
        };

        mw.review.dialogs.Dialog.prototype.showProgress = function () {
            this.$content.hide();
            this.$progress.show();
        };

        mw.review.dialogs.Dialog.prototype.hideProgress = function () {
            this.$progress.hide();
            this.$content.show();
        };
    };

    OO.inheritClass( mw.review.dialogs.Dialog, OO.ui.ProcessDialog );
}() );