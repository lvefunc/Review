( function () {
    mw.loader.using( "ext.visualEditor.mediawiki", function () {
        ve.init.mw.Target.prototype.initAutosave = function ( config ) {};
    } );

    mw.loader.using( "ext.visualEditor.targetLoader", function () {
        let api = new mw.Api();
        let revision = ( new URLSearchParams( window.location.search ) ).get( "revision" );

        if ( revision === null ) {
            return;
        }

        mw.libs.ve.targetLoader[ "requestParsoidData" ] = function ( pageName, options ) {
            return api.post( {
                "action": "query",
                "list": "reviewrevisions",
                "id": revision
            } ).then( ( v ) => {
                let metadata = api.get( {
                    action: "visualeditor",
                    paction: "metadata",
                    page: pageName,
                    uselang: mw.config.get( "wgUserLanguage" )
                } ).then();

                let parsefragment = api.get( {
                    action: "visualeditor",
                    paction: "parsefragment",
                    page: pageName,
                    wikitext: v.result.content
                } ).then();

                return $.when( metadata, parsefragment ).then( ( metadata, parsefragment ) => {
                    let r1 = metadata[ 0 ];
                    let r2 = parsefragment[ 0 ];

                    if ( r1.visualeditor && r2.visualeditor ) {
                        let content = r2.visualeditor.content;
                        let revisionID = mw.config.get( "wgCurRevisionId" );

                        r1.visualeditor.content = "<html";

                        if ( revisionID !== 0 ) {
                            r1.visualeditor.content += " about=\"";
                            r1.visualeditor.content += new mw.Title( "Special:Redirect/revision/" + revisionID ).getUrl();
                            r1.visualeditor.content += "\"";
                        }

                        r1.visualeditor.content += "><body>" + content + "</body></html>";
                    }

                    r1.visualeditor.canEdit = true;

                    return r1;
                } ).promise();
            } ).fail( ( e ) => {
                console.log( e );
            } ).promise();
        };

        let fn = mw.libs.ve.targetSaver[ "postContent" ];

        mw.libs.ve.targetSaver[ "postContent" ] = function ( data, options ) {
            if ( revision !== null ) {
                $.extend( data, { "revision": revision } );
            }

            return fn.apply( this, arguments );
        };
    } );
}() );
