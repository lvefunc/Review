( function () {
    mw.review.ui.VerdictWidget = function MwReviewUiVerdictWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-verdictWidget" );
        config.label = config.label || mw.msg( "review-ui-verdict-widget-label" );

        if ( !config.taskID ) {
            throw new Error( "Task ID is not set" );
        } else {
            this.taskID = config.taskID;
        }

        mw.review.ui.VerdictWidget.super.call( this, config );

        config = {};
        config.data = "accept";
        config.label = mw.msg( "review-ui-verdict-widget-accept-radio-label" );

        this.acceptRadio = new OO.ui.RadioOptionWidget( config );

        config = {};
        config.data = "reject";
        config.label = mw.msg( "review-ui-verdict-widget-reject-radio-label" );

        this.rejectRadio = new OO.ui.RadioOptionWidget( config );

        config = {};
        config.items = [ this.acceptRadio, this.rejectRadio ];

        this.radioSelect = new OO.ui.RadioSelectWidget( config );
        this.radioSelect.on( "choose", ( option ) => {
            this.lock();
            this.save( option )
                .then( () => this.load() )
                .then( () => this.unlock() )
                .catch( ( error ) => {
                    let message = mw.msg( error );

                    OO.ui.alert( message ).then( () => {
                        this.unlock();
                    } );
                } );
        } );

        this.$content.append( this.radioSelect.$element );
    };

    OO.inheritClass( mw.review.ui.VerdictWidget, mw.review.ui.BlockWidget );

    mw.review.ui.VerdictWidget.prototype.load = function () {
        this.lock();

        return this.fetch().then( () => {
            this.unlock();
        }, ( error ) => {
            let message = mw.msg( error );

            OO.ui.alert( message ).then( () => {
                this.unlock();
            } );
        } );
    };

    mw.review.ui.VerdictWidget.prototype.fetch = function () {
        let params = {};

        params.action = "workflows";
        params.operation = "read";
        params.read = "runtime";
        params.readruntime = "task";
        params.id = this.taskID;

        return mw.review.api.get( params )
            .then( ( taskData ) => OO.getProp( taskData, "result", "verdict" ) === "true" )
            .then( ( verdict ) => this.radioSelect.selectItem( verdict ? this.acceptRadio : this.rejectRadio ) );
    };

    mw.review.ui.VerdictWidget.prototype.save = function ( option ) {
        let params = {};

        params.action = "workflows";
        params.operation = "execute";
        params.execute = "setverdict";
        params.task_id = this.taskID;
        params.verdict = option === this.acceptRadio ? true : undefined;

        return mw.review.api.get( params );
    };

    mw.review.ui.VerdictWidget.prototype.lock = function () {
        this.radioSelect.setDisabled( true );
    };

    mw.review.ui.VerdictWidget.prototype.unlock = function () {
        this.radioSelect.setDisabled( false );
    };
}() );