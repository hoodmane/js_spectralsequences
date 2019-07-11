
// Name: Slice SS $\tmf_{(3)}(2)$
// Description: The slice spectral sequence for $\tmf_{(3)}(2)^{hC_3}$. This is a truncated version of HFPSS $EO(3,1)$.

let sseq = new Sseq();
sseq.min_page_idx = 1;

sseq.xRange = [0, 200];
sseq.yRange = [0, 40];

sseq.initialxRange = [0, 20];
sseq.initialyRange = [0, 16];

Znode = new Node();
Znode.shape = Shapes.square;
Znode.size = 8;

pZnode = Znode.copy();
pZnode.fill = "white";

sseq.onDifferentialAdded(d => {
    d.setStructlinePages();
    if(d.source.degree.y === 0){
        d.replaceSource(pZnode);
    }
})

classes = new StringifyingMap();
window.classes = classes;

let v1max = 66;

for(let v1 = 0; v1 < v1max; v1 += 3){
    for(let i = 0; i <= 4*v1 ; i+=2){
        for(let epsilon = 0; epsilon <= 1; epsilon++){
            let stem = 4*v1 + 3*epsilon - i;
            let filtration = i + epsilon;
            if(stem + 1 + epsilon >= Math.floor(filtration/2)){
                let c = sseq.addClass(stem, filtration);
                classes.set([stem, filtration], c);
                if(filtration == 0){
                    c.setNode(Znode);
                }
            }
        }
    }
}

for(let k of classes){
    let t = k[0];
    let at = [t[0] + 3, t[1] + 1 ];
    let bt = [t[0] + 10, t[1] + 2 ];
    if(classes.has(at)){
        sseq.addStructline(k[1], classes.get(at));
    }
    if(classes.has(bt)){
        sseq.addStructline(k[1], classes.get(bt));
    }
}


for(let v1 = -20; v1 <= v1max; v1 += 1) {
    if (v1 % 3 === 0) {
        continue;
    }
    for (let alpha = 0; alpha <= 1; alpha += 1) {
        for (let beta = 0; beta <= 20; beta += 1) {
            let stem = 12 * v1 + 3 * alpha + 10 * beta;
            let filtration = alpha + 2 * beta;
            sseq.addDifferential(classes.get([stem, filtration]), classes.get([stem - 1, filtration + 5]), 5);
        }
    }
}


for(let v1 = -21; v1 <= v1max; v1 ++){
    if (mod(v1, 6) === 4 || mod(v1,6) == 1) {
        for (let beta = 0; beta <= 20; beta += 1) {
            let stem = 12 * v1  + 3 + 10 * beta;
            let filtration = 1 + 2 * beta;
            sseq.addDifferential(classes.get([stem, filtration]), classes.get([stem - 1, filtration + 9]), 9);
        }
    }
}



sseq.display("#main");
