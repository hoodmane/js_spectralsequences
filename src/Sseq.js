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

const StringifyingMap = require("./StringifyingMap.js");

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

/**
 * Make a string from a list of variable names and a list of exponents.
 * @param {Array|string} vars The list of variable names
 * @param {Array|int} exponents
 * @returns {string} The name of the monomial
 */
function monomialString(vars, exponents){
    let out = [];
    for(let i = 0; i < vars.length; i++){
        if(exponents[i] === 0){
            out[i] = "";
        } else if(exponents[i]===1){
            out[i] = vars[i];
        } else {
            out[i] = `${vars[i]}^{${exponents[i]}}`;
        }
    }
    let outStr = out.filter(s =>  s !== "").join(" ");
    if( outStr === "" ){
        outStr = "1";
    }
    return outStr;
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
        return c;
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
        this.display_classes = this.classes.filter(c => {c.in_range = c._inRangeQ(xmin, xmax, ymin, ymax); return c.in_range && c._drawOnPageQ(page);});
        this.display_edges = this.edges.filter(e => 
             e._drawOnPageQ(page)
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
        this.structlines.push(struct);
        this.edges.push(struct);
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
        this.differentials.push(differential);
        this.edges.push(differential);
        this.addPageToPageList(page);
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
            if(this.page_list[i] > page){
                this.page_list.splice(i, 0, page);
            }
            if(this.page_list[i] >= page){
                return this;
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
   addPolynomialClasses(var_degree_dict,var_spec_list, cond){
        let var_name_list = [];
        let stem_list = [];
        let filtration_list = [];
        let range_list = [];
        
        for(let i=0; i<var_spec_list.length; i++){
            let var_spec = var_spec_list[i];
            let var_name = var_spec[0];
            var_name_list.push(var_name);
            stem_list.push(var_degree_dict[var_name][0]);
            filtration_list.push(var_degree_dict[var_name][1]);
            range_list.push(range(...var_spec.slice(1)));
        }

        let class_dict = new monomial_basis(this, var_name_list);
            
        let l = product(...range_list);
        for(let i = 0; i < l.length; i++){
            let monomial_exponents = l[i];
            // This is the dot product here...
            let stem = dot_product(monomial_exponents, stem_list);
            let filtration = dot_product(monomial_exponents, filtration_list);
            if(this.xRange){
                if(stem < this.xRange[0] -10 || stem > this.xRange[1] + 10){
                    continue;
                }
            }
            if(cond && cond()){

            }
            if(this.yRange && this.max_differential_length){
                if(filtration > this.yRange[1] + this.max_differential_length || filtration < this.yRange[0]){
                    continue;
                }
            }
            let name = monomialString(var_name_list,monomial_exponents);
            class_dict._add_class(monomial_exponents, name, this.addClass(stem,filtration).setName(name));
        }
        return class_dict; 
   }
    
}


/**
 * Make an array based on the given start, stop, step
 * @param start
 * @param stop
 * @param step
 * @returns {Array|int}
 */
function range(start, stop, step = 1){
    if(arguments.length === 1){
        start = 1;
        stop = arguments[0];
        step = 1;
    }
    return Array(Math.ceil((stop - start + step)/step)).fill(start).map((x, y) => x + y * step);
}

function product() {
  const args = Array.prototype.slice.call(arguments); // makes array from arguments
  return args.reduce(function tl (accumulator, value) {
      const tmp = [];
      accumulator.forEach(function (a0) {
      value.forEach(function (a1) {
        tmp.push(a0.concat(a1));
      });
    });
    return tmp;
  }, [[]]);
}

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
 * Add two vectors of the same length.
 * @param {Array|int} k
 * @param {Array|int} l
 * @returns {Array|int} The sum k + l.
 */
function vectorSum(k,l){
    let out = [];
    for(let i=0; i<k.length; i++){
        out.push(k[i]+l[i]);
    }
    return out;
}


class monomial_basis {
    /**
     * Construct a monomial_basis.
     * @param sseq Parent spectral sequence.
     * @param variable_list The list of variable names in the order that they are referred to by vectors.
     * @private
     */
    constructor(sseq, variable_list){
        this.sseq = sseq;
        this._tuples_to_classes = new StringifyingMap();
        this._strings_to_classes = new Map();
        this._tuples_to_strings = new StringifyingMap();
        this._strings_to_tuples = new Map();
        this.length = 0;
        this.variable_list = variable_list;
    }

    /**
     * Add a class to the basis.
     * @param tuple The vector of powers of each variable in the monomial
     * @param name The name of the class.
     * @param the_class The class
     * @package
     */
    _add_class(tuple, name, the_class){
        this.length++;
        this._tuples_to_classes.set(tuple, the_class);
        this._strings_to_classes.set(name, the_class);
        this._tuples_to_strings.set(tuple, name);
        this._strings_to_tuples.set(name, tuple);
    }

    /**
     * Convert an object of the form {..., variable_name : power, ...} to a vector.
     * @param map
     * @returns {*}
     * @private
     */
    _monomial_map_to_vect(map){
        // We just map over the variable_list as a list of property names. Check if property is present, else return zero.
        return this.variable_list.map(v => {
            if(map.hasOwnProperty(v)){
                return map[v];
            } else {
                return 0;
            }
        });
    }

    /**
     * If the argument is already an array, do nothing. If it's a map, apply _monomial_map_to_vect to it. If it's a
     * string look it up in _strings_to_classes.
     * @param vect
     * @returns {Array|int} The offset vector
     * @private
     */
    _ensure_vect(vect){
        if(! Array.isArray(vect)){
            if(typeof(vect) === "string"){
                if(!this._strings_to_classes.has(vect)){
                    throw "Invalid variable name";
                } else {
                    vect = this._strings_to_tuples.get(vect);
                }
            } else {
                vect = this._monomial_map_to_vect(vect);
            }
        }
        return vect;
    }

    /*
     * Add structlines to every monomial corresponding to the given offset vector.
     * For instance, if there is a generator called
     */
    addStructline(offset_vector, callback){
        offset_vector = this._ensure_vect(offset_vector);
        for(let k of this){
            let c1 = k[1];
            let c2 = this.get(vectorSum(k[0],offset_vector));
            if(c2 !== undefined){
                let sline = this.sseq.addStructline(c1, c2);
                if(callback){
                    callback(sline);
                }
            }
        }
        return this;
    }


    /**
     * Add differentials to monomials.
     * @param page The page of the differential
     * @param target_vect The differential is effectively of the form d(x) = r*x where r is specified by target_vect.
     *        This can either be of the form `[first_var_power, ..., last_var_power]` or of the form `{ "var_name" : var_power }`
     * @param cond A conditional used to determine whether to place a differential coming off of this particular source.
     * @param callback A callback called on each resulting differential.
     * @returns {monomial_basis} Chainable
     */
    addDifferential(page, target_vect, cond, callback){
        target_vect = this._ensure_vect(target_vect);
        for(let key_value of this){
            let k = key_value[0];   
            let c1 = key_value[1];  
            let c2 = this.get(vectorSum(k, target_vect));
            if(cond(k)){
                if(c2){
                    let d = this.sseq.addDifferential(c1, c2, page);
                    if(callback !== undefined){
                        callback(d,k);
                    }
                } else {
                    if(c1.getPage() > page){
                        c1.setPage(page);
                    }
                }
            }
        }
        return this;
    }

    // These are immutable map methods.

    has(key){
        if(this._strings_to_classes.has(key))
            return true;
        key = this._ensure_vect(key);
        return this._tuples_to_classes.has(key);
    }
    
    get(key, default_value){
        if(this._strings_to_classes.has(key)) {
            return this._strings_to_classes.get(key);
        }
        key = this._ensure_vect(key);
        if(this._tuples_to_classes.has(key)){
            return this._tuples_to_classes.get(key);
        }
        return default_value;
    }
}

    
monomial_basis.prototype[Symbol.iterator] = function*(){
    for(let k of this._tuples_to_classes){
        yield k;
    }
};

exports.Sseq = Sseq;
window.SseqNode = Node;

