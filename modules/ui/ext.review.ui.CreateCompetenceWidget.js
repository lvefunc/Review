( function () {
    mw.review.ui.CreateCompetenceWidget = function MwReviewUiCreateCompetenceWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-createCompetenceWidget" );
        config.label = config.label || mw.msg( "review-ui-create-competence-widget-label" );

        if ( !config.taskID ) {
            throw new Error( "Task ID is not set" );
        } else {
            this.taskID = config.taskID;
        }

        mw.review.ui.CreateCompetenceWidget.super.call( this, config );

        config = {};
        config.label = mw.msg( "review-ui-create-competence-widget-keyword-label" );

        this.keywordLabel = new OO.ui.LabelWidget( config );
        this.keywordLabel.$element.addClass( "ext-review-ui-createCompetenceWidget-keywordLabel" );

        config = {};
        config.readOnly = true;

        this.keywordTextInput = new OO.ui.TextInputWidget( config );
        this.keywordTextInput.$element.addClass( "ext-review-ui-createCompetenceWidget-keywordTextInput" );

        config = {};
        config.label = mw.msg( "review-ui-create-competence-widget-synonyms-label" );

        this.synonymsLabel = new OO.ui.LabelWidget( config );
        this.synonymsLabel.$element.addClass( "ext-review-ui-createCompetenceWidget-synonymsLabel" );

        config = {};
        config.input = {};
        config.input.readOnly = true;
        config.allowArbitrary = true;

        this.synonymsMultiselect = new OO.ui.TagMultiselectWidget( config );
        this.synonymsMultiselect.$element.addClass( "ext-review-ui-createCompetenceWidget-synonymsMultiselect" );

        config = {};
        config.label = mw.msg( "review-ui-create-competence-widget-experts-label" );

        this.expertsLabel = new OO.ui.LabelWidget( config );
        this.expertsLabel.$element.addClass( "ext-review-ui-createCompetenceWidget-expertsLabel" );

        config = {};
        config.allowArbitrary = false;
        config.placeholder = mw.msg( "review-ui-create-competence-widget-experts-multiselect-placeholder" );

        this.expertsMultiselect = new OO.ui.MenuTagMultiselectWidget( config );
        this.expertsMultiselect.$element.addClass( "ext-review-ui-createCompetenceWidget-expertsMultiselect" );

        config = {};
        config.label = mw.msg( "review-ui-create-competence-widget-confirm-button-label" );

        this.confirmButton = new OO.ui.ButtonWidget( config );
        this.confirmButton.$element.addClass( "ext-review-ui-createCompetenceWidget-confirmButton" );
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

        this.$content.append( this.keywordLabel.$element );
        this.$content.append( this.keywordTextInput.$element );
        this.$content.append( this.synonymsLabel.$element );
        this.$content.append( this.synonymsMultiselect.$element );
        this.$content.append( this.expertsLabel.$element );
        this.$content.append( this.expertsMultiselect.$element );
        this.$content.append( this.confirmButton.$element );
    };

    OO.inheritClass( mw.review.ui.CreateCompetenceWidget, mw.review.ui.BlockWidget );

    mw.review.ui.CreateCompetenceWidget.prototype.load = function () {
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

    mw.review.ui.CreateCompetenceWidget.prototype.fetch = async function () {
        let params = {};

        params.action = "workflows";
        params.operation = "read";
        params.read = "runtime";
        params.readruntime = "task";
        params.id = this.taskID;

        let [ options, selected ] = await Promise.all( [
            mw.review.model.Expert.static.findAll().then( allexperts => {
                return Promise.all( allexperts.map( expert => {
                    return ( async ( expert ) => ( {
                        data: btoa( expert.getID() ),
                        label: ( await expert.getUser() ).getName()
                    } ) )( expert );
                } ) );
            } ),
            ( async () => {
                let keyword = await mw.review.api.get( params )
                    .then( ( taskData ) => OO.getProp( taskData, "result", "keyword", "id" ) )
                    .then( ( keywordID ) => mw.review.model.Keyword.static.findByID( keywordID ) );
                let [ synonyms, experts ] = await Promise.all( [
                    mw.review.model.Synonym.static.findByKeyword( keyword ),
                    mw.review.model.Competence.static.findByKeyword( keyword )
                        .then( competencies => Promise.all( competencies.map( competence => competence.getExpert() ) ) )
                ] );

                this.keywordTextInput.setValue( keyword.getName() );
                this.synonymsMultiselect.setValue( synonyms.map( synonym => synonym.getName() ) );
                this.synonymsMultiselect.getItems().forEach( item => item.setDisabled( true ) );

                return experts.map( expert => btoa( expert.getID() ) );
            } )()
        ] );

        this.expertsMultiselect.addOptions( options );
        this.expertsMultiselect.setValue( selected );
        this.initiallySelected = selected;
    };

    mw.review.ui.CreateCompetenceWidget.prototype.save = function () {
        let promises = [], params = {};

        params.action = "workflows";
        params.operation = "execute";
        params.task_id = this.taskID;

        this.expertsMultiselect.getValue().forEach( data => {
            let index = this.initiallySelected.indexOf( data );

            if ( index > -1 ) {
                this.initiallySelected.splice( index, 1 );
            } else {
                params.execute = "createcompetence";
                params.expert_id = parseInt( atob( data ) );

                promises.push( mw.review.api.get( params ) );
            }
        } );

        this.initiallySelected.forEach( data => {
            params.execute = "deletecompetence";
            params.expert_id = parseInt( atob( data ) );

            promises.push( mw.review.api.get( params ) );
        } );

        return Promise.all( promises );
    };

    mw.review.ui.CreateCompetenceWidget.prototype.clear = function () {
        this.expertsMultiselect.menu.removeItems( this.expertsMultiselect.menu.getItems() );
    };

    mw.review.ui.CreateCompetenceWidget.prototype.lock = function () {
        this.expertsMultiselect.setDisabled( true );
        this.confirmButton.setDisabled( true );
    };

    mw.review.ui.CreateCompetenceWidget.prototype.unlock = function () {
        this.expertsMultiselect.setDisabled( false );
        this.confirmButton.setDisabled( false );
    };
}() );