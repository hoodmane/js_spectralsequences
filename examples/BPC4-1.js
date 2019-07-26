// Name: Slice SS $BP^{((C_4))}\langle 1\rangle$
// Description: The slice spectral sequence for the $C_4$ fixed points of $BP^{((C_4))}\langle 1\rangle$.

let SseqNode = Node;

let max_diagonal = 300;

let Groups = {};


Groups.Z = new SseqNode();
Groups.Z.fill = "white";
Groups.Z.shape = Shapes.square;
Groups.Z.size = 8;

Groups.Z2 = new SseqNode();

Groups.Z4 = new SseqNode();
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

function partitionList(list, part_size){
    let out = [];
    for(i = 0; i < list.length; i+=part_size){
        out.push(list.slice(i,i+part_size).join(", "));
    }
    return out;
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


let b;
sequentialTuples = a=>[a.map(a=>a[0]),...(b=a.find(a=>a[1]))?sequentialTuples(a,b.shift()):[]];


class sliceMonomial {
    constructor(d1, s1, as2, al, as){
        this.d1 = d1;
        this.s1 = s1;
        this.d3 = 0;
        this.as2 = as2;
        this.al = al;
        this.as = as;
        this.us2 = s1 - as2;
        this.ul = d1 - al;
        this.us = d1 - as;
        this.stem = 4*d1 + 2*s1 - 2*al - as2 - as;
        this.filtration = 2*al + as2 + as;

        if(this.as > 0 || this.as2 > 0){
            this._group = "Z2";
        } else if(this.al > 0 ){
            this._group = "Z4";
        } else {
            this._group = "Z";
        }

        this._induced = s1 > 0;
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
        return [this.d1, this.s1, this.as2, this.al, this.as];
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
            monomialString(["\\overline{\\mathfrak{d}}_3","\\overline{\\mathfrak{d}}_1", "\\overline{s}_1"],[this.d3, this.d1,this.s1]));
    }

    sliceName(){
        return monomialString(["\\overline{\\mathfrak{d}}_3","\\overline{\\mathfrak{d}}_1", "\\overline{s}_1"],[this.d3, this.d1,this.s1]);
    }
}


function getSlice(d1pow, s1pow){
    let out = [];
    let tuples;
    if(s1pow === 0){
        tuples = sequentialTuples([[0], range(0, d1pow), range(d1pow % 2, d1pow, 2)]);
    } else {
        tuples = sequentialTuples([range(s1pow % 2, s1pow, 2), range(0, d1pow), [0]]);
    }
    return tuples.map( l => new sliceMonomial(d1pow, s1pow, ...l));
}


let BPC4 = new Sseq();
BPC4.drop_out_of_range_classes = true;
BPC4.addPageRangeToPageList([5,10000]);
BPC4.min_page_idx = 1;
let s1max = 10;
let max_x = Math.floor(16/9*max_diagonal/2);
let d1max = Math.floor(max_x/2);

BPC4.xRange = [0, max_x];
BPC4.yRange = [0, max_diagonal];

BPC4.initialxRange = [0, 20];
BPC4.initialyRange = [0, 16];

let differential_colors = {
    3 : "blue",
    5 : "#40E0D0", // turquoise -- cyan is too bright
    7 : "magenta",
    11 : "green",
    13 : "orange"
};

BPC4.on("differential-added", function(d) {
    d.addInfoToSourceAndTarget();
    if(d.source.group == "Z4"){
        d.source.group = "Z2";
        d.source.replace(Groups.Z2sup, (name) => "2\\," + name);
    } else if(d.source.group === "Z"){
        d.source.group = "2Z";
        d.source.replace(Groups.Zsup, (name) => "2\\," + name);
    } else if(d.source.group === "2Z"){
        d.source.group = "4Z";
        d.source.replace(Groups.Zsupsup);
    }

    if(d.target.group == "Z4"){
        d.target.group = "Z2";
        d.target.replace(Groups.Z2hit);
    }
    d.color = differential_colors[d.page];
});



let d3_cycles = [];
let d3_cycles_map  = new StringifyingMap();
let big_slices = [];


function addSlice(sseq, elt) {
    let slice = new Map();
    let d1 = elt[0];
    let s1 = elt[1];

    for(let c of getSlice(d1, s1)) {
        let sseq_class = sseq.addClass(...c.degree())
            .setName(c.toString())
            .setNode(Groups[c.group()]);
        sseq_class.group = c.group();
        sseq_class.E2group = c.group();
        sseq_class.slice = c;
        if(s1 == 0){
            sseq_class.x_offset = 0;
            sseq_class.y_offset = 0;
        }
        slice.set(sseq_class.x, sseq_class);
    }

    return slice;
}

slices = BPC4.addSliceClasses({"s1" : {name : "\\overline{s}_1", degree: 2}, "d1" : {name : "\\overline{\\mathfrak{d}}_1", degree: 4}},
    [["d1", 0, d1max],["s1", 0, 3]], addSlice);

slices.addDifferential(3, [0, 1], (k, stem, filtration) => (stem - filtration) % 8 === 4);

for(let c of BPC4.getSurvivingClasses(4)){
    if(c.y < 3 && (c.slice.s1 > 2 || c.slice.us2 > 0) ){
        c.setPage(3);
    } else {
        c.x_offset = 0;
        c.y_offset = 0;
    }
}

for(let d1 = 0; d1 < d1max; d1 += 2){
    for(let s = 0; s <= 1; s++){
        BPC4.addStructline(slices.get([d1,s]).get(4*d1 + s),slices.get([d1, s + 1]).get(4*d1 + s + 1)).setMinPage(5);
    }
}


function addDifferential(page, source_slice, target_slice, stem, translation_multiple){
    let i = translation_multiple;
    slices.addDifferentialLeibniz(page, source_slice, stem, target_slice, [[i*2,0,i*4],[i*4,0,i*16]],[[0,Math.floor(d1max/(2*i))],[0,Math.floor(d1max/(4*i))]]);
}


slices.addDifferentialLeibniz(5, {"d1" : 2}, 4, {"d1" : 3}, [[1,0,1],[4,0,8]], [[0,d1max],[0,d1max/4]]);

addDifferential(5, {"d1" : 2}, {"d1" : 3}, 8, 1);
addDifferential(5, {"d1" : 3}, {"d1" : 4}, 9, 1);
addDifferential(5, {"d1" : 3}, {"d1" : 4}, 11, 1);


addDifferential(7, {"d1" : 2}, {"d1" : 3, "s1" : 1},  8, 1);
addDifferential(7, {"d1" : 4}, {"d1" : 5, "s1" : 1}, 16, 2);
addDifferential(7, {"d1" : 10},{"d1" : 11, "s1" : 1},36, 2);


addDifferential(11, {"d1" : 3, "s1" : 1}, {"d1" : 6 }, 11, 2);
addDifferential(11, {"d1" : 9, "s1" : 1}, {"d1" : 12}, 31, 2);

addDifferential(13, {"d1" : 5}, {"d1" : 8}, 17, 2);
addDifferential(13, {"d1" : 6}, {"d1" : 9}, 18, 2);
addDifferential(13, {"d1" : 8}, {"d1" : 11}, 30, 2);
addDifferential(13, {"d1" : 11},{"d1" : 14}, 37, 2);


window.saveSseq = function saveTruncationSseq(sseq){
    max_x = sseq.xRange[1];
    max_y = sseq.yRange[1];
    let result = {};
    result.max_diagonal = max_diagonal;
    result.max_x = max_x;
    result.max_y = max_y;
    result.classes = [];
    result.differentials = [];
    for(let c of sseq.getClasses().filter(c => c.page_list[c.page_list.length - 1] > 3 && c.x < max_x && c.y < max_y)) {
        let o = {};
        o.name = c.name;
        o.slice = c.slice.copy();
        o.x = c.x;
        o.y = c.y;
        o.extra_info = c.extra_info;
        o.page_list = c.page_list;
        o.node_list = c.node_list;
        result.classes.push(o);
    }
    for(let d of sseq.getDifferentials()){
        let o = {};
        o.source = [d.source.x, d.source.y];
        o.page = d.page;
        o.color = d.color;
        result.differentials.push(o);
    }
    return result;
};


let display = new BasicDisplay("#main");
display.setSseq(BPC4);

Mousetrap.bind("p", () => display.downloadSVG("BPC4-1.svg"));
