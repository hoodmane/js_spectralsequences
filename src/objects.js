"use strict";
const d3 = require("d3");
const StringifyingMap = require("./StringifyingMap.js");

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


window.circle_draw_func = function(context) {
      context.beginPath();
      context.arc(0, 0, this.getSize(), 0, 2 * Math.PI, false);
      context.closePath();
      context.fillStrokeShape(this);
}

window.square_draw_func = function(context) {
    let size = this.getSize();
    context.beginPath();
    context.rect(-size, -size, 2*size, 2*size);    
    context.closePath();
    context.fillStrokeShape(this);    
}

class Sseq {
    constructor(){
        this.total_classes = 0;
        this.classes_by_degree = new StringifyingMap();
        this.num_classes_by_degree = new StringifyingMap();
        this.classes_by_stem = new Map();
        this.classes = [];
        this.structlines = [];
        this.differentials = [];
        this.display_classes = [];        
        this.display_structlines = [];
        this.display_differentials = [];
        this.xshift = 0;
        this.yshift = 0;        
        this.offset_size = 10;
        this.page_list = [0,infinity];
        this.default_node = new SseqNode();
        //this.default_node.stroke = "#000";
        this.default_node.fill = "#000";
        this.default_node.sceneFunc = circle_draw_func;
        this.default_node.size = 6;
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
    
    calculateDrawnElements(page, xmin, xmax, ymin, ymax){
        this.display_classes = this.classes.filter(c => {c.in_range = c.inRangeQ(xmin,xmax,ymin,ymax); return c.in_range && c.drawOnPageQ(page);});
        this.display_structlines = this.structlines.filter(sl => 
             sl.source.drawOnPageQ(page) && sl.target.drawOnPageQ(page) 
             &&  ( sl.source.in_range || sl.target.in_range )
        );
        this.display_differentials = this.differentials.filter(sl => 
             ( page == 0 || sl.page == page )
             && sl.source.drawOnPageQ(page) && sl.target.drawOnPageQ(page) 
             && ( sl.source.in_range || sl.target.in_range )
        );
        for(let i = 0; i < this.display_structlines.length; i++){
            let sl = this.display_structlines[i];
            if(!sl.source.in_range){
                this.display_classes.push(sl.source);
            }
            if(!sl.target.in_range){
                this.display_classes.push(sl.target);
            }            
        }
        for(let i = 0; i < this.display_differentials.length; i++){
            let sl = this.display_differentials[i];
            if(!sl.source.in_range){
                this.display_classes.push(sl.source);
            }
            if(!sl.target.in_range){
                this.display_classes.push(sl.target);
            }            
        }        
    }
    
    
    getClasses(){
        return this.display_classes;
    }
    
    getStructlines(){
        return this.display_structlines;
    }
    
    getDifferentials(){
        return this.display_differentials;
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
        target.addStructline(struct);
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
            if(stem < -10 || stem > 1000){
                continue;
            }
            if(filtration > 100){
                continue;
            }
            let name = monomialString(var_name_list,monomial_exponents);
            class_dict.add_class(monomial_exponents, name, this.addClass(stem,filtration).setName(name));
        }
        return class_dict; 
   }
    
}


class SseqNode {
    copy(){
        return Object.assign(new SseqNode(), this);
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

        this.edges = [];
        this.structlines = [];
        this.outgoing_differentials = [];
        this.incoming_differentials = [];
        this.name = "";
        this.extra_info = "";
        this.page_list = [infinity];
        this.node_list = [sseq.default_node.copy()];
        this.visible = true;     
        this.last_page = 0;   
        this.last_page_idx = 0;   
    }
    
    getDegree(){
        return [this.x, this.y];
    }    
    
    addStructline(sl){
        this.structlines.push(sl);
        this.edges.push(sl);
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
    
    getPageIndex(page){
        if( page === undefined ) {
            return this.page_list.length - 1;
        } else if( page === this.last_page ) {
            return this.last_page_idx;
        }
        var page_idx;
        for(let i = 0; i < this.page_list.length; i++){
            if(this.page_list[i] >= page){
                page_idx = i;
                break;
            }
        }
        if(page_idx === undefined){
            page_idx = this.page_list.length - 1;
        }
        this.last_page = page;        
        this.last_page_idx = page_idx;
        return page_idx;
    }
    
    getNode(page){
        const idx = this.getPageIndex(page);
        return this.node_list[idx];
    }

    setNode(node, page){
//        if(typeof(node) === "string"){
//            node = node_dict[node];
//        }
        if(node === undefined){
            node = {};
        }
        const idx = this.getPageIndex(page);
        this.node_list[idx] = Object.assign(this.sseq.default_node.copy(), node);
        return this;
    }
    
    
    appendPage(page){
        this.page_list.push(page);
        this.node_list.push(this.sseq.default_node.copy());
        return this;
    }

    replace(node){
        this.appendPage(infinity);
//        if(typeof(node) === "string"){
//            node = node_dict[node];
//        }
        this.setNode(node);
        return this;
    }
    
    addExtraInfo(str){
        this.extra_info += "<hr>" + str;
    }
    
    
    getXOffset(){
        let total_classes = this.sseq.num_classes_by_degree.get(this.pair);
        let idx = this.idx;
        return (idx - (total_classes - 1)/2)*this.sseq.offset_size;
    }

    getYOffset(){
        let total_classes = this.sseq.num_classes_by_degree.get(this.pair);
        let idx = this.idx;
        return -(idx - (total_classes - 1)/2)*this.sseq.offset_size;
    }        
    
    toString(){
        return this.name;
    }

    addOutgoingDifferential(differential){
        if(this.getPage() < differential.page){
            //this.handleDoubledDifferential("supporting another" + differential.supportedMessage());
        }
        this.setPage(differential.page);
        this.outgoing_differentials.push(differential);
        this.edges.push(differential);
    }

    addIncomingDifferential(differential){
        if(this.getPage() < differential.page){
            //this.handleDoubledDifferential("receiving another" + differential.hitMessage());
        }
        this.setPage(differential.page);
        this.incoming_differentials.push(differential);
        this.edges.push(differential);
    }
    
    setStructlinePages(page){
        for(let i = 0; i < this.structlines.length; i++){
            let sl = this.structlines[i];
            if(sl.page > page){
                sl.page = page;
            }
        }
        return this;
    }

    drawOnPageQ(page){
        return this.page_list[this.page_list.length -1] >= page && this.visible;
    }
    
    inRangeQ(xmin,xmax,ymin,ymax){
        return xmin <= this.x && this.x <= xmax
            && ymin <= this.y && this.y <= ymax;
    }
    
}

class SseqStructline {
    constructor(source, target){
        this.edge_type = "structline";
        this.source = source;
        this.target = target;
        this.page = infinity;
        this.page_min = 0;
        this.color = "#000";
    }   
}



class Differential {
    constructor(source, target, page){
        this.edge_type = "differential";
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
    
    setSourceStructlinePages(){
        this.source.setStructlinePages(this.page);
        return this;
    }

    setTargetStructlinePages(){
        this.target.setStructlinePages(this.page);
        return this;
    }
    
    setStructlinePages(){
        this.source.setStructlinePages(this.page);
        this.target.setStructlinePages(this.page);
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

module.exports = Sseq;
window.SseqNode = SseqNode;

