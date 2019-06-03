// Name: Slice SS $BP^{((C_4))}\langle 2\rangle$
// Description: The slice spectral sequence for the $C_4$ fixed points of $BP^{((C_4))}\langle 2\rangle$.

let VERSION = 0;


let t0 = performance.now();
let tp5 = t0;
function getTime(){
    let t = tp5;
    tp5 = performance.now();
    return (tp5 - t) / 1000;
}



Display.enableFontAwesome();
window.sseq = new Sseq();
window.undo = new Interface.Undo(sseq);

let layout = document.createElement("div");
layout.id = "layout";
document.body.appendChild(layout);
d3.select("#layout")
    .style("height", "100vh")
    .style("width", "100vw");

$('#layout').w2layout({
    name: 'layout',
    panels: [
        {
            type: 'main', style: 'background-color: #FFFFFF; padding: 5px;'
        },
        {
            type: 'right', size: 400, resizable: true, style: 'background-color: #ffffff; border-left: 0px;',
            hidden      : true
        }
    ]
});

$('#main')[0].id = '';
$('#layout_layout_panel_right').css('border-left', '1px solid silver');
let el = w2ui['layout'].el('main');
el.id = "main";


let grid_config = {
    name: 'grid',
    show: {
        toolbar: true,
        toolbarDelete : true,
        toolbarReload : false
    },
    multiSearch: false,
    toolbar: {
        style: 'background-color: #ffffff;',
        items: [
            {type: 'spacer' },
            {
                type: 'button', id: 'close', icon: 'fa fa-window-close', hint: 'Close sidebar',
                onClick: () => w2ui.layout.hide('right')
            }
        ]
    },
    columns: [
        { field: 'source', caption: 'Source', size: '100px', sortable: true, searchable: true },
        { field: 'target', caption: 'Target', size: '100px', sortable: true, searchable: true },
        { field: 'page', caption: 'Page', size: '43px', sortable: true, searchable: true },
        { field: 'offset_vectors', caption: 'Leibniz Vectors', size: '50%' }
    ],
    onSelect : function(event){
        let recids = event.recids;
        if(!event.multiple){
            let recid = Number.parseInt(event.recid);
            differential_family.current_differential = differential_family.rec_id_map.get(recid);
            recids = [event.recid];
        }
        recids = recids.map(a => Number.parseInt(a)).filter(a => a);
        for(let recid of recids){
            recid = Number.parseInt(recid);
            differential_family.rec_id_map.get(recid).select();
        }
        sseq.update();
    },
    onUnselect : function(event){
        console.log(event);
        let recids = event.recids;
        if(!event.multiple){
            recids = [event.recid];
        }
        recids = recids.map(a => Number.parseInt(a)).filter(a => a);
        for(let recid of recids){
            differential_family.rec_id_map.get(recid).unselect();
            if(differential_family.current_differential && differential_family.current_differential.recid === recid){
                differential_family.current_differential = undefined;
            }
        }
        sseq.update();
    }
};
w2ui.layout.content('right', $().w2grid(grid_config));
w2ui.grid.toolbar.set('w2ui-delete', {'tooltip' : 'Delete selected differentials'});
w2ui.grid.msgDelete = "Are you sure you want to delete the selected differentials?";

w2ui.grid.on('delete', function(event) {
    if(!event.force){
        onDeleteQuery()
    } else {
        w2ui.grid.message();
        onDelete(w2ui.grid.getSelection())
    }
});

function onDeleteQuery(){
    setTimeout(function () {
        $(w2ui.grid.box).find('input, textarea, select, button').on('keydown.message', function (evt) {
            if (evt.keyCode === 27) { // esc
                w2ui.grid.message();
            }
            if(evt.keyCode === 13) {// enter
                w2ui.grid.delete(true);
            }
        });
    }, 25);
}

function onDelete(recids){
    undo.startMutationTracking();
    for(let recid of recids){
        let df = differential_family.rec_id_map.get(recid);
        df.delete();
        df.unselect();
        let e = {action: "delete", args : {recid : recid}};
        undo.addMutation(df, e, e);
    }
    undo.addMutationsToUndoStack({action: "delete", args : {recids : recids}});
}

function openGrid() {
    w2ui.layout.show('right');
    w2ui.grid.refresh();
}

class differential_family {
    // o.source and o.target are DISPLAY classes. This is so they are serializable.
    constructor(o){
        console.log(o);
        this.recid = differential_family.next_rec_id;
        differential_family.next_rec_id ++;
        this.page = o.page;
        this.source_type = o.source_type;
        this.source_position = o.source_position;
        this.source_index = o.source_index;
        this.target_type = o.target_type;
        this.target_position = o.target_position;
        this.target_index = o.target_index;
        this.offset_vectors = o.offset_vectors || [];
        this.offset_vector_ranges = o.offset_vector_ranges || [];
        this.liebnized_differentials = [];
        this.invalid = false;

        let source = classes[this.source_type].get(this.source_position)[this.source_index];
        let target = classes[this.target_type].get(this.target_position)[this.target_index];

        this.root_differential  = sseq.addDifferential(source, target, this.page);
        this.color = this.root_differential.color;
        differential_family.list.push(this);
        differential_family.rec_id_map.set(this.recid, this);
        differential_family.current_differential = this;
        let rec_obj = this.getRecordObject();
        w2ui.grid.add(rec_obj);
        if(!w2ui.layout.get("right").hidden){
            w2ui.grid.select(rec_obj.recid);
        }
    }

    toJSON(){
        let o = {};
        o.recid = this.recid;
        o.page = this.page;
        o.source_position = this.source_position;
        o.source_type = this.source_type;
        o.source_index = this.source_index;
        o.target_position = this.target_position;
        o.target_type = this.target_type;
        o.target_index = this.target_index;
        o.offset_vectors = this.offset_vectors;
        o.offset_vector_ranges = this.offset_vector_ranges;
        o.invalid = this.invalid;
        return o;
    }

    getRecordObject(){
        let o = {};
        o.recid = this.recid;
        o.page = this.page;
        display.updateNameHTML(this.root_differential.source);
        display.updateNameHTML(this.root_differential.target);
        o.source = this.root_differential.source.name_html;
        o.target = this.root_differential.target.name_html;
        o.offset_vectors = JSON.stringify(this.offset_vectors).slice(1,-1);
        return o;
    }

    static refreshRecords(){
        for(let df of differential_family.list){
            if(df.invalid){
                continue;
            }
            let o = df.getRecordObject();
            if(w2ui.grid.get(o.recid)){
                w2ui.grid.set(o.recid, o)
            } else {
                w2ui.grid.add(o);
            }
        }
        w2ui.grid.select(differential_family.list.filter(df => df.selected).map(df => df.recid));
        sseq.update();
    }


    select(){
        if(this.selected){
            return;
        }
        this.selected = true;
        this.root_differential.color = differential_family.root_selected_color;
        sseq.updateEdge(this.root_differential);
        for(let d of this.liebnized_differentials){
            d.color = differential_family.selected_color;
            sseq.updateEdge(d);
        }
    }

    unselect(){
        if(!this.selected){
            return;
        }
        this.selected = false;
        for(let d of this.liebnized_differentials.concat([this.root_differential])){
            d.color = this.color;
            sseq.updateEdge(d);
        }
    }

    static selectNone(){
        for(let df of differential_family.list){
            df.unselect();
        }
    }

    updateDifferentials(){
        let o = this.getRecordObject();
        w2ui.grid.set(o.recid, o);
        w2ui.grid.refresh();

        for(let d of this.liebnized_differentials){
            d.delete();
        }

        this.liebnized_differentials = [];
        if(this.offset_vectors.length === 0){
            return; // Note the early return -- any logic that should always happen needs to go up top.
        }
        for(let exponent_vector of product(...this.offset_vectors.map( v => range(0,50)))){
            let cur_source = this.source_position;
            let source_degree = vectorSum(cur_source, vectorLinearCombination(this.offset_vectors, exponent_vector));
            let target_degree = vectorSum(source_degree, [-1,this.page]);
            let source_class_list = classes[this.source_type].get(source_degree);
            let target_class_list = classes[this.target_type].get(target_degree);
            console.log("source_class_list:", source_class_list);
            let source_index = Math.min(this.source_index, source_class_list.length - 1);
            let target_index = Math.min(this.target_index, target_class_list.length - 1);
            console.log("source_index:", source_index);
            console.log("target_index:", target_index);
            if(source_index < 0 || target_index < 0){
                continue;
            }
            let sourceClass = source_class_list[source_index];
            let targetClass = target_class_list[target_index];
            let d = sseq.addDifferential(sourceClass, targetClass, this.page);
            this.liebnized_differentials.push(d);
            if(this.selected){
                d.color = differential_family.selected_color;
                sseq.updateEdge(d);
            }
        }
        sseq.update();
    }

    delete(){
        if(this.invalid === true){
            return;
        }
        this.invalid = true;
        for(let d of this.liebnized_differentials){
            d.delete();
        }
        this.root_differential.delete();
        w2ui.grid.remove(this.recid);
        differential_family.refreshRecords();
        w2ui.grid.refresh();
        sseq.update();
    }

    restore(){
        if(!this.invalid){
            return;
        }
        this.invalid = false;

        for(let d of this.liebnized_differentials){
            d.revive();
        }
        this.root_differential.revive();
        let o = this.getRecordObject();
        w2ui.grid.add(o);
        differential_family.refreshRecords();
        w2ui.grid.refresh();
        sseq.update();
    }

    // getMemento(){
    //     if(this.invalid){
    //         return {invalid: true};
    //     }
    //     let result = {};
    //     result.offset_vectors = this.offset_vectors.map(v => v.slice());
    //     result.offset_vector_ranges = this.offset_vector_ranges.map(v => v.slice());
    //     return result;
    // }

    // restoreFromMemento(o){
    //     if(o.invalid){
    //         this.delete();
    //         return;
    //     }
    //     if(this.invalid){
    //         this.restore();
    //         return;
    //     }
    //     this.offset_vectors = o.offset_vectors;
    //     this.offset_vector_ranges = o.offset_vector_ranges;
    //     this.updateDifferentials();
    // }

    undoFromMemento(e){
        let df = this;
        const undoDict = {
            new : function(){
                df.delete()
            },
            leibniz : function(e){
                df.offset_vectors.pop();
                df.offset_vector_ranges.pop();
                df.updateDifferentials();
            },
            delete : function(){
                df.restore();
            }
        };
        undoDict[e.action](e);
    }

    redoFromMemento(e){
        let df = this;
        const redoDict = {
            new : function(){
                df.restore()
            },
            leibniz : function(e){
                df.offset_vectors.push(e.args.vector);
                df.offset_vector_ranges.push(e.args.range);
                df.updateDifferentials();
            },
            delete : function(){
                df.delete();
            }
        };
        redoDict[e.action](e);
    }

    static getSaveObject(){
        let result = {};
        result.version = VERSION;
        result.history = undo.toJSON();
        result.differentials = differential_family.list;
        result.next_rec_id = differential_family.next_rec_id;
        return result;
    }
}

differential_family.list = [];
differential_family.next_rec_id = 1;
differential_family.rec_id_map = new Map();
differential_family.root_selected_color = "red";
differential_family.selected_color = "black";





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

IO.loadFromServer(getJSONFilename("BPC8-1-E13")).then(function(json){
    Display.addLoadingMessage(`Read JSON in ${getTime()} seconds.`);
    window.classes = {};
    classes.all = new StringifyingMap();
    classes.induced = new StringifyingMap();
    classes.surviving = new StringifyingMap();
    classes.truncation = new StringifyingMap();
    window.sseq = new Sseq();
    sseq.name = "BPC8-1";
    window.max_x = json.max_x;
    window.max_y = json.max_y;
    window.max_diagonal = json.max_diagonal;
    sseq.xRange = [0, max_x];
    sseq.yRange = [0, max_y];

    y_initial = 120;
    sseq.initialxRange = [0, Math.floor(16/9 * y_initial)];
    sseq.initialyRange = [0, y_initial];
    sseq.class_scale = 0.4;
    dss = sseq.getDisplaySseq();
    dss.squareAspectRatio = true;

    // sseq.initialxRange = [0, Math.floor(16 / 9 * 40)];
    // sseq.initialyRange = [0, 40];
    // sseq.class_scale = 0.75;

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
        c.type = o.type;
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
        if(!classes[o.type].has([c.x, c.y])){
            classes[o.type].set([c.x, c.y], []);
        }
        let entry = classes[o.type].get([c.x,c.y]);
        c.classes_index = entry.length;
        entry.push(c);
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
        for (let diag = 4; diag < 2*json.max_diagonal; diag += 4) {
            context.moveTo(xScale(diag + 2), yScale(-2));
            context.lineTo(xScale(-2), yScale(diag + 2));
        }
        context.stroke();
        context.restore();
        // context.save();
        // context.beginPath();
        // context.lineWidth = 1;
        // context.strokeStyle = "#9d9d9d";
        // // vanishing lines
        // for (let y of [3, 7, 15, 31, 61]) {
        //     context.moveTo(xScale(-2), yScale(y));
        //     context.lineTo(xScale(max_diagonal), yScale(y));
        // }
        // context.moveTo(xScale(-1), yScale(-1));
        // context.lineTo(xScale(max_diagonal), yScale(max_diagonal));
        // context.moveTo(xScale(-1), yScale(-3));
        // context.lineTo(xScale(max_diagonal / 3), yScale(max_diagonal));
        // context.stroke();
        // context.restore();
        context = display.supermarginLayerContext;
    });
    sseq.initial_page_idx = 0;

    // addDifferentialsLogic();
    for(let o of json.differentials){
        let source = classes[o.source_type].get(o.source_position)[o.source_index];
        let target = classes[o.target_type].get(o.target_position)[o.target_index];
        sseq.addDifferential(source, target, o.page);
    }
    Display.addLoadingMessage(`Added differentials in ${getTime()} seconds.`);
    document.getElementById("loading").style.display =  "none";
    sseq.display();
    // IO.download("BPC8-1.svg", display.toSVG());
    Display.addLoadingMessage(`Displayed in ${getTime()} seconds.`);
    let t1 = performance.now();
    console.log("Rendered in " + (t1 - t0)/1000 + " seconds.");
}).catch((err) => console.log(err)).then(() => IO.loadFromLocalStore("BPC4-2-differentials"))
    .then((json) =>{
        setupDifferentialInterface(json);
    }).catch(err => {
    console.log(err);
    setupDifferentialInterface();
});

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



function setupDifferentialInterface(json){
    if(!json || json.version === undefined || json.version < VERSION){
        if(json) {
            console.log("discarding old version.");
            console.log(json);
        }
        json = {history : [], differentials : []};
    }
    window.json = json;
    let dfamilies = json.differentials;
    dfamilies = dfamilies.map( o => new differential_family(o));
    for(let df of dfamilies){
        df.updateDifferentials();
    }
    for(let e of json.history){
        if(e.type === "normal"){
            undo.startMutationTracking();
            for(let kv of e.mutations){
                undo.addMutation(differential_family.rec_id_map.get(kv[0]), kv[1], kv[1]);
            }
            undo.addMutationsToUndoStack();
        } else {
            e.undoFunction = Interface.Undo.undoFunctions[e.type].bind(undo);
            e.redoFunction = Interface.Undo.redoFunctions[e.type].bind(undo);
            undo.undoStack.push(e);
        }
    }
    if(json.history.length !== 0) {
        undo.addLock();
    }

    differential_family.current_differential = undefined;
    window.dss = sseq.getDisplaySseq();

    dss.addEventHandler('s', function(event) {
            const c = event.mouseover_class;
            console.log(c);
            if (!c) {
                return
            }
            dss.temp_source_class = c;
            display.updateNameHTML(c);
            let name = c.name_html;
            display.setStatus(`Adding differential. Source: ${name}`);
        }
    );


    dss.addEventHandler('t', function (event) {
        if(event.mouseover_class && dss.temp_source_class){
            let s = dss.temp_source_class;
            let t = event.mouseover_class;
            if(s.x !== t.x + 1){
                return;
            }
            let length = t.y - s.y;
            display.updateNameHTML(s);
            display.updateNameHTML(t);
            let sourcename = s.name_html;
            let targetname = t.name_html;
            let source = sseq.display_class_to_real_class.get(s);
            let target = sseq.display_class_to_real_class.get(t);
            w2confirm(`Add d_${length} differential from ${sourcename} to ${targetname}`).yes(() =>{
                let o = {
                    page: length,
                    source_type: source.type,
                    source_position: [source.x, source.y],
                    source_index: source.classes_index,
                    target_type: target.type,
                    target_position: [target.x, target.y],
                    target_index: target.classes_index,
                    offset_vectors : [],
                    offset_vector_ranges : []
                };
                let df = new differential_family(o);
                undo.startMutationTracking();
                let event = {action: "new", args : o};
                undo.addMutation(df, event, event);
                undo.addMutationsToUndoStack(event);
                dss.update();
                dss.temp_source_class = undefined;
                display.setStatus("");
                differential_family.selectNone();
                df.select();
            });
        }
    });



    dss.addEventHandler('l',  (event) => {
        let df = differential_family.current_differential;
        let c = event.mouseover_class;
        if (!c || !df) {
            return;
        }
        let dx = c.x;// - dss.most_recent_differential.source.x;
        let dy = c.y;// - dss.most_recent_differential.source.y;
        if(df.offset_vectors.map(JSON.stringify).includes(JSON.stringify([dx, dy]))){
            return;
        }
        if(confirm(`Leibniz along vector [${dx},${dy}]?`)){
            undo.startMutationTracking();
            df.offset_vectors.push([dx,dy]);
            df.offset_vector_ranges.push([0,20]);
            df.updateDifferentials();
            let event = {action: "leibniz", args : {vector:[dx, dy], range: [0,20]}};
            undo.addMutation(df, event, event);
            undo.addMutationsToUndoStack(event);
            sseq.update();
        }
    });



    dss.addEventHandler("d", (event) => {
        display.setStatus("Saving...");
        console.log(differential_family.list);
        IO.saveToLocalStore("BPC4-2-differentials", differential_family.getSaveObject());
        // IO.download("BPC4-2-differentials.json", differential_family.getSaveObject());
        console.log("Saved.");
        display.setStatus("Saved.");
        display.delayedSetStatus("", 2000);
    });

    dss.addEventHandler("D", (event) => {
        display.setStatus("Saving...");
        console.log(differential_family.list);
        IO.saveToLocalStore("BPC4-2-differentials", differential_family.getSaveObject());
        IO.download("BPC4-2-differentials.json", differential_family.getSaveObject());
        console.log("Saved.");
        display.setStatus("Saved.");
        display.delayedSetStatus("", 2000);
    });

    dss.addEventHandler("Q",(event)=>{
        sseq.downloadSVG();
    });

    dss.addEventHandler('o', (event) => {
        openGrid();
    });

    dss.addEventHandler('z', (event) => {
        undo.undo();
    });

    dss.addEventHandler("ctrl+z", undo.undo);
    dss.addEventHandler("ctrl+shift+z", undo.redo);

    sseq.updateAll();
    dss.display();
    setTimeout(() => differential_family.refreshRecords(), 500);
    w2ui.layout.onResize = function onResize(event) {
        event.onComplete = function onResizeComplete(){
            display.resize();
        }
    };
}

