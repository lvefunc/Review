( function () {
    mw.review.ui.AssignKeywordsWidget = function MwReviewUiAssignKeywordsWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-assignKeywordsWidget" );
        config.label = config.label || mw.msg( "review-ui-assign-keywords-widget-label" );

        if ( !config.taskID ) {
            throw new Error( "Task ID is not set" );
        } else {
            this.taskID = config.taskID;
        }

        mw.review.ui.AssignKeywordsWidget.super.call( this, config );

        // Keywords label widget
        config = {};
        config.label = mw.msg( "review-ui-assign-keywords-widget-keywords-label" );

        this.keywordsLabel = new OO.ui.LabelWidget( config );
        this.keywordsLabel.$element.addClass( "ext-review-ui-assignKeywordsWidget-keywordsLabel" );

        // Keywords multiselect widget
        config = {};
        config.allowArbitrary = false;
        config.placeholder = mw.msg( "review-ui-assign-keywords-widget-keywords-multiselect-placeholder" );

        this.keywordsMultiselect = new OO.ui.MenuTagMultiselectWidget( config );
        this.keywordsMultiselect.$element.addClass( "ext-review-ui-assignKeywordsWidget-keywordsMultiselect" );

        // Confirm button widget
        config = {};
        config.label = mw.msg( "review-ui-assign-keywords-widget-confirm-button-label" );

        this.confirmButton = new OO.ui.ButtonWidget( config );
        this.confirmButton.$element.addClass( "ext-review-ui-assignKeywordsWidget-confirmButton" );
        this.confirmButton.on( "click", () => {
            this.lock();
            this.save()
                .then( () => {
                    this.clear();
                    this.fetch().then( () => {
                        this.unlock();
                    } );
                }, ( error ) => {
                    let message = mw.msg( error );

                    OO.ui.alert( message ).then( () => {
                        this.clear();
                        this.fetch().then( () => {
                            this.unlock();
                        } );
                    } );
                } );
        } );

        this.$content.append( this.keywordsLabel.$element );
        this.$content.append( this.keywordsMultiselect.$element );
        this.$content.append( this.confirmButton.$element );
    };

    OO.inheritClass( mw.review.ui.AssignKeywordsWidget, mw.review.ui.BlockWidget );

    mw.review.ui.AssignKeywordsWidget.prototype.load = function () {
        this.lock();
        this.clear();

        return this.fetch().then( () => {
            this.unlock();
        }, ( error ) => {
            let message = mw.msg( error );

            OO.ui.alert( message ).then( () => {
                this.clear();
                this.unlock();
            } );
        } );
    };

    mw.review.ui.AssignKeywordsWidget.prototype.fetch = function () {
        let params = {};

        params.action = "workflows";
        params.operation = "read";
        params.read = "runtime";
        params.readruntime = "task";
        params.id = this.taskID;

        return Promise.all( [
            mw.review.model.Keyword.static.findAll()
                .then( ( keywords ) => keywords.map( keyword => ( {
                    data: btoa( keyword.getID() ),
                    label: keyword.getName()
                } ) ) ),
            mw.review.api.get( params )
                .then( ( taskData ) => OO.getProp( taskData, "result", "revision", "id" ) )
                .then( ( revisionID ) => mw.review.model.Revision.static.findByID( revisionID ) )
                .then( ( revision ) => mw.review.model.Match.static.findByRevision( revision ) )
                .then( ( matches ) => Promise.all( matches.map( match => match.getKeyword() ) ) )
                .then( ( keywords ) => keywords.map( keyword => btoa( keyword.getID() ) ) )
        ] ).then( ( [ options, selected ] ) => {
            this.keywordsMultiselect.addOptions( options );
            this.keywordsMultiselect.setValue( selected );
            this.initiallySelected = selected;
        } );
    };

    mw.review.ui.AssignKeywordsWidget.prototype.save = function () {
        let promises = [], params = {};

        params.action = "workflows";
        params.operation = "execute";
        params.task_id = this.taskID;

        this.keywordsMultiselect.getValue().forEach( data => {
            let index = this.initiallySelected.indexOf( data );

            if ( index > -1 ) {
                this.initiallySelected.splice( index, 1 );
            } else {
                params.execute = "assignkeyword";
                params.keyword_id = parseInt( atob( data ) );

                promises.push( mw.review.api.get( params ) );
            }
        } );

        this.initiallySelected.forEach( data => {
            params.execute = "unassignkeyword";
            params.keyword_id = parseInt( atob( data ) );

            promises.push( mw.review.api.get( params ) );
        } );

        return Promise.all( promises );
    };

    mw.review.ui.AssignKeywordsWidget.prototype.clear = function () {
        this.keywordsMultiselect.menu.removeItems( this.keywordsMultiselect.menu.getItems() );
    };

    mw.review.ui.AssignKeywordsWidget.prototype.lock = function () {
        this.keywordsMultiselect.setDisabled( true );
        this.confirmButton.setDisabled( true );
    };

    mw.review.ui.AssignKeywordsWidget.prototype.unlock = function () {
        this.keywordsMultiselect.setDisabled( false );
        this.confirmButton.setDisabled( false );
    };
}() );