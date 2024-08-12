( function () {
    mw.review.ui.DiffWidget = function MwReviewUiDiffWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-diffWidget" );

        if ( !config.revision ) {
            throw new Error( "Revision is not set" );
        } else {
            this.revision = config.revision;
        }

        mw.review.ui.DiffWidget.super.call( this, config );
    };

    OO.inheritClass( mw.review.ui.DiffWidget, OO.ui.Widget );

    mw.review.ui.DiffWidget.prototype.load = async function () {
        let parent = await this.revision.getParent(),
            params = {};

        params[ "action" ] = "compare";
        params[ "toslots" ] = "main";
        params[ "totext-main" ] = this.revision.getContent();
        params[ "fromslots" ] = "main";
        params[ "fromtext-main" ] = parent === null ? "" : parent.getContent();

        let result = await mw.review.api.get( params );
        let tbody = $( "<tbody>" ).html( OO.getProp( result, "compare", "*" ) );

        tbody.find( ".diff-lineno" ).text( mw.msg( "review-ui-diff-widget-this-revision", this.revision.getID(), this.revision.getTimestamp() ) );
        tbody.find( "#mw-diff-left-l1.diff-lineno" ).text(
            parent === null
                ? mw.msg( "review-ui-diff-widget-blank-revision" )
                : mw.msg( "review-ui-diff-widget-parent-revision", parent.getID(), parent.getTimestamp() )
        );

        this.$element.html(
            $( "<table>" ).addClass( "diff" ).append(
                $( "<colgroup>" )
                    .append( $( "<col>" ).addClass( "diff-marker" ) )
                    .append( $( "<col>" ).addClass( "diff-content" ) )
                    .append( $( "<col>" ).addClass( "diff-marker" ) )
                    .append( $( "<col>" ).addClass( "diff-content" ) )
            ).append( tbody )
        );
    };
}() );