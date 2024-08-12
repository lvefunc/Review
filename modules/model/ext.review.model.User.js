( function () {
    mw.review.model.User = function MwReviewModelUser( id, name ) {
        this.id = id;
        this.name = name;
    };

    OO.initClass( mw.review.model.User );

    mw.review.model.User.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.User.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.User.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query";
            params.list = "users";
            params.ususerids = id;

            let result = await mw.review.api.get( params );
            let data = result.query.users.find( user => user.userid === id );

            identityMap.setValue( id, new mw.review.model.User( data.userid, data.name ) );
        }

        let user = identityMap.getValue( id );
        mw.review.model.User.static.identityMap.release();

        return user;
    };

    mw.review.model.User.static.findCurrent = async function () {
        let identityMap = await mw.review.model.User.static.identityMap.acquire();

        if ( !identityMap.isSet( "current" ) ) {
            let params = {};

            params.action = "query";
            params.meta = "userinfo";

            let result = await mw.review.api.get( params );
            let data = result.query.userinfo;

            if ( !identityMap.isSet( data.id ) ) {
                identityMap.setValue( data.id, new mw.review.model.User( data.id, data.name ) );
            }

            identityMap.setValue( "current", identityMap.getValue( data.id ) );
        }

        let user = identityMap.getValue( "current" );
        mw.review.model.User.static.identityMap.release();

        return user;
    };


    mw.review.model.User.static.findAll = async function ( limit = 50 ) {
        let users = [], params = {};

        params.action = "query";
        params.list = "allusers";
        params.aulimit = limit;

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.User.static.identityMap.acquire()
        ] );

        while ( true ) {
            if ( !result.query.allusers ) {
                break;
            }

            result.query.allusers.forEach( data => {
                if ( !identityMap.isSet( !data.userid ) ) {
                    if ( data.name !== "MediaWiki default" ) {
                        identityMap.setValue( data.userid, new mw.review.model.User( data.userid, data.name ) );
                        users.push( identityMap.getValue( data.userid ) );
                    }
                } else {
                    users.push( identityMap.getValue( data.userid ) );
                }
            } );

            if ( result.continue ) {
                params.aufrom = result.continue.aufrom;
                result = await mw.review.api.get( params );
            } else {
                break;
            }
        }

        mw.review.model.User.static.identityMap.release();

        return users;
    };

    mw.review.model.User.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.User.prototype.getName = function () {
        return this.name;
    };
}() );