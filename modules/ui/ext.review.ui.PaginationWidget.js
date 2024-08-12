( function () {
    mw.review.ui.PaginationWidget = function MwReviewUiPaginationWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-paginationWidget" );

        if ( !config.renderer ) {
            throw new Error( "Renderer is not set" );
        } else {
            this.renderer = config.renderer;
        }

        mw.review.ui.PaginationWidget.super.call( this, config );

        this.currentPage = 1;
        this.pages = [];

        this.$progress = $( "<div>" );
        this.$progress.addClass( "ext-review-ui-paginationWidget-progress" );
        this.$progress.html( new OO.ui.ProgressBarWidget( {} ).$element );

        this.$content = $( "<div>" );
        this.$content.addClass( "ext-review-ui-paginationWidget-content" );

        // Ordering
        config = {};
        config.label = mw.msg( "review-ui-pagination-widget-ordering-label" );

        this.orderingLabel = new OO.ui.LabelWidget( config );
        this.orderingLabel.$element.addClass( "ext-review-ui-paginationWidget-orderingLabel" );

        config = {};
        config.options = [
            { data: "Descending", label: mw.msg( "review-ui-pagination-widget-ordering-descending" ) },
            { data: "Ascending", label: mw.msg( "review-ui-pagination-widget-ordering-ascending" ) }
        ];

        this.orderingDropdownInput = new OO.ui.DropdownInputWidget( config );
        this.orderingDropdownInput.$element.addClass( "ext-review-ui-paginationWidget-orderingDropdownInput" );

        config = {};
        config.label = mw.msg( "review-ui-pagination-widget-confirm-ordering-button-label" );

        this.confirmOrderingButton = new OO.ui.ButtonWidget( config );
        this.confirmOrderingButton.$element.addClass( "ext-review-ui-paginationWidget-confirmOrderingButton" );
        this.confirmOrderingButton.on( "click", () => {
            this.clear();
            this.load( 1 );
        } );

        this.$ordering = $( "<div>" );
        this.$ordering.addClass( "ext-review-ui-paginationWidget-ordering" );
        this.$ordering.append( this.orderingLabel.$element );
        this.$ordering.append( this.orderingDropdownInput.$element );
        this.$ordering.append( this.confirmOrderingButton.$element );

        // Limit
        config = {};
        config.label = mw.msg( "review-ui-pagination-widget-limit-label" );

        this.limitLabel = new OO.ui.LabelWidget( config );
        this.limitLabel.$element.addClass( "ext-review-ui-paginationWidget-limitLabel" );

        config = {};
        config.options = [
            { data: 10, label: mw.msg( "review-ui-pagination-widget-limit-ten" ) },
            { data: 25, label: mw.msg( "review-ui-pagination-widget-limit-twenty-five" ) },
            { data: 50, label: mw.msg( "review-ui-pagination-widget-limit-fifty" ) },
            { data: 100, label: mw.msg( "review-ui-pagination-widget-limit-one-hundred" ) }
        ];

        this.limitDropdownInput = new OO.ui.DropdownInputWidget( config );
        this.limitDropdownInput.$element.addClass( "ext-review-ui-paginationWidget-limitDropdownInput" );

        config = {};
        config.label = mw.msg( "review-ui-pagination-widget-confirm-limit-button-label" );

        this.confirmLimitButton = new OO.ui.ButtonWidget( config );
        this.confirmLimitButton.$element.addClass( "ext-review-ui-paginationWidget-confirmLimitButton" );
        this.confirmLimitButton.on( "click", () => {
            this.clear();
            this.load( 1 );
        } );

        this.$limit = $( "<div>" );
        this.$limit.addClass( "ext-review-ui-paginationWidget-limit" );
        this.$limit.append( this.limitLabel.$element );
        this.$limit.append( this.limitDropdownInput.$element );
        this.$limit.append( this.confirmLimitButton.$element );

        // Navigation
        config = {};

        this.currentPageLabel = new OO.ui.LabelWidget( config );
        this.currentPageLabel.$element.addClass( "ext-review-ui-paginationWidget-currentPageLabel" );

        config = {};
        config.icon = "arrowPrevious";
        config.invisibleLabel = true;

        this.prevPageButton = new OO.ui.ButtonWidget( config );
        this.prevPageButton.$element.addClass( "ext-review-ui-paginationWidget-prevPageButton" );
        this.prevPageButton.on( "click", () => {
            this.load( --this.currentPage );
        } );

        config = {};
        config.icon = "arrowNext";
        config.invisibleLabel = true;

        this.nextPageButton = new OO.ui.ButtonWidget( config );
        this.nextPageButton.$element.addClass( "ext-review-ui-paginationWidget-nextPageButton" );
        this.nextPageButton.on( "click", () => {
            this.load( ++this.currentPage );
        } );

        this.$navigation = $( "<div>" );
        this.$navigation.addClass( "ext-review-ui-paginationWidget-navigation" );
        this.$navigation.append( this.currentPageLabel.$element );
        this.$navigation.append( this.prevPageButton.$element );
        this.$navigation.append( this.nextPageButton.$element );

        this.$element.append( this.$progress );
        this.$element.append( this.$content );
        this.$element.append( this.$ordering );
        this.$element.append( this.$limit );
        this.$element.append( this.$navigation );

        this.load( 1 );
    };

    OO.inheritClass( mw.review.ui.PaginationWidget, OO.ui.Widget );

    mw.review.ui.PaginationWidget.prototype.load = function ( pos ) {
        this.pages.forEach( page => page.$page.$element.hide() );

        if ( this.pages[ pos ] === undefined ) {
            this.showProgress();

            let from = pos === 1 ? 0 : this.pages[ pos - 1 ].$params.from;
            let ordering = this.orderingDropdownInput.getValue();
            let limit = this.limitDropdownInput.getValue();

            this.renderer.load( from, ordering, limit ).then( page => {
                this.pages[ pos ] = page;
                this.pages[ pos ].$page.$element.hide();
                this.$content.append( this.pages[ pos ].$page.$element );

                this.hideProgress();
                this.show( pos );
            } );
        } else {
            this.show( pos );
        }
    };

    mw.review.ui.PaginationWidget.prototype.show = function ( pos ) {
        this.pages[ pos ].$page.$element.show();
        this.currentPageLabel.setLabel( pos.toString() );
        this.prevPageButton.setDisabled( pos === 1 );
        this.nextPageButton.setDisabled( this.pages[ pos ].$params.from === undefined );
    };

    mw.review.ui.PaginationWidget.prototype.clear = function () {
        this.$content.empty();
        this.pages = [];
    };

    mw.review.ui.PaginationWidget.prototype.showProgress = function () {
        this.buttonStates = {
            "prev": this.prevPageButton.isDisabled(),
            "next": this.nextPageButton.isDisabled()
        };

        this.prevPageButton.setDisabled( true );
        this.nextPageButton.setDisabled( true );
        this.orderingDropdownInput.setDisabled( true );
        this.confirmOrderingButton.setDisabled( true );
        this.limitDropdownInput.setDisabled( true );
        this.confirmLimitButton.setDisabled( true );

        this.$content.hide();
        this.$progress.show();
    };

    mw.review.ui.PaginationWidget.prototype.hideProgress = function () {
        this.prevPageButton.setDisabled( this.buttonStates.prev );
        this.nextPageButton.setDisabled( this.buttonStates.next );
        this.orderingDropdownInput.setDisabled( false );
        this.confirmOrderingButton.setDisabled( false );
        this.limitDropdownInput.setDisabled( false );
        this.confirmLimitButton.setDisabled( false );

        this.$progress.hide();
        this.$content.show();
    };
}() );