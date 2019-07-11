"use strict";

let DisplaySseq = require("./DisplaySseq.js").DisplaySseq;
let Shapes = require("./Shape.js");
let SseqClassjs = require("./SseqClass.js");
let SseqClass = SseqClassjs.SseqClass;
let Node = SseqClassjs.Node;
let Edges = require("./Edges.js");
let Edge = Edges.Edge;
let Structline = Edges.Structline;
let Extension = Edges.Extension;
let Differential = Edges.Differential;
let monomial_basisjs = require("./monomial_basis.js");
let monomial_basis = monomial_basisjs.monomial_basis;
let slice_basis = monomial_basisjs.slice_basis;
let Util = require("./Util.js");
let infinity = Util.infinity;
let IO = require("./SaveLoad");
let sseqDatabase = IO.sseqDatabase;

exports.DisplaySseq = DisplaySseq;
exports.SseqClass = SseqClass;
exports.Node = Node;
exports.Edge = Edge;
exports.Differential = Differential
exports.Structline = Structline;
exports.Extension = Extension;
exports.monomialString = monomial_basisjs.monomialString;
exports.range = monomial_basisjs.range;
exports.StringifyingMap = monomial_basisjs.StringifyingMap;
exports.product = monomial_basisjs.product;
exports.vectorSum = monomial_basisjs.vectorSum;
exports.vectorScale = monomial_basisjs.vectorScale;
exports.vectorLinearCombination = monomial_basisjs.vectorLinearCombination;
exports.dictionaryVectorSum = monomial_basisjs.dictionaryVectorSum;
exports.dictionaryVectorScale = monomial_basisjs.dictionaryVectorScale;
exports.dictionaryVectorLinearCombination = monomial_basisjs.dictionaryVectorLinearCombination;



let StringifyingMap = require("./StringifyingMap.js");



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




class Sseq {
    /**
     * Make a spectral sequence object.
     * Key properties:
     *
     */
    constructor(){
        this.display_sseq = new DisplaySseq();
        this.display_class_to_real_class = new StringifyingMap((c) => `${c.x}, ${c.y}, ${c.unique_id}`);
        this.display_edge_to_real_edge = new StringifyingMap((e) =>
            `${e.type} : (${e.source.x}, ${e.source.y}, ${e.source.unique_id}) => (${e.target.x}, ${e.target.y}, ${e.target.unique_id})`
        );
        this.total_classes = 0;
        this.initialxRange = [0, 10];
        this.initialyRange = [0, 10];
        this.classes_by_degree = new StringifyingMap();
        this.num_classes_by_degree = new StringifyingMap();
        this.classes_by_stem = new Map();
        this.classes = [];
        this.class_tooltip_fields = ["extra_info"];
        this.structlines = [];
        this.differentials = [];
        this.edges = [];
        this.display_classes = [];        
        this.display_structlines = [];
        this.display_differentials = [];
        this.xshift = 0;
        this.yshift = 0;        
        this.offset_size = 0.3;
        this.class_scale = 1;
        this.min_page_idx = 0;
        this.page_list = [0,infinity];
        this.default_node = new Node();
        this.default_node.fill = true;
        this.default_node.stroke = true;
        this.default_node.shape = Shapes.circle;
        this.default_node.size = 6;
        this.projection = (ssclass) => [ssclass.degree.x, ssclass.degree.y];
        this.stem_degree = (ssclass) => ssclass.degree.x;
        this.filtration_degree = (ssclass) => ssclass.degree.y;
        // The list of valid products, styled {name, stem, filtration, optional color}
        this.products = [];
        this.selectedClasses = [];

        this._sseq_update_fields = [""];

        this._class_update_fields = [
            "x", "y", "idx", "unique_id", "x_offset", "y_offset",
            "name", "save_name", "extra_info", "page_list", "node_list",
            "visible", "class_tooltip_fields",
            "_classInRangeQ", "_drawOnPageQ", "selected", "invalid"
        ];

        this._edge_update_fields = [
            "page", "page_min", "color", "source_name", "target_name",
            "_drawOnPageQ", "visible", "bend", "opacity", "dash", "lineWidth",
            "source_name", "target_name"
        ];
        this.serializeSseqFields = Sseq.serializeSseqFields;
        this.serializeClassFields = Sseq.serializeClassFields;
        this.serializeEdgeFields = Sseq.serializeEdgeFields;
    }

    startMutationTracking(){
        if(!this.undo){
            this.undo = new Interface.Undo(this);
        }
        this.mutationMap = new Map();
    }

    addMutationsToUndoStack(event_obj){
        this.undo.add(this.mutationMap, event_obj);
        this.mutationMap = undefined;
    }

    addMutation(obj, pre, post){
        if(!this.mutationMap){
            return;
        }
        if(this.mutationMap.get(obj)){
            pre = this.mutationMap.get(obj).before;
        }
        this.mutationMap.set(obj, {obj: obj, before: pre, after : post});
    }

    changeObject(obj, callback){
        if(!this.mutationList){
            callback();
            return;
        }
        let pre = obj.getMemento();
        callback();
        let post = obj.getMemento();
        this.mutationList.push({obj: obj, before: pre, after : post});
    }

    set_shift(x, y){
        this.xshift = x;
        this.yshift = y;
        return this;
   }

   add_to_shift(x, y){
        this.xshift += x;
        this.yshift += y;
        return this;
   }

    onClassAdded(f){
        this.on_class_added = f;
        return this;
    }

    onEdgeAdded(f){
        this.on_edge_added = f;
        return this;
    }

    onDifferentialAdded(f){
        this.on_differential_added = f;
        return this;
    }

    onStructlineAdded(f){
        this.on_structline_added = f;
        return this;
    }

    onExtensionAdded(f){
        this.on_extension_added = f;
        return this;
    }

    onDraw(f){
        this.on_draw = f;
        this.display_sseq.on_draw = f;
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

    getSelection(){

    }

    clearSelection(){
        for(let c of this.classes){
            c.selected = false;
        }
        this.updateAll();
        return this;
    }

    selectClass(c, selectOrUnselect = true){
        if(!c){
            return this;
        }
        c.selected = selectOrUnselect;
        this.updateClass(c);
        return this;
    }

    unselectClass(c){
        this.selectClass(c, false);
    }

    unselectAll(){
        for(let c of this.getClasses()){
            c.selected = false;
        }
        this.updateAll();
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

        if(this.on_class_added){
            this.on_class_added(c);
        }
        c.display_class = {};
        this.display_sseq.classes[c.class_list_index] = c.display_class;
        this.updateClass(c);
        this.display_class_to_real_class.set(c.display_class, c);
        // this.display_sseq.update(); // Update the display if it exists.
        this.addMutation(c, {delete: true}, c.getMemento());
        return c;
    }

    deleteClass(c){
        if(!c || c.invalid){
            return;
        }
        c.invalid = true;
        c.display_class.invalid = true;
        let idx  = this.num_classes_by_degree.get([c.x, c.y]);
        this.num_classes_by_degree.set([c.x, c.y], idx - 1);
        this.total_classes --;
        this.classes.splice( this.classes.indexOf(c), 1 );
        this.updateClass(c);
        // this.display_sseq.update();
        return c;
    }

    reviveClass(c){
        if(!c || !c.invalid){
            return;
        }
        c.invalid = false;
        c.display_class.invalid = false;
        let idx  = this.num_classes_by_degree.get([c.x, c.y]);
        this.num_classes_by_degree.set([c.x, c.y], idx + 1);
        this.total_classes ++;
        this.classes.push(c);
        this.updateClass(c);
        // this.display_sseq.update();
        return c;
    }

    deleteEdge(e){
        return e.delete();
    }

    reviveEdge(e){
        e.revive();
    }


    /**
     * Adds a structline from source to target.
     * @param source
     * @param target
     * @returns {Structline} the structline object
     */
    addStructline(source, target){
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
        source._addStructline(struct);
        target._addStructline(struct);
        this.structlines.push(struct);
        struct.edge_list_index = this.edges.length;
        this.edges.push(struct);
        if(this.on_edge_added){
            this.on_edge_added(struct);
        }
        if(this.on_structline_added){
            this.on_structline_added(struct);
        }
        this.setupDisplayEdge(struct);
        this.addMutation(struct, {delete: true}, struct.getMemento());
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
        if(this.on_edge_added){
            this.on_edge_added(differential);
        }
        if(this.on_differential_added){
            this.on_differential_added(differential);
        }
        this.setupDisplayEdge(differential);
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
        if(this.on_edge_added){
            this.on_edge_added(ext);
        }
        if(this.on_extension_added){
            this.on_extension_added(ext);
        }
        this.setupDisplayEdge(ext);
        this.addMutation(ext, {delete: true}, ext.getMemento());
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

    setupDisplayEdge(edge) {
        let display_edge = {};
        edge.display_edge = display_edge;
        this.display_sseq.edges[edge.edge_list_index] = display_edge;
        display_edge.source = edge.source.display_class;
        display_edge.target = edge.target.display_class;
        display_edge.type = edge.constructor.name;
        this.display_edge_to_real_edge.set(edge.display_edge, edge);
        this.updateEdge(edge);
        //this.display_sseq.update();
    }

    display(div){
        let dss = this.getDisplaySseq();
        this.updateAll();
        dss.display(div);
        return dss;
    }

    update(){
        this.display_sseq.update();
    }

    updateAll(){
        Util.assignFields(this.display_sseq, this, this._sseq_update_fields);
        for(let c of this.classes){
            this.updateClass(c);
        }
        for(let e of this.edges){
            this.updateEdge(e);
        }
        this.display_sseq.update();
    }

    updateObject(o){
        if(o.constructor === SseqClass){
            this.updateClass(o);
        } else {
            this.updateEdge(o);
        }
    }

    updateClass(c){
        Util.assignFields(c.display_class, c, this._class_update_fields);
        Util.assignFields(c.display_class, c, this.class_tooltip_fields);
        c.display_class.tooltip = undefined;
        // Crappy fix for a bug when the list of indices changes.
        this.display_sseq.getClassNode(c.display_class, -1);
    }

    //
    updateEdge(edge){
       if(edge.isDummy()){
           return;
       }
       let display_edge = edge.display_edge;
       Util.assignFields(display_edge, edge, this._edge_update_fields);
       //this.display_sseq.updateAll();
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
               // this.updateClass(c);
               // this.updateClass(c2);
               // this.display_sseq.updateAll();
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
                // this.updateClass(c);
                // this.updateClass(c2);
                // this.display_sseq.updateAll();
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



    static getSseqFromDisplay(dss){
        let sseq = new Sseq();
        dss.real_sseq = sseq;
        Object.assign(sseq, dss);
        sseq.num_classes_by_degree = new StringifyingMap();
        sseq.classes = [];
        sseq.edges = [];
        sseq.display_class_to_real_class = new StringifyingMap((c) => `${c.x}, ${c.y}, ${c.unique_id}`);

        let classes = dss.classes;
        let edges = dss.edges;


        for(let display_class of classes){
            if(!display_class){
                continue;
            }
            let real_class = sseq.addClass(display_class.x,display_class.y);
            real_class.unique_id = display_class.unique_id;
            Object.assign(real_class, display_class);

            real_class.constructor = SseqClass.constructor;
            real_class.display_class = display_class;
            sseq.display_class_to_real_class.set(display_class, real_class);
            sseq.updateClass(real_class);
        }

        for(let display_edge of edges){
            if(!display_edge){
                continue;
            }
            // Ensure source has a lower y value than target.
            if(display_edge.source.y > display_edge.target.y){
               let temp = display_edge.target;
                display_edge.target = display_edge.source;
                display_edge.source = temp;
            }

            let real_edge;
            let source = sseq.display_class_to_real_class.get(display_edge.source);
            let target = sseq.display_class_to_real_class.get(display_edge.target);
            switch(display_edge.type){
                case "Differential" :
                    // Save and restore page_list of source and target to make sure adding the differential doesn't change
                    // it (the effect of this differential should already be taken into account in page_list).
                    let source_page_list = source.page_list.slice();
                    let target_page_list = target.page_list.slice();
                    real_edge = sseq.addDifferential(source, target, display_edge.page);
                    source.page_list = source_page_list;
                    target.page_list = target_page_list;
                    break;
                case "Extension":
                    real_edge = sseq.addExtension(source, target);
                    break;
                case "Structline" :
                default:
                    real_edge = sseq.addStructline(source, target);
                    break;
            }
            Object.assign(real_edge, display_edge);
            real_edge.source = source;
            real_edge.target = target;
            real_edge.display_edge = display_edge;
            sseq.updateEdge(real_edge);
        }
        sseq.display_sseq = dss;
        sseq.getDisplaySseq();
        return sseq;
    }

    // TODO: This shouldn't have side effects?
    getDisplaySseq(){
        let dss = this.display_sseq;
        dss.real_sseq = this;
        dss.min_page_idx = this.min_page_idx;
        dss.initial_page_idx = this.initial_page_idx;
        dss.page_list = this.page_list;
        dss.initialxRange = this.initialxRange;
        dss.initialyRange = this.initialyRange;
        dss.xRange = this.xRange;
        dss.yRange = this.yRange;
        dss.on_draw = this.on_draw;
        dss.class_scale = this.class_scale;
        dss.num_classes_by_degree = this.num_classes_by_degree;
        dss.serializeSseqFields = this.serializeSseqFields;
        dss.serializeClassFields = this.serializeClassFields;
        dss.serializeEdgeFields = this.serializeEdgeFields;
        dss.class_tooltip_fields = this.class_tooltip_fields;

        if(this._getXOffset){
            dss._getXOffset = this._getXOffset;
        }
        if(this._getYOffset){
            dss._getYOffset = this._getYOffset;
        }
        if(this.offset_size){
            dss.offset_size = this.offset_size;
        }
        if(this.onmouseoverClass){
            dss.onmouseoverClass = this.onmouseoverClass;
        }

        return dss;
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
            // Currently dss has a reference to the same array.
            //this.display_sseq.serializeSseqFields = this.serializeSseqFields;
        }
    }

    addClassFieldToSerialize(field){
        if(Array.isArray(field)){
            field.forEach( f => this.addClassFieldToSerialize(f));
            return;
        }
        if(!this.serializeClassFields.includes(field)){
            this.serializeClassFields.push(field);
            // Currently dss has a reference to the same array.
            //this.display_sseq.serializeSseqFields = this.serializeSseqFields;
        }
    }

    addEdgeFieldToSerialize(field){
        if(Array.isArray(field)){
            field.forEach( f => this.addEdgeFieldToSerialize(f));
            return;
        }
        if(!this.serializeEdgeFields.includes(field)){
            this.serializeEdgeFields.push(field);
            // Currently dss has a reference to the same array.
            //this.display_sseq.serializeSseqFields = this.serializeSseqFields;
        }
    }

    download(filename){
        IO.download(filename, JSON.stringify(this));
    }

    static upload(){
       return IO.upload().then(json => {
           return DisplaySseq.fromJSONObject(JSON.parse(json));
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
        let sseq = DisplaySseq.fromJSONObject(json);
        sseq.path = path;
        return sseq;
    }

    static async loadFromServer(path){
       let json = await IO.loadFromServer(path);
       return DisplaySseq.fromJSONObject(json);
    }

    static async loadFromLocalStore(key){
       let json = await IO.loadFromLocalStore(key);
       console.log(json);
       return DisplaySseq.fromJSONObject(json);
    }


    toJSON() {
       for(let field of this.serializeSseqFields) {
           if(this[field]){
               this.display_sseq[field] = this[field];
           }
       }

       for(let c of this.getClasses()) {
           for(let field of this.serializeClassFields){
               if(c[field]){
                   c.display_class[field] = c[field];
               }
           }
       }
       for(let e of this.getEdges()) {
            for(let field of this.serializeEdgeFields){
                if(e[field]){
                    e.display_edge[field] = e[field];
                }
            }
       }

       let json = this.getDisplaySseq().toJSON();
       for(let c of this.getClasses()) {
           this.display_class_to_real_class.set(c.display_class, c);
       }
       return json;
    }

    // TODO: add check that this spectral sequence is the one being displayed?
    downloadSVG(filename){
        if(filename === undefined){
            filename = `${this.name}_x-${display.xmin}-${display.xmax}_y-${display.ymin}-${display.ymax}.svg`
        }
        IO.download(filename, display.toSVG());
    }

}

Sseq.serializeSseqFields = [
    "min_page_idx", "page_list", "xRange", "yRange", "initialxRange", "initialyRange",
    "default_node", "class_scale", "offset_size", "serializeSseqFields", "serializeClassFields", "serializeEdgeFields",
    "class_tooltip_fields"
]; // classes and edges are dealt with separately.
Sseq.serializeClassFields = [
    "x", "y", "name", "extra_info", "unique_id", "idx", "x_offset", "y_offset", "page_list", "visible"
]; // "node_list" is dealt with separately
Sseq.serializeEdgeFields = [
    "color", "bend", "dash", "lineWidth", "opacity", "page_min", "page", "type", "mult",
    "source_name", "target_name"
]; // "source" and "target" are dealt with separately.

exports.Sseq = Sseq;
//window.SseqNode = Node;


