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
    }

    degree(){
        return [this.stem, this.filtration];
    }

    toString() {
        return subnomialString(
            [["u","\\sigma_2"], ["u","\\lambda"], ["u", "\\sigma"],
             ["a","\\sigma_2"], ["a","\\lambda"], ["a", "\\sigma"]],
            [this.us2, this.ul, this.us,
             this.as2, this.ul, this.as],
            monomialString(["d1", "s1"],[this.d1,this.s1]));
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
for(let c of getSlice(2,2)){
    sseq.addClass(...c.getDegree()).setName(c.toString());
}

let disp = new Display(sseq);
window.disp = disp;
