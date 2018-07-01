let sseq = new Sseq();

sseq.initialxRange = [0, 8];
sseq.initialyRange = [0, 8];

classes = sseq.addPolynomialClasses({ "v" : [4,0], "\\eta" : [1,1]}, [["\\eta", 0,50], ["v", -10,11]]);
classes.addStructline(1,0);
classes.addDifferential(3, [3,-1], k => k[1] % 2 != 0, (d, _) => d.addInfoToSourceAndTarget());

let Znode = new SseqNode();
Znode.shape = Shapes.square;

let Z2node = Znode.copy();
Z2node.fill = false;

for(let v=-10; v<=11; v++){
    classes.get([0,v]).setNode(Znode);
    classes.get([0,v]).replace(Z2node);
}

window.classes = classes;

let disp = new Display(sseq);

