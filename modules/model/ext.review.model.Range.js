( function () {
    mw.review.model.Range = function MwReviewModelRange(
        id, commentID, startContainer, endContainer, startOffset, endOffset
    ) {
        this.id = id;
        this.commentID = commentID;
        this.startContainer = startContainer;
        this.endContainer = endContainer;
        this.startOffset = startOffset;
        this.endOffset = endOffset;
    };

    OO.initClass( mw.review.model.Range );

    mw.review.model.Range.static.identityMap = new mw.review.model.Mutex( new mw.review.model.IdentityMap() );

    mw.review.model.Range.static.construct = function ( data ) {
        return new mw.review.model.Range(
            data.id,
            data.commentID,
            data.startContainer,
            data.endContainer,
            data.startOffset,
            data.endOffset
        );
    };

    mw.review.model.Range.static.findByID = async function ( id ) {
        let identityMap = await mw.review.model.Range.static.identityMap.acquire();

        if ( !identityMap.isSet( id ) ) {
            let params = {};

            params.action = "query";
            params.list = "reviewranges";
            params.id = id;

            let result = await mw.review.api.get( params );
            identityMap.setValue( id, mw.review.model.Range.static.construct( result.result ) );
        }

        let range = identityMap.getValue( id );
        mw.review.model.Range.static.identityMap.release();

        return range;
    };

    mw.review.model.Range.static.findByComment = async function ( comment ) {
        let ranges = [], params = {};

        params.action = "query";
        params.list = "reviewranges";
        params.comment_id = comment.getID();

        let [ result, identityMap ] = await Promise.all( [
            mw.review.api.get( params ),
            mw.review.model.Range.static.identityMap.acquire()
        ] );

        if ( result.result ) {
            ranges.push( ...result.result.map( data => {
                if ( !identityMap.isSet( data.id ) ) {
                    identityMap.setValue( data.id, mw.review.model.Range.static.construct( data ) )
                }

                return identityMap.getValue( data.id );
            } ) );
        }

        mw.review.model.Range.static.identityMap.release();

        return ranges;
    };

    mw.review.model.Range.prototype.getID = function () {
        return this.id;
    };

    mw.review.model.Range.prototype.getComment = function () {
        return mw.review.model.Comment.static.findByID( this.commentID );
    };

    mw.review.model.Range.prototype.getStartContainer = function () {
        return this.startContainer;
    };

    mw.review.model.Range.prototype.getEndContainer = function () {
        return this.endContainer;
    };

    mw.review.model.Range.prototype.getStartOffset = function () {
        return this.startOffset;
    };

    mw.review.model.Range.prototype.getEndOffset = function () {
        return this.endOffset;
    };
}() );