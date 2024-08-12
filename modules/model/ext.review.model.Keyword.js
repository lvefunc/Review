( function () {
    mw.review.model.Keyword = function MwReviewModelKeyword( id, name, status, synonyms, matches ) {
        this.id = id;
        this.name = name;
        this.status = status;
        this.synonyms = synonyms;
        this.matches = matches;
    };

    OO.initClass( mw.review.model.Keyword );

    mw.review.model.Keyword.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.Keyword.static.construct = function ( data ) {
        return new mw.review.model.Keyword(
            data.id,
            data.name,
            data.status,
            data.synonyms.map( synonym => synonym.id ),
            data.matches.map( match => match.id )
        );
    };

    mw.review.model.Keyword.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.Keyword.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query";
            params.list = "reviewkeywords";
            params.id = id;

            let result = await mw.review.api.get( params );

            identityMap.setValue( id, mw.review.model.Keyword.static.construct( result.result ) );
        }

        let keyword = identityMap.getValue( id );
        mw.review.model.Keyword.static.identityMap.release();

        return keyword;
    };

    mw.review.model.Keyword.static.findAll = async function ( limit = 50 ) {
        let keywords = [], params = {};

        params.action = "query";
        params.list = "reviewkeywords";
        params.limit = limit;

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Keyword.static.identityMap.acquire()
        ] );

        while ( true ) {
            if ( !result.result ) {
                break;
            }

            result.result.forEach( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Keyword.static.construct( data ) );
                }

                keywords.push( identityMap.getValue( data.id ) );
            } );

            if ( result.continue ) {
                params.from = result.continue.from;
                result = await mw.review.api.get( params );
            } else {
                break;
            }
        }

        mw.review.model.Keyword.static.identityMap.release();

        return keywords;
    };

    mw.review.model.Keyword.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.Keyword.prototype.getName = function () {
        return this.name;
    };

    mw.review.model.Keyword.prototype.getStatus = function () {
        return this.status;
    };

    mw.review.model.Keyword.prototype.getSynonyms = function () {
        return mw.review.model.Synonym.static.findByKeyword( this );
    };

    mw.review.model.Keyword.prototype.getMatches = function () {
        return mw.review.model.Match.static.findByKeyword( this );
    };
}() );