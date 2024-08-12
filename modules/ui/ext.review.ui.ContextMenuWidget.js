( function () {
    mw.review.ui.ContextMenuWidget = function MwReviewUiContextMenu( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-contextMenuWidget" );

        mw.review.ui.ContextMenuWidget.super.call( this, config );

        this.$menu = $( "<ul>" );
        this.$menu.addClass( "ext-review-ui-contextMenuWidget-menu" );

        this.$content = $( "<div>" );
        this.$content.addClass( "ext-review-ui-contextMenuWidget-content" );
        this.$content.on( "contextmenu", event => {
            event.preventDefault();
            this.$menu.finish().toggle( 100 ).css( {
                left: event.pageX + "px",
                top: event.pageY + "px"
            } );
        } );

        if ( config.options ) {
            config.options.forEach( option => this.addOption( option.label, option.action, option.fn ) );
        }

        this.$element.append( this.$menu );
        this.$element.append( this.$content );
    };

    OO.inheritClass( mw.review.ui.ContextMenuWidget, OO.ui.Widget );

    mw.review.ui.ContextMenuWidget.prototype.addOption = function ( label, fn ) {
        this.$menu.hide();
        this.$menu.append(
            $( "<li>" ).text( label ).on( "click", () => {
                this.$menu.hide();
                fn();
            } )
        );
    };
}() );