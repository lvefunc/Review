( function () {
    mw.review.model.Edit = function MwReviewModelEdit( id, title, revisions ) {
        this.id = id;
        this.title = title;
        this.revisions = revisions;
    };

    OO.initClass( mw.review.model.Edit );

    mw.review.model.Edit.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.Edit.static.construct = function ( data ) {
        data.revisions.forEach( revision => mw.review.model.Revision.static.mapFromData( revision ) );

        return new mw.review.model.Edit(
            data.id,
            data.title,
            data.revisions.map( revision => revision.id )
        );
    };

    mw.review.model.Edit.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.Edit.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query";
            params.list = "reviewedits";
            params.id = id;

            let result = await mw.review.api.get( params );

            identityMap.setValue( id, mw.review.model.Edit.static.construct( result.result ) );
        }

        let edit = identityMap.getValue( id );
        mw.review.model.Edit.static.identityMap.release();

        return edit;
    };

    mw.review.model.Edit.static.findByOwner = async function ( owner, from, ordering = "Ascending", limit = 10 ) {
        let edits = [], params = {};

        params.action = "query";
        params.list = "reviewedits";
        params.owner = owner.getID();
        params.ordering = ordering;
        params.limit = limit;

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Edit.static.identityMap.acquire()
        ] );

        if ( result.result ) {
            edits.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Edit.static.construct( data ) );
                }

                return identityMap.getValue( data.id );
            } ) );
        }

        mw.review.model.Edit.static.identityMap.release();

        let response = {};

        response.result = edits;
        response.params = {};

        if ( result.continue ) {
            response.params.from = result.continue.from;
        }

        return response;
    };

    mw.review.model.Edit.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.Edit.prototype.getTitle = function () {
        return this.title;
    };

    mw.review.model.Edit.prototype.getRevisions = function () {
        return Promise.all( this.revisions.map( revision => mw.review.model.Revision.static.findByID( revision ) ) );
    };
}() );