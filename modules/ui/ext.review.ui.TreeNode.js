( function () {
    mw.review.ui.TreeNode = function MwReviewUiTreeNode( ...cellValues ) {
        this.level = 0;
        this.cellValues = [];
        this.cellElements = [];
        this.parent = null;
        this.children = [];

        this.$element = $( "<tr>" );
        this.$element.addClass( "ext-review-ui-treeNode" );
        this.$element.addClass( "ext-review-ui-treeNode-expanded" );

        cellValues.forEach( value => this.addCell( value ) );
    };

    OO.initClass( mw.review.ui.TreeNode );

    mw.review.ui.TreeNode.prototype.getChildren = function () {
        return this.children;
    };

    mw.review.ui.TreeNode.prototype.addChild = function ( node ) {
        let parent = this;

        while ( parent !== null ) {
            if ( node === parent ) {
                throw new Error( "Cyclic dependency detected!" );
            }

            parent = parent.parent;
        }

        this.children.push( node );
        node.setParent( this );
    };

    mw.review.ui.TreeNode.prototype.setParent = function ( parent ) {
        this.parent = parent;
        this.level = parent.level + 1;
    };

    mw.review.ui.TreeNode.prototype.addCell = function ( value ) {
        this.cellValues.push( value );
    };

    mw.review.ui.TreeNode.prototype.draw = function () {
        for ( let i = 0; i < this.cellValues.length; i++ ) {
            let cellElement = this.createCellElement( i );

            this.cellElements[ i ] = cellElement;
            this.$element.append( cellElement );
        }
    };

    mw.review.ui.TreeNode.prototype.createCellElement = function ( index ) {
        let cellElement = $( "<td>" );

        cellElement.addClass( "ext-review-ui-treeNode-cell" );

        if ( index !== 0 ) {
            cellElement.html( this.cellValues[ index ] );
        } else {
            let indent = $( "<span>" );

            indent.addClass( "ext-review-ui-treeNode-indent" );
            indent.css( "width", 10 * this.level + "px" );

            cellElement.append( indent );

            if ( this.children.length > 0 ) {
                let config = {};

                config.icon = "next";
                config.framed = false;

                this.$collapseButton = new OO.ui.ButtonWidget( config );
                this.$collapseButton.on( "click", () => this.collapse() );

                config = {};
                config.icon = "expand";
                config.framed = false;

                this.$expandButton = new OO.ui.ButtonWidget( config );
                this.$expandButton.on( "click", () => this.expand() );

                cellElement.append( this.$expandButton.$element );
                cellElement.append( this.$collapseButton.$element );
            } else {
                indent.css( "width", ( 10 * this.level + 32 ) + "px" );
            }

            cellElement.append( this.cellValues[ index ] );
        }

        return cellElement;
    };

    mw.review.ui.TreeNode.prototype.collapse = function () {
        if ( !this.$element.hasClass( "ext-review-ui-treeNode-expanded" ) ) {
            return;
        }

        this.$element.removeClass( "ext-review-ui-treeNode-expanded" );
        this.$element.addClass( "ext-review-ui-treeNode-collapsed" );

        if ( this.children.length > 0 ) {
            this.$collapseButton.$element.hide();
            this.$expandButton.$element.show();
        }

        this.children.forEach( child => {
            child.$element.hide();
            child.collapse();
        } );
    };

    mw.review.ui.TreeNode.prototype.expand = function () {
        if ( !this.$element.hasClass( "ext-review-ui-treeNode-collapsed" ) ) {
            return;
        }

        this.$element.removeClass( "ext-review-ui-treeNode-collapsed" );
        this.$element.addClass( "ext-review-ui-treeNode-expanded" );

        if ( this.children.length > 0 ) {
            this.$expandButton.$element.hide();
            this.$collapseButton.$element.show();
        }

        this.children.forEach( child => {
            child.$element.show();
        } );
    };
}() );