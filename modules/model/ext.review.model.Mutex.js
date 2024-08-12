( function () {
    mw.review.model.Mutex = function MwReviewModelMutex( resource ) {
        this.resource = resource;
        this.queue = [];
        this.locked = false;
    };

    OO.initClass( mw.review.model.Mutex );

    mw.review.model.Mutex.prototype.acquire = function () {
        return new Promise( ( resolve ) => {
            if ( this.locked ) {
                this.queue.push( resolve );
            } else {
                this.locked = true;
                resolve( this.resource );
            }
        } );
    };

    mw.review.model.Mutex.prototype.release = function () {
        if ( this.queue.length > 0 ) {
            const resolve = this.queue.shift();
            resolve( this.resource );
        } else {
            this.locked = false;
        }
    };
}() );