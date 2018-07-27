// Name: Slice SS $BP^{((C_4))}\langle 1\rangle$
// Description: The slice spectral sequence for the $C_4$ fixed points of $BP^{((C_4))}\langle 1\rangle$.

let Groups = {};
let SseqNode = Node;
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


SseqClass.prototype.addToMap = function(map){
    map.set([this.x,this.y], this);
    return this;
}

SseqClass.prototype.setGroup = function(group){
    this.group = group;
    return this;
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

    getSliceNames(){
        let slice_names = [];
        for(let d3 = 0; d3 < this.d1/3; d3 ++){
            let slice = this.copy();
            slice.d3 = d3;
            slice.d1 -= 3*d3;
            slice_names.push(`\\(${slice.sliceName()}\\)`);
        }
        return slice_names;
    }

}


function getSlice(d1pow, s1pow){
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
let max_diagonal = 800;
let max_y = Math.floor(9/16*max_diagonal/2);
let max_x = max_diagonal/2;
let d1max = Math.floor(max_x/2);

BPC4.xRange = [0, max_x];
BPC4.yRange = [0, max_y];

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
    if(d.source.group === "Z4"){
        d.source.group = "Z2";
        d.source.replace(Groups.Z2sup, (name) => "2\\," + name);
    } else if(d.source.group === "Z"){
        d.source.group = "2Z";
        d.source.replace(Groups.Zsup, (name) => "2\\," + name);
    } else if(d.source.group === "2Z"){
        d.source.group = "4Z";
        d.source.replace(Groups.Zsupsup);
    }

    if(d.target.group === "Z4"){
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
        if(s1 === 0){
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


function addBPC4Differential(page, source_slice, target_slice, stem, translation_multiple){
    let i = translation_multiple;
    slices.addDifferentialLeibniz(page, source_slice, stem, target_slice, [[i*2,0,i*4],[i*4,0,i*16]],[[0,Math.floor(d1max/(2*i))],[0,Math.floor(d1max/(4*i))]]);
}


slices.addDifferentialLeibniz(5, [2, 0], 4, [3,0], [[1,0,1],[4,0,8]], [[0,d1max],[0,d1max/4]]);

addBPC4Differential(5, {"d1" : 2}, {"d1" : 3}, 8, 1);
addBPC4Differential(5, {"d1" : 3}, {"d1" : 4}, 9, 1);
addBPC4Differential(5, {"d1" : 3}, {"d1" : 4}, 11, 1);


addBPC4Differential(7, {"d1" : 2}, {"d1" : 3, "s1" : 1},  8, 1);
addBPC4Differential(7, {"d1" : 4}, {"d1" : 5, "s1" : 1}, 16, 2);
addBPC4Differential(7, {"d1" : 10},{"d1" : 11, "s1" : 1},36, 2);


addBPC4Differential(11, {"d1" : 3, "s1" : 1}, {"d1" : 6 }, 11, 2);
addBPC4Differential(11, {"d1" : 9, "s1" : 1}, {"d1" : 12}, 31, 2);

addBPC4Differential(13, {"d1" : 5}, {"d1" : 8}, 17, 2);
addBPC4Differential(13, {"d1" : 6}, {"d1" : 9}, 18, 2);
addBPC4Differential(13, {"d1" : 8}, {"d1" : 11}, 30, 2);
addBPC4Differential(13, {"d1" : 11},{"d1" : 14}, 37, 2);


function getTruncationClasses(n){
    let out = [];
    for(let c of BPC4.classes){
        let incoming_differentials = c.getIncomingDifferentials();
        if(c.x + c.y >= 4*n && incoming_differentials.length > 0){
            for(let i = 0; i < incoming_differentials.length; i++){
                let d = incoming_differentials[i];
                if(d.source.x + d.source.y < 4*n && incoming_differentials[incoming_differentials.length - 1].page > 3){
                    let node = c.getNode();
                    node.stroke = differential_colors[d.page];
                    node.color = differential_colors[d.page];
                    c.slice.d1 -= n;
                    c.slice.d3 = n/3;
                    c.name = c.slice.toString();
                    c.cut_length = d.page;
                    if(c.E2group === "Z4"){
                        if(c.getOutgoingDifferentials().length > 0){
                            node.fill = "red";
                            c.name = "2\\," + c.name;
                            c.group = "Z2";
                        } else {
                            if(i > 0){
                                node.fill = "grey";
                                c.group = "Z2";
                            } else {
                                node.fill = "white";
                                c.group = "Z4";
                            }
                        }
                    }
                    out.push(c);
                    break;
                }
            }
        }
    }
    return out;
}




let truncation_sseq = new Sseq();
truncation_sseq.xRange = [0, max_x];
truncation_sseq.yRange = [0, max_y];

truncation_sseq.initialxRange = [0, Math.floor(16/9*40)];
truncation_sseq.initialyRange = [0, 40];
truncation_sseq.class_scale = 0.75;

truncation_sseq.onDifferentialAdded(d => {
    d.addInfoToSourceAndTarget();
    if(d.source.group === "Z4"){
        d.source.group = "Z2";
        d.source.replace(Groups.Z2sup, (name) => "2\\," + name);
    } else if(d.source.group === "Z"){
        d.source.group = "2Z";
        d.source.replace(Groups.Zsup, (name) => "2\\," + name);
    } else if(d.source.group === "2Z"){
        d.source.group = "4Z";
        d.source.replace(Groups.Zsupsup);
    }

    if(d.target.group === "Z4"){
        d.target.group = "Z2";
        d.target.replace(Groups.Z2hit);
    }
    //d.color = differential_colors[d.page];
});


//truncation_sseq.min_page_idx = BPC4.page_list.length - 1;

let surviving_classes = new StringifyingMap();
let classes = new StringifyingMap();
let induced_classes = new StringifyingMap();

// Induced E2C2 classes, see top of page 38 in progress notes.
function addInducedE2C2Classes() {
    for (let diag = 7; diag < max_diagonal; diag++) {
        let slice_names = [];
        let k = diag % 3;
        let two_i_plus_j = (diag - k) / 3;
        for (let i = 0; two_i_plus_j - 2 * i > 0; i++) {
            let j = two_i_plus_j - 2 * i;
            slice_names.push(monomialString(["\\overline{\\mathfrak{d}}_3", "\\overline{s}_3", "\\overline{r}_1"], [i, j, k]));
        }
        for (let i = 0; diag - i >= 7; i += 16) { // i += 8 for all induced classes, we're skipping half.
            let filtration = diag - i;
            let stem = diag + i;
            let c = truncation_sseq.addClass(stem, filtration);
            partitionList(slice_names, 5).forEach((s) => c.addExtraInfo(`\\(${s}\\)`));
            c.setColor("pink");
            c.addToMap(induced_classes);
        }
    }

    for (let s = 0; s < max_x; s += 8) { // add back in permanent cycles on skipped diagonals.
        let c = truncation_sseq.addClass(s, 0).setColor("pink").addToMap(induced_classes);
        if(s % 32 === 0){
            c.setNode(Groups.Z).setGroup("Z");
        } else {
            c.setNode(Groups.Zsup).setGroup("2Z");
        }
        let i_max = (s % 16 === 0) ? 6 : 2;
        for (let i = 1; i <= i_max; i++) {
            truncation_sseq.addClass(s + i, i).setColor("pink").addToMap(induced_classes);
        }
    }
}
addInducedE2C2Classes();


for(let c of BPC4.getSurvivingClasses()){
    let nc = truncation_sseq.addClass(c.x,c.y);
    nc.name = c.name;
    nc.group = c.group;
    if(c.group === "4Z"){
        nc.name = "4\\," + nc.name;
    } else if(c.group === "2Z" || c.getOutgoingDifferentials().length > 0){
        nc.name = "2\\," + nc.name;
    }
    partitionList(c.slice.getSliceNames(), 5).forEach((s) => nc.addExtraInfo(`${s}`));
    nc.setNode(c.getNode());
    nc.addToMap(surviving_classes);
}


let msgs = 0;
for(let n = 0; n < max_diagonal; n += 3){
    for(c of getTruncationClasses(n)){
        let nc = truncation_sseq.addClass(c.x,c.y);
        Util.assignFields(nc, c, ["name"]);
        nc.setNode(c.getNode(c.cut_length - 1));
        partitionList(c.slice.getSliceNames()).forEach((s) => nc.addExtraInfo(`\\(${s}\\)`));
        nc.addToMap(classes);
    }
}




function addDifferential(page, source, offset_vectors, offset_vector_ranges, class_dict = classes, add_source = undefined, add_target = undefined){
    if(!Array.isArray(source[0])){
        source = [source];
    }
    for(let exponent_vector of product(source,...offset_vector_ranges.map( r => range(...r)))){
        let cur_source = exponent_vector.splice(0,2);
        let source_degree = vectorSum(cur_source, vectorLinearCombination(offset_vectors, exponent_vector));
        let target_degree = vectorSum(source_degree, [-1,page]);
        let sourceClass;
        if(!class_dict.has(source_degree)){
            if(add_source && source_degree[1] >= 0 && class_dict.has(target_degree)){
                sourceClass = add_source(source_degree);
            } else {
                continue;
            }
        } else {
            sourceClass = class_dict.get(source_degree);
        }
        let targetClass;
        if(!class_dict.has(target_degree)){
            if(add_target){
                targetClass = add_target(target_degree);
            } else {
                continue;
            }
        } else {
            targetClass = class_dict.get(target_degree);
        }
        let d = truncation_sseq.addDifferential(sourceClass, targetClass, page);
    }
}


// Add extra low filtration classes to be sources of differentials
for(let v = 0; v < max_x; v += 32){
    let c;
    truncation_sseq.addClass(20 + v,4).addToMap(classes).setGroup("Z4")
        .setNode(Groups.Z4).getNode().setStroke("blue");
    truncation_sseq.addClass(53 + 2*v, 7).setColor("blue").addToMap(classes);
    truncation_sseq.addClass(265 + 5*v, 11).setColor("blue").addToMap(classes); // Supports a d61.
}

truncation_sseq.addClass(66,6).addToMap(classes)
    .setNode(Groups.Z2sup).getNode().setStroke("blue");



// Missing a class in (21, 21)
// Missing a pink Z/2 in (27,11) that should be target of d19(26,30) = (27,11) with a .
// Missing target of d29(61,15) = (60, 44) and all
// d43 is missing
// d51 is missing

addInducedClass = (degree) => truncation_sseq.addClass(degree[0],degree[1]).setColor("pink");

// above line of slope 1:
addDifferential(13, [[10,14], [24,24], [41,43]], [[3,9],[48,48]], [[0,30], [0,10]]);

// below line of slope 1:
addDifferential(13, [[20,4], [27,9],[37,23],[39,21]], [[24,24],[16,-16], [96,0]], [[0,10],[0,3],[0,10]]);

truncation_sseq.initial_page_idx = 2;
addDifferential(15, [20,4], [[12,12],[16,-16]],[[0,25],[0,20]]);
addDifferential(15, [40,8], [[24,24],[32,-32]], [[0,15],[0,10]]);
addDifferential(15, [28,12], [[24,24],[16,-16]], [[0,15],[0,10]], classes, undefined, addInducedClass);
truncation_sseq.initial_page_idx = 3;

addDifferential(19, [[27,11]], [[24,24], [8,-8]],[[0,20], [0,20]]);
addDifferential(19, [34,14], [[12,12],[28,-4]], [[0,20],[0,10]], classes, undefined, addInducedClass);

addDifferential(21, [[47,13]], [[24,24], [28,-4]],[[0,10], [0,10]]);

addDifferential(23, [[48,16]], [[24,24],[32,-32]],[[0,10],[0,10]]);


addDifferential(27, [[43,19],[63,23]], [[24,24],[56,-8]],[[0,10],[0,10]]);



for(let v = 0; v < max_x; v += 32){
    truncation_sseq.addClass(32 + v,0).setNode(Groups.Z).setGroup("Z").setColor("blue").addToMap(classes);
    truncation_sseq.addClass(32 + v + 1, 3).setColor("blue").addToMap(classes);
    for(let l of [[34,6],[46,2], [54,10]]){
        let c = truncation_sseq.addClass(v + l[0], l[1]).setNode(Groups.Z2sup).setColor("blue").addToMap(classes);
    }
}
addDifferential(29, [[32,0],[33,3],[34,6],[41,11],[46,2],[49,19],[50,22], [54,10], [61,15]],[[24,24],[32,-32]], [[0,10],[0,10]]);


addDifferential(31, [[32,0]],[[1,1],[64,0]],[[0,max_diagonal],[0,10]], induced_classes);
addDifferential(31, [[40,8]],[[24,24],[56,-8]],[[0,10],[0,10]], classes,undefined, addInducedClass);
addDifferential(31, [[80,16]],[[48,48],[56,-8]],[[0,10],[0,10]], classes,undefined, addInducedClass);

addDifferential(35, [[55,7]],[[24,24],[32,-32]],[[0,10],[0,10]]);

addDifferential(43, [[ 55, 23 ]], [[48,48]], [[0,10]], classes, addInducedClass);


addDifferential(51, [111,15], [[48,48],[8,-56]],[[0,10],[0,10]] , classes, addInducedClass)

addDifferential(53, [[52,4],[69,23],[86,42]],[[48,48]],[[0,10]]);

addDifferential(55, [[156,44]],[[48,48],[8,-56]],[[0,10],[0,10]]);

truncation_sseq.addClass(251, 3).setColor("blue").addToMap(classes);
addDifferential(59, [[83,27]],[[48,48],[8,-56]],[[0,10],[0,10]]);

addDifferential(61, [[49,-13],[66,6]],[[48,48],[28,-20],[56,-8],[132,20]],[[0,10],[0,1],[0,1],[0,3]]);
addDifferential(61, [153,27], [[24,24],[32,-32]],[[0,10],[0,10]])
truncation_sseq.initial_page_idx = 1;

truncation_sseq.onDraw((display) => {
    let context = display.edgeLayerContext;
    context.save();
    context.lineWidth = 1;
    context.strokeStyle = "#333";
    let xScale = display.xScale;
    let yScale = display.yScale;
    context.beginPath();
    // Truncation lines
    for(let diag = 12; diag < max_diagonal; diag += 12){
        context.moveTo(xScale(diag + 2), yScale(-2));
        context.lineTo(xScale(-2), yScale(diag + 2 ));
    }
    // vanishing lines
    for(let y of [3, 7,  15, 31, 61]){
        context.moveTo(xScale(-2), yScale(y));
        context.lineTo(xScale(max_diagonal), yScale(y));
    }

    context.closePath();
    context.stroke();
    context.restore();
    context = display.supermarginLayerContext;
    // page number
    context.clearRect(50,0,400,200)
    context.font = "15px Arial";
    context.fillText(`Page ${display.pageRange}`,100,12);
});

let dss = truncation_sseq.getDisplaySseq();
window.dss = dss;
dss.addKeyHandler('z',
    () => {
        if(this.mouseover_class){
            if(this.last_class){
                console.log([this.mouseover_class.x - this.last_class.x, this.mouseover_class.y - this.last_class.y]);
                this.last_class = null;
            } else {
                this.last_class = this.mouseover_class;
            }
        }
    }
);

truncation_sseq.topMargin = 20;
truncation_sseq.squareAspectRatio = true;

truncation_sseq.display();
window.truncation_sseq = truncation_sseq;


