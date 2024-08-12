( function () {
    let mwContentText = $( "#mw-content-text" );

    let renderer = new mw.review.ui.EditTreeTableRenderer();
    let widget = new mw.review.ui.PaginationWidget( { renderer: renderer } );

    mwContentText.append( widget.$element );
}() );