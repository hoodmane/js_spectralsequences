"use strict";
let infinity = 10000;

Map.prototype.getOrElse = function(key, value) {
  return this.has(key) ? this.get(key) : value;
}

function addToDictionaryOfLists(dictionary, key,value){
    if(!dictionary.has(key)){
        dictionary.set(key, []);
    }
    dictionary.get(key).push(value);
}

function monomialString(vars, exponents){
    let out = new Array();
    for(let i = 0; i < vars.length; i++){
        if(exponents[i] == 0){
            out[i] = "";
        } else if(exponents[i]==1){
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
    constructor(){
        this.classes = [];
        this.total_classes = 0;
        this.classes_by_degree = new StringifyingMap();
        this.num_classes_by_degree = new StringifyingMap();
        this.classes_by_stem = new Map();
        this.classes = [];
        this.structlines = [];
        this.differentials = [];
        this.xshift = 0;
        this.yshift = 0;        
        this.offset_size = 10;
        this.page_list = [0,infinity];
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
    
    addClass(x, y){
        x = x + this.xshift;
        y = y + this.yshift;
        let p = [x,y];
        let idx  = this.num_classes_by_degree.getOrElse(p, 0)
        this.num_classes_by_degree.set(p, idx + 1);
        let c = new SseqClass(this, p, idx);
        this.classes.push(c);
        addToDictionaryOfLists(this.classes_by_degree, p, c);
        addToDictionaryOfLists(this.classes_by_stem, x , c);
        this.total_classes ++;
        return c;
    }
    
    getClasses(page, xmin, xmax, ymin, ymax){
        return this.classes.filter(c => c.drawOnPageQ(page,xmin,xmax,ymin,ymax));
    }
    
    getStructlines(page,xmin,xmax,ymin,ymax){
        return this.structlines.filter(sl => 
             sl.source.drawOnPageQ(page,xmin,xmax,ymin,ymax)
          && sl.target.drawOnPageQ(page,xmin,xmax,ymin,ymax)
        )
    }
    
    getDifferentials(page,xmin,xmax,ymin,ymax){
        return this.differentials.filter(d => 
             d.source.drawOnPageQ(page,xmin,xmax,ymin,ymax)
          && d.target.drawOnPageQ(page,xmin,xmax,ymin,ymax)
        )
    }
    
    addStructline(source, target){
//        if(source == undefined){
//            source = this.last_classes[0]
//            target = this.last_classes[1]
//        } else if(target == undefined){
//            target = this.last_classes[0]
//        }
        let struct = new SseqStructline(source,target);
        this.structlines.push(struct);
        source.addStructline(struct);
        return struct;
    }
    
   addDifferential(sourceClass, targetClass, page){
        if(page <= 0){
            console.log("No page <= 0 differentials allowed.");
            return
        }
        let differential = new Differential(sourceClass, targetClass, page);
        this.differentials.push(differential);
        this.addPageToPageList(page);
        return differential;
    }
    
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
    
   addPolynomialClasses(var_degree_dict,var_spec_list){
        let var_name_list = [];
        let stem_list = [];
        let filtration_list = [];
        let range_list = [];
        let class_dict = new monomial_basis(this);
        
        for(let i=0; i<var_spec_list.length; i++){
            let var_spec = var_spec_list[i];
            let var_name = var_spec[0];
            var_name_list.push(var_name);
            stem_list.push(var_degree_dict[var_name][0]);
            filtration_list.push(var_degree_dict[var_name][1]);
            range_list.push(range(...var_spec.slice(1)));
        }
            
        let l = product(...range_list);
        for(let i=0; i<l.length; i++){
            let monomial_exponents = l[i];
            // This is the dot product here...
            let stem = dot_product(monomial_exponents, stem_list);
            let filtration = dot_product(monomial_exponents, filtration_list);
            let name = monomialString(var_name_list,monomial_exponents);
            class_dict.add_class(monomial_exponents, name, this.addClass(stem,filtration).setName(name));
        }
        return class_dict    
   }
    
}


class SseqNode {
    constructor(){
        this.strokeColor = "#000";
        this.fillColor = "#000";
        this.shape = d3.symbolCircle;
        this.size = 100;
    }
}

class SseqClass {
    constructor(sseq){
        this.sseq = sseq;
        if(Array.isArray(arguments[1])){
            this.pair = arguments[1];
            this.x    = this.pair[0];
            this.y    = this.pair[1];
            this.idx  = arguments[2];
        } else {
            this.x   = arguments[1];
            this.y   = arguments[2];
            this.idx = arguments[3];
        }

        this.structlines = [];
        this.outgoing_differentials = [];
        this.incoming_differentials = [];
        this.name = "";
        this.extra_info = "";
        this.page_list = [infinity];
        this.node_list = [new SseqNode()] //[this.sseq.default_node.copy()];
        this.visible = true;        
    }
    
    getDegree(){
        return [this.x, this.y];
    }    
    
    addStructline(){
        return;
    }
    
    getStructlines(){
        return this.structlines;
    }    
    
    getPage(){
        return this.page_list[this.page_list.length - 1];
    }

    setPage(page){
        this.page_list[this.page_list.length - 1] = page;
        return this;
    }    
    
    setName(name){
        this.name = name;
        return this;
    }
    
    addExtraInfo(str){
        this.extra_info += str + "\n";
    }
    
    
    getXOffset(){
        let total_classes = this.sseq.num_classes_by_degree.get(this.pair);
        let idx = this.idx;
        return (idx - (total_classes - 1)/2)*sseq.offset_size;
    }

    getYOffset(){
        let total_classes = this.sseq.num_classes_by_degree.get(this.pair);
        let idx = this.idx;
        return -(idx - (total_classes - 1)/2)*sseq.offset_size;
    }        
    
    toString(){
        return this.name;
    }

    addOutgoingDifferential(differential){
        if(this.getPage() < differential.page){
            this.handleDoubledDifferential("supporting another" + differential.supportedMessage());
        }
        this.setPage(differential.page);
        this.outgoing_differentials.push(differential);
    }

    addIncomingDifferential(differential){
        if(this.getPage() < differential.page){
            this.handleDoubledDifferential("receiving another" + differential.hitMessage());
        }
        this.setPage(differential.page);
        this.incoming_differentials.push(differential);
    }

    drawOnPageQ(page,xmin,xmax,ymin,ymax){
        return this.page_list[this.page_list.length -1] >= page && this.visible
                && xmin <= this.x && this.x <= xmax
                && ymin <= this.y && this.y <= ymax;
    }
    
    getSize(){
        console.log(this.node_list[0].size);
        return this.node_list[0].size;
    }
    
    getSymbol(){
        //console.log(this.node_list[0].symbol);
        return this.node_list[0].shape;
    }
    
    getStrokeColor(){
        console.log(this.node_list[0].strokeColor);
        return this.node_list[0].strokeColor;
    }
    
    getFillColor(){
        return this.node_list[0].fillColor;
    }    
}

class SseqStructline {
    constructor(source, target){
        this.source = source;
        this.target = target;
        this.page = infinity;
        this.page_min = 0;
        this.color = "#000";
    }   
}



class Differential {
    constructor(source, target, page){
        this.source = source;
        this.target = target;
        this.page = page;
        this.color = "#00F";
        source.addOutgoingDifferential(this);
        target.addIncomingDifferential(this);
        this.source_name = this.source.toString();
        this.target_name = this.target.toString();
    }

    setKernel(nodeStyle){
        this.source.replace(nodeStyle);
        return this;
    }

    setCokernel(nodeStyle){
        this.target.replace(nodeStyle);
        return this;
    }

    replaceSource(nodeStyle){
        this.setKernel(nodeStyle);
        return this;
    }

    replaceTarget(nodeStyle){
        this.setCokernel(nodeStyle);
        return this;
    }
        
    setSourceName(){
        this.source_name = name;
        return this;
    }
    
    setTargetName(){
        this.target_name = name;
        return this;
    }

//    hitMessage(){
//        return "hit on page %d by class %r" % (this.page, this.source);
//    }
//
//    supportedMessage(){
//        return "supported a differential on page %d hitting class %r" % (this.page, this.target);
//    }

    addInfoToSourceAndTarget(){
        this.source.addExtraInfo(this);
        this.target.addExtraInfo(this);
        return this;
    }

    toString(){
        return `\\(d_{${this.page}}(${this.source_name}) = ${this.target_name}\\)`;
    }
}


function range(start, stop, step = 1){
    if(arguments.length == 1){
        start = 1;
        stop = arguments[0];
        step = 1;
    }
    return Array(Math.ceil((stop - start + step)/step)).fill(start).map((x, y) => x + y * step);
}

function product() {
  var args = Array.prototype.slice.call(arguments); // makes array from arguments
  return args.reduce(function tl (accumulator, value) {
    var tmp = [];
    accumulator.forEach(function (a0) {
      value.forEach(function (a1) {
        tmp.push(a0.concat(a1));
      });
    });
    return tmp;
  }, [[]]);
}

function dot_product(k,l){
    let s = 0;
    for(let i=0; i<k.length; i++){
        s += k[i] * l[i];
    }
    return s;
}

function vectorSum(k,l){
    let out = [];
    for(let i=0; i<k.length; i++){
        out.push(k[i]+l[i]);
    }
    return out;
}


class monomial_basis {
    constructor(sseq){
        this.sseq = sseq;
        this._tuples_to_classes = new StringifyingMap();
        this._strings_to_classes = new Map();
        this._tuples_to_strings = new StringifyingMap();
        this.length = 0;
    }
        
    add_class(tuple, name, the_class){
        this.length++;
        this._tuples_to_classes.set(tuple, the_class);
        this._strings_to_classes.set(name, the_class);
        this._tuples_to_strings.set(tuple, name);
    }
    
    addStructline(){
        var kwargs, vect;
        if(typeof(arguments[-1]) === "object"){
            kwargs = arguments[-1];
            vect =  Array.prototype.slice.call(arguments,0, -1);
        } else {
            vect = Array.prototype.slice.call(arguments);
            kwargs = {};
        }
        for(let k of this){
            let c1 = k[1];
            let c2 = this.get(vectorSum(k[0],vect));
            if(c2 !== undefined){
                let sline = this.sseq.addStructline(c1, c2);
                if("callback" in kwargs){
                    kwargs["callback"](sline);
                }
            }
        }
    }        
                
    addDifferential(page, target_vect, cond, callback){
        for(let key_value of this){
            let k = key_value[0];   
            let c1 = key_value[1];  
            let c2 = this.get(vectorSum(k, target_vect));
            if(cond(k)){
                console.log(k[1]);
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
    }
    
    has(item){
        return this._tuples_to_classes.has(item) || this._strings_to_classes.has(item);
    }
    
    get(key, default_value){
        if(this._tuples_to_classes.has(key)){
            return this._tuples_to_classes.get(key);
        }
        if(this._strings_to_classes.has(key)){
            return this._strings_to_classes.get(key);
        }
        return default_value;
    }
}

    
monomial_basis.prototype[Symbol.iterator] = function*(){
    for(let k of this._tuples_to_classes){
        yield k;
    }
}
