import * as Shapes from "./Shape"
import * as SseqClassjs from "./SseqClass"
import * as Edges from "./Edges";
import * as monomial_basisjs from "./monomial_basis";
import * as Util from "./Util";
import * as IO from "./SaveLoad";
import EventEmitter from "events";
import StringifyingMap from "./StringifyingMap"
import * as Interface from "./Interface"


export const SseqClass = SseqClassjs.SseqClass;
export const Node = SseqClassjs.Node;
export const Edge = Edges.Edge;
export const Structline = Edges.Structline;
export const Extension = Edges.Extension;
export const Differential = Edges.Differential;
let monomial_basis = monomial_basisjs.monomial_basis;
let slice_basis = monomial_basisjs.slice_basis;
let infinity = Util.infinity;
let sseqDatabase = IO.sseqDatabase;

export const monomialString = monomial_basisjs.monomialString;
export const range = monomial_basisjs.range;
export const product = monomial_basisjs.product;
export const vectorSum = monomial_basisjs.vectorSum;
export const vectorScale = monomial_basisjs.vectorScale;
export const vectorLinearCombination = monomial_basisjs.vectorLinearCombination;
export const dictionaryVectorSum = monomial_basisjs.dictionaryVectorSum;
export const dictionaryVectorScale = monomial_basisjs.dictionaryVectorScale;
export const dictionaryVectorLinearCombination = monomial_basisjs.dictionaryVectorLinearCombination;




/**
 * Calculate the dot product of two vectors of the same length
 * @param {Array|int} k
 * @param {Array|int} l
 * @returns {int} the dot product of k and l.
 */
function dot_product(k,l){
    let s = 0;
    for(let i=0; i<k.length; i++){
        s += k[i] * l[i];
    }
    return s;
}


/**
 * Adds an entry to a map keys ==> lists.
 * If the current key isn't present in the map, add an empty list first.
 * @param dictionary The dictionary of lists to add the entry to
 * @param key
 * @param value
 */
function addToDictionaryOfLists(dictionary, key,value){
    if(!dictionary.has(key)){
        dictionary.set(key, []);
    }
    dictionary.get(key).push(value);
}




export class Sseq extends EventEmitter {
    /**
     * Make a spectral sequence object.
     * Key properties:
     *
     */
    constructor(){
        super();

        this.total_classes = 0;
        this.xRange = [0, 100];
        this.yRange = [0, 100];
        this.initialxRange = [0, 10];
        this.initialyRange = [0, 10];
        this.classes_by_degree = new StringifyingMap();
        this.num_classes_by_degree = new StringifyingMap();
        this.classes_by_stem = new Map();
        this.classes = [];
        this.structlines = [];
        this.differentials = [];
        this.edges = [];
        this.xshift = 0;
        this.yshift = 0;        
        this.offset_size = 0.3;
        this.min_class_size = 20;
        this.max_class_size = 60;
        this.class_scale = 1;
        this.min_page_idx = 0;
        this.page_list = [0,infinity];
        this.default_node = new Node();
        this.default_node.hcolor = "red";
        this.default_node.fill = true;
        this.default_node.stroke = true;
        this.default_node.shape = Shapes.circle;
        this.default_node.size = 1;
        this.projection = (ssclass) => [ssclass.degree.x, ssclass.degree.y];
        this.stem_degree = (ssclass) => ssclass.degree.x;
        this.filtration_degree = (ssclass) => ssclass.degree.y;
        // The list of valid products, styled {name, stem, filtration, optional color}
        this.products = [];
        this.selectedClasses = [];

        this.serializeSseqFields = Sseq.serializeSseqFields;
        this.serializeClassFields = Sseq.serializeClassFields;
        this.serializeEdgeFields = Sseq.serializeEdgeFields;
        this.serializeNodeFields = Sseq.serializeNodeFields;

        this.undo = new Interface.Undo(this);
    }

    startMutationTracking(){
        this.undo.startMutationTracking();
    }

    addMutationsToUndoStack(event_obj){
        this.undo.addMutationsToUndoStack(event_obj);
    }

    addMutation(obj, pre, post){
        this.undo.addMutation(obj, pre, post);
    }

    set_shift(x, y){
        this.xshift = x;
        this.yshift = y;
        return this;
   }

   get minX() { return this.xRange[0]; }
   get minY() { return this.yRange[0]; }
   get maxX() { return this.xRange[1]; }
   get maxY() { return this.yRange[1]; }
   set minX(x) { this.xRange[0] = parseInt(x); }
   set minY(y) { this.yRange[0] = parseInt(y); }
   set maxX(x) { this.xRange[1] = parseInt(x); }
   set maxY(y) { this.yRange[1] = parseInt(y); }

   add_to_shift(x, y){
        this.xshift += x;
        this.yshift += y;
        return this;
   }

    getClasses(){
        return this.classes;
    }

    getEdges(){
        return this.edges;
    }

    getStructlines(){
        return this.structlines;
    }

    getDifferentials(){
        return this.differentials;
    }

    getStructlineTypes(){
        return new Set(this.structlines.map(x => x.mult));
    }

    getSelection(){

    }

    clearSelection(){
        for(let c of this.classes){
            c.selected = false;
        }
        this.emit('update');
        return this;
    }

    selectClass(c, selectOrUnselect = true){
        if(!c){
            return this;
        }
        c.selected = selectOrUnselect;
        return this;
    }

    unselectClass(c){
        this.selectClass(c, false);
    }

    unselectAll(){
        for(let c of this.getClasses()){
            c.selected = false;
        }
        this.emit('update');
    }

    getPotentialTargets(c){
        let x = c.x - 1;
        return sseq.getClasses().filter(cl => cl.x === x);
    }

    getClassesInDegree(x, y){
        return this.classes.filter(c => c.x === x && c.y === y);
        // if(this.classes_by_degree.has({x: x, y: y})) {
        //     return this.classes_by_degree.get({x: x, y: y});
        // }
    }

    getClassesByName(name){
        return this.classes.filter(c => c.name === name);
        // if(this.classes_by_degree.has({x: x, y: y})) {
        //     return this.classes_by_degree.get({x: x, y: y});
        // }
    }

    getOccupiedStems(){
        return Array.from(this.classes_by_degree.keys());
    }

    getStem(stem){
        return this.classes_by_stem.get(stem) || [];
    }

    /**
     * Add a class in position (x,y) and return the class. Uses sseq.default_node for display.
     *
     * @param x The x position
     * @param y
     * @returns {SseqClass} The new class
     */
    addClass(x, y){
        if(x === undefined){
            return SseqClass.getDummy();
        }
        let degree;
        if(y === undefined){
            degree = x;
        } else {
            x = x + this.xshift;
            y = y + this.yshift;
            degree = {x: x, y: y};
        }
        let c = new SseqClass(this, degree);
        let idx  = this.num_classes_by_degree.getOrElse([c.x, c.y], 0);
        this.num_classes_by_degree.set([c.x, c.y], idx + 1);
        c.idx = idx;
        c.class_list_index = this.classes.length;
        this.classes.push(c);
        addToDictionaryOfLists(this.classes_by_degree, degree, c);
        addToDictionaryOfLists(this.classes_by_stem, c.x , c);
        this.total_classes ++;

        this.emit("class-added", c);
        this.emit("update");
        this.addMutation(c, {delete: true}, c.getMemento());
        return c;
    }

    deleteClass(c){
        this.addMutation(c, c.getMemento(), {delete: true});
        c.delete();
        for (let e of c.edges)
            if (!e.invalid)
                this.deleteEdge(e, true);

        this.emit("update");
    }

    deleteEdge(e, noupdate = false){
        this.addMutation(e, e.getMemento(), {delete: true});

        let source_pre = e.source.getMemento();
        let target_pre = e.target.getMemento();
        e.delete();
        this.addMutation(e.source, source_pre, e.source.getMemento());
        this.addMutation(e.target, target_pre, e.target.getMemento());

        if (!noupdate) this.emit("update");
    }

    /**
     * Adds a structline from source to target.
     * @param source
     * @param target
     * @param mult
     * @returns {Structline} the structline object
     */
    addStructline(source, target, mult){
//        if(source == undefined){
//            source = this.last_classes[0]
//            target = this.last_classes[1]
//        } else if(target == undefined){
//            target = this.last_classes[0]
//        }
        if(this.duplicateEdge(Structline, source, target).length > 0){
            return Structline.getDummy();
        }
        if(!source || !target || source.isDummy() || target.isDummy()){
            return Structline.getDummy();
        }
        let struct = new Structline(this, source, target);
        if (mult) struct.setProduct(mult);

        let source_pre = source.getMemento();
        let target_pre = target.getMemento();
        source._addStructline(struct);
        target._addStructline(struct);
        this.structlines.push(struct);
        struct.edge_list_index = this.edges.length;
        this.edges.push(struct);
        this.emit("edge-added", struct);
        this.emit("structline-added", struct);
        this.emit("update");
        this.addMutation(struct, {delete: true}, struct.getMemento());
        this.addMutation(source, source_pre, source.getMemento());
        this.addMutation(target, target_pre, target.getMemento());
        return struct;
    }

    /**
     * Adds a differential.
     * @param source
     * @param target
     * @param page
     * @returns {Differential}
     */
   addDifferential(source, target, page, set_pages = true){
       if(typeof source === "number"){
           console.log("addDifferential a SseqClass in position 1, got a number. Probably the arguments are in the wrong order.")
           return Differential.getDummy();
       }
       if(typeof page !== "number"){
           console.log(`Invalid page ${page} for differential.`);
           return Differential.getDummy();
       }
        if(!source || !target){
            // throw new Error(`Source or target is undefined.`);
            return Differential.getDummy();
        }
       // if(source.constructor !== SseqClass){
       //     console.log(`Source has invalid type ${source.constructor.name}`);
       //     return Differential.getDummy();
       // }
       //  if(target.constructor !== SseqClass){
       //      console.log(`Target has invalid type ${target.constructor.name}`);
       //      return Differential.getDummy();
       //  }
        if(source.isDummy() || target.isDummy()){
            console.log("source or target is dummy");
            return Differential.getDummy();
        }
        let possible_duplicate_edges = this.duplicateEdge(Differential, source, target, page);
        if(possible_duplicate_edges.length > 0){
            console.log("duplicate edge");
            console.log(possible_duplicate_edges);
            return possible_duplicate_edges[0];
        }
        if(page <= 0){
            console.log([source, target, page]);
            console.log("No page <= 0 differentials allowed.");
            return Differential.getDummy();
        }

        let differential = new Differential(this, source, target, page);
        let source_pre = source.getMemento();
        let target_pre = target.getMemento();
        source._addOutgoingDifferential(differential, set_pages);
        target._addIncomingDifferential(differential, set_pages);
        differential.edge_list_index = this.edges.length;
        this.differentials.push(differential);
        this.edges.push(differential);
        this.addPageToPageList(page);

        this.emit("edge-added", differential);
        this.emit("differential-added", differential);
        this.emit("update");

        this.addMutation(differential, {delete: true}, differential.getMemento());
        this.addMutation(source, source_pre, source.getMemento());
        this.addMutation(target, target_pre, target.getMemento());
        return differential;
    }

    /**
     * Adds an extension.
     * @param source
     * @param target
     * @returns {Extension}
     */
    addExtension(source, target){
        if(!source || !target || source.isDummy() || target.isDummy()){
            return Extension.getDummy();
        }
        if(this.duplicateEdge(Extension, source, target).length){
            return Extension.getDummy();
        }
        let ext = new Extension(this, source, target);
        ext.edge_list_index = this.edges.length;
        this.edges.push(ext);
        let source_pre = source.getMemento();
        let target_pre = target.getMemento();
        source._addExtension(ext);
        target._addExtension(ext);

        this.emit("edge-added", ext);
        this.emit("extension-added", ext);
        this.emit("update");

        this.addMutation(ext, {delete: true}, ext.getMemento());
        this.addMutation(source, source_pre, source.getMemento());
        this.addMutation(target, target_pre, target.getMemento());
        return ext;
    }

    duplicateEdge(type, source, target, page){
        return this.edges.filter(e =>
            e.constructor === type
            && e.source === source
            && e.target === target
            && (!page || e.page === page)
            && !e.invalid
        );
    }

    /**
     * This doesn't work very well right now...
     * @param source
     * @param targets
     * @param page
     * @returns {Array}
     */
    addSumDifferential(source, targets, page){
       let target_name = targets.map(t => t.name).join("+");
       let differentialList = [];
       for(let t of targets){
           let d = this.addDifferential(source, t, page);
           d.target_name = target_name;
           differentialList.push(d);
       }
       for(let i = 0; i < differentialList.length - 1; i++){
           differentialList[i].replaceTarget();
       }
       return differentialList;
    }

    getClassString(c){
        let name = c.name ? `[${c.name}]` : "";
       return `(${c.x}, ${c.y})${name}`;
    }


    /**
     * Makes a query to determine if the user wants to add a differential.
     */
    getDifferentialQuery(source, target, page){
        if(page === undefined){
            return `Add differential from ${this.getClassString(source)} to ${this.getClassString(target)}?`;
        }
        return `Add d${page} differential from ${this.getClassString(source)} to ${this.getClassString(target)}?`;
    }

    /**
     * Makes a query to determine if the user wants to add a Structline.
     */
    getStructlineQuery(source, target, name){
        name = name ? " *" + name : "";
        return `Add${name} structline from ${this.getClassString(source)} to ${this.getClassString(target)}?`;
    }

    getExtensionQuery(source, target, name){
        name = name ? " *" + name : "";
        return `Add${name} extension from ${this.getClassString(source)} to ${this.getClassString(target)}?`;
    }


    // Returns either falsey or a pair [description of edge to add, callback to add edge].
    // The idea is to query to user with description and run the callback if they agree.
    getPossibleEdgesToAdd(c1, c2){
       if(this.stem_degree(c1) > this.stem_degree(c2)){
           let temp = c2;
           c2 = c1;
           c1 = temp;
       }
       // So s1 <= s2.
       let s1 = this.stem_degree(c1);
       let s2 = this.stem_degree(c2);
       let f1 = this.filtration_degree(c1);
       let f2 = this.filtration_degree(c2)
       let ds = s2 - s1;
       let df = f2 - f1;
       // Differentials
       if(ds === 1){
           if(df < 0){
               return {
                   query : this.getDifferentialQuery(c2, c1, -df),
                   callback : () => this.addDifferential(c2, c1, -df)
               };
           }
       }

       for(let prod of this.products){
            if(prod.stem === ds && prod.filtration === df){
                return {
                    query: this.getStructlineQuery(c1, c2, prod.name),
                    callback: () => this.addStructline(c1, c2).setProduct(prod.name).setColor(prod.color)
                }
            }
           if(prod.stem === -ds && prod.filtration === df){
               return {
                   query : this.getStructlineQuery(c2, c1, prod.name),
                   callback : () => this.addStructline(c2, c1).setProduct(prod.name).setColor(prod.color)
               }
           }
       }

        for(let prod of this.products){
            if(prod.stem === ds && prod.filtration < df){
                return {
                    query: this.getExtensionQuery(c1, c2, prod.name),
                    callback: () => this.addExtension(c1, c2).setProduct(prod.name).setColor(prod.color)
                }
            }
            if(prod.stem === -ds && prod.filtration < df){
                return {
                    query : this.getExtensionQuery(c2, c1, prod.name),
                    callback : () => this.addExtension(c2, c1).setProduct(prod.name).setColor(prod.color)
                }
            }
        }
        return false;
    }

    decrementClassIndex(c){
       let classes = this.getClassesInDegree(c.x,c.y);
       let idx = c.idx;
       if(idx === 0){
           return;
       }
       for(let c2 of classes){
           if(c2.idx === idx - 1){
               c.idx --;
               c2.idx ++;
               return;
           }
       }
    }

    incrementClassIndex(c){
        let classes = this.getClassesInDegree(c.x, c.y);
        let idx = c.idx;
        if(idx === classes.length){
            return;
        }
        for(let c2 of classes){
            if(c2.idx === idx + 1){
                c.idx ++;
                c2.idx --;
                return;
            }
        }
    }

    /**
     * For display purposes, a Sseq object maintains a list of pages on which something changes in the spectral sequence.
     * Currently this list always contains 0, infinity, and the set of pages on which differentials live.
     * @param page
     * @returns {Sseq} chainable
     */
    addPageToPageList(page){
        for(let i = 0; i < this.page_list.length; i++){
            let compare_page;
            if(Array.isArray(this.page_list[i])){
                compare_page = this.page_list[i][0];
            } else {
                compare_page = this.page_list[i];
            }
            if(compare_page > page){
                this.page_list.splice(i, 0, page);
            }
            if(compare_page >= page && !Array.isArray(this.page_list[i])){
                return this;
            }
        }
    }

    addPageRangeToPageList(pageRange){
        let page = pageRange[0];
        for(let i = 0; i < this.page_list.length; i++){
            let compare_page;
            if(Array.isArray(this.page_list[i])){
                compare_page = this.page_list[i][0];
            } else {
                compare_page = this.page_list[i];
            }
            if(compare_page > page){
                this.page_list.splice(i, 0, pageRange);
                return this;
            } else if(compare_page == page){
                if(!Array.isArray(this.page_list[i])){
                    this.page_list.splice(i, 0, pageRange);
                    return this;
                } else {
                    if(this.page_list[i][1] > pageRange[1]){
                        this.page_list.splice(i, 0, pageRange);
                        return this;
                    } else if(this.page_list[i][1] == pageRange[1]){
                        return this;
                    }
                }
            }
        }
    }


    /**
     *
     * @param var_degree_dict -- Object with bidegrees of the generators, of the form `"var_name" : [stem, filtration]`
     * @param var_spec_list -- List of range specifications. Each range specification is a list of the form
     *  `["var_name", min, max, step]` where `min` defaults to 0 and `step` defaults to 1.
     * @param cond
     * @returns {monomial_basis} A monomial_basis object containing the set of classes so generated.
     */
   addPolynomialClasses(var_degree_dict, var_spec_list, module_generators = {"" : [0,0] }){
        if(!Array.isArray(var_spec_list)){
            throw "Second argument of addPolynomialClasses should be an array"
        }

       return new monomial_basis(this, var_degree_dict, var_spec_list, module_generators);
   }

   deserializePolynomialClasses(serialized_basis){
       return new monomial_basis(this, serialized_basis);
   }

    addSliceClasses(var_degree_dict, var_spec_list, make_slice){
        if(!Array.isArray(var_spec_list)){
            throw "Second argument of addPolynomialClasses should be an array"
        }

        return new slice_basis(this, var_degree_dict, var_spec_list, make_slice);
    }


    getSurvivingClasses(page){
       if(page===undefined){
           page = infinity - 1;
       }
        return this.classes.filter((c) => c.page_list[c.page_list.length-1] >= page);
    }

    /**
     * This returns the classes and edges that should be displayed on the current page and view range.
     *
     * @param page
     * @param xmin
     * @param xmax
     * @param ymin
     * @param ymax
     * @package
     */
    getDrawnElements(page, xmin, xmax, ymin, ymax) {
        Util.checkArgumentsDefined(Sseq.prototype.getDrawnElements, arguments);
        let pageRange;
        // TODO: clean up pageRange. Probably we should always pass pages as pairs?
        if (Array.isArray(page)) {
            pageRange = page;
            page = page[0];
        } else {
            pageRange = [page, page];
        }
        let display_classes = this.classes.filter(c => {
            if (!c || c.invalid) {
                return false;
            }
            c.in_range = Sseq._classInRangeQ(c, xmin, xmax, ymin, ymax);
            return c.in_range && Sseq._drawClassOnPageQ(c, page);
        });

        // Display edges such that
        // 1) e is a valid edge
        // 2) e is supposed to be drawn on the current pageRange.
        // 3) e.source and e.target are supposed to be drawn on the current pageRange
        // 4) At least one of the source or target is in bounds.
        let display_edges = this.edges.filter(e =>
            e && !e.invalid && 
            Sseq._drawEdgeOnPageQ(e, pageRange)
            && Sseq._drawClassOnPageQ(e.source, page) && Sseq._drawClassOnPageQ(e.target, page)
            && (e.source.in_range || e.target.in_range)
        );

        // We need to go back and make sure that for every edge we are planning to  draw, we draw both its source and
        // target even if one of them is out of bounds. Check for out of bounds sources / targets and add them to the
        // list of edges to draw.
        for (let e of display_edges) {
            if (!e.source.in_range) {
                display_classes.push(e.source);
                e.source.in_range = true;
            }
            if (!e.target.in_range) {
                e.target.in_range = true;
                display_classes.push(e.target);
            }
        }

        let display_nodes = display_classes.map(c => {
            let node = this.getClassNode(c, page);
            if(node === undefined) {
                console.log(c);
                console.log(page);
                throw `Undefined node for class`;
            }
            node.c = c;
            node.x = c.x;
            node.y = c.y;
            c.node = node;
            return node;
        });
        display_nodes = display_nodes.filter(n => n); // Remove undefined nodes. This shouldn't happen?

        for (let e of display_edges) {
            e.source_node = e.source.node;
            e.target_node = e.target.node;
        }
        return [display_nodes, display_edges];
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
    static _classInRangeQ(c, xmin, xmax, ymin, ymax) {
        return xmin <= c.x && c.x <= xmax && ymin <= c.y && c.y <= ymax;
    }

    /**
     * Check whether `page` is less than the maximum draw page for the `c`.
     * @param c
     * @param page
     * @returns {boolean}
     * @private
     */
    static _drawClassOnPageQ(c, page) {
        if (c._drawOnPageQ) {
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
    static _drawEdgeOnPageQ(edge, pageRange) {
        if (edge._drawOnPageQ) {
            return edge._drawOnPageQ(pageRange);
        } else {
            switch (edge.type) {
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
     * If multiple classes are in the same (x,y) location, we offset their position a bit to avoid clashes.
     * Gets called by display code.
     * @returns {number} The x offset
     * @package
     */
    _getXOffset(node, page) {
        let c = node.c;
        if (c.x_offset !== false) {
            return c.x_offset * this.offset_size;
        }
        let total_classes = this.num_classes_by_degree.get([c.x, c.y]);
        let idx = c.idx;
        let out = (idx - (total_classes - 1) / 2) * this.offset_size;
        if (isNaN(out)) {
            console.log("Invalid offset for class:",c);
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
    _getYOffset(node, page) {
        let c = node.c;
        if (c.y_offset !== false) {
            return c.y_offset  * this.offset_size;
        }
        let total_classes = this.num_classes_by_degree.get([c.x, c.y]);
        let idx = c.idx;
        let out = -(idx - (total_classes - 1) / 2) * this.offset_size;
        if (isNaN(out)) {
            console.log("Invalid offset for class:", c);
            return 0;
        }
        return out;
    }

    /**
     * Gets the node to be drawn for the class on the given page. Used primarily by display.
     * @param c
     * @param page
     * @returns {*}
     */
    getClassNode(c, page) {
        return c.node_list[SseqClass.prototype._getPageIndex.call(c, page)];
    }

    exportToTex(filename, page, xmin, xmax, ymin, ymax){
        ExportToTex.DownloadSpectralSequenceTex(filename, this, page, xmin, xmax, ymin, ymax);
    }


    static fromJSONObject(json) {
        let sseq = new Sseq();

        let serializeSseqFields;
        if (json.serializeSseqFields)
            serializeSseqFields = json.serializeSseqFields;
        else
            serializeSseqFields = Sseq.serializeSseqFields;

        for (let field of serializeSseqFields) {
            if (json[field]) sseq[field] = json[field];
        }

        sseq.default_node = new Node(sseq.default_node);
        sseq.default_node.shape = Shapes[sseq.default_node.shape.name];

        // We assume json.classes is an array but addClass can fail? Maybe
        // revisit this assumption
        let class_idx = [];

        let mnl = json.master_node_list;
        for (let c of json.classes) {
            let rc = sseq.addClass(c.x, c.y);
            Object.assign(rc, c);
            rc.node_list = rc.node_list.map(x => new Node(mnl[x]));
            for (let n of rc.node_list) {
                n.shape = Shapes[n.shape.name];
            }
            class_idx.push(rc);
        }

        for (let e of json.edges) {
            let source = class_idx[e.source];
            let target = class_idx[e.target];

            if (source.y > target.y) {
                [source, target] = [target, source];
            }
            let re;

            switch (e.type) {
                case "Differential":
                    // Save and restore page_list of source and target to make sure adding the differential doesn't change
                    // it (the effect of this differential should already be taken into account in page_list).
                    let source_page_list = source.page_list.slice();
                    let target_page_list = target.page_list.slice();
                    re = sseq.addDifferential(source, target, e.page);
                    source.page_list = source_page_list;
                    target.page_list = target_page_list;
                    break;
                case "Structline":
                    re = sseq.addStructline(source, target);
                    break;
                case "Extension":
                    re = sseq.addExtension(source, target);
                    break;
            }
            Object.assign(re, e);
            // This overwrote re.source and re.target
            re.source = source;
            re.target = target;
        }
        return sseq;
    }

    deleteDuplicateEdges(){
        for(let c of this.getClasses()){
            let targets = [];
            for(let e of c.getEdges()){
                if(targets.includes(e.otherClass(c))){
                    e.delete();
                } else {
                    targets.push(e.otherClass(c));
                }
            }
        }
    }

    addSseqFieldToSerialize(field){
        if(Array.isArray(field)){
            field.forEach( f => this.addSseqFieldToSerialize(f));
            return;
        }
        if(!this.serializeSseqFields.includes(field)){
            this.serializeSseqFields.push(field);
        }
    }

    addClassFieldToSerialize(field){
        if(Array.isArray(field)){
            field.forEach( f => this.addClassFieldToSerialize(f));
            return;
        }
        if(!this.serializeClassFields.includes(field)){
            this.serializeClassFields.push(field);
        }
    }

    addEdgeFieldToSerialize(field){
        if(Array.isArray(field)){
            field.forEach( f => this.addEdgeFieldToSerialize(f));
            return;
        }
        if(!this.serializeEdgeFields.includes(field)){
            this.serializeEdgeFields.push(field);
        }
    }

    download(filename){
        IO.download(filename, JSON.stringify(this));
    }

    static upload(){
       return IO.upload().then(json => {
           return Sseq.fromJSONObject(JSON.parse(json));
       });
    }

    save(){
        if(!this.save_name){
            this.saveAs();
        } else {
            this.saveToLocalStore(name);

        }
    }

    saveAs(){
        let name = prompt("Save as:", this.save_name || "");
        if(name){
            this.save_name = name;
            this.saveToLocalStore(name);
        }
    }

    saveToLocalStore(key){
        return IO.saveToLocalStore(key, this);
    }

    static async loadFromDataStoreOrServer(path){
        let json;
        json = await IO.loadFromLocalStore(path);
        if(!json){
            json = await IO.loadFromServer(path);
        }
        let sseq = Sseq.fromJSONObject(json);
        sseq.path = path;
        return sseq;
    }

    static async loadFromServer(path){
       let json = await IO.loadFromServer(path);
       return Sseq.fromJSONObject(json);
    }

    static async loadFromLocalStore(key){
       let json = await IO.loadFromLocalStore(key);
       console.log(json);
       return Sseq.fromJSONObject(json);
    }

    // This is hacky. Need to choose which properties to keep.
    static _serializeNode(node) {
        let n = {};
        for (let field of this.serializeNodeFields) {
            if (node[field]) n[field] = node[field];
        }
        return n;
    }

    toJSON() {
        let json = {};

        for(let field of this.serializeSseqFields){
            json[field] = this[field];
        }

        // Make a map of each node that occurs at least once. We're going to replace the class.node_list with the indices
        // of the node in the master_node_list.
        let node_map = new StringifyingMap((n) => JSON.stringify(Sseq._serializeNode(n)));
        json.master_node_list = [];
        json.classes = [];
        json.edges = [];

        for (let c of this.classes) {
            if (c.invalid) {
                continue;
            }
            let cs = {};
            // Copy fields that we serialize
            for(let field of this.serializeClassFields){
                cs[field] = c[field];
            }
            cs.node_list = [];
            // Replace node_list with list of master_node_list indices.
            for(let cur_node of c.node_list){
                if(!node_map.has(cur_node)){
                    node_map.set(cur_node, json.master_node_list.length);
                    json.master_node_list.push(Sseq._serializeNode(cur_node));
                }
                cs.node_list.push(node_map.get(cur_node));
            }
            c.list_index = json.classes.length;
            json.classes.push(cs);
        }

        for(let e of this.edges){
            if(e.invalid){
                continue;
            }
            let es = {};
            // Copy fields that we serialize
            for(let field of this.serializeEdgeFields){
                es[field] = e[field];
            }
            // Replace source and target with list indices.
            es.source = e.source.list_index;
            es.target = e.target.list_index;
            json.edges.push(es);
        }
        return json;
    }
}

Sseq.serializeSseqFields = ["min_page_idx", "page_list", "xRange", "yRange", "initialxRange", "initialyRange", "default_node", "class_scale", "offset_size", "min_class_size", "max_class_size", "serializeSseqFields", "serializeClassFields", "serializeEdgeFields", "serializeNodeFields"]; // classes and edges are dealt with separately.
Sseq.serializeClassFields = ["x", "y", "name", "extra_info", "unique_id", "idx", "x_offset", "y_offset", "page_list", "visible"]; // "node_list" is dealt with separately
Sseq.serializeEdgeFields = ["color", "bend", "dash", "lineWidth", "opacity", "page_min", "page", "type", "mult", "source_name", "target_name"]; // "source" and "target" are dealt with separately.
Sseq.serializeNodeFields = ["opacity", "color", "fill", "stroke", "hcolor", "hfill", "hstroke", "shape", "scale"];

