( function () {
    let sitelink = async () => {
        let params = {};

        params.action = "query";
        params.meta = "siteinfo";
        params.siprop = "general";

        return await mw.review.api.get( params )
            .then( result => {
                let server = OO.getProp( result, "query", "general", "server" );
                let script = OO.getProp( result, "query", "general", "script" );

                return server + script;
            } );
    };

    let run = () => {
        let fn = mw.Api.prototype.ajax;

        mw.Api.prototype.ajax = function ( parameters, ajaxOptions ) {
            let found = false;

            ajaxOptions.dataFilter = ( rawData, dataType ) => {
                if ( dataType !== "json" ) {
                    return rawData;
                }

                let struct = JSON.parse( rawData );

                if ( !struct.errors ) {
                    return rawData;
                }

                if (
                    struct.errors.find( ( e ) => e.code === "review-intercepted" )
                ) {
                    found = true;

                    return JSON.stringify( {
                        "visualeditoredit": {
                            "result": "success",
                            "newrevid": undefined,
                            "isRedirect": false,
                            "displayTitleHtml": "",
                            "lastModified": "",
                            "contentSub": "",
                            "modules": "",
                            "jsconfigvars": "",
                            "content": "<div id=\"hook\"></div>",
                            "categorieshtml": "<div id=\"catlinks\"></div>"
                        }
                    } );
                }

                return rawData;
            };

            ajaxOptions.complete = () => {
                if ( found ) {
                    sitelink().then( link => {
                        window.onbeforeunload = null;
                        window.location = link + "/Special:Review";
                    } );
                }
            }

            return fn.apply( this, arguments );
        };
    };

    mw.loader.using( "mediawiki.api", () => {
        run( mw.Api );
    } );
}() );
