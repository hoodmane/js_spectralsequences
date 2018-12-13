"use strict";

let Sseq = require("./Sseq.js");
let SseqClassjs = require("./SseqClass.js");
let SseqClass = SseqClassjs.SseqClass;
let Node = SseqClassjs.Node;
let Util = require("./Util.js");
let Shapes = require("../src/Shape.js");
let ExportToTex = require("./ExportToTex");
let infinity = Util.infinity;

const {parse, stringify} = require('flatted/cjs');




let default_node = new Node();
default_node.fill = true;
default_node.stroke = true;
default_node.shape = Shapes.circle;
default_node.size = 6;

/**
 *  This class is supposed to implement a minimal interface for Display.js.
 *  It could be streamlined a bit, but is close to doing that.
 *
 *  To display a spectral sequence, we need a list of classes and a list of edges.
 *  The classes have a bidegree and an offset, as well as a list of pages and nodes.
 *  The edges have source and target classes and some fields like color, opacity, dash pattern, and bend that control the display.
 *
 *  The classes and edges handled by DisplaySseq are POJOs.
 *  The DisplaySseq has to provide a list of classes and edges to be drawn in a given range on a given page.
 *  It also has methods to answer any questions that the display has about the classes and edges that are not
 *  answered by their fields (since they don't contain any methods).
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
        this.offset_size = 0.3;
        this.default_node = new Node();
        this.default_node.fill = true;
        this.default_node.stroke = true;
        this.default_node.shape = Shapes.circle;
        this.default_node.size = 6;
        this.class_scale = 1;
        this.eventHandlers = {};
        this.page_change_handler = () => true;
        this.serializeSseqFields = Sseq.serializeSseqFields;
        this.serializeClassFields= Sseq.serializeClassFields;
        this.serializeEdgeFields = Sseq.serializeEdgeFields;
    }

    /**
     * Make a new class POJO, with all of the necessary fields instantiated to boring defaults.
     * At the very least, x, y, and idx should be overridden with real values.
     * For internal use.
     */
    static newClass(){
        return {
            x: 0,
            y: 0,
            idx: 0,
            x_offset: false,
            y_offset: false,
            name: "",
            extra_info: "",
            page_list: [infinity],
            node_list: [default_node.copy()],
            visible: true,
            _drawOnPageQ: () => true
        };
    }

    /**
     * Make a new class POJO, with all of the necessary fields instantiated to boring defaults other than source and target.
     * Before use, needs at least a source and a target and preferably a type.
     * For internal use.
     */
    static newEdge(){
        let e = {};
        e.color = "black";
        e.page = infinity;
        e.page_min = 0;
        e._drawOnPageQ = () => true;
        e.visible = true;
        return e;
    }


    /**
     * Add an event handler. Currently, the event can be any Mousetrap key code, "onclick" or "oncontextmenu" (right click).
     * @param key
     * @param fn
     */
    addEventHandler(key, fn){
        this.eventHandlers[key] = fn;
    }

    setPageChangeHandler(f){
        this.page_change_handler = f;
    }

    pageChangeHandler(page){
        this.page_change_handler(page);
        if(this.real_sseq){
            this.real_sseq.update();
        }
    }

    /**
     * If this spectral sequence is being displayed, tell the display to redraw. Use after changing the spectral sequence.
     */
    update(){
        if(this.update_listener){
            this.update_listener();
        }
    }

    /**
     * Display this spectral sequence. Gets overridden if you call `some_other_sseq.display()`.
     */
    display(){
        if(typeof window === "undefined"){
            console.log("Can only display in browser.");
            return;
        }
        if(window.display){
            window.display.setSseq(this);
            display.update();
        } else {
            window.display = new Display(this);
        }
    }


    //
    // Display Methods
    //

    /**
     * If this spectral sequence is currently being displayed, this will called with a reference to display.update()
     * so that this.update() will cause the display to update.
     * @param f
     * @package
     */
    _registerUpdateListener(f){
        this.update_listener = f;
    }

    /**
     * This is used by display to calculate the set of features to be displayed on the current page and view range.
     * After calling this method, the classes and edges can be gotten from _getClassesToDisplay and _getEdgesToDisplay
     * respectively.
     *
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
        // TODO: clean up pageRange. Probably we should always pass pages as pairs?
        if(Array.isArray(page)){
            pageRange = page;
            page = page[0];
        } else {
            pageRange = [page,page];
        }
        this.display_classes = this.classes.filter(c => {
                if(!c){ return false; }
                c.in_range = DisplaySseq._classInRangeQ(c,xmin, xmax, ymin, ymax);
                return c.in_range && DisplaySseq._drawClassOnPageQ(c,page);
        });
        // Display edges such that
        // 1) e is a valid edge
        // 2) e is supposed to be drawn on the current pageRange.
        // 3) e.source and e.target are supposed to be drawn on the current pageRange
        // 4) At least one of the source or target is in bounds.
        this.display_edges = this.edges.filter(e =>
            e &&
            DisplaySseq._drawEdgeOnPageQ(e, pageRange)
            && DisplaySseq._drawClassOnPageQ(e.source, page) && DisplaySseq._drawClassOnPageQ(e.target, page)
            && ( e.source.in_range || e.target.in_range )
        );

        // We need to go back and make sure that for every edge we are planning to  draw, we draw both its source and
        // target even if one of them is out of bounds. Check for out of bounds sources / targets and add them to the
        // list of edges to draw.
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

    /**
     * For c a class, check if `xmin <= c.x <= xmax` and `ymin <= c.y <= ymax`
     * @param c
     * @param xmin
     * @param xmax
     * @param ymin
     * @param ymax
     * @returns {boolean}
     * @private
     */
    static _classInRangeQ(c, xmin, xmax, ymin, ymax){
        return xmin <= c.x && c.x <= xmax && ymin <= c.y && c.y <= ymax;
    }

    /**
     * Check whether `page` is less than the maximum draw page for the `c`.
     * @param c
     * @param page
     * @returns {boolean}
     * @private
     */
    static _drawClassOnPageQ(c, page){
        if(c._drawOnPageQ){
            return c._drawOnPageQ(page);
        } else {
            return SseqClass.prototype._drawOnPageQ.call(c, page);
        }
    }

    /**
     * Check whether the edge should be drawn on the given page / pageRange. The behavior depends on whether the edge is a
     * Differential, Structline, or Extension.
     * @param edge
     * @param pageRange
     * @returns {boolean}
     * @private
     */
    static _drawEdgeOnPageQ(edge, pageRange){
        if(edge._drawOnPageQ){
            return edge._drawOnPageQ(pageRange);
        } else {
            switch(edge.type){
                case "Differential":
                    return Differential.prototype._drawOnPageQ.call(edge, pageRange);
                case "Extension":
                    return Extension.prototype._drawOnPageQ.call(edge, pageRange);
                case "Structline":
                    return Structline.prototype._drawOnPageQ.call(edge, pageRange);
                default:
                    return Edge.prototype._drawOnPageQ.call(edge, pageRange);

            }
        }
    }

    /**
     * Get list of classes to display calculated by _calculateDrawnElements. Used by display.
     * @returns {Array}
     * @package
     */
    _getClassesToDisplay(){
        return this.display_classes;
    }

    /**
     * Get list of edges to display calculated by _calculateDrawnElements. Used by display.
     * @returns {Array}
     * @package
     */
    _getEdgesToDisplay(){
        return this.display_edges;
    }


    /**
     * If multiple classes are in the same (x,y) location, we offset their position a bit to avoid clashes.
     * Gets called by display code.
     * @returns {number} The x offset
     * @package
     */
    _getXOffset(c, page){
        if(c.x_offset !== false){
            return c.x_offset * this.offset_size;
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
        let out = - (idx - (total_classes - 1)/2) * this.offset_size;
        return out;
    }

    /**
     * Gets the node to be drawn for the class on the given page. Used primarily by display.
     * @param c
     * @param page
     * @returns {*}
     */
    getClassNode(c, page){
        return c.node_list[SseqClass.prototype._getPageIndex.call(c, page)];
    }

    /**
     * Gets the tooltip for the current class on the given page (currently ignores the page).
     * @param c
     * @param page
     * @returns {string}
     */
    getClassTooltip(c, page){
        let tooltip = "";
        if(c.name !== ""){
            tooltip = `\\(${c.name}\\) &mdash; `;
        }
        tooltip += `(${c.x}, ${c.y})`;
        let extra_info;
        if(!c.extra_info_page_map) {
            extra_info = c.extra_info;
        } else {
            let lastkey;
            for(let k of c.extra_info_page_map.keys()){
                if(k > page){
                    break;
                }
                lastkey = k;
            }
            extra_info = "\n" + c.extra_info_page_map.get(lastkey);
        }
        tooltip += extra_info;
        return tooltip;
    }


    //
    //  Serialization and Deserialization methods
    //

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
            if(e.type){
                en.mult = e.type;
            }
            edges.push(en);
        }
        let dss = new DisplaySseq();
        dss.num_classes_by_degree = num_classes_by_degree;
        dss.classes = classes;
        dss.edges = edges;
        return dss;
    }

    static async fromJSONOld(path){
        let response = await fetch(path);
        let json = await response.text();
        let sseq = parse(json);
        Object.setPrototypeOf(sseq, DisplaySseq.prototype);
        sseq.default_node = Object.assign(new Node(), sseq.default_node);
        let num_classes_by_degree = new StringifyingMap();
        for(let c of sseq.classes){
            if(!c){
                continue;
            }
            let idx  = num_classes_by_degree.getOrElse([c.x, c.y], 0);
            num_classes_by_degree.set([c.x, c.y], idx + 1);
            for(let i = 0; i < c.node_list.length; i++){
                c.node_list[i] = new Node(c.node_list[i]);
                c.node_list[i].shape = Shapes[c.node_list[i].shape.name];
            }
        }
        console.log(sseq.classes);
        for(let e of sseq.edges){
            if(e.type === "Extension"){
                e._drawOnPageQ = undefined;
            }
        }
        sseq.num_classes_by_degree = num_classes_by_degree;
        return sseq;
    }/**/


    /**
     * Load spectral sequence from JSON. Returns a promise for a DisplaySseq
     * @param path The file path / name of the JSON file to load.
     * @returns {Promise<DisplaySseq>}
     */
    static async fromJSON(path){
        let response = await fetch(path);
        let sseq_obj = await response.json();
        let sseq = Object.assign(new DisplaySseq(), sseq_obj);
        // To resuscitate, we need to fix:
        //  1) The num_classes_by_degree map which is used for calculating offsets doesn't get serialized.
        //     We remake it by counting the number of classes in each degree.
        //  2) The node_list for each class has been replaced with a list of indices in the sseq.master_node_list.
        //     Each integer in each class.node_list needs to be replaced with a real node copied from sseq.master_node_list.
        //  3) The edges have their source and target class references replaced by indexes into the class list. Replace
        //     these integers with references to the actual class.


        sseq.default_node = Object.assign(new Node(), sseq.default_node);
        let num_classes_by_degree = new StringifyingMap();
        let class_list_index_map = new Map(); // For fixing edge source / target references
        for(let i = 0; i < sseq.classes.length; i++){
            let c = sseq.classes[i];
            class_list_index_map.set(i, c);
            if(!c){
                continue;
            }
            let idx  = num_classes_by_degree.getOrElse([c.x, c.y], 0);
            num_classes_by_degree.set([c.x, c.y], idx + 1);
            for(let i = 0; i < c.node_list.length; i++){
                // c.node_list[i] currently contains an integer, replace it with a node.
                c.node_list[i] = new Node(sseq.master_node_list[c.node_list[i]]);
                c.node_list[i].shape = Shapes[c.node_list[i].shape.name];
            }
        }
        for(let e of sseq.edges){
            if(e.type === "Extension"){
                e._drawOnPageQ = undefined;
            }
            // e.source and e.target currently contain integers. Replace them with actual classes.
            e.source = class_list_index_map.get(e.source);
            e.target = class_list_index_map.get(e.target);
        }
        sseq.num_classes_by_degree = num_classes_by_degree;
        return sseq;
    }

    /**
     *
     */
    toJSON() {
        let sseqToSerialize = {};
        // Copy fields listed in serializeSseqFields into our serializer object.
        // TODO: What happens if extra fields contain references? Is this forbidden? Can we handle it somehow?
        for(let field of this.serializeSseqFields){
            sseqToSerialize[field] = this[field];
        }
        // Make a map of each node that occurs at least once. We're going to replace the class.node_list with the indices
        // of the node in the master_node_list.
        let node_map = new StringifyingMap((n) => JSON.stringify(n));
        sseqToSerialize.master_node_list = [];
        sseqToSerialize.classes = [];
        sseqToSerialize.edges = [];
        for(let c of this.classes){
            if(c.invalid){
                continue;
            }
            let classToSerialize = {};
            // Copy fields that we serialize
            for(let field of this.serializeClassFields){
                classToSerialize[field] = c[field];
            }
            classToSerialize.node_list = [];
            // Replace node_list with list of master_node_list indices.
            for(let cur_node of c.node_list){
                if(!node_map.has(cur_node)){
                    node_map.set(cur_node, sseqToSerialize.master_node_list.length);
                    sseqToSerialize.master_node_list.push(cur_node);
                }
                classToSerialize.node_list.push(node_map.get(cur_node));
            }
            c.list_index = sseqToSerialize.classes.length;
            sseqToSerialize.classes.push(classToSerialize);
        }
        for(let edge of this.edges){
            if(edge.invalid){
                continue;
            }
            let edgeToSerialize = {};
            // Copy fields that we serialize
            for(let field of this.serializeEdgeFields){
                edgeToSerialize[field] = edge[field];
            }
            // Replace source and target with list indices.
            edgeToSerialize.source = edge.source.list_index;
            edgeToSerialize.target = edge.target.list_index;
            sseqToSerialize.edges.push(edgeToSerialize);
        }
        console.log(sseqToSerialize);
        return sseqToSerialize;
    }

    exportToTex(filename, page, xmin, xmax, ymin, ymax){
        ExportToTex.DownloadSpectralSequenceTex(filename, this, page, xmin, xmax, ymin, ymax);
    }


}

DisplaySseq.default_node = default_node;

exports.DisplaySseq = DisplaySseq;