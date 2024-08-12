( function () {
    mw.review.ui.MakeUserExpertWidget = function MwReviewUiMakeUserExpertWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-makeUserExpertWidget" );
        config.label = config.label || mw.msg( "review-ui-make-user-expert-widget-label" );

        if ( !config.taskID ) {
            throw new Error( "Task ID is not set" );
        } else {
            this.taskID = config.taskID;
        }

        this.ccw = config.ccw !== undefined && config.ccw;

        mw.review.ui.MakeUserExpertWidget.super.call( this, config );

        config = {};
        config.label = mw.msg( "review-ui-make-user-expert-widget-users-label" );

        this.usersLabel = new OO.ui.LabelWidget( config );
        this.usersLabel.$element.addClass( "ext-review-ui-makeUserExpertWidget-usersLabel" );

        config = {};
        config.allowArbitrary = false;
        config.placeholder = mw.msg( "review-ui-make-user-expert-widget-users-multiselect-placeholder" );

        this.usersMultiselect = new OO.ui.MenuTagMultiselectWidget( config );
        this.usersMultiselect.$element.addClass( "ext-review-ui-makeUserExpertWidget-usersMultiselect" );

        config = {};
        config.label = mw.msg( "review-ui-make-user-expert-widget-confirm-button-label" );

        this.confirmButton = new OO.ui.ButtonWidget( config );
        this.confirmButton.$element.addClass( "ext-review-ui-makeUserExpertWidget-confirmButton" );
        this.confirmButton.on( "click", () => {
            this.lock();
            this.save()
                .then( () => {
                    if ( this.ccw ) {
                        return this.ccw.load();
                    }
                } )
                .then( () => {
                    this.clear();
                    this.fetch().then( () => {
                        this.unlock();
                    } );
                } )
                .catch( ( error ) => {
                    let message = mw.msg( error );

                    OO.ui.alert( message ).then( () => {
                        this.clear();
                        this.fetch().then( () => {
                            this.unlock();
                        } );
                    } );
                } );
        } );

        this.$content.append( this.usersLabel.$element );
        this.$content.append( this.usersMultiselect.$element );
        this.$content.append( this.confirmButton.$element );
    };

    OO.inheritClass( mw.review.ui.MakeUserExpertWidget, mw.review.ui.BlockWidget );

    mw.review.ui.MakeUserExpertWidget.prototype.load = function () {
        this.lock();
        this.clear();

        return this.fetch().then( () => {
            this.unlock();
        } ).catch( ( error ) => {
            let message = mw.msg( error );

            OO.ui.alert( message ).then( () => {
                this.clear();
                this.unlock();
            } );
        } );
    };

    mw.review.ui.MakeUserExpertWidget.prototype.fetch = async function () {
        let [ allusers, allexperts ] = await Promise.all( [
            mw.review.model.User.static.findAll(),
            mw.review.model.Expert.static.findAll()
                .then( allexperts => Promise.all( allexperts.map( expert => expert.getUser() ) ) )
        ] );
        let options = allusers
            .filter( user => allexperts.find( expert => expert === user ) === undefined )
            .map( user => ( { data: btoa( user.getID() ), label: user.getName() } ) );

        this.usersMultiselect.addOptions( options );
    };

    mw.review.ui.MakeUserExpertWidget.prototype.save = function () {
        let params = {};

        params.action = "workflows";
        params.operation = "execute";
        params.execute = "makeuserexpert";

        let promises = this.usersMultiselect.getValue().map( data => {
            params.task_id = this.taskID;
            params.user_id = parseInt( atob( data ) );

            return mw.review.api.get( params );
        } );

        return Promise.all( promises );
    };

    mw.review.ui.MakeUserExpertWidget.prototype.clear = function () {
        this.usersMultiselect.menu.removeItems( this.usersMultiselect.menu.getItems() );
        this.usersMultiselect.setValue( [] );
    };

    mw.review.ui.MakeUserExpertWidget.prototype.lock = function () {
        this.usersMultiselect.setDisabled( true );
        this.confirmButton.setDisabled( true );
    };

    mw.review.ui.MakeUserExpertWidget.prototype.unlock = function () {
        this.usersMultiselect.setDisabled( false );
        this.confirmButton.setDisabled( false );
    };
}() );