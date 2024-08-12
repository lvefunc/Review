( function () {
    mw.review.ui.TableHeader = function MwReviewUiTableHeader( ...columnNames ) {
        this.$row = $( "<tr>" );
        this.$element = $( "<thead>" );
        this.$element.addClass( "ext-review-ui-tableHeader" );
        this.$element.html( this.$row );

        columnNames.forEach( name => this.addColumn( name ) );
    };

    OO.initClass( mw.review.ui.TableHeader );

    mw.review.ui.TableHeader.prototype.addColumn = function ( name ) {
        let column = $( "<th>" );

        column.addClass( "ext-review-ui-tableHeader-column" );
        column.html( name );

        this.$row.append( column );
    };
}() );