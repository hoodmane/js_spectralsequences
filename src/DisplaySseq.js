"use strict";

let SseqClassjs = require("./SseqClass.js");
let SseqClass = SseqClassjs.SseqClass;
let Node = SseqClassjs.Node;
let Util = require("./Util.js");
let Shapes = require("../src/Shape.js");
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
        this.keyHandlers = {};
        this.serializeSseqFields = [
            "min_page_idx", "page_list", "xRange", "yRange", "initialxRange", "initialyRange",
            "default_node", "class_scale", "offset_size", "serializeSseqFields", "serializeClassFields", "serializeEdgeFields"
        ]; // classes and edges are dealt with separately.
        this.serializeClassFields = [
            "x", "y", "name", "extra_info", "unique_id", "idx", "x_offset", "y_offset", "page_list", "visible"
        ]; // "node_list" is dealt with separately
        this.serializeEdgeFields = [
            "color", "bend", "dash", "lineWidth", "opacity", "page_min", "page", "type"
        ]; // "source" and "target" are dealt with separately.
    }

    static getSerializeFields(){
        return Object.getOwnPropertyNames(new DisplaySseq());
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
        this.display_edges = this.edges.filter(e =>
            e &&
            DisplaySseq._drawEdgeOnPageQ(e, pageRange)
            && DisplaySseq._drawClassOnPageQ(e.source, page) && DisplaySseq._drawClassOnPageQ(e.target, page)
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

    registerUpdateListener(f){
        this.update_listener = f;
    }

    update(){
        if(this.update_listener){
            this.update_listener();
        }
    }

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

    static newEdge(){
        let e = {};
        e.color = "black";
        e.page = infinity;
        e.page_min = 0;
        e._drawOnPageQ = () => true;
        e.visible = true;
        return e;
    }

    addKeyHandler(key, fn){
        this.keyHandlers[key] = fn;
    }

    setPageChangeHandler(f){
        this.pageChangeHandler = f;
    }

    /* */
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
    /**/

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


    static async fromJSON(path){
        let response = await fetch(path);
        let json = await response.text();
        let sseq_obj = JSON.parse(json);
        console.log(sseq_obj.edges);
        let sseq = Object.assign(new DisplaySseq(), sseq_obj);
        sseq.default_node = Object.assign(new Node(), sseq.default_node);
        let num_classes_by_degree = new StringifyingMap();
        let class_list_index_map = new Map();
        for(let i = 0; i < sseq.classes.length; i++){
            let c = sseq.classes[i];
            class_list_index_map.set(i, c);
            if(!c){
                continue;
            }
            let idx  = num_classes_by_degree.getOrElse([c.x, c.y], 0);
            num_classes_by_degree.set([c.x, c.y], idx + 1);
            for(let i = 0; i < c.node_list.length; i++){
                c.node_list[i] = new Node(sseq.master_node_list[c.node_list[i]]);
                c.node_list[i].shape = Shapes[c.node_list[i].shape.name];
            }
        }
        for(let e of sseq.edges){
            if(e.type === "Extension"){
                e._drawOnPageQ = undefined;
            }
            e.source = class_list_index_map.get(e.source);
            e.target = class_list_index_map.get(e.target);
        }
        sseq.num_classes_by_degree = num_classes_by_degree;
        return sseq;
    }


    display(){
        if(typeof window === "undefined"){
            console.log("Can only display in browser.");
            return;
        }
        if(window.display){
            window.display.setSseq(this);
        } else {
            window.display = new Display(this);
        }
    }

    toJSON() {
        let sseqToSerialize = {};
        for(let field of this.serializeSseqFields){
            sseqToSerialize[field] = this[field];
        }
        let node_map = new StringifyingMap((n) => JSON.stringify(n));
        sseqToSerialize.master_node_list = [];
        sseqToSerialize.classes = [];
        sseqToSerialize.edges = [];
        for(let c of this.classes){
            let classToSerialize = {};
            for(let field of this.serializeClassFields){
                classToSerialize[field] = c[field];
            }
            classToSerialize.node_list = [];
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
            let edgeToSerialize = {};
            for(let field of this.serializeEdgeFields){
                edgeToSerialize[field] = edge[field];
            }
            edgeToSerialize.source = edge.source.list_index;
            edgeToSerialize.target = edge.target.list_index;
            sseqToSerialize.edges.push(edgeToSerialize);
        }
        console.log(sseqToSerialize)
        return sseqToSerialize;
    }


    download(filename){
        this.serializeSseqFields = [
            "min_page_idx", "page_list", "xRange", "yRange", "initialxRange", "initialyRange",
            "default_node", "class_scale", "offset_size", "serializeSseqFields", "serializeClassFields", "serializeEdgeFields"
        ]; // classes and edges are dealt with separately.
        this.serializeClassFields = [
            "x", "y", "name", "extra_info", "unique_id", "idx", "x_offset", "y_offset", "page_list", "visible", "permanent_cycle_info"
        ]; // "node_list" is dealt with separately
        this.serializeEdgeFields = [
            "color", "bend", "dash", "lineWidth", "opacity", "page_min", "page", "type","mult"
        ]; // "source" and "target" are dealt with separately.
        for(let c of this.classes){
            c.tooltip_html = undefined;
        }
        this.edges = this.edges.filter(e => !e.invalid);
        let display_classes = this.display_classes;
        let display_edges = this.display_edges;
        this.display_classes = undefined;
        this.display_edges = undefined;
        Util.download(filename, JSON.stringify(this));
        this.display_classes = display_classes;
        this.display_edges = display_edges;
    }




}

DisplaySseq.default_node = default_node;

exports.DisplaySseq = DisplaySseq;