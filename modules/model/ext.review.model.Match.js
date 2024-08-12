( function () {
    mw.review.model.Match = function MwReviewModelMatch( id, revisionID, keywordID ) {
        this.id = id;
        this.revisionID = revisionID;
        this.keywordID = keywordID;
    };

    OO.initClass( mw.review.model.Match );

    mw.review.model.Match.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.Match.static.construct = function ( data ) {
        return new mw.review.model.Match( data.id, data.revisionID, data.keywordID );
    };

    mw.review.model.Match.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.Match.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query";
            params.list = "reviewmatches";
            params.id = id;

            let result = await mw.review.api.get( params );

            identityMap.setValue( id, mw.review.model.Match.static.construct( result.result ) );
        }

        let match = identityMap.getValue( id );
        mw.review.model.Match.static.identityMap.release();

        return match;
    };

    mw.review.model.Match.static.findByRevision = async function ( revision ) {
        let matches = [], params = {};

        params.action = "query";
        params.list = "reviewmatches";
        params.revision_id = revision.getID();

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Match.static.identityMap.acquire()
        ] );

        if ( result.result ) {
            matches.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Match.static.construct( data ) )
                }

                return identityMap.getValue( data.id );
            } ) );
        }

        mw.review.model.Match.static.identityMap.release();

        return matches;
    };

    mw.review.model.Match.static.findByKeyword = async function ( keyword ) {
        let matches = [], params = {};

        params.action = "query";
        params.list = "reviewmatches";
        params.keyword_id = keyword.getID();

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Match.static.identityMap.acquire()
        ] );

        if ( result.result ) {
            matches.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Match.static.construct( result.result ) )
                }

                return identityMap.getValue( data.id );
            } ) );
        }

        mw.review.model.Match.static.identityMap.release();

        return matches;
    };

    mw.review.model.Match.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.Match.prototype.getRevision = function () {
        return mw.review.model.Revision.static.findByID( this.revisionID );
    };

    mw.review.model.Match.prototype.getKeyword = function () {
        return mw.review.model.Keyword.static.findByID( this.keywordID )
    };
}() );