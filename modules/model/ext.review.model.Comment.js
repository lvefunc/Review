( function () {
    mw.review.model.Comment = function MwReviewModelComment( id, revisionID, text, commentatorID, ranges ) {
        this.id = id;
        this.revisionID = revisionID;
        this.text = text;
        this.commentatorID = commentatorID;
        this.ranges = ranges;
    };

    OO.initClass( mw.review.model.Comment );

    mw.review.model.Comment.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.Comment.static.construct = function ( data ) {
        return new mw.review.model.Comment(
            data.id,
            data.revisionID,
            data.text,
            data.commentator,
            data.ranges.map( range => range.id )
        );
    };

    mw.review.model.Comment.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.Comment.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query";
            params.list = "reviewcomments";
            params.id = id;

            let result = await mw.review.api.get( params );

            identityMap.setValue( id, mw.review.model.Comment.static.construct( result.result ) );
        }

        let comment = identityMap.getValue( id );
        mw.review.model.Comment.static.identityMap.release();

        return comment;
    };

    mw.review.model.Comment.static.findByRevision = async function ( revision ) {
        let comments = [], params = {};

        params.action = "query";
        params.list = "reviewcomments";
        params.revision_id = revision.getID();

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Comment.static.identityMap.acquire()
        ] );

        if ( result.result ) {
            comments.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Comment.static.construct( data ) )
                }

                return identityMap.getValue( data.id );
            } ) );
        }

        mw.review.model.Comment.static.identityMap.release();

        return comments;
    };

    mw.review.model.Comment.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.Comment.prototype.getRevision = function () {
        return mw.review.model.Revision.static.findByID( this.revisionID );
    };

    mw.review.model.Comment.prototype.getText = function () {
        return this.text;
    };

    mw.review.model.Comment.prototype.getCommentator = function () {
        return mw.review.model.User.static.findByID( this.commentatorID );
    };

    mw.review.model.Comment.prototype.getRanges = function () {
        return mw.review.model.Range.static.findByComment( this );
    };
}() );