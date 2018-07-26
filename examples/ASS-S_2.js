"use strict";


function otherClass(sl,c){
    if(sl.source === c){
        return sl.target;
    } else {
        return sl.source;
    }
}

//js_spectralsequences/json/ASS-S_2.json
DisplaySseq.fromJSON("json/ASS-S_2.json").catch((error) => console.log(error)).then((dss) => {
    dss.xRange = [0,70];
    dss.yRange = [0, 40];
    window.dss = dss;
    window.sseq = Sseq.getSseqFromDisplay(dss);
    dss.offset_size = 0.2;
    dss._getXOffset = tools.fixed_tower_xOffset.bind(dss);
    dss._getYOffset = () => 0;

    // let decomposable_classes = sseq.classes.filter(c => c.structlines.some( sl => sl.visible && otherClass(sl, c).y < c.y && c.x > 8));
    //
    // tools.straightenTowers(sseq);
    // for(let c of decomposable_classes){
    //     c.name = "";
    //     sseq.updateClass(c);
    // }
    //
    // for(let sl of sseq.structlines){
    //     let disp = sl.target.x - sl.source.x;
    //     sl.mult = {0 : "h_0", 1 : "h_1", 3 : "h_2"}[disp];
    //     sl.display_edge.mult = sl.mult;
    // }
    //
    // tools.addProductNames(sseq, "h_0");
    // tools.addProductNames(sseq, "h_1");
    // tools.addProductNames(sseq, "h_2");




    tools.install_edit_handlers(dss,"ASS-S_2");


    dss.display();
});
