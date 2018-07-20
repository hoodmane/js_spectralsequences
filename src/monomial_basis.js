"use strict";

let StringifyingMap = require("./StringifyingMap.js");
exports.StringifyingMap = StringifyingMap;


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
exports.range = range;

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

function convert_exponent_map_to_vector(var_list, exponent_map){
    return var_list.map(v => {
        if(exponent_map.hasOwnProperty(v)){
            return exponent_map[v];
        } else {
            return 0;
        }
    })
}

/**
 * Make a string from a list of variable names and a list of exponents.
 * @param {Array|string} vars The list of variable names
 * @param {Array|int} exponents
 * @param {string} module_generator
 * @returns {string} The name of the monomial
 */
function monomialString(vars, exponents, module_generator = ""){
    let out = [];
    out[0] = module_generator;
    // If exponents is a map var_names ==> power, convert it to a list.
    if(!Array.isArray(exponents)){
        exponents = convert_exponent_map_to_vector(vars, exponents);
    }
    for(let i = 0; i < vars.length; i++){
        let exponent = exponents[i];
        if(exponent === 0){
            out[i+1] = "";
        } else if(exponent === 1){
            out[i+1] = vars[i];
        } else {
            out[i+1] = `${vars[i]}^{${exponent}}`;
        }
    }
    let outStr = out.filter(s =>  s !== "").join(" ");
    if( outStr === "" ){
        outStr = "1";
    }
    return outStr;
}
exports.monomialString = monomialString;



/**
 * Add two vectors of the same length.
 * @param {Array|int} k
 * @returns {Array|int} The sum k + l.
 */
function vectorSum(k){
    let out = [];
    for(let i = 0; i < k.length; i++){
        let entry = 0;
        for(let l of arguments){
            entry += l[i];
        }
        out.push(entry);
    }
    return out;
}

function vectorScale(c, v){
    return v.map((x) => c*x);
}

function vectorLinearCombination(vector_list, coefficient_list){
    let scaled_list = [];
    for(let i = 0; i < vector_list.length; i++){
        scaled_list.push(vectorScale(coefficient_list[i], vector_list[i]));
    }
    return vectorSum(...scaled_list);
}


class monomial_ring {
    constructor(var_name_list, var_degree_dict, module_generators_dict){
        this._var_degree_dict = var_degree_dict;
        this._var_name_list = var_name_list;
        this._var_degree_list = this._var_name_list.map( v => this._var_degree_dict[v] );
        this._module_generators_dict = module_generators_dict;
    }

    _exponent_map_to_vector(var_powers_dict){
        return convert_exponent_map_to_vector(this._var_name_list, var_powers_dict);
    }

    getElement(var_powers_dict, module_generator = "") {
        let exponent_vector;
        if(Array.isArray(var_powers_dict)){
            exponent_vector = var_powers_dict;
        } else if(typeof var_powers_dict === "string") {
            let temp_map = new Object();
            temp_map[var_powers_dict] = 1;
            exponent_vector = convert_exponent_map_to_vector(this._var_name_list, temp_map);
        } else {
            let variables = Object.keys(var_powers_dict);
            for (let v of variables) {
                if (!this._var_degree_dict.hasOwnProperty(v)) {
                    throw new Error(`Invalid variable ${v}`);
                }
            }
            exponent_vector = convert_exponent_map_to_vector(this._var_name_list, var_powers_dict);
        }
        return this.getElementFromVector(exponent_vector, module_generator);
    }


    getElementFromVector(exponent_vector, module_generator = ""){
        if(module_generator !== "" && !this._module_generators_dict.hasOwnProperty(module_generator)){
            throw new Error(`Invalid module generator ${module_generator}`);
        }
        if(exponent_vector.length != this._var_name_list.length){
            throw new Error(`Exponent vector ${exponent_vector} should have length ${this._var_name_list.length}, has length ${exponent_vector.length}`);
        }
        return new monomial_element(this, exponent_vector, module_generator);
    }



}

class monomial_element {
    constructor(ring, exponent_vector, module_generator = ""){
        this._ring = ring;
        this.exponent_vector = exponent_vector;
        this._module_generator = module_generator;
        for(let i = 0; i < exponent_vector.length; i++){
            this[i] = exponent_vector[i];
        }
    }

    _initializeDegree(){
        let stem_degree = 0;
        let filtration = 0;
        if(this._module_generator !== ""){
            stem_degree += this._ring._module_generators_dict[this._module_generator][0];
            filtration += this._ring._module_generators_dict[this._module_generator][1];
        }

        for(let i = 0; i < this.exponent_vector.length; i++){
            stem_degree += this._ring._var_degree_list[i][0] * this.exponent_vector[i];
            filtration  += this._ring._var_degree_list[i][1] * this.exponent_vector[i];
        }

        this._degree = [stem_degree, filtration];
    }

    getName(){
        if(!this._name){
            this._name = monomialString(this._ring._var_name_list, this.exponent_vector, this._module_generator);
        }
        return this._name;
    }

    getDegree(){
        if(!this._degree){
            this._initializeDegree();
        }
        return this._degree;
    }

    multiply(elt){
        if(this._ring !== elt._ring){
            throw new Error("Cannot multiply elements from different rings.")
        }
        if(this._module_generator !== "" && elt._module_generator !== ""){
            throw new Error("Cannot multiply two module elements, only a module element by a ring element.")
        }
        let module_generator = this._module_generator || elt._module_generator;
        let exponent_vector = vectorSum(this.exponent_vector, elt.exponent_vector);
        return new monomial_element(this._ring, exponent_vector, module_generator)
    }

    getStringifyingMapKey(){
        return this._module_generator + this.exponent_vector.toString();
    }

    toString(){
        return this.getName();
    }

}


class monomial_basis {
    /**
     * Construct a monomial_basis.
     * @param sseq Parent spectral sequence.
     * @param variable_list The list of variable names in the order that they are referred to by vectors.
     * @private
     */
    constructor(sseq, var_degree_dict, var_spec_list, module_generators_dict){
        this.sseq = sseq;
        this._tuples_to_classes = new StringifyingMap();
        this._strings_to_classes = new Map();
        this._tuples_to_strings = new StringifyingMap();
        this._strings_to_tuples = new Map();
        this.length = 0;
        this.var_degree_dict = var_degree_dict;
        this.var_spec_list = var_spec_list;
        this.module_generators_dict = module_generators_dict;
        this.module_generators = Object.keys(module_generators_dict);

        let var_name_list = [];
        let stem_list = [];
        let filtration_list = [];
        let range_list = [];

        for(let i = 0; i < var_spec_list.length; i++){
            let var_spec = var_spec_list[i];
            let var_name = var_spec[0];
            monomial_basis._validateVarSpec(var_spec, var_degree_dict, i);
            var_name_list.push(var_name);
            stem_list.push(var_degree_dict[var_name][0]);
            filtration_list.push(var_degree_dict[var_name][1]);
            range_list.push(range(...var_spec.slice(1)));
        }

        this._stem_list = stem_list;
        this._filtration_list = filtration_list;
        this._range_list = range_list;


        this._ring = new monomial_ring(var_name_list, var_degree_dict, module_generators_dict);

        let l = product(this.module_generators,...range_list);
        for(let i = 0; i < l.length; i++){
            let exponent_vector = l[i];
            let module_generator = exponent_vector.shift();
            let elt = this._ring.getElementFromVector(exponent_vector, module_generator);
            let degree = elt.getDegree();
            let stem = degree[0];
            let filtration = degree[1];
            let name = elt.getName();
            if(sseq.xRange){
                if(sseq.xRange && (stem < sseq.xRange[0] -10 || stem > sseq.xRange[1] + 10)){
                    continue;
                }
            }
            // if(cond && cond()){
            //
            // }
            if(sseq.yRange && sseq.max_differential_length){
                if(filtration > sseq.yRange[1] + sseq.max_differential_length || filtration < sseq.yRange[0]){
                    continue;
                }
            }
            this._add_class(elt, sseq.addClass(stem,filtration).setName(name));
        }
    }


    /**
     * Add a class to the basis.
     * @param tuple The vector of powers of each variable in the monomial
     * @param name The name of the class.
     * @param the_class The class
     * @private
     */
    _add_class(elt, the_class){
        this.length++;
        let tuple = elt.exponent_vector;
        let name = elt.getName();
        this._tuples_to_classes.set(elt, the_class);
        this._strings_to_classes.set(name, the_class);
        this._tuples_to_strings.set(elt, name);
        this._strings_to_tuples.set(name, elt);
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
                    throw new Error("Invalid variable name");
                } else {
                    vect = this._strings_to_tuples.get(vect);
                }
            } else {
                vect = this._ring._exponent_map_to_vector(vect);
            }
        }
        return vect;
    }

    /*
     * Add structlines to every monomial corresponding to the given offset vector.
     * For instance, if there is a generator called
     */
    addStructline(offset_vector, callback){
        offset_vector = this._ring.getElement(offset_vector);
        for(let k of this){
            let c1 = k[1];
            let c2 = this.get(k[0].multiply(offset_vector));
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
        target_vect = this._ring.getElement(target_vect);
        for(let key_value of this){
            let k = key_value[0];
            let c1 = key_value[1];
            let c2 = this.get(key_value[0].multiply(target_vect));
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
        if(this._tuples_to_classes.has(key)){
            return this._tuples_to_classes.get(key);
        }
        try {
            key = this._ring.getElement(key);
            if (this._tuples_to_classes.has(key)) {
                return this._tuples_to_classes.get(key);
            }
        } catch(error) {}
        return default_value;
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
}


monomial_basis.prototype[Symbol.iterator] = function*(){
    for(let k of this._tuples_to_classes){
        yield k;
    }
};

exports.monomial_basis = monomial_basis;

class slice_basis {
    constructor(sseq, var_degree_dict, var_spec_list, make_slice){
        this.sseq = sseq;
        this._tuples_to_slices = new StringifyingMap();
        this.length = 0;

        this.var_degree_dict = var_degree_dict;
        this.var_spec_list = var_spec_list;

        let var_name_list = [];
        let stem_list = [];
        let range_list = [];

        for(let i = 0; i < var_spec_list.length; i++){
            let var_spec = var_spec_list[i];
            let var_name = var_spec[0];
            monomial_basis._validateVarSpec(var_spec, var_degree_dict, i);
            var_name_list.push(var_name);
            stem_list.push(var_degree_dict[var_name]);
            range_list.push(range(...var_spec.slice(1)));
        }

        this._stem_list = stem_list;
        this._range_list = range_list;

        let var_degree_dict_with_zeroes = Object.assign({}, ...Object.keys(var_degree_dict).map(k => ({[k]: [var_degree_dict[k],0]})));

        this._ring = new monomial_ring(var_name_list, var_degree_dict_with_zeroes);

        for(let exponent_vector of product(...range_list)){
            let elt = this._ring.getElementFromVector(exponent_vector);
            let degree = elt.getDegree()[0];
            let name = elt.getName();
            this._add_slice(elt, make_slice);
        }
    }

    /**
     * Add a class to the basis.
     * @param tuple The vector of powers of each variable in the monomial
     * @param name The name of the class.
     * @param the_class The class
     * @private
     */
    _add_slice(elt, make_slice){
        this.length++;
        let tuple = elt.exponent_vector;
        let name = elt.getName();
        this._tuples_to_slices.set(elt, make_slice(this.sseq, elt));
    }

    /*
 * Add structlines to every monomial corresponding to the given offset vector.
 * For instance, if there is a generator called
 */
    addStructline(slice_offset_vector, stem_offset, callback){
        slice_offset_vector = this._ring.getElement(slice_offset_vector);
        for(let k of this){
            let s1 = k[1];
            let s2 = this.get(k[0].multiply(slice_offset_vector));
            if(s2 !== undefined){
                for(let stem of Object.keys(s1)){
                    if(s2.hasOwnProperty(stem + stem_offset)){
                        let sline = this.sseq.addStructline(s1.get(stem), s2.get(stem+stem_offset));
                        if(callback){
                            callback(sline);
                        }
                    }
                }
            }
        }
        return this;
    }

    addDifferential(page, slice_offset_vector, cond, callback){
        let target_vect = this._ring.getElement(slice_offset_vector);
        for(let key_value of this){
            let k = key_value[0];
            let s1 = key_value[1];
            let s2 = this.get(k.multiply(target_vect));
            for(let key_value of s1) {
                let stem = key_value[0];
                if (cond(k, stem, s1.get(stem).y)) {
                    let c1 = s1.get(stem);
                    if (s2 && s2.has(stem - 1)) {
                        let d = this.sseq.addDifferential(c1, s2.get(stem - 1), page);
                        if (callback !== undefined) {
                            callback(d, k);
                        }
                    } else {
                        if (!s2 && c1.getPage() > page) {
                            c1.setPage(page);
                        }
                    }
                }
            }
        }
        return this;
    }

    addDifferentialLeibniz(page, source_slice, source_stem, target_slice,  offset_vectors, offset_vector_ranges, callback){
        for(let exponent_vector of product(...offset_vector_ranges.map( r => range(...r)))){
            let offset_slice = vectorLinearCombination(offset_vectors, exponent_vector);
            let stem = offset_slice.pop() + source_stem;
            let cur_source_slice = vectorSum(source_slice, offset_slice);
            if(!this.has(cur_source_slice) || !this.get(cur_source_slice).has(stem)){
                continue;
            }
            let sourceClass = this.get(cur_source_slice).get(stem);
            let cur_target_slice = vectorSum(target_slice, offset_slice);
            if(this.has(cur_target_slice) && this.get(cur_target_slice).has(stem - 1)){
                let targetClass = this.get(cur_target_slice).get(stem-1);
                let d = this.sseq.addDifferential(sourceClass, targetClass, page);
                if (callback !== undefined) {
                    callback(d);
                }
            } else {
                if(!this.has(cur_target_slice) && sourceClass.getPage() > page){
                    sourceClass.setPage(page);
                }
            }
        }
    }

    has(key){
        key = this._ensure_vect(key);
        return this._tuples_to_slices.has(key);
    }

    get(key, default_value){
        if(this._tuples_to_slices.has(key)){
            return this._tuples_to_slices.get(key);
        }
        try {
            key = this._ring.getElement(key);
            if (this._tuples_to_slices.has(key)) {
                return this._tuples_to_slices.get(key);
            }
        } catch(error) {}
        return default_value;
    }

}



slice_basis.prototype[Symbol.iterator] = function*(){
    for(let k of this._tuples_to_slices){
        yield k;
    }
};

slice_basis.prototype._ensure_vect = monomial_basis.prototype._ensure_vect;

exports.slice_basis = slice_basis;

