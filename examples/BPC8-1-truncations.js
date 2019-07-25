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
        this.da0 = slice.da0;
        this.da1 = slice.da1;
        this.d1 = slice.d1;
        this.s1 = slice.s1;
        this.as2 = slice.as2;
        this.al = slice.al;
        this.as = slice.as;
        this.us2 = slice.s1 - slice.as2;
        this.ul = slice.da1 + slice.da0 - slice.al;
        this.us = slice.da1 + slice.da0 - slice.as;
        this.stem = 4*(slice.da1 + slice.da0) + 2*slice.s1 - 2*slice.al - slice.as2 - slice.as;
        this.filtration = 2*slice.al + slice.as2 + slice.as;

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
            monomialString(["\\overline{\\mathfrak{d}}_{a_0}","\\overline{\\mathfrak{d}}_{a_1}", "(\\overline{s}_{a_0}+\\overline{s}_{a_1})"],[this.da0, this.da1,this.s1]));
    }

    sliceName(){
        return monomialString(["\\overline{\\mathfrak{d}}_{a_0}","\\overline{\\mathfrak{d}}_{a_1}", "(\\overline{s}_{a_0}+\\overline{s}_{a_1})"],[this.da0, this.da1,this.s1]);
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
    addLoadingMessage(`Read JSON in ${getTime()} seconds.`);
    window.classes = new StringifyingMap();
    window.display = new BasicDisplay("#main");
    window.sseq = new Sseq();
    window.max_x = json.max_x;
    window.max_y = json.max_y;
    window.max_diagonal = json.max_diagonal;
    sseq.xRange = [0, max_x];
    sseq.yRange = [0, max_y];

    sseq.initialxRange = [0, Math.floor(16 / 9 * 40)];
    sseq.initialyRange = [0, 40];
    sseq.class_scale = 0.75;

    let color_to_group = {
        "white" : "Z",
        "red"   : "2Z",
        "black" : "4Z"
    };
    for(let o of json.classes){
        let c = sseq.addClass(o.x, o.y);
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
    addLoadingMessage(`Added classes in ${getTime()} seconds.`);
    for(let o of json.differentials){
        o.target = [];
        o.target[0] = o.source[0] - 1;
        o.target[1] = o.source[1] + o.page;
        let source = classes.get(o.source);
        let target = classes.get(o.target);
        let d = sseq.addDifferential(source, target, o.page, false);
        d.color = o.color;
    }
    sseq.page_list[0] = [5, infinity];
    window.da1 = 0;
    updateTruncation(da1);

    display.on("draw", function () {
        let context = this.context;
        // context.beginPath();
        context.save();
        this.clipContext(context);
        context.lineWidth = 0.3;
        context.strokeStyle = "#818181";
        let xScale = this.xScale;
        let yScale = this.yScale;
        // Truncation lines
        // for (let diag = 12; diag < json.max_diagonal; diag += 12) {
        //     context.moveTo(xScale(diag + 2), yScale(-2));
        //     context.lineTo(xScale(-2), yScale(diag + 2));
        // }
        // context.stroke();
        // context.restore();
        // context.save();
        // context.beginPath();
        // context.lineWidth = 1;
        // context.strokeStyle = "#9d9d9d";
        // // vanishing lines
        // for (let y of [3, 7, 15, 31, 61]) {
        //     context.moveTo(xScale(-2), yScale(y));
        //     context.lineTo(xScale(max_diagonal), yScale(y));
        // }
        context.moveTo(xScale(0), yScale(0));
        context.lineTo(xScale(max_diagonal), yScale(max_diagonal));
        context.moveTo(xScale(0), yScale(0));
        context.lineTo(xScale(max_diagonal / 3), yScale(max_diagonal));
        context.stroke();
        context.restore();
        // context = display.supermarginLayerContext;
    });
    sseq.initial_page_idx = 0;


    addLoadingMessage(`Added differentials in ${getTime()} seconds.`);
    document.getElementById("loading").style.display =  "none";
    display.setSseq(sseq);
    addLoadingMessage(`Displayed in ${getTime()} seconds.`);
    let t1 = performance.now();
    console.log("Rendered in " + (t1 - t0)/1000 + " seconds.");


});

function updateTruncation(da1) {
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
        // c.slice.d1 = 0;
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
    sseq.emit("update");
    document.body.appendChild(truncation_div);
}




Mousetrap.bind("up", () => {
    da1 ++;
    truncation_input.innerText = da1;
    updateTruncation(da1);
});

Mousetrap.bind("down", () => {
    if(da1 === 0){
        return;
    }
    da1 --;
    truncation_input.innerText = da1;
    updateTruncation(da1);
});

let truncation_div = document.createElement("div");
truncation_div.innerText = "Truncation: ";
let truncation_input = document.createElement("span");
truncation_div.appendChild(truncation_input);
window.da1 = 0;
truncation_input.innerText = da1;
truncation_div.style.setProperty("position", "absolute");
truncation_div.style.setProperty("top", "10px");
truncation_div.style.setProperty("left", "400px");
truncation_div.style.setProperty("font-family", "Arial");
truncation_div.style.setProperty("font-size","15px");

