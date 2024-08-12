( function () {
    mw.review.ui.CommentItemWidget = function MwReviewUiCommentItemWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-commentItemWidget" );

        if ( !config.comment ) {
            throw new Error( "Comment is not set" );
        } else {
            this.comment = config.comment;
        }

        this.deletable = config.deletable || false;

        mw.review.ui.CommentItemWidget.super.call( this, config );

        config = {};
        config.label = this.comment.getText();

        this.textLabel = new OO.ui.LabelWidget( config );
        this.textLabel.$element.addClass( "ext-review-ui-commentItemWidget-textLabel" );

        config = {};

        this.commentatorLabel = new OO.ui.LabelWidget( config );
        this.commentatorLabel.$element.addClass( "ext-review-ui-commentItemWidget-commentatorLabel" );

        config = {};
        config.label = mw.msg( "review-ui-comment-item-widget-delete-button-label" );

        this.deleteButton = new OO.ui.ButtonWidget( config );
        this.deleteButton.$element.addClass( "ext-review-ui-commentItemWidget-deleteButton" );
        this.deleteButton.$element.addClass( "ext-review-ui-commentItemWidget-deleteButton-disabled" );
        this.deleteButton.setDisabled( true );
        this.deleteButton.connect( this, { click: "onDeleteButtonClick" } );

        this.$element.append( this.textLabel.$element );
        this.$element.append( this.commentatorLabel.$element );
        this.$element.append( this.deleteButton.$element );
    };

    OO.inheritClass( mw.review.ui.CommentItemWidget, OO.ui.OptionWidget );

    mw.review.ui.CommentItemWidget.prototype.load = async function () {
        let [ currentUser, commentator, ranges ] = await Promise.all( [
            mw.review.model.User.static.findCurrent(),
            this.comment.getCommentator(),
            this.comment.getRanges()
        ] );

        this.commentator = commentator;
        this.ranges = ranges;

        this.commentatorLabel.setLabel( commentator.getName() );

        if ( this.deletable && ( currentUser === commentator ) ) {
            this.deleteButton.$element.removeClass( "ext-review-ui-commentItemWidget-deleteButton-disabled" );
            this.deleteButton.$element.addClass( "ext-review-ui-commentItemWidget-deleteButton-enabled" );
            this.deleteButton.setDisabled( false );
        }
    };

    mw.review.ui.CommentItemWidget.prototype.onDeleteButtonClick = function () {
        this.emit( "delete" );
    };

    mw.review.ui.CommentItemWidget.prototype.getComment = function () {
        return this.comment;
    };

    mw.review.ui.CommentItemWidget.prototype.getCommentator = function () {
        return this.commentator;
    };

    mw.review.ui.CommentItemWidget.prototype.getRanges = function () {
        return this.ranges;
    };
}() );