( function () {
    mw.review.model.Expert = function MwReviewModelExpert( id, userID, competencies ) {
        this.id = id;
        this.userID = userID;
        this.competencies = competencies;
    };

    OO.initClass( mw.review.model.Expert );

    mw.review.model.Expert.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.Expert.static.construct = function ( data ) {
        return new mw.review.model.Expert(
            data.id,
            data.user,
            data.competencies.map( competence => competence.id )
        );
    };

    mw.review.model.Expert.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.Expert.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query";
            params.list = "reviewexperts";
            params.id = id;

            let result = await mw.review.api.get( params );

            if ( result.result ) {
                identityMap.setValue( id, mw.review.model.Expert.static.construct( result.result ) );
            }
        }

        let expert = identityMap.getValue( id );
        mw.review.model.Expert.static.identityMap.release();

        return expert;
    };

    mw.review.model.Expert.static.findAll = async function ( limit = 50 ) {
        let experts = [], params = {};

        params.action = "query";
        params.list = "reviewexperts";
        params.limit = limit;

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Expert.static.identityMap.acquire()
        ] );

        while ( true ) {
            if ( !result.result ) {
                break;
            }

            experts.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Expert.static.construct( data ) );
                }

                return identityMap.getValue( data.id );
            } ) );

            if ( result.continue ) {
                params.from = result.continue.from;
                result = await mw.review.api.get( params )
            } else {
                break;
            }
        }

        mw.review.model.Expert.static.identityMap.release();

        return experts;
    };

    mw.review.model.Expert.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.Expert.prototype.getUser = function () {
        return mw.review.model.User.static.findByID( this.userID );
    };

    mw.review.model.Expert.prototype.getCompetencies = function () {
        return mw.review.model.Competence.static.findByExpert( this );
    };
}() );