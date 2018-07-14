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


let sseq = new Sseq();
sseq.addPageRangeToPageList([5,15]);
sseq.min_page_idx = 1;
let s1max = 10;
let d1max = 20;

sseq.xRange = [0, 100];
sseq.yRange = [0, 40];

sseq.initialxRange = [0, 20];
sseq.initialyRange = [0, 16];

sseq.onDifferentialAdded(d => {
    d.addInfoToSourceAndTarget();
    if(d.source.group == "Z4"){
        d.source.group = "Z2";
        d.source.replace(Groups.Z2supp);
    } else if(d.source.group === "Z"){
        d.source.group = "2Z";
        d.source.replace(Groups.Zsup);
    } else if(d.source.group === "2Z"){
        d.source.group = "4Z";
        d.source.replace(Groups.Zsupsup);
    }

    if(d.target.group == "Z4"){
        d.target.group = "Z2";
        d.target.replace(Groups.Z2hit);
    }
})



let d3_cycles = [];
let d3_cycles_map  = new StringifyingMap();
let big_slices = [];


function addSlice(sseq,d1) {
    let classes = new StringifyingMap();
    let sliceMonomials = [];
    let slices = [];


    for (let s1 = 0; s1 < s1max; s1++) {
        slices[s1] = {};
        for (let c of getSlice(d1, s1)) {
            slices[s1][c.degree()[0]] = c;
            sliceMonomials.push(c);
            let sseq_class = sseq.addClass(...c.degree())
                .setName(c.toString())
                .setNode(Groups[c.group()])
            classes.set(c, sseq_class);
            sseq_class.getNode().setColor(c.is_induced() ? "blue" : "black");
            sseq_class.group = c.group();
        }
    }
    big_slices[d1] = slices;


    for (source of sliceMonomials) {
        let sourceClass = classes.get(source);
        if ((source.stem - source.filtration) % 8 === 4) {
            let tuple = source.getTuple();
            let s1 = tuple[1];

            if (slices[s1 + 1] && classes.has(slices[s1 + 1][source.stem - 1])) {
                let target = slices[s1 + 1][source.stem - 1];
                sseq.addDifferential(sourceClass, classes.get(target), 3);
            } else {
                sourceClass.setPage(3);
            }
        }

        if(source.filtration < 3 && ( source.s1 > 2 || source.us2 > 0) ){
            sourceClass.setPage(3);
        }

        if(sourceClass.getPage() > 3){
            d3_cycles.push(source);
            d3_cycles_map.set(source, classes.get(source));
            sourceClass.x_offset = 0;
            sourceClass.y_offset = 0;
        }
    }
    return sseq;
}

//for(let source of d3_cycles){
//}


for(let d1 = 0; d1 < d1max; d1 ++ ){
    addSlice(sseq,d1);
}

for(let d1 = 2; d1 < d1max; d1++ ){
    for(let i = d1 + 2; i <= 2*d1; i += 4){
        let source = big_slices[d1][0][i];
        let sourceClass = d3_cycles_map.get(source);
        if(d1 < d1max - 1 && d3_cycles_map.has(big_slices[d1+1][0][source.stem - 1])){
            sseq.addDifferential(sourceClass, d3_cycles_map.get(big_slices[d1+1][0][source.stem - 1]), 5);
        } else {
            sourceClass.setPage(5);
        };
    }
}

for(let d1_a= 2; d1_a < d1max; d1_a += 2){
    for(let d1_translate = 0; d1_translate + d1_a < d1max; d1_translate += 4){
        for(let eps = 0; eps <= 2; eps++){
            let stem = 4 + 2*d1_a + 4*d1_translate + eps + (eps == 2 ? 1 : 0);
            let d1 = d1_a + d1_translate + (eps == 0 ? 0 : 1);
            let source = big_slices[d1][0][stem];
            let sourceClass = d3_cycles_map.get(source);
            if(d1 + 1 < d1max){
                let target = big_slices[d1 + 1][0][stem - 1];
                sseq.addDifferential(sourceClass, d3_cycles_map.get(target),5);
            }
        }
    }
}

for(let d1_a = 2; d1_a < d1max; d1_a += 2){
    for(let d1_translate = 0; d1_translate + d1_a < d1max; d1_translate += 2){
        let stem = 4 + 2*d1_a + 4*d1_translate;
        let d1 = d1_a + d1_translate;
        if(d1_translate % 4 === 0 || (d1_translate + 2*d1_a) % 8 === 6 ) {
            let source = big_slices[d1][0][stem];
            let sourceClass = d3_cycles_map.get(source);
            if (d1 + 1 < d1max) {
                let target = big_slices[d1 + 1][1][stem - 1];
                sseq.addDifferential(sourceClass, d3_cycles_map.get(target), 7);
            }
        }
    }
}

for(let d1_a = 3; d1_a < d1max; d1_a += 4){
    for(let d1_translate = 0; d1_translate + d1_a < d1max; d1_translate += 8){
        for(let eps = 0; eps <= 1; eps++){
            let stem = 5 + 2*d1_a + 4*d1_translate + 20*eps;
            let d1 = d1_a + d1_translate + 6*eps;
            if(d1 >= d1max){
                continue;
            }
            let source = big_slices[d1][1][stem];
            let sourceClass = d3_cycles_map.get(source);
            if (d1 + 3 < d1max) {
                let target = big_slices[d1 + 3][0][stem - 1];
                sseq.addDifferential(sourceClass, d3_cycles_map.get(target), 11);
            }
        }
    }
}


for(let d1_a = 5; d1_a < d1max; d1_a += 4){
    for(let d1_translate = 0; d1_translate + d1_a < d1max; d1_translate += 4){
        for(let eps = 0; eps <= 1; eps ++ ) {
            let translate_parity = (d1_translate % 8) / 4;
            let stem = 7 + 2 * d1_a + 4 * d1_translate - 3 * translate_parity + eps;
            let d1 = d1_a + d1_translate - translate_parity  + eps;
            if (d1 >= d1max) {
                continue;
            }
            let source = big_slices[d1][0][stem];
            let sourceClass = d3_cycles_map.get(source);
            if (d1 + 3 < d1max) {
                let target = big_slices[d1 + 3][0][stem - 1];
                sseq.addDifferential(sourceClass, d3_cycles_map.get(target), 13);
            }
        }
    }
}

// sseq.addDifferential(d3_cycles_map.get(new sliceMonomial(2, 0, 0, 2, 0)), d3_cycles_map.get(new sliceMonomial(3, 0, 0, 3, 3)), 5)
//     .addInfoToSourceAndTarget();

// this.tooltip_div = body.append("div")
//     .attr("id", "tooltip_div")
//     .attr("class", "tooltip")
//
// body.append("div")

let disp = new Display(sseq);
window.disp = disp;
