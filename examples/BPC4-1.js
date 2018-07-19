// Name: Slice SS $BP^{((C_4))}\langle 1\rangle$
// Description: The slice spectral sequence for the $C_4$ fixed points of $BP^{((C_4))}\langle 1\rangle$.

let Groups = {};

Groups.Z = new SseqNode();
Groups.Z.fill = "white";
Groups.Z.shape = Shapes.square;
Groups.Z.size = 8;

Groups.Z2 = new SseqNode();

Groups.Z4 = new SseqNode();
Groups.Z4.size = 8;
Groups.Z4.fill = "white";

Groups.Z2supp = Groups.Z4.copy();
Groups.Z2supp.fill = "red";

Groups.Z2hit = Groups.Z4.copy();
Groups.Z2hit.fill = "gray";

Groups.Zsup = Groups.Z.copy();
Groups.Zsup.fill = "red";

Groups.Zsupsup = Groups.Z.copy();
Groups.Zsupsup.fill = "black";

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
            [["u","\\sigma_2"], ["u","\\lambda"], ["u", "\\sigma"],
             ["a","\\sigma_2"], ["a","\\lambda"], ["a", "\\sigma"]],
            [this.us2, this.ul, this.us,
             this.as2, this.al, this.as],
            monomialString(["\\overline{\\mathfrak{d}}_1", "\\overline{s}_1"],[this.d1,this.s1]));
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
BPC4.addPageRangeToPageList([5,15]);
BPC4.min_page_idx = 1;
let s1max = 10;
let d1max = 50;

BPC4.xRange = [0, 100];
BPC4.yRange = [0, 40];

BPC4.initialxRange = [0, 20];
BPC4.initialyRange = [0, 16];

let differential_colors = {
    3 : "blue",
    5 : "blue",
    7 : "red",
    11 : "green",
    13 : "orange"
};

BPC4.onDifferentialAdded(d => {
    d.addInfoToSourceAndTarget();
    if(d.source.group == "Z4"){
        d.source.group = "Z2";
        d.source.replace(Groups.Z2supp, (name) => "2\\," + name);
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
})



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
        sseq_class.getNode().setColor(c.is_induced() ? "blue" : "black");
        sseq_class.group = c.group();
        sseq_class.slice = c;
        if(s1 == 0){
            sseq_class.x_offset = 0;
            sseq_class.y_offset = 0;
        }
        slice.set(sseq_class.x, sseq_class);
    }

    return slice;
}

slices = BPC4.addSliceClasses({"\\overline{s}_1" : 2, "\\overline{\\mathfrak{d}}_1" : 4}, [["\\overline{\\mathfrak{d}}_1", 0, d1max],["\\overline{s}_1", 0, s1max]], addSlice);

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

slices.addDifferentialLeibniz(5, [2,0], 4, [3,0], [[1,0,1],[4,0,8]], [[0,20],[0,10]]);
slices.addDifferentialLeibniz(5, [2, 0], 8, [3,0], [[2,0,4],[4,0,16]], [[0,10],[0,10]]);
slices.addDifferentialLeibniz(5, [3, 0], 9, [4,0], [[2,0,4],[4,0,16]], [[0,10],[0,10]]);
slices.addDifferentialLeibniz(5, [3, 0], 11, [4,0], [[2,0,4],[4,0,16]], [[0,10],[0,10]]);

slices.addDifferentialLeibniz(7, [2, 0], 8, [3,1], [[2,0,4],[4,0,16]], [[0,10],[0,10]]);
slices.addDifferentialLeibniz(7, [4, 0], 16, [5,1], [[4,0,8],[8,0,32]], [[0,10],[0,10]]);
slices.addDifferentialLeibniz(7, [10, 0], 36, [11,1], [[4,0,8],[8,0,32]], [[0,10],[0,10]]);


slices.addDifferentialLeibniz(11, [3, 1], 11, [6, 0], [[4,0,8],[8,0,32]], [[0,10],[0,10]]);
slices.addDifferentialLeibniz(11, [9, 1], 31, [12, 0], [[4,0,8],[8,0,32]], [[0,10],[0,10]]);

slices.addDifferentialLeibniz(13, [5, 0], 17, [8, 0], [[4,0,8],[8,0,32]], [[0,10],[0,10]]);
slices.addDifferentialLeibniz(13, [6, 0], 18, [9, 0], [[4,0,8],[8,0,32]], [[0,10],[0,10]]);
slices.addDifferentialLeibniz(13, [8, 0], 30, [11, 0], [[4,0,8],[8,0,32]], [[0,10],[0,10]]);
slices.addDifferentialLeibniz(13, [11, 0], 37, [14, 0], [[4,0,8],[8,0,32]], [[0,10],[0,10]]);









BPC4.display();
