// Name: HFPSS $EO(3,1)$
// Description: The homotopy fixed point spectral sequence for $E_2^{hC_3 \rtimes C_{4}}$ for $p=3$.

let sseq = new Sseq();

sseq.xRange = [-72 * 3, 72*3 - 1];
sseq.yRange = [0, 20];
sseq.max_differential_length = 9;

sseq.initialxRange = [0, 72];
sseq.initialyRange = [0, 40];

const vmin = -24;
const vmax = 20;
const bmax = 40;

classes = sseq.addPolynomialClasses(
    {   "\\alpha" : [3,1], "\\beta" : [10,2],   "v" : [12,0] },
      [["\\alpha", 0, 1], ["\\beta", 0, bmax], ["v", vmin, vmax]])


Znode = new Node();
Znode.shape = Shapes.square;
Znode.size = 8;

pZnode = Znode.copy();
pZnode.fill = false;

sseq.on("differential-added", (d) => d.addInfoToSourceAndTarget());

for(let v = vmin + 1; v < vmax; v++){
    if(classes.has({"v" : v})){
        classes.get({"v" : v}).setNode(Znode);
    }
}

classes.addStructline("\\alpha");
classes.addStructline("\\beta");

classes.addDifferential(5, [1, 2,-2], k => k[2] % 3 !== 0 && k[0] === 0, (d) => d.setStructlinePages());
classes.addDifferential(9, [-1,5,-4], k => (mod(k[2], 6) === 4 || mod(k[2],6) == 1) && k[0] === 1);

for(let b = 0; b <= 1; b++){
    for(let v = 11; v < 9; v += 3){
        sseq.addStructline(classes.get([1, b, v]),classes.get([0, 3 + b, v-2])).setPageMin(10);
    }
}

for(let v = vmin; v < vmax; v++){
    if(v % 3 !== 0){
        if(classes.has({"v" : v})){
            classes.get({"v" : v}).replace(pZnode);
        }
    }
}

for(let v = vmin; v < vmax; v++){
    if(v % 3 === 0){
        if(classes.has([1,1,v+1])){
            for(let b = 0; b < 2; b++){
                sseq.addExtension(classes.get([1,b,v + 2]),classes.get([0,3 + b,v]));
            }
        }
    }
}

new BasicDisplay("#main", sseq);
