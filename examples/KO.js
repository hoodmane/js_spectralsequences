//const disp = sseq_display;
//window.disp = disp;
//var sseq = new Sseq();

classes = sseq.addPolynomialClasses({ "v" : [4,0], "\\eta" : [1,1]}, [["\\eta", 0,50], ["v", -10,11]]);
classes.addStructline(1,0);
classes.addDifferential(3, [3,-1], k => k[1] % 2 != 0, (d, _) => d.addInfoToSourceAndTarget());

let Znode = new SseqNode();
Znode.shape = d3.symbolSquare;
Znode.size = 200;
Znode.fillColor = "#000";

let Z2node = Znode.copy();
Z2node.fillColor = "#FFF";

for(let v=-10; v<=11; v++){
    classes.get([0,v]).setNode(Znode);
    classes.get([0,v]).replace(Z2node);
}

window.classes = classes;

disp.setSseq(sseq);

disp.updateForeground();

