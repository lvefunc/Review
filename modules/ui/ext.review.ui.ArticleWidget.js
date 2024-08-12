( function () {
    mw.review.ui.ArticleWidget = function MwReviewUiArticleWidget( config ) {
        config = config || {};
        config.classes = config.classes || [];
        config.classes.push( "ext-review-ui-articleWidget" );

        if ( !config.revision ) {
            throw new Error( "Revision is not set" );
        } else {
            this.revision = config.revision;
        }

        mw.review.ui.ArticleWidget.super.call( this, config );
    };

    OO.inheritClass( mw.review.ui.ArticleWidget, OO.ui.Widget );

    mw.review.ui.ArticleWidget.prototype.load = async function () {
        let edit = await this.revision.getEdit(),
            params = {};

        params.action = "parse";
        params.contentmodel = "wikitext";
        params.title = edit.getTitle();
        params.text = this.revision.getContent();

        let result = await mw.review.api.get( params );

        this.$element.html(
            $( "<div>" ).addClass( "mw-content-container" ).append(
                $( "<main>" ).addClass( "mw-body" ).append(
                    $( "<header>" ).addClass( "mw-body-header" ).append(
                        $( "<h1>" ).addClass( "firstHeading" ).addClass( "mw-first-heading" ).append(
                            OO.getProp( result, "parse", "displaytitle" )
                        )
                    )
                ).append(
                    $( "<div>" ).addClass( "mw-body-content" ).addClass( "mw-content-ltr" ).append(
                        OO.getProp( result, "parse", "text", "*" )
                    )
                )
            )
        );
    };
}() );