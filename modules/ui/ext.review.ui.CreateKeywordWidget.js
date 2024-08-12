( function () {
    mw.review.ui.CreateKeywordWidget = function MwReviewUiCreateKeywordWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-createKeywordWidget" );
        config.label = config.label || mw.msg( "review-ui-create-keyword-widget-widget-label" );

        if ( !config.taskID ) {
            throw new Error( "Task ID is not set" );
        } else {
            this.taskID = config.taskID;
        }

        this.akw = config.akw !== undefined && config.akw;

        mw.review.ui.CreateKeywordWidget.super.call( this, config );

        // Keyword label widget
        config = {};
        config.label = mw.msg( "review-ui-create-keyword-widget-keyword-label" );

        this.keywordLabel = new OO.ui.LabelWidget( config );
        this.keywordLabel.$element.addClass( "ext-review-ui-createKeywordWidget-keywordLabel" );

        // Keyword text input widget
        config = {};
        config.required = true;
        config.validate = "non-empty";
        config.placeholder = mw.msg( "review-ui-create-keyword-widget-keyword-textinput-placeholder" );

        this.keywordTextInput = new OO.ui.TextInputWidget( config );
        this.keywordTextInput.$element.addClass( "ext-review-ui-createKeywordWidget-keywordTextInput" );

        // Synonyms label widget
        config = {};
        config.label = mw.msg( "review-ui-create-keyword-widget-synonyms-label" );

        this.synonymsLabel = new OO.ui.LabelWidget( config );
        this.synonymsLabel.$element.addClass( "ext-review-ui-createKeywordWidget-synonymsLabel" );

        // Synonyms multiselect widget
        config = {};
        config.allowArbitrary = true;
        config.placeholder = mw.msg( "review-ui-create-keyword-widget-synonyms-multiselect-placeholder" );

        this.synonymsMultiselect = new OO.ui.MenuTagMultiselectWidget( config );
        this.synonymsMultiselect.$element.addClass( "ext-review-ui-createKeywordWidget-synonymsMultiselect" );

        // Button widget
        config = {};
        config.label = mw.msg( "review-ui-create-keyword-widget-confirm-button-label" );

        this.confirmButton = new OO.ui.ButtonWidget( config );
        this.confirmButton.$element.addClass( "ext-review-ui-createKeywordWidget-confirmButton" );
        this.confirmButton.on( "click", () => {
            this.keywordTextInput.getValidity().then( () => {
                this.lock();
                this.save()
                    .then( () => {
                        if ( this.akw ) {
                            return this.akw.load();
                        }
                    } )
                    .then( () => {
                        this.clear();
                        this.unlock();
                    } )
                    .catch( ( error ) => {
                        let message = mw.msg( error );

                        OO.ui.alert( message ).then( () => {
                            this.unlock();
                        } );
                    } );
            }, () => {
                let message = mw.msg( "review-ui-create-keyword-widget-not-valid-input" );

                OO.ui.alert( message );
            } );
        } );

        this.$content.append( this.keywordLabel.$element );
        this.$content.append( this.keywordTextInput.$element );
        this.$content.append( this.synonymsLabel.$element );
        this.$content.append( this.synonymsMultiselect.$element );
        this.$content.append( this.confirmButton.$element );
    };

    OO.inheritClass( mw.review.ui.CreateKeywordWidget, mw.review.ui.BlockWidget );

    mw.review.ui.CreateKeywordWidget.prototype.save = function () {
        let params = {};

        params.action = "workflows";
        params.operation = "execute";
        params.execute = "createkeyword";
        params.task_id = this.taskID;
        params.keyword_name = this.keywordTextInput.getValue();
        params.synonym_names = this.synonymsMultiselect.getValue().join( "|" );

        return mw.review.api.get( params );
    };

    mw.review.ui.CreateKeywordWidget.prototype.clear = function () {
        this.keywordTextInput.setValue();
        this.synonymsMultiselect.clearItems();
    };

    mw.review.ui.CreateKeywordWidget.prototype.lock = function () {
        this.keywordTextInput.setDisabled( true );
        this.synonymsMultiselect.setDisabled( true );
        this.confirmButton.setDisabled( true );
    };

    mw.review.ui.CreateKeywordWidget.prototype.unlock = function () {
        this.keywordTextInput.setDisabled( false );
        this.synonymsMultiselect.setDisabled( false );
        this.confirmButton.setDisabled( false );
    };
}() );