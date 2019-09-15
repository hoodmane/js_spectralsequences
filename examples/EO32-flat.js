let sseq_name = "EO32";
let sseq_filename = "EO32";

Zq = new Node();
Zq.shape = Shapes.square;
Zq.scale = 1.3;

qZq = Zq.copy();
qZq.fill = "white";
qZq.stroke = "black";

Zmq = new Node();
Zmq.shape = Shapes.circle;

let t0 = performance.now();
let tp5 = t0;
function getTime(){
    let t = tp5;
    tp5 = performance.now();
    return (tp5 - t) / 1000;
}

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
    window.max_diagonal = json.max_diagonal;
    sseq.xRange = [-50, 1000];
    sseq.yRange = [0, 30];
    sseq.initialxRange = [0, 54];
    sseq.initialyRange = [0, 30];

    let y_initial = 30;
    sseq.initialxRange = [0, Math.floor(16/9 * y_initial)];
    sseq.initialyRange = [0, y_initial];
    sseq.squareAspectRatio = true;
    console.log(json);
    for(let o of json.classes){
        // console.log([o.x,o.y]);
        let c = sseq.addClass(o.x, o.y);
        o.class = c;
        c.name = o.name;
        c.color = o.color;
        c.page_list = o.page_list;
        c.setNode(Zq,0);
        c.getNode(0).fill = o.color;
        if(o.node_list_length > 1){
            if(c.y < 10){
                c.node_list.push(qZq.copy());
            } else {
                c.node_list.push(Zmq.copy());
            }
        }
    }


    for(let d of json.differentials){
        let dn = sseq.addDifferential(json.classes[d.source].class, json.classes[d.target].class, d.page, false)
        // dn.setColor(differential_colors[d.page]);
        // dn.addInfoToSourceAndTarget();
    }

    for(let sl of json.structlines){

    }
    new BasicDisplay("#main", sseq);
});
