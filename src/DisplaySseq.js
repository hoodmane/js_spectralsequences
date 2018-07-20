let SseqClassjs = require("./SseqClass.js");
let SseqClass = SseqClassjs.SseqClass;
let Node = SseqClassjs.Node;
let Util = require("./Util.js");



let default_node = new Node();
default_node.fill = true;
default_node.stroke = true;
default_node.shape = Shapes.circle;
default_node.size = 6;

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
        this.offset_size = 10;
        this.default_node = new Node();
        this.default_node.fill = true;
        this.default_node.stroke = true;
        this.default_node.shape = Shapes.circle;
        this.default_node.size = 6;
        this.class_scale = 1;
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
        Util.checkArgumentsDefined(DisplaySseq.prototype._calculateDrawnElements, arguments);
        let pageRange;
        if(Array.isArray(page)){
            pageRange = page;
            page = page[0];
        } else {
            pageRange = [page,page];
        }
        this.display_classes = this.classes.filter(c => {c.in_range = DisplaySseq._inRangeQ(c,xmin, xmax, ymin, ymax); return c.in_range && c._drawOnPageQ(page);});
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

    static _inRangeQ(c, xmin, xmax, ymin, ymax){
        return xmin <= c.x && c.x <= xmax && ymin <= c.y && c.y <= ymax;
    }

    /**
     * If multiple classes are in the same (x,y) location, we offset their position a bit to avoid clashes.
     * Gets called by display code.
     * @returns {number} The x offset
     * @package
     */
    _getXOffset(c, page){
        if(c.x_offset !== false){
            return c.x_offset;
        }
        let total_classes = this.num_classes_by_degree.get([c.x, c.y]);
        let idx = c.idx;
        let out = (idx - (total_classes - 1)/2) * this.offset_size;
        if(isNaN(out)){
            console.log("Invalid offset for class:" ); console.log(c);
            return 0;
        }
        return out;
    }

    /**
     * If multiple classes are in the same (x,y) location, we offset their position a bit to avoid clashes.
     * Gets called by display code.
     * @returns {number} The y offset
     * @package
     */
    _getYOffset(c, page){
        if(c.x_offset !== false){
            return c.y_offset;
        }
        let total_classes = this.num_classes_by_degree.get([c.x, c.y]);
        let idx = c.idx;
        let out = (idx - (total_classes - 1)/2) * this.offset_size;
        return out;
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

    static newClass(){
        let c = {
            x: 0,
            y: 0,
            idx: 0,
            x_offset: false,
            y_offset: false,
            name: "",
            extra_info: "",
            page_list: [infinity],
            node_list: [default_node],
            visible: true,
            _drawOnPageQ : () => true
        };
        return c;
    }

    static newEdge(){
        let e = {};
        e.color = "black";
        e.page = infinity;
        e.page_min = 0;
        e._drawOnPageQ = () => true;
        return e;
    }

    static async loadFromResolutionJSON(path){
        let response = await fetch(path);
        let json = await response.json();
        let num_classes_by_degree = new StringifyingMap();
        let classes_by_id = new Map();
        let classes = [];
        for(let c of json.classes){
            let cn = DisplaySseq.newClass();
            cn.x = c.degree[0];
            cn.y = c.degree[1];
            let idx  = num_classes_by_degree.getOrElse([cn.x, cn.y], 0);
            num_classes_by_degree.set([cn.x, cn.y], idx + 1);
            classes_by_id.set(c.name, cn);
            cn.idx = idx;
            classes.push(cn);
        }
        let edges = [];
        for(let e of json.structlines){
            let en = DisplaySseq.newEdge();
            en.source = classes_by_id.get(e.sourceName); //
            en.target = classes_by_id.get(e.targetName);
            edges.push(en);
        }
        let dss = new DisplaySseq();
        dss.num_classes_by_degree = num_classes_by_degree;
        dss.classes = classes;
        dss.edges = edges;
        return dss;
    }


    display(){
        if(window.display){
            window.display.setSseq(this);
        } else {
            window.display = new Display(this);
        }
    }


}

DisplaySseq.default_node = default_node;

exports.DisplaySseq = DisplaySseq;