"use strict";
// Name: Slice SS $BP^{((C_8))}\langle 1\rangle$
// Description: The slice spectral sequence for the $C_8$ fixed points of $BP^{((C_8))}\langle 1\rangle$ (computation in progress).

let VERSION = 0;
let sseq_name = "BPC8-1";
let sseq_filename = "BPC8-1-all";

let t0 = performance.now();
let tp5 = t0;
function getTime(){
    let t = tp5;
    tp5 = performance.now();
    return (tp5 - t) / 1000;
}

let differential_colors = {
    13: "#34eef3",//"cyan",//
    15: "#ff00ff",//"magenta", //
    19: "#7fe900", // LimeGreen
    21: "blue",
    23: "orange",
    27: "#14e01b", // ForestGreen
    29: "red",
    31: "pink",
    35: "#ffb529", // Dandelion
    43: "#ff3b21",  // RedOrange
    51: "#22f19f",
    53: "#8000ff", // Plum
    55: "#0f75ff", // NavyBlue
    59: "#8c2700", // Raw Sienna
    61: "black"
};

let Groups = {};
let SseqNode = Node;
Groups.Z = new SseqNode();
Groups.Z.fill = "white";
Groups.Z.color = false;
Groups.Z.shape = Shapes.square;
Groups.Z.size = 8;

Groups["Z/2"] = new SseqNode();

Groups["Z/4"] = new SseqNode();
Groups["Z/4"].size = 8;
Groups["Z/4"].fill = "white";
Groups["Z4"] = Groups["Z/4"];

Groups.Z2sup = Groups.Z4.copy();
Groups.Z2sup.fill = "red";

Groups.Z2hit = Groups.Z4.copy();
Groups.Z2hit.fill = "gray";

Groups["2Z"] = Groups.Z.copy();
Groups["2Z"].fill = "red";

Groups["4Z"] = Groups.Z.copy();
Groups["4Z"].fill = "black";


IO.loadFromServer(getJSONFilename(sseq_filename)).then(function(json){
    console.log(`Read JSON in ${getTime()} seconds.`);
    window.classes = {};
    classes.all = new StringifyingMap();
    classes.induced = new StringifyingMap();
    classes.surviving = new StringifyingMap();
    classes.truncation = new StringifyingMap();
    window.sseq = new Sseq();
    sseq.name = sseq_name;
    json.max_x = 250;
    json.max_y = 250;
    window.max_x = json.max_x;
    window.max_y = json.max_y;
    window.max_diagonal = json.max_diagonal;
    sseq.xRange = [0, max_x];
    sseq.yRange = [0, max_y];

    let y_initial = 30;
    sseq.initialxRange = [0, Math.floor(16/9 * y_initial)];
    sseq.initialyRange = [0, y_initial];
    sseq.class_scale = 0.4;
    let dss = sseq.getDisplaySseq();
    dss.squareAspectRatio = true;

    for(let o of json.classes){
        if(o.color == "blue" && o.group_list.length === 1){
            continue;
        } 
        let c = sseq.addClass(o.x, o.y);
        o.class = c;
        c.name = o.name;
        c.color = o.color;
        c.page_list = o.page_list;
        c.group_list = o.group_list;
        c.extra_info = o.extra_info;
        let start_node = c.node_list[0];
        c.node_list = [];
        for(let group of c.group_list) {
            if(group === "0"){
                continue;
            }
            let node = Node.merge(start_node, Groups[group]);
            node.setColor(c.color);
            c.node_list.push(node);
        }
    }

    for(let d of json.differentials){
        sseq.addDifferential(json.classes[d.source].class, json.classes[d.target].class, d.page, false)
            .setColor(differential_colors[d.page])
            .addInfoToSourceAndTarget();
    }
    
    for(let c of sseq.getClassesInDegree(247,215)){
        if(c.getColor()==="pink"){
            c.setPage(43);
        }
    }


    sseq.updateAll();
    dss.display('#main');
    console.log(`Rendered in ${getTime()} seconds.`);
}).catch(err => console.log(err));