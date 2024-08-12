( function () {
    mw.review.ui.BlockWidget = function MwReviewUiBlockWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-blockWidget" );

        mw.review.ui.BlockWidget.super.call( this, config );

        this.$label = $( "<div>" );
        this.$label.addClass( "ext-review-ui-blockWidget-label" );
        this.$label.append( config.label );

        this.$banner = $( "<div>" );
        this.$banner.addClass( "ext-review-ui-blockWidget-banner" );
        this.$banner.append( this.$label );

        this.$content = $( "<div>" );
        this.$content.addClass( "ext-review-ui-blockWidget-content" );

        this.$element.append( this.$banner );
        this.$element.append( this.$content );
    };

    OO.inheritClass( mw.review.ui.BlockWidget, OO.ui.Widget );
}() );