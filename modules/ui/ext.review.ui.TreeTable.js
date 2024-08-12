( function () {
    mw.review.ui.TreeTable = function MwReviewUiTreeTable( header, roots = [] ) {
        this.$thead = header.$element;
        this.$tbody = $( "<tbody>" );
        this.$element = $( "<table>" );
        this.$element.addClass( "ext-review-ui-treeTable" );
        this.$element.append( this.$thead );
        this.$element.append( this.$tbody );

        roots.forEach( root => {
            this.traverse( root );
            root.collapse();
        } );
    };

    OO.initClass( mw.review.ui.TreeTable );

    mw.review.ui.TreeTable.prototype.traverse = function ( node ) {
        node.draw();
        this.$tbody.append( node.$element );
        node.getChildren().forEach( child => this.traverse( child ) );
    };
}() );