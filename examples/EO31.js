const vmin = -12
const vmax = 10
const bmax = 40

window.classes = sseq.addPolynomialClasses(
    {   "a" : [3,1], "b" : [10,2],   "v" : [24,0] },
      [["a", 0, 1], ["b", 0, bmax], ["v", vmin, vmax]])

Znode = new SseqNode();
Znode.shape = d3.symbolSquare;
Znode.size = 200;

pZnode = Znode.copy();
pZnode.fillColor = "#FFF";


for(let v = vmin; v < vmax; v++){
    classes.get([0,0,v]).setNode(Znode);
}

classes.addStructline(1,0,0);
classes.addStructline(0,1,0);

classes.addDifferential(5, [1, 2,-1], k => k[2] % 3 !== 0 && k[0] === 0, (d, _) => d.addInfoToSourceAndTarget());
classes.addDifferential(9, [-1,5,-2], k => (k[2] % 3 + 3)%3 === 2 && k[0] === 1, (d, _) => d.addInfoToSourceAndTarget());

for(let b = 0; b <= 1; b++){
    for(let v = 11; v < 9; v += 3){
        sseq.addStructline(classes.get([1, b, v]),classes.get([0, 3 + b, v-1])).setPageMin(10);
    }
}

for(let v = vmin; v < vmax; v++){
    if(v % 3 !== 0){
        classes.get([0,0,v]).replace(pZnode);
    }
}

disp.setSseq(sseq);

disp.updateForeground();
