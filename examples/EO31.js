let sseq = new Sseq();

sseq.xRange = [-72 * 3, 72*3 - 1];
sseq.yRange = [0, 20];
sseq.max_differential_length = 9;

sseq.initialxRange = [0, 72];
sseq.initialyRange = [0, 40];

const vmin = -12;
const vmax = 10;
const bmax = 40;

classes = sseq.addPolynomialClasses(
    {   "a" : [3,1], "b" : [10,2],   "v" : [24,0] },
      [["a", 0, 1], ["b", 0, bmax], ["v", vmin, vmax]])


Znode = new SseqNode();
Znode.sceneFunc = square_draw_func;
Znode.size = 8;

pZnode = Znode.copy();
pZnode.fill = "#FFF";
pZnode.stroke = "#000";


for(let v = vmin + 1; v < vmax; v++){
    if(classes.has([0,0,v])){
        classes.get([0,0,v]).setNode(Znode);
    }
}

classes.addStructline(1,0,0);
classes.addStructline(0,1,0);

classes.addDifferential(5, [1, 2,-1], k => k[2] % 3 !== 0 && k[0] === 0, (d, _) => d.addInfoToSourceAndTarget().setStructlinePages());
classes.addDifferential(9, [-1,5,-2], k => (k[2] % 3 + 3)%3 === 2 && k[0] === 1, (d, _) => d.addInfoToSourceAndTarget());

for(let b = 0; b <= 1; b++){
    for(let v = 11; v < 9; v += 3){
        sseq.addStructline(classes.get([1, b, v]),classes.get([0, 3 + b, v-1])).setPageMin(10);
    }
}

for(let v = vmin; v < vmax; v++){
    if(v % 3 !== 0){
        if(classes.has([0,0,v])){
            classes.get([0,0,v]).replace(pZnode);
        }
    }
}

for(let v = vmin; v < vmax; v++){
    if(v % 3 === 0){
        if(classes.has([1,1,v+1])){
            for(let b = 0; b < 2; b++){
                sseq.addExtension(classes.get([1,b,v + 1]),classes.get([0,3 + b,v]));
            }
        }
    }
}

disp.setSseq(sseq);

disp.draw();
