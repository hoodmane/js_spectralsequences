// Name: Slice SS $BP^{((C_4))}\langle 2\rangle$
// Description: The slice spectral sequence for the $C_4$ fixed points of $BP^{((C_4))}\langle 2\rangle$.


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
Groups.Z.shape = Shapes.square;
Groups.Z.size = 8;

Groups.Z2 = new SseqNode();

Groups.Z4 = new SseqNode();
Groups.Z4.size = 8;
Groups.Z4.fill = "white";

Groups.Z2sup = Groups.Z4.copy();
Groups.Z2sup.fill = "red";

Groups.Z2hit = Groups.Z4.copy();
Groups.Z2hit.fill = "gray";

Groups.Zsup = Groups.Z.copy();
Groups.Zsup.fill = "red";

Groups.Zsupsup = Groups.Z.copy();
Groups.Zsupsup.fill = "black";

IO.loadFromServer(getJSONFilename("BPC4-2-E13")).then(function(json){
    Display.addLoadingMessage(`Read JSON in ${getTime()} seconds.`);
    window.classes = {};
    classes.induced = new StringifyingMap();
    classes.surviving = new StringifyingMap();
    classes.truncation = new StringifyingMap();
    window.sseq = new Sseq();
    window.max_x = json.max_x;
    window.max_y = json.max_y;
    window.max_diagonal = json.max_diagonal;
    sseq.xRange = [0, max_x];
    sseq.yRange = [0, max_y];

    sseq.initialxRange = [0, Math.floor(16 / 9 * 40)];
    sseq.initialyRange = [0, 40];
    sseq.class_scale = 0.75;
    for(let o of json.truncation_classes) {
        o.type = "truncation";
    }
    for(let o of json.induced_classes) {
        o.type = "induced";
    }
    for(let o of json.surviving_classes) {
        o.type = "surviving";
        if(o.color === "blue"){
            o.type = "truncation";
        }
    }
    let color_to_group = {
        "white" : "Z",
        "red"   : "2Z",
        "black" : "4Z"
    };
    for(let o of json.truncation_classes.concat(json.induced_classes, json.surviving_classes)){
        if(o.type === "induced" && classes[o.type].has([o.x, o.y])){
            continue;
        }
        let c = sseq.addClass(o.x, o.y);
        c.original_obj = o;
        c.name = o.name;
        c.extra_info = o.extra_info;
        c.getNode().setColor(o.color).setFill(o.fill);
        if(o.y === 0){
            c.setShape(Shapes.square);
            c.group = color_to_group[o.fill];
        } else if(o.fill !== true){
            c.getNode().setSize(8);
            c.group = o.fill === "white" ? "Z/4" : "Z/2";
        } else {
            c.group = "Z/2";
        }
        classes[o.type].set([c.x,c.y], c);
    }
    Display.addLoadingMessage(`Added classes in ${getTime()} seconds.`);

    sseq.onDifferentialAdded(d => {
        d.addInfoToSourceAndTarget();
        if (d.source.group === "Z/4") {
            d.source.group = "Z/2";
            d.source.replace(Groups.Z2sup, (name) => "2\\," + name);
            d.source.setColor(d.source.getColor(0));
        } else if (d.source.group === "Z") {
            d.source.group = "2Z";
            d.source.replace(Groups.Zsup, (name) => "2\\," + name);
        } else if (d.source.group === "2Z") {
            d.source.group = "4Z";
            d.source.replace(Groups.Zsupsup);
        }

        if (d.target.group === "Z/4") {
            d.target.group = "Z/2";
            d.target.replace(Groups.Z2hit);
            d.target.setColor(d.target.getColor(0));
        }
        d.color = differential_colors[d.page];
    });

    sseq.onDraw((display) => {
        let context = display.edgeLayerContext;
        context.clearRect(0, 0, this.width, this.height);
        context.save();
        context.lineWidth = 0.3;
        context.strokeStyle = "#818181";
        let xScale = display.xScale;
        let yScale = display.yScale;
        // Truncation lines
        for (let diag = 12; diag < json.max_diagonal; diag += 12) {
            context.moveTo(xScale(diag + 2), yScale(-2));
            context.lineTo(xScale(-2), yScale(diag + 2));
        }
        context.stroke();
        context.restore();
        context.save();
        context.beginPath();
        context.lineWidth = 1;
        context.strokeStyle = "#9d9d9d";
        // vanishing lines
        for (let y of [3, 7, 15, 31, 61]) {
            context.moveTo(xScale(-2), yScale(y));
            context.lineTo(xScale(max_diagonal), yScale(y));
        }
        context.moveTo(xScale(-1), yScale(-1));
        context.lineTo(xScale(max_diagonal), yScale(max_diagonal));
        context.moveTo(xScale(-1), yScale(-3));
        context.lineTo(xScale(max_diagonal / 3), yScale(max_diagonal));
        context.stroke();
        context.restore();
        context = display.supermarginLayerContext;
    });
    sseq.initial_page_idx = 0;

    // addDifferentialsLogic();
    for(let o of json.differentials){
        o.target = [];
        o.target[0] = o.source[0] - 1;
        o.target[1] = o.source[1] + o.page;
        let source = classes[o.source_type].get(o.source);
        let target = classes[o.target_type].get(o.target);
        sseq.addDifferential(source, target, o.page);
    }
    Display.addLoadingMessage(`Added differentials in ${getTime()} seconds.`);
    document.getElementById("loading").style.display =  "none";
    sseq.display("#main");
    Display.addLoadingMessage(`Displayed in ${getTime()} seconds.`);
    let t1 = performance.now();
    console.log("Rendered in " + (t1 - t0)/1000 + " seconds.");
}).catch((err) => console.log(err));

function addDifferentialsLogic(){

    for (let v = 16; v < max_diagonal; v += 32) {
        for (let i = 0; i < max_diagonal; i++) {
            let d = sseq.addDifferential(classes.induced.get([v + i, i]), classes.induced.get([v + i - 1, i + 15]), 15);
            if (d.isDummy()) {
                break;
            }
            if (i === 0) {
                d.replaceSource(Groups.Zsup).source.setColor("pink");
            } else if (i <= 6) {
                d.replaceSource(Groups.Z2).source.setColor("pink");
            }
            d.replaceTarget(Groups.Z2).target.setColor("pink");
            d.color = "pink"
        }
    }

    function addDifferential(page, source, offset_vectors, offset_vector_ranges, source_class_dict = classes.truncation, target_class_dict = classes.truncation) {
        if (!Array.isArray(source[0])) {
            source = [source];
        }
        for (let exponent_vector of product(source, ...offset_vector_ranges.map(r => range(...r)))) {
            let cur_source = exponent_vector.splice(0, 2);
            let source_degree = vectorSum(cur_source, vectorLinearCombination(offset_vectors, exponent_vector));
            let target_degree = vectorSum(source_degree, [-1, page]);
            let sourceClass = source_class_dict.get(source_degree);
            let targetClass = target_class_dict.get(target_degree);
            sseq.addDifferential(sourceClass, targetClass, page);
        }
    }

    addDifferential(13, [[10, 14], [24, 24], [41, 43]], [[3, 9], [48, 48]], [[0, 30], [0, 10]]);
    addDifferential(13, [[20, 4], [27, 9], [37, 23], [39, 21]], [[24, 24], [16, -16], [96, 0]], [[0, 10], [0, 3], [0, 10]]);

    addDifferential(15, [20, 4], [[12, 12], [16, -16]], [[0, 25], [0, 20]]);
    addDifferential(15, [40, 8], [[24, 24], [32, -32]], [[0, 15], [0, 10]]);
    addDifferential(15, [28, 12], [[24, 24], [16, -16]], [[0, 15], [0, 10]], classes.truncation, classes.induced);

    addDifferential(19, [[27, 11]], [[24, 24], [8, -8]], [[0, 20], [0, 20]]);
    addDifferential(19, [34, 14], [[12, 12], [28, -4]], [[0, 20], [0, 10]], classes.truncation, classes.induced);

    addDifferential(21, [[47, 13]], [[24, 24], [28, -4]], [[0, 10], [0, 10]]);
    addDifferential(23, [[48, 16]], [[24, 24], [32, -32]], [[0, 15], [0, 10]]);
    addDifferential(27, [[43, 19], [63, 23]], [[24, 24], [56, -8]], [[0, 10], [0, 10]]);
    addDifferential(29, [[32, 0], [33, 3], [34, 6], [41, 11], [46, 2], [49, 19], [50, 22], [54, 10], [61, 15]], [[24, 24], [32, -32]], [[0, 20], [0, 20]]);

    addDifferential(31, [[32, 0]], [[1, 1], [64, 0]], [[0, max_diagonal], [0, 10]], classes.induced, classes.induced);
    addDifferential(31, [[40, 8]], [[24, 24], [56, -8]], [[0, 10], [0, 10]], classes.truncation, classes.induced);
    addDifferential(31, [[80, 16]], [[48, 48], [56, -8]], [[0, 10], [0, 10]], classes.truncation, classes.induced);

    addDifferential(35, [[55, 7]], [[24, 24], [32, -32]], [[0, 15], [0, 10]]);
    addDifferential(43, [[55, 23]], [[48, 48]], [[0, 10]], classes.induced, classes.truncation);
    addDifferential(51, [111, 15], [[48, 48], [8, -56]], [[0, 10], [0, 10]], classes.induced, classes.truncation);
    addDifferential(53, [[52, 4], [69, 23], [86, 42]], [[48, 48]], [[0, 10]]);
    addDifferential(55, [[156, 44]], [[48, 48], [8, -56]], [[0, 10], [0, 10]]);
    addDifferential(59, [[83, 27]], [[48, 48], [8, -56]], [[0, 10], [0, 10]]);

    addDifferential(61, [66, 6], [[48, 48]], [[0, 10]]);
    addDifferential(61, [97, 35], [[48, 48]], [[0, 10]]);
    addDifferential(61, [125, 15], [[48, 48]], [[0, 10]]);
    addDifferential(61, [142, 34], [[48, 48]], [[0, 10]]);
    addDifferential(61, [153, 27], [[48, 48]], [[0, 10]]);
    addDifferential(61, [170, 46], [[48, 48]], [[0, 10]]);
    addDifferential(61, [181, 7], [[48, 48]], [[0, 10]]);
    addDifferential(61, [198, 26], [[48, 48]], [[0, 10]]);
    addDifferential(61, [209, 19], [[48, 48]], [[0, 10]]);
    addDifferential(61, [226, 38], [[48, 48]], [[0, 10]]);
    addDifferential(61, [[254, 18], [265, 11], [282, 30], [285, 47], [310, 10], [321, 3], [338, 22], [341, 39], [366, 2], [394, 14], [397, 31]], [[48, 48]], [[0, 10]]);
}

window.saveTruncationSseq = function saveTruncationSseq(){
    max_x = sseq.xRange[1];
    max_y = sseq.yRange[1];
    let result = {};
    result.max_diagonal = max_diagonal;
    result.max_x = max_x;
    result.max_y = max_y;
    result.truncation_classes = [];
    result.induced_classes = [];
    result.surviving_classes = [];
    result.differentials = [];
    let class_map = new StringifyingMap();
    let classes = new Set(sseq.getClasses().filter(c =>  c.x <= max_x && c.y <= max_y));
    let differentials = sseq.getDifferentials().filter(d => d.source.x <= max_x + 1 && d.source.y <= max_y);
    for(let d of differentials){
        classes.add(d.target);
        if(d.source.x === max_x + 1){
            classes.add(d.source);
        }
    }
    classes = Array.from(classes);

    for(let c of classes) {
        let o = {};
        o.color = c.getColor(0);
        o.fill = c.getNode(0).fill;
        o.name = c.name;
        o.x = c.x;
        o.y = c.y;
        o.extra_info = c.extra_info.split("\n").filter(l => !l.startsWith("\\(d") && l !== "\\(\\)").join("\n");
        if(c.getColor(0) === "pink"){
            result.induced_classes.push(o);
            class_map.set(c, "induced");
        } else if(c.getColor(0) === "black"){
            result.surviving_classes.push(o);
        } else {
            result.truncation_classes.push(o);
            class_map.set(c, "truncation");
        }
    }
    for(let d of differentials){
        let o = {};
        o.source = [d.source.x, d.source.y];
        o.page = d.page;
        o.source_type = class_map.get(d.source);
        o.target_type = class_map.get(d.target);
        result.differentials.push(o);
    }
    return result;
};

