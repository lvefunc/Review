( function () {
    mw.review.model.Synonym = function MwReviewModelSynonym( id, name, keywordID ) {
        this.id = id;
        this.name = name;
        this.keywordID = keywordID;
    };

    OO.initClass( mw.review.model.Synonym );

    mw.review.model.Synonym.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.Synonym.static.construct = function ( data ) {
        return new mw.review.model.Synonym( data.id, data.name, data.keywordID );
    };

    mw.review.model.Synonym.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.Synonym.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query"
            params.list = "reviewsynonyms";
            params.id = id;

            let result = await mw.review.api.get( params );

            identityMap.setValue( id, mw.review.model.Synonym.static.construct( result.result ) );
        }

        let synonym = identityMap.getValue( id );
        mw.review.model.Synonym.static.identityMap.release();

        return synonym;
    };

    mw.review.model.Synonym.static.findByKeyword = async function ( keyword ) {
        let synonyms = [], params = {};

        params.action = "query";
        params.list = "reviewsynonyms";
        params.keyword_id = keyword.getID();

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Synonym.static.identityMap.acquire()
        ] );

        if ( result.result ) {
            synonyms.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Synonym.static.construct( data ) );
                }

                return identityMap.getValue( data.id );
            } ) );
        }

        mw.review.model.Synonym.static.identityMap.release();

        return synonyms;
    };

    mw.review.model.Synonym.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.Synonym.prototype.getName = function () {
        return this.name;
    };

    mw.review.model.Synonym.prototype.getKeyword = function () {
        return mw.review.model.Keyword.static.findByID( this.keywordID );
    };
}() );