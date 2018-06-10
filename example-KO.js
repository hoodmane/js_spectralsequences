classes = sseq.addPolynomialClasses({ "v" : [4,0], "\\eta" : [1,1]}, [["\\eta", 0,50], ["v", -10,11]]);
classes.addStructline(1,0);
classes.addDifferential(3, [3,-1], k => k[1] % 2 != 0, (d, _) => d.addInfoToSourceAndTarget());

for(let v=-10; v<=11; v++){
    classes.get([0,v]).node_list[0].shape = d3.symbolSquare;
    classes.get([0,v]).node_list[0].size = 200;
    classes.get([0,v]).node_list[0].fillColor = "#FFF";
}


updateForeground();
