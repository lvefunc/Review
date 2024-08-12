( function () {
    mw.review.ui.EditTreeTableRenderer = function MwReviewUiEditsTreeTableRenderer() {
    };

    OO.inheritClass( mw.review.ui.EditTreeTableRenderer, mw.review.ui.Renderer );

    mw.review.ui.EditTreeTableRenderer.prototype.load = async function ( from, ordering, limit ) {
        let owner = await mw.review.model.User.static.findCurrent();
        let response = await mw.review.model.Edit.static.findByOwner( owner, from, ordering, limit );

        let tableHeader = new mw.review.ui.TableHeader();

        tableHeader.addColumn( mw.msg( "review-ui-edit-tree-table-column-title" ) );
        tableHeader.addColumn( mw.msg( "review-ui-edit-tree-table-column-status" ) );
        tableHeader.addColumn( mw.msg( "review-ui-edit-tree-table-column-timestamp" ) );
        tableHeader.addColumn( mw.msg( "review-ui-edit-tree-table-column-inspect" ) );
        tableHeader.addColumn( mw.msg( "review-ui-edit-tree-table-column-create-revision" ) );
        tableHeader.addColumn( mw.msg( "review-ui-edit-tree-table-column-create-workflow" ) );

        let treeRoots = await Promise.all( response.result.map( edit => this.treeNodeFromEdit( edit ) ) );

        return {
            $page: new mw.review.ui.TreeTable( tableHeader, treeRoots ),
            $params: {
                from: response.params.from
            }
        };
    };

    mw.review.ui.EditTreeTableRenderer.prototype.treeNodeFromEdit = async function ( edit ) {
        let params = {};

        params.action = "query";
        params.meta = "siteinfo";
        params.siprop = "general";

        let sitelink = await mw.review.api.get( params )
            .then( result => {
                let server = OO.getProp( result, "query", "general", "server" );
                let script = OO.getProp( result, "query", "general", "script" );

                return server + script;
            } );

        let treeRoot = new mw.review.ui.TreeNode( edit.getTitle(), "", "", "", "", "" );
        let structure = {},
            treeNodes = [];

        for ( let revision of await edit.getRevisions() ) {
            structure[ revision.getID() ] = revision.parentID;
            treeNodes[ revision.getID() ] = this.treeNodeFromRevision( edit, revision, sitelink );
        }

        for ( let [ revisionID, parentID ] of Object.entries( structure ) ) {
            if ( parentID === null ) {
                treeRoot.addChild( treeNodes[ revisionID ] );
            } else {
                if ( !treeNodes[ parentID ] ) {
                    treeRoot.addChild( treeNodes[ revisionID ] );
                } else {
                    ( treeNodes[ parentID ] ).addChild( treeNodes[ revisionID ] );
                }
            }
        }

        return treeRoot;
    };

    mw.review.ui.EditTreeTableRenderer.prototype.treeNodeFromRevision = function ( edit, revision, sitelink ) {
        let treeNode = new mw.review.ui.TreeNode();

        treeNode.addCell( mw.msg( "review-ui-edit-tree-table-revision-title", revision.getID() ) );
        treeNode.addCell( revision.getStatus() );
        treeNode.addCell( revision.getTimestamp() );

        let config = {};

        config.label = mw.msg( "review-ui-edit-tree-table-inspect-revision-button-label" );

        let inspectRevisionButton = new OO.ui.ButtonWidget( config );
        inspectRevisionButton.on( "click", () => {
            let windowManager = new OO.ui.WindowManager();
            $( document.body ).append( windowManager.$element );

            let inspectRevisionDialog = new mw.review.ui.InspectRevisionDialog( { revisionID: revision.getID() } );
            windowManager.addWindows( [ inspectRevisionDialog ] );
            windowManager.openWindow( inspectRevisionDialog );
        } );

        config = {};
        config.label = mw.msg( "review-ui-edit-tree-table-create-revision-button-label" );

        treeNode.addCell( inspectRevisionButton.$element );

        let createRevisionButton = new OO.ui.ButtonWidget( config );
        createRevisionButton.on( "click", () => {
            createRevisionButton.setDisabled( true );

            window.onbeforeunload = null;
            window.location = sitelink + "/" + edit.getTitle() + "?veaction=edit&revision=" + revision.getID();
        } );

        treeNode.addCell( createRevisionButton.$element );

        if ( revision.getStatus() === mw.review.model.Revision.static.New ) {
            config = {};
            config.label = mw.msg( "review-ui-edit-tree-table-create-workflow-button-label" );

            let createWorkflowButton = new OO.ui.ButtonWidget( config );
            createWorkflowButton.on( "click", () => {
                createWorkflowButton.setDisabled( true );

                ( async ( revision ) => {
                    let [ definition, value ] = await Promise.all( [
                        mw.workflows.model.Definition.static.findByName( "Review" ),
                        mw.workflows.model.Value.static.create( mw.workflows.model.Value.static.Integer, revision.getID() )
                    ] );

                    let input = await mw.workflows.model.Input.static.create( "revision", value );

                    mw.workflows.model.Workflow.static.create( definition, [ input ] ).then( () => {
                        window.onbeforeunload = null;
                        window.location = sitelink + "/Special:Workflows";
                    }, error => {
                        console.log( error );
                    } );
                } )( revision );
            } );

            treeNode.addCell( createWorkflowButton.$element );
        } else {
            treeNode.addCell( mw.msg( "review-ui-edit-tree-table-empty-row" ) );
        }

        return treeNode;
    };
}() );