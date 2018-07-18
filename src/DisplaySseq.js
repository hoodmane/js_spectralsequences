let SseqClass = require("./SseqClass.js").SseqClass;

/**
 *
 */

class DisplaySseq {

    constructor(){
        this.classes = [];
        this.edges = [];
        this.min_page_idx = 0;
        this.page_list = [0, infinity];
        this.initialxRange = [0, 20];
        this.initialyRange = [0, 20];
        this.xRange = [0, 100];
        this.yRange = [0, 100];
    }


    /**
     * This is an internal method used by display to calculate the set of features to be displayed on the current page.
     * @param page
     * @param xmin
     * @param xmax
     * @param ymin
     * @param ymax
     * @package
     */
    _calculateDrawnElements(page, xmin, xmax, ymin, ymax){
        let pageRange;
        if(Array.isArray(page)){
            pageRange = page;
            page = page[0];
        } else {
            pageRange = [page,page];
        }
        this.display_classes = this.classes.filter(c => {c.in_range = c._inRangeQ(xmin, xmax, ymin, ymax); return c.in_range && c._drawOnPageQ(page);});
        this.display_edges = this.edges.filter(e =>
            e._drawOnPageQ(pageRange)
            && e.source._drawOnPageQ(page) && e.target._drawOnPageQ(page)
            && ( e.source.in_range || e.target.in_range )
        );

        for(let i = 0; i < this.display_edges.length; i++){
            let e = this.display_edges[i];
            if(!e.source.in_range){
                this.display_classes.push(e.source);
            }
            if(!e.target.in_range){
                this.display_classes.push(e.target);
            }
        }
    }

    _getXOffset(c, page){
        return 0;
    }

    _getYOffset(c, page){
        return 0;
    }

    getClassesToDisplay(){
        return this.display_classes;
    }

    getEdgesToDisplay(){
        return this.display_edges;
    }

    getClassNode(c, page){
        return c.node_list[SseqClass.prototype._getPageIndex.call(c, page)];
    }

    getClassTooltip(c, page){
        let tooltip = "";
        if(c.name !== ""){
            tooltip = `\\(${c.name}\\) &mdash; `;
        }
        tooltip += `(${c.x}, ${c.y})`;
        tooltip += c.extra_info;
        return tooltip;
    }



}

exports.DisplaySseq = DisplaySseq;