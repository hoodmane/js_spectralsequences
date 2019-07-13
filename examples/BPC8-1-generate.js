"use strict";

let t0 = performance.now();
let tp5 = t0;
function getTime(){
    let t = tp5;
    tp5 = performance.now();
    return (tp5 - t) / 1000;
}



function subnomialString(vars, exponents, module_generator = ""){
    let out = [];
    out[0] = module_generator;
    for(let i = 0; i < vars.length; i++){
        let exponent = exponents[i];
        if(exponent === 0){
            out[i+1] = "";
        } else if(exponent === 1){
            out[i+1] = `${vars[i][0]}_{${vars[i][1]}}`;
        } else {
            out[i+1] = `${vars[i][0]}_{${exponent}${vars[i][1]}}`;
        }
    }
    let outStr = out.filter(s =>  s !== "").join(" ");
    if( outStr === "" ){
        outStr = "1";
    }
    return outStr;
}

class sliceMonomial {
    constructor(slice){
        slice = slice || {};
        this.da0 = slice.da0 || 0;
        this.da1 = slice.da1 || 0;
        this.d1 = slice.d1 || 0;
        this.s1 = slice.s1 || 0;
        this.sa0 = slice.sa0 || 0;
        this.sa1 = slice.sa1 || 0;
        this.as2 = slice.as2 || 0;
        this.al = slice.al || 0;
        this.as = slice.as || 0;
        this.us2 = (this.s1 + this.sa1 + this.sa0) - this.as2;
        this.ul = this.da1 + this.da0 + this.d1 - this.al;
        this.us = this.da1 + this.da0 + this.d1 - this.as;
        this.stem = 4*(this.da1 + this.da0 + this.d1) + 2*(this.s1 + this.sa1 + this.sa0) - 2*this.al - this.as2 - this.as;
        this.filtration = 2*this.al + this.as2 + this.as;

        if(this.as > 0 || this.as2 > 0){
            this._group = "Z2";
        } else if(this.al > 0 ){
            this._group = "Z4";
        } else {
            this._group = "Z";
        }

        this._induced = slice.s1 > 0;
    }

    copy(){
        let out = Object.create(sliceMonomial);
        out.__proto__ = sliceMonomial.prototype;
        Object.assign(out, this);
        return out;
    }

    degree(){
        return [this.stem, this.filtration];
    }

    getTuple(){
        return [this.da0, this.da1, this.s1, this.as2, this.al, this.as];
    }

    group(){
        return this._group;
    }

    is_induced(){
        return this._induced;
    }

    toString() {
        return subnomialString(
            [["u","\\lambda"], ["u", "\\sigma"], ["u","\\sigma_2"],
                ["a","\\lambda"], ["a", "\\sigma"], ["a","\\sigma_2"]],
            [this.ul, this.us, this.us2,
                this.al, this.as, this.as2],
            monomialString(["\\overline{\\mathfrak{d}}_{a_0}","\\overline{\\mathfrak{d}}_{a_1}", "\\overline{\\mathfrak{d}}_1", "(\\overline{s}_{a_0}+\\overline{s}_{a_1})", "\\overline{s}_{a_0}", "\\overline{s}_{a_1}"],[this.da0, this.da1,this.d1, this.s1, this.sa0, this.sa1]));
    }

    sliceName(){
        return monomialString(["\\overline{\\mathfrak{d}}_{a_0}","\\overline{\\mathfrak{d}}_{a_1}", "\\overline{\\mathfrak{d}}_1", "(\\overline{s}_{a_0}+\\overline{s}_{a_1})", "\\overline{s}_{a_0}", "\\overline{s}_{a_1}"],[this.da0, this.da1,this.d1, this.s1, this.sa0, this.sa1]);
    }
}


let differential_colors = {
    3 : "blue",
    5 : "#40E0D0", // turquoise -- cyan is too bright
    7 : "magenta",
    11 : "green",
    13: "orange",//"cyan",//
    15: "#ff00ff",//"magenta", //
    19: "#7fe900", // LimeGreen
    21: "blue",
    23: "orange",
    27: "#14e01b", // ForestGreen
    29: "red",
    31: "pink",
    35: "#ffb529", // Dandelion
    43: "#ff3b21",  // RedOrange
    51: "#22f19f",
    53: "#8000ff", // Plum
    55: "#0f75ff", // NavyBlue
    59: "#8c2700", // Raw Sienna
    61: "black"
};

let Groups = {};
let SseqNode = Node;
Groups.Z = new SseqNode();
Groups.Z.fill = "white";
Groups.Z.shape = Shapes.square;
Groups.Z.size = 8;

Groups.Z2 = new SseqNode();
Groups.Z2.shape = Shapes.circle;

Groups.Z4 = new SseqNode();
Groups.Z4.shape = Shapes.circle;
Groups.Z4.size = 8;
Groups.Z4.fill = "white";

Groups.Z2sup = Groups.Z4.copy();
Groups.Z2sup.fill = "red";

Groups.Z2hit = Groups.Z4.copy();
Groups.Z2hit.fill = "gray";

Groups.Zsup = Groups.Z.copy();
Groups.Zsup.fill = "red";

Groups.Zsupsup = Groups.Z.copy();
Groups.Zsupsup.fill = "black";

IO.loadFromServer(getJSONFilename("BPC8-truncations")).catch(err => console.log(err)).then(function(json){
    // addLoadingMessage(`Read JSON in ${getTime()} seconds.`);
    window.classes = new StringifyingMap();
    window.truncation_sseq = new Sseq();
    window.max_x = json.max_x;
    window.max_y = json.max_y;
    window.max_diagonal = json.max_diagonal;
    truncation_sseq.xRange = [0, max_x];
    truncation_sseq.yRange = [0, max_y];

    truncation_sseq.initialxRange = [0, Math.floor(16 / 9 * 40)];
    truncation_sseq.initialyRange = [0, 40];
    truncation_sseq.class_scale = 0.75;

    let color_to_group = {
        "white" : "Z",
        "red"   : "2Z",
        "black" : "4Z"
    };
    for(let o of json.classes){
        let c = truncation_sseq.addClass(o.x, o.y);
        c.original_obj = o;
        c.name = o.name;
        c.extra_info = o.extra_info;
        // c.getNode().setColor(o.color).setFill(o.fill);
        c.slice = o.slice;
        if(o.y === 0){
            c.setShape(Shapes.square);
            c.group = color_to_group[o.fill];
        } else if(o.fill !== true){
            c.getNode().setSize(8);
            c.group = o.fill === "white" ? "Z/4" : "Z/2";
        } else {
            c.group = "Z/2";
        }
        c.save_page_list = o.page_list;
        c.page_list = c.save_page_list;
        c.node_list = o.node_list;
        for(let n of c.node_list){
            n.shape = Shapes[n.shape.name];
        }
        c.save_node_list = c.node_list;
        classes.set([c.x, c.y], c);
    }
    // addLoadingMessage(`Added classes in ${getTime()} seconds.`);
    for(let o of json.differentials){
        o.target = [];
        o.target[0] = o.source[0] - 1;
        o.target[1] = o.source[1] + o.page;
        let source = classes.get(o.source);
        let target = classes.get(o.target);
        let d = truncation_sseq.addDifferential(source, target, o.page, false);
        d.color = o.color;
    }
    
    window.sseq = new Sseq();
    sseq.xRange = [0, 250];
    sseq.yRange = [0, 250];   
    for(let c of truncation_sseq.classes){
        if(c.getPage() < infinity){
            continue;
        }
        let c_new = sseq.addClass(c.x, c.y);
        c_new.setNode(c.getNode());
        c_new.slice = new sliceMonomial(c.slice);
        c_new.slice.da0 = 0;
        c_new.slice.da1 = 0;
        c_new.name = c_new.slice.toString();

        c_new = sseq.addClass(c.x, c.y);
        c_new.setNode(c.getNode());
        c_new.slice = new sliceMonomial(c.slice);
        c_new.slice.da1 = c_new.slice.d1;
        c_new.slice.d1 = 0;
        c_new.setColor("blue");
        c_new.name = c_new.slice.toString();

    }    
    
    for(let da1 = 0; da1 < 135; da1++){
        updateTruncation(truncation_sseq, da1);
        for(let c of truncation_sseq.classes){
            if(!c.visible){
                continue;
            }
            if(c.getNode().color !== "black"){
                let c_new = sseq.addClass(c.x, c.y);
                c_new.setNode(c.getNode());
                c_new.slice = c.slice.copy();
                c_new.slice.d1 = 0;
                c_new.name = c_new.slice.toString();
                c_new.type = "truncation";
            }
        }
    }

    for(let i = 0; i < 125; i++){
        for( let v = 0; v < 10; v++){
            let slice = new sliceMonomial({sa0: 6, sa1: 3, da1 : i + 8*v, as2 : 9, al : i});
            let c = sseq.addClass(slice.stem, slice.filtration);
            c.type = "induced";
            c.slice = slice;
            c.setColor("pink");
            c.group = "Z/2";
            c.group_list = [c.group];
            c.name = slice.toString();            
        }
    }    

    new BasicDisplay("#main", sseq);
}).catch((err) => console.log(err));


function updateTruncation(sseq, da1) {
    window.da1 = da1;
    for(let c of sseq.classes) {
        c.visible = !(
            (c.x % 8 === 1 && c.y === 1)
            || (c.x % 8 === 2 && c.y === 2)
        ) && c.slice.d1 >= da1;
    }

    for(let c of sseq.classes) {
        if(!c.visible){
            continue;
        }
        c.node_list = c.save_node_list;
        c.page_list = c.save_page_list;
        let trunc_edges = c.edges.filter(d => !d.source.visible).map( d => d.page);
        c.trunc_edges = trunc_edges;
        c.trunc_page = undefined;
        if(trunc_edges.length > 0){
            c.trunc_page = Math.min(...trunc_edges);
            c.node_list = c.save_node_list.filter((_,idx)=> !trunc_edges.includes(c.page_list[idx - 1]));
            c.page_list = c.save_page_list.filter(p => !trunc_edges.includes(p));
            if(!c.page_list.includes(infinity)){
                c.page_list.push(infinity);
            }
            if(c.node_list.length < c.page_list.length){
                c.node_list.push(Groups.Z2sup.copy());
            }
            if(c.getOutgoingDifferentials().map(d => d.page).includes(5)){
                c.page_list = [5, infinity];
                c.node_list = c.save_node_list;
            }
        }
        c.slice.da1 = da1;
        c.slice.da0 = c.slice.d1 - da1;
        c.slice = new sliceMonomial(c.slice);
        c.name = c.slice.toString();
    }

    for(let c of sseq.classes){
        for(let i = 0; i < c.node_list.length; i++){
            c.node_list[i] = new Node(c.node_list[i]);
            if(c.trunc_page){
                c.node_list[i].color = differential_colors[c.trunc_page];
            }
        }
        c._updateDifferentialStrings();
        c.extra_info = c.differential_strings.join("\n");
    }
}

window.saveTruncationSseq = function saveTruncationSseq(){
    max_x = sseq.xRange[1];
    max_y = sseq.yRange[1];
    let result = {};
    result.max_diagonal = max_diagonal;
    result.max_x = max_x;
    result.max_y = max_y;
    result.truncation_classes = [];
    result.induced_classes = [];
    result.surviving_classes = [];
    result.differentials = [];
    let class_map = new StringifyingMap();
    let classes = new Set(sseq.getClasses().filter(c =>  c.x <= max_x && c.y <= max_y));
    let differentials = sseq.getDifferentials().filter(d => d.source.x <= max_x + 1 && d.source.y <= max_y);
    for(let d of differentials){
        classes.add(d.target);
        if(d.source.x === max_x + 1){
            classes.add(d.source);
        }
    }
    classes = Array.from(classes);

    for(let c of classes) {
        let o = {};
        o.color = c.getColor(0);
        o.fill = c.getNode(0).fill;
        o.name = c.name;
        o.x = c.x;
        o.y = c.y;
        o.slice = c.slice;
        o.extra_info = c.extra_info.split("\n").filter(l => !l.startsWith("\\(d") && l !== "\\(\\)").join("\n");
        if(c.getColor(0) === "pink"){
            result.induced_classes.push(o);
            class_map.set(c, "induced");
        } else if(c.getColor(0) === "black"){
            result.surviving_classes.push(o);
        } else {
            result.truncation_classes.push(o);
            class_map.set(c, "truncation");
        }
    }
    for(let d of differentials){
        let o = {};
        o.source = [d.source.x, d.source.y];
        o.page = d.page;
        o.source_type = class_map.get(d.source);
        o.target_type = class_map.get(d.target);
        result.differentials.push(o);
    }
    return result;
};
