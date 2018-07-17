"use strict";

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

exports.monomialString = monomial_basisjs.monomialString;
exports.range = monomial_basisjs.range;
exports.StringifyingMap = monomial_basisjs.StringifyingMap;



let StringifyingMap = require("./StringifyingMap.js");

/**
 * Map method get with default.
 * @param key
 * @param value
 * @returns {*}
 */
Map.prototype.getOrElse = function(key, value) {
  return this.has(key) ? this.get(key) : value;
};


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
        this.total_classes = 0;
        this.classes_by_degree = new StringifyingMap();
        this.num_classes_by_degree = new StringifyingMap();
        this.classes_by_stem = new Map();
        this.classes = [];
        this.structlines = [];
        this.differentials = [];
        this.edges = [];
        this.display_classes = [];        
        this.display_structlines = [];
        this.display_differentials = [];
        this.xshift = 0;
        this.yshift = 0;        
        this.offset_size = 10;
        this.min_page_idx = 0;
        this.page_list = [0,infinity];
        this.default_node = new Node();
        this.default_node.fill = true;
        this.default_node.stroke = true;
        this.default_node.shape = Shapes.circle;
        this.default_node.size = 6;
        this.projection = function(ssclass){
            return [ssclass.degree.x, ssclass.degree.y];
        }
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


    /**
     * Add a class in position (x,y) and return the class. Uses sseq.default_node for display.
     *
     * @param x The x position
     * @param y
     * @returns {SseqClass} The new class
     */
    addClass(x, y){
        let degree;
        if(y === undefined){
            degree = x;
        } else {
            x = x + this.xshift;
            y = y + this.yshift;
            degree = {x: x, y: y};
        }
        let c = new SseqClass(this, degree);
        let idx  = this.num_classes_by_degree.getOrElse(c.projection, 0);
        this.num_classes_by_degree.set(c.projection, idx + 1);
        c.idx = idx;
        this.classes.push(c);
        addToDictionaryOfLists(this.classes_by_degree, degree, c);
        addToDictionaryOfLists(this.classes_by_stem, c.x , c);
        this.total_classes ++;

        if(this.on_class_added){
            this.on_class_added(c);
        }
        return c;
    }



    /**
     * Gets recalculated by _calculateDrawnElements.
     * @returns {Array|SseqClass} The list of classes currently being displayed.
     */
    getClassesToDisplay(){
        return this.display_classes;
    }


    /**
     * Gets recalculated by _calculateDrawnElements.
     * @returns {Array|Edge} The list of edges currently being displayed.
     */
    getEdgesToDisplay(){
        return this.display_edges;
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
        if(!source || !target){
            return null;
        }
        let struct = new Structline(source,target);
        source._addStructline(this);
        target._addStructline(this);
        this.structlines.push(struct);
        this.edges.push(struct);
        if(this.on_edge_added){
            this.on_edge_added(struct);
        }
        if(this.on_structline_added){
            this.on_structline_added(struct);
        }
        return struct;
    }

    /**
     * Adds a differential.
     * @param source
     * @param target
     * @param page
     * @returns {Differential}
     */
   addDifferential(source, target, page){
        if(page <= 0){
            console.log("No page <= 0 differentials allowed.");
            return null;
        }
        if(!source || !target){
            return null;
        }        
        let differential = new Differential(source, target, page);
        source._addOutgoingDifferential(this);
        target._addIncomingDifferential(this);
        this.differentials.push(differential);
        this.edges.push(differential);
        this.addPageToPageList(page);
        if(this.on_edge_added){
            this.on_edge_added(differential);
        }
        if(this.on_differential_added){
            this.on_differential_added(differential);
        }
        return differential;
    }

    /**
     * Adds an extension.
     * @param source
     * @param target
     * @returns {Extension}
     */
   addExtension(source, target){
        if(!source || !target){
            return null;
        }
        let ext = new Extension(source, target);
        this.edges.push(ext);
        if(this.on_edge_added){
            this.on_edge_added(ext);
        }
        if(this.on_extension_added){
            this.on_extension_added(ext);
        }
        return ext;
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

    static _validateVarSpec(var_spec, var_degree_dict, index){
        let err_string = "Invalid variable specification '" + var_spec + "' at position " + index + ".";
        if(!Array.isArray(var_spec)){
            throw err_string + " Variable specification must be a list.";
        }

        if(var_spec.length < 2 || var_spec.length > 4 ){
            throw err_string + " Variable specification should be of length at least 2 and at most 4.";
        }


        if(typeof var_spec[0] !== 'string'){
            throw err_string + " First entry of variable specification should be a string, the name of a variable.";
        }

        if(!var_degree_dict.hasOwnProperty(var_spec[0])){
            throw err_string + " Variable '" + var_spec[0] + "' does not have an entry in the degree dictionary";
        }

        for(let i = 1; i < var_spec.length; i++){
            if(!Number.isInteger(var_spec[i])){
                throw err_string + " Expecting an integer in position '" + i + "'."
            }
        }


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
}



exports.Sseq = Sseq;
window.SseqNode = Node;

