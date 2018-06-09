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
    out = new Array();
    for(let i = 0; i < vars.length; i++){
        if(exponents[i] == 0){
            out[i] = "";
        } else if(exponents[i]==1){
            out[i] = vars[i];
        } else {
            out[i] = vars[i] + "^" + exponents[i];
        }
    }
    outStr = out.filter(s =>  s !== "").join(" ");
    if( outStr === "" ){
        outStr = "1";
    }
    return outStr;
}

class Pair {
    constructor(x,y){
        this.x = x;
        this.y = y;
    }
    
    catToString(){
        return this.x + "::" + this.y;
    }
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
        let p = new Pair(x,y);
//        console.log(x + "," + y);
        let idx  = this.num_classes_by_degree.getOrElse(p, 0)
        this.num_classes_by_degree.set(p, idx + 1);
        let c = new SseqClass(this, p, idx);
        this.classes.push(c);
        addToDictionaryOfLists(this.classes_by_degree, p, c);
        addToDictionaryOfLists(this.classes_by_stem, x , c);
        this.total_classes ++;
        return c;
    }
    
    addStructline(source, target){
//        if(source == undefined){
//            source = this.last_classes[0]
//            target = this.last_classes[1]
//        } else if(target == undefined){
//            target = this.last_classes[0]
//        }
        let struct = new SseqStructline(source,target)
        this.structlines.push(struct)
        source.addStructline(struct)
        return struct
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
    
}


class SseqClass {
    constructor(sseq, p, idx){
        this.sseq = sseq;
        this.pair = p;
        this.x = p.x;
        this.y = p.y;
        this.idx = idx;
        this.structlines = [];
        this.outgoing_differentials = [];
        this.incoming_differentials = [];
        this.name = "";
        this.extra_info = "";
        this.color = "#000";
        this.page_list = [infinity];
        this.node_list = [] //[this.sseq.default_node.copy()];
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
        return this.page_list[-1];
    }

    setPage(page){
        this.page_list[-1] = page;
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

    drawOnPageQ(page){
        return this.page_list[-1] >= page && this.visible;
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
        return '\\(' + `d_{${this.page}}(${this.source_name}) = ${this.target_name}` + '\\)';
    }
}
