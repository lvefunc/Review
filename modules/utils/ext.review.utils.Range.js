( function () {
    mw.review.utils.Range = function () {
    };

    OO.initClass( mw.review.utils.Range );

    mw.review.utils.Range.static.save = function ( rootElement ) {
        let selection = document.getSelection();
        let objects = [];

        for ( let i = 0; i < selection.rangeCount; i++ ) {
            let range = selection.getRangeAt( i );

            let startContainer = mw.review.utils.Range.static.serializeContainer( range.startContainer, rootElement );

            if ( !startContainer ) {
                continue;
            }

            let endContainer = mw.review.utils.Range.static.serializeContainer( range.endContainer, rootElement );

            if ( !endContainer ) {
                continue;
            }

            let object = {};

            object.startContainer = startContainer;
            object.endContainer = endContainer;
            object.startOffset = range.startOffset;
            object.endOffset = range.endOffset;

            objects.push( object );
        }

        return objects;
    };

    mw.review.utils.Range.static.restore = function ( rootElement, objects ) {
        let ranges = [];

        for ( let object of objects ) {
            let range = document.createRange();

            range.setStart( mw.review.utils.Range.static.unserializeContainer( object.startContainer, rootElement ), object.startOffset );
            range.setEnd( mw.review.utils.Range.static.unserializeContainer( object.endContainer, rootElement ), object.endOffset );

            ranges.push( range );
        }

        return ranges;
    };

    mw.review.utils.Range.static.serializeContainer = function ( container, rootElement ) {
        let indices = [];

        while ( container !== rootElement ) {
            if ( !container ) {
                return;
            }

            let index = 0;
            let sibling = container;

            while ( sibling.previousSibling ) {
                sibling = sibling.previousSibling;
                index++;
            }

            indices.push( index );
            container = container.parentElement;
        }

        return btoa( JSON.stringify( indices ) );
    };

    mw.review.utils.Range.static.unserializeContainer = function ( base64, rootElement ) {
        let indices = JSON.parse( atob( base64 ) );
        let index = indices.length;

        while ( index-- ) {
            let childElement = rootElement.childNodes[ indices[ index ] ];

            if ( !childElement ) {
                break;
            }

            rootElement = childElement;
        }

        return rootElement;
    };

    mw.review.utils.Range.static.highlight = function ( range ) {
        mw.review.utils.Range.static.findTextNodes( range ).forEach( textNode => {
            let highlight = textNode.ownerDocument.createElement( "mark" );
            let range = document.createRange();

            range.selectNode( textNode );
            range.surroundContents( highlight );
        } );
    };

    mw.review.utils.Range.static.findTextNodes = function ( range ) {
        if ( range.startContainer.nodeType === Node.TEXT_NODE && range.startOffset > 0 ) {
            let node = range.startContainer.splitText( range.startOffset );

            if ( range.startContainer === range.endContainer ) {
                range.setEnd( node, range.endOffset - range.startOffset );
            }

            range.setStart( node, 0 );
        }

        if ( range.endContainer.nodeType === Node.TEXT_NODE && range.endOffset < range.endContainer.length ) {
            range.endContainer.splitText( range.endOffset );
        }

        let textNodes = [];

        let treeWalker = range.startContainer.ownerDocument.createTreeWalker(
            range.commonAncestorContainer,
            NodeFilter.SHOW_TEXT,
            node => range.intersectsNode( node ) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT
        );

        if ( treeWalker.currentNode.nodeType === Node.TEXT_NODE ) {
            textNodes.push( treeWalker.currentNode );
        }

        while ( treeWalker.nextNode() && range.comparePoint( treeWalker.currentNode, 0 ) !== 1 ) {
            textNodes.push( treeWalker.currentNode );
        }

        return textNodes;
    };
}() );