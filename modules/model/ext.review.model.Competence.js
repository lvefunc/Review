( function () {
    mw.review.model.Competence = function MwReviewModelCompetence( id, expertID, keywordID ) {
        this.id = id;
        this.expertID = expertID;
        this.keywordID = keywordID;
    };

    OO.initClass( mw.review.model.Competence );

    mw.review.model.Competence.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.Competence.static.construct = function ( data ) {
        return new mw.review.model.Competence( data.id, data.expertID, data.keywordID );
    };

    mw.review.model.Competence.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.Expert.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query";
            params.list = "reviewcompetencies";
            params.id = id;

            let result = await mw.review.api.get( params );

            if ( result.result ) {
                identityMap.setValue( id, mw.review.model.Expert.static.construct( result.result ) );
            }
        }

        let competence = identityMap.getValue( id );
        mw.review.model.Competence.static.identityMap.release();

        return competence;
    };

    mw.review.model.Competence.static.findByExpert = async function ( expert ) {
        let competencies = [], params = {};

        params.action = "query";
        params.list = "reviewcompetencies";
        params.expert_id = expert.getID();

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Competence.static.identityMap.acquire()
        ] );

        if ( result.result ) {
            competencies.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Competence.static.construct( data ) );
                }

                return identityMap.getValue( data.id );
            } ) );
        }

        mw.review.model.Competence.static.identityMap.release();

        return competencies;
    };

    mw.review.model.Competence.static.findByKeyword = async function ( keyword ) {
        let competencies = [], params = {};

        params.action = "query";
        params.list = "reviewcompetencies";
        params.keyword_id = keyword.getID();

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Competence.static.identityMap.acquire()
        ] );

        if ( result.result ) {
            competencies.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Competence.static.construct( data ) );
                }

                return identityMap.getValue( data.id );
            } ) );
        }

        mw.review.model.Competence.static.identityMap.release();

        return competencies;
    };

    mw.review.model.Competence.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.Competence.prototype.getExpert = function () {
        return mw.review.model.Expert.static.findByID( this.expertID );
    };

    mw.review.model.Competence.prototype.getKeyword = function () {
        return mw.review.model.Keyword.static.findByID( this.keywordID );
    };
}() );