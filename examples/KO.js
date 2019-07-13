// Name: HFPSS $KO$
// Description: The homotopy fixed point spectral sequence for $KO$.



let sseq = new Sseq();

sseq.xRange = [0, 40];
sseq.yRange = [0, 8];
sseq.initialxRange = [0, 16];
sseq.initialyRange = [0, 8];

classes = sseq.addPolynomialClasses({ "v" : [4,0], "\\eta" : [1,1]}, [["\\eta", 0,50], ["v", -10,11]]);
classes.addStructline({"\\eta" : 1});
classes.addDifferential(3, [3,-1], k => k[1] % 2 !== 0, (d, _) => d.addInfoToSourceAndTarget());

let Znode = new Node();
Znode.shape = Shapes.square;
Znode.size = 8;

let Z2node = new Node();
Z2node.fill = false;

for(let v=-10; v<=11; v++){
    if(classes.has({"v" : v})) {
        classes.get({"v" : v}).setNode(Znode);
        classes.get({"v" : v}).replace(Z2node);
    }
}

new BasicDisplay("#main", sseq);
