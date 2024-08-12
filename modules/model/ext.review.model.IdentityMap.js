( function () {
    mw.review.model.IdentityMap = function MwReviewModelIdentityMap() {
        this.identityMap = [];
    };

    OO.initClass( mw.review.model.IdentityMap );

    mw.review.model.IdentityMap.prototype.isSet = function ( key ) {
        return this.identityMap[ key ] !== undefined;
    };

    mw.review.model.IdentityMap.prototype.getValue = function ( key ) {
        return this.identityMap[ key ];
    };

    mw.review.model.IdentityMap.prototype.setValue = function ( key, value ) {
        if ( !this.identityMap[ key ] ) {
            this.identityMap[ key ] = value;
        }
    };
}() );