( function () {
    mw.review.model.Revision = function MwReviewModelRevision(
        id, editID, parentID, ownerID, status, matches, comments, content, timestamp, summary
    ) {
        this.id = id;
        this.editID = editID;
        this.parentID = parentID;
        this.ownerID = ownerID;
        this.status = status;
        this.matches = matches;
        this.comments = comments;
        this.content = content;
        this.timestamp = timestamp;
        this.summary = summary;
    };

    OO.initClass( mw.review.model.Revision );

    mw.review.model.Revision.static.New = mw.msg( "review-model-revision-new" );
    mw.review.model.Revision.static.Queried = mw.msg( "review-model-revision-queried" );
    mw.review.model.Revision.static.Current = mw.msg( "review-model-revision-current" );
    mw.review.model.Revision.static.Rejected = mw.msg( "review-model-revision-rejected" );
    mw.review.model.Revision.static.Legacy = mw.msg( "review-model-revision-legacy" );

    mw.review.model.Revision.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.Revision.static.construct = function ( data ) {
        return new mw.review.model.Revision(
            data.id,
            data.editID,
            data.parent === null ? null : data.parent.id,
            data.owner,
            data.status,
            data.matches.map( match => match.id ),
            data.comments.map( comment => comment.id ),
            data.content,
            data.timestamp,
            data.summary
        );
    };

    mw.review.model.Revision.static.mapFromData = async function ( data ) {
        let identityMap = await mw.review.model.Revision.static.identityMap.acquire();

        if ( !identityMap.isSet( data.id ) ) {
            identityMap.setValue( data.id, mw.review.model.Revision.static.construct( data ) );
        }

        mw.review.model.Revision.static.identityMap.release();
    };

    mw.review.model.Revision.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.Revision.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query";
            params.list = "reviewrevisions";
            params.id = id;

            let result = await mw.review.api.get( params );

            identityMap.setValue( id, mw.review.model.Revision.static.construct( result.result ) );
        }

        let revision = identityMap.getValue( id );
        mw.review.model.Revision.static.identityMap.release();

        return revision;
    };

    mw.review.model.Revision.static.findByEdit = async function ( edit ) {
        let revisions = [], params = {};

        params.action = "query";
        params.list = "reviewrevisions";
        params.edit_id = edit.getID();

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Revision.static.identityMap.acquire()
        ] );

        if ( result.result ) {
            revisions.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Revision.static.construct( data ) );
                }

                return identityMap.getValue( data.id );
            } ) );
        }

        mw.review.model.Revision.static.identityMap.release();

        return revisions;
    };

    mw.review.model.Revision.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.Revision.prototype.getEdit = function () {
        return mw.review.model.Edit.static.findByID( this.editID );
    };

    mw.review.model.Revision.prototype.getParent = function () {
        return this.parentID === null ? null : mw.review.model.Revision.static.findByID( this.parentID );
    };

    mw.review.model.Revision.prototype.getOwner = function () {
        return mw.review.model.User.static.findByID( this.ownerID );
    };

    mw.review.model.Revision.prototype.getStatus = function () {
        switch ( this.status ) {
            case 0:
                return mw.review.model.Revision.static.New;
            case 1:
                return mw.review.model.Revision.static.Queried;
            case 2:
                return mw.review.model.Revision.static.Current;
            case 3:
                return mw.review.model.Revision.static.Rejected;
            case 4:
                return mw.review.model.Revision.static.Legacy;
        }
    };

    mw.review.model.Revision.prototype.getMatches = function () {
        return mw.review.model.Match.static.findByRevision( this );
    };

    mw.review.model.Revision.prototype.getComments = function () {
        return mw.review.model.Comment.static.findByRevision( this );
    };

    mw.review.model.Revision.prototype.getContent = function () {
        return this.content;
    };

    mw.review.model.Revision.prototype.getTimestamp = function () {
        return new Date( this.timestamp * 1000 ).toLocaleString();
    };

    mw.review.model.Revision.prototype.getSummary = function () {
        return this.summary;
    };
}() );