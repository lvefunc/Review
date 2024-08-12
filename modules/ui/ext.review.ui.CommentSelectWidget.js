( function () {
    mw.review.ui.CommentSelectWidget = function MwReviewUiCommentListWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-commentSelectWidget" );

        if ( config.taskID ) {
            this.taskID = config.taskID;
        } else if ( config.revisionID ) {
            this.revisionID = config.revisionID;
        } else {
            throw new Error( "Task or revision ID's are not set" );
        }

        if ( config.rootElementID ) {
            let rootElement = document.getElementById( config.rootElementID );

            this.rootElement = rootElement;
            this.rootElementCopy = rootElement.innerHTML;
        }

        mw.review.ui.CommentSelectWidget.super.call( this, config );

        this.aggregate( { delete: "itemDelete" } );
        this.connect( this, { itemDelete: "onItemDelete" } );
        this.connect( this, { choose: "onItemChoose" } );
    };

    OO.inheritClass( mw.review.ui.CommentSelectWidget, OO.ui.SelectWidget );

    mw.review.ui.CommentSelectWidget.prototype.load = async function () {
        if ( !this.revisionID ) {
            let params = {};

            params.action = "workflows";
            params.operation = "read";
            params.read = "runtime";
            params.readruntime = "task";
            params.id = this.taskID;

            this.revisionID = await mw.review.api.get( params )
                .then( ( taskData ) => OO.getProp( taskData, "result", "revision", "id" ) )
        }

        return mw.review.model.Revision.static.findByID( this.revisionID )
            .then( ( revision ) => mw.review.model.Comment.static.findByRevision( revision ) )
            .then( ( comments ) => {
                return comments.map( comment => {
                    let config = {};

                    config.comment = comment;
                    config.deletable = true;

                    return new mw.review.ui.CommentItemWidget( config );
                } );
            } )
            .then( ( items ) => Promise.all( items.map( item => item.load() ) ).then( () => this.addItems( items ) ) );
    };

    mw.review.ui.CommentSelectWidget.prototype.add = async function () {
        let ranges = mw.review.utils.Range.static.save( this.rootElement );

        let message = mw.msg( "review-ui-comment-select-widget-add-prompt-message" );
        let placeholder = mw.msg( "review-ui-comment-select-widget-add-prompt-textinput-placeholder" );

        return OO.ui.prompt( message, {
            textInput: {
                placeholder: placeholder
            }
        } ).then( ( result ) => {
            if ( !result ) {
                // ...
            } else {
                let params = {};

                params.action = "workflows";
                params.operation = "execute";
                params.execute = "createcomment";
                params.task_id = this.taskID;
                params.comment_text = result;

                return mw.review.api.get( params ).then( ( commentData ) => {
                    let commentID = OO.getProp( commentData, "result", "id" );

                    params = {};
                    params.action = "workflows";
                    params.operation = "execute";
                    params.execute = "createrange";
                    params.task_id = this.taskID;
                    params.comment_id = commentID;

                    let promises = ranges.map( range => {
                        params.start_container = range.startContainer;
                        params.end_container = range.endContainer;
                        params.start_offset = range.startOffset;
                        params.end_offset = range.endOffset;

                        return mw.review.api.get( params );
                    } );

                    return Promise.all( promises )
                        .then( () => mw.review.model.Comment.static.findByID( commentID ) )
                        .then( ( comment ) => {
                            let config = {};

                            config.comment = comment;
                            config.deletable = true;

                            return new mw.review.ui.CommentItemWidget( config );
                        } )
                        .then( ( item ) => item.load().then( () => this.addItems( [ item ] ) ) );
                } );
            }
        } );
    };

    mw.review.ui.CommentSelectWidget.prototype.onItemChoose = function ( item ) {
        if ( $( this.rootElement ).is( ":hidden" ) ) {
            return;
        }

        let selectWidget = this;

        this.rootElement.innerHTML = this.rootElementCopy;
        this.rootElement.addEventListener( "mousedown", function () {
            selectWidget.unselectItem( item );
            selectWidget.rootElement.innerHTML = selectWidget.rootElementCopy;
        }, {
            once: true
        } );

        mw.review.utils.Range.static.restore( this.rootElement, item.getRanges() )
            .forEach( range => mw.review.utils.Range.static.highlight( range ) );
    };

    mw.review.ui.CommentSelectWidget.prototype.onItemDelete = function ( item ) {
        if ( this.rootElement && ( item === this.findSelectedItem() ) ) {
            this.rootElement.innerHTML = this.rootElementCopy;
        }

        this.removeItems( [ item ] );

        let params = {};

        params.action = "workflows";
        params.operation = "execute";
        params.execute = "deletecomment";
        params.task_id = this.taskID;
        params.comment_id = item.getComment().getID();

        return mw.review.api.get( params );
    };
}() );