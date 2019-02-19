// Name: Slice SS $Res^{C_4} BP^{((C_8))}\langle 2\rangle$
// Description: The slice spectral sequence for the $C_4$ fixed points of $BP^{((C_8))}\langle 1\rangle$.

let Groups = {};

Groups.Z = new Node();
Groups.Z.fill = "white";
Groups.Z.shape = Shapes.square;
Groups.Z.size = 8;

Groups.Z2 = new Node();

Groups.Z4 = new Node();
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
BPC4.addPageRangeToPageList([5,15]);
BPC4.min_page_idx = 1;
let s1max = 10;
let d1max = 100;

BPC4.xRange = [0, 100];
BPC4.yRange = [0, 40];

BPC4.initialxRange = [0, 20];
BPC4.initialyRange = [0, 16];

let differential_colors = {
    3 : "blue",
    5 : "#40E0D0", // turquoise -- cyan is too bright
    7 : "magenta",
    11 : "green",
    13 : "orange"
};

BPC4.onDifferentialAdded(d => {
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

slices = BPC4.addSliceClasses({"\\overline{s}_1" : 2, "\\overline{\\mathfrak{d}}_1" : 4},
    [["\\overline{\\mathfrak{d}}_1", 0, d1max],["\\overline{s}_1", 0, 3]], addSlice);

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


slices.addDifferentialLeibniz(5, [2, 0], 4, [3,0], [[1,0,1],[4,0,8]], [[0,20],[0,10]]);

addDifferential(5, [2,0], [3,0], 8, 1);
addDifferential(5, [3,0], [4,0], 9, 1);
addDifferential(5, [3,0], [4,0], 11, 1);


addDifferential(7, [2, 0], [3,1],  8, 1);
addDifferential(7, [4, 0], [5,1], 16, 2);
addDifferential(7, [10, 0],[11,1],36, 2);


addDifferential(11, [3, 1], [6, 0], 11, 2);
addDifferential(11, [9, 1], [12, 0], 31, 2);

addDifferential(13, [5, 0], [8, 0], 17, 2);
addDifferential(13, [6, 0], [9, 0], 18, 2);
addDifferential(13, [8, 0], [11, 0], 30, 2);
addDifferential(13, [11, 0],[14, 0], 37, 2);



let truncation_sseq = new Sseq();
truncation_sseq.drop_out_of_range_classes = true;
truncation_sseq.xRange = [0, 100];
truncation_sseq.yRange = [0, 50];

truncation_sseq.initialxRange = [0, 70];
truncation_sseq.initialyRange = [0, 40];

//truncation_sseq.min_page_idx = BPC4.page_list.length - 1;

for(let c of BPC4.getSurvivingClasses()){
    let nc = truncation_sseq.addClass(c.x,c.y);
    nc.name = c.name;
    if(c.group === "4Z"){
        nc.name = "4\\," + nc.name;
    } else if(c.group === "2Z" || c.getOutgoingDifferentials().length > 0){
        nc.name = "2\\," + nc.name;
    }
    let slice_names = [];
    for(let d3 = 0; d3 < c.slice.d1/3; d3 ++){
        let slice = c.slice.copy();
        slice.d3 = d3;
        slice.d1 -= 3*d3;
        slice_names.push(`\\(${slice.sliceName()}\\)`);
    }
    for(i = 0; i < slice_names.length; i+=5){
        nc.addExtraInfo(slice_names.slice(i,i+5).join(", "));
    }
    nc.setNode(c.getNode());
}


function getTruncationClasses(k){
    let out = [];
    for(let c of BPC4.classes){
        let incoming_differentials = c.getIncomingDifferentials();
        let n = Math.floor((c.x + c.y)/k);
        if(incoming_differentials.length > 0){
            for(let i = 0; i < incoming_differentials.length; i++){
                let d = incoming_differentials[i];
                if(d.source.x + d.source.y < k*n && incoming_differentials[incoming_differentials.length - 1].page > 3){
                    let c2 = Object.assign(new SseqClass(BPC4, c.x, c.y), c);
                    c2.cut_length = d.page;
                    let node = c.getNode(c2.cut_length - 1).copy();
                    c2.node_list = [node];
                    c2.page_list = [infinity];
                    node.stroke = differential_colors[d.page];
                    node.color = differential_colors[d.page];
                    c2.slice = c.slice.copy();
                    c2.slice.d1 -= n;
                    c2.slice.d3 = n/3;
                    c2.name = c2.slice.toString();
                    c2.E2group = c.E2group;
                    if(c.E2group === "Z4"){
                        if(c.getOutgoingDifferentials().length > 0){
                            node.fill = "red";
                            c2.name = "2\\," + c.name;
                            c2.group = "Z2";
                        } else {
                            if(i > 0){
                                node.fill = "grey";
                                c2.group = "Z2";
                            } else {
                                node.fill = "white";
                                c2.group = "Z4";
                            }
                        }
                    } else {
                        c2.group = c2.E2group;
                    }
                    out.push(c2);
                    break;
                }
            }
        }
    }
    return out;
}

let msgs = 0;
for(c of getTruncationClasses(4)){
    let nc = truncation_sseq.addClass(c.x,c.y);
    Util.assignFields(nc, c, ["name", "cut_length", "slice","group","E2group"]);
    nc.setNode(c.getNode());
    //partitionList(c.slice.getSliceNames()).forEach((s) => nc.addExtraInfo(`\\(${s}\\)`));
//    nc.addToMap(classes);
}




truncation_sseq.display();
