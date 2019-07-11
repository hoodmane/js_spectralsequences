
// Name: Slice SS $BP^{((C_8))}\langle 1\rangle$
// Description: The slice spectral sequence for the $C_8$ fixed points of $BP^{((C_8))}\langle 1\rangle$ (computation in progress).

let VERSION = 0;
let sseq_name = "BPC8-1";
let differential_local_store_key = `${sseq_name}-differentials`;
let differential_filename = differential_local_store_key + ".json";

class sliceMonomial {
    constructor(slice){
        this.da0 = 0;
        this.da1 = 0;
        this.d1 = 0;
        this.s1 = 0;
        this.sa1 = 0;
        this.sa0 = 0;
        this.as2 = 0;
        this.al = 0;
        this.as = 0;

        if(this.as > 0 || this.as2 > 0){
            this._group = "Z2";
        } else if(this.al > 0 ){
            this._group = "Z4";
        } else {
            this._group = "Z";
        }
    }

    copy(){
        let out = Object.create(sliceMonomial);
        out.__proto__ = sliceMonomial.prototype;
        Object.assign(out, this);
        return out;
    }

    degree(){
        return [this.stem, this.filtration];
    }

    getTuple(){
        return [this.da0, this.da1, this.s1, this.as2, this.al, this.as];
    }

    group(){
        return this._group;
    }

    is_induced(){
        return this._induced;
    }

    toString() {
        return monomialString(["\\overline{\\mathfrak{d}}_{a_0}","\\overline{\\mathfrak{d}}_{a_1}", "\\overline{s}_{a_0}", "\\overline{s}_{a_1}", "(\\overline{s}_{a_0}+\\overline{s}_{a_1})"],[this.da0, this.da1,this.sa0, this.sa1, this.s1]);
    }

    sliceName(){
        return monomialString(["\\overline{\\mathfrak{d}}_{a_0}","\\overline{\\mathfrak{d}}_{a_1}", "\\overline{s}_{a_0}", "\\overline{s}_{a_1}", "(\\overline{s}_{a_0}+\\overline{s}_{a_1})"],[this.da0, this.da1,this.sa0, this.sa1, this.s1]);
    }
}

function partitionList(list, part_size) {
    let out = [];
    for (i = 0; i < list.length; i += part_size) {
        out.push(list.slice(i, i + part_size).join(", "));
    }
    return out;
}

function ensureMath(str){
    if(str.startsWith("\\(") || str.startsWith("$")){
        return str;
    }
    if(!str){
        return "";
    }
    return "$" + str + "$";
}

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

document.getElementById("main").style.display = "none";

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

$('#layout_layout_panel_right').css('border-left', '1px solid silver');

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
        this.recid = differential_family.next_rec_id;
        differential_family.next_rec_id ++;
        this.page = o.page;
        this.source_type = o.source_type;
        this.source_position = o.source_position;
        this.source_slice = o.source_slice;
        this.target_type = o.target_type;
        this.target_position = o.target_position;
        this.target_slice = o.target_slice;
        this.offset_vectors = o.offset_vectors || [];
        this.offset_vector_ranges = o.offset_vector_ranges || [];
        this.leibniz_slices = o.leibniz_slices || [];
        this.liebnized_differentials = [];
        this.invalid = false;

        let source = classes[this.source_type].get(this.source_position).get(this.source_slice);
        let target = classes[this.target_type].get(this.target_position).get(this.target_slice);

        this.root_differential  = sseq.addDifferential(source, target, this.page);
        if(this.root_differential.isDummy()){
            console.log(this);
            console.log("source: ", source);
            console.log("target: ", target);
        }
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
        o.source_slice = this.source_slice;
        o.target_position = this.target_position;
        o.target_type = this.target_type;
        o.target_slice = this.target_slice;
        o.leibniz_slices = this.leibniz_slices;
        o.offset_vectors = this.offset_vectors;
        o.offset_vector_ranges = this.offset_vector_ranges;
        o.invalid = this.invalid;
        return o;
    }

    getRecordObject(){
        let o = {};
        o.recid = this.recid;
        o.page = this.page;
        if(!this.root_differential.source || !this.root_differential.target){
            console.log("problem");
            console.log(this);
            return;
        }
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
            d.source.group_list.pop();
            d.target.group_list.pop();
            d.delete();
        }

        this.liebnized_differentials = [];
        if(this.offset_vectors.length === 0){
            return; // Note the early return -- any logic that should always happen needs to go up top.
        }
        let ranges = product(...this.offset_vectors.map( v => range(0,15)));
        if(this.offset_vectors[0][0] == 1){
            ranges = product(range(0,50));
        }
        for(let exponent_vector of ranges){
            let cur_source = this.source_position;
            let source_degree = vectorSum(cur_source, vectorLinearCombination(this.offset_vectors, exponent_vector));
            let target_degree = vectorSum(source_degree, [-1,this.page]);
            // It's possible that the root source class is a "permanent cycle".
            // We probably should check both possibilities.
            let source_type = this.source_type;
            if(exponent_vector.every(e => e===0)){
                continue;
            }
            if(source_degree[1] > this.source_position[1]){
                source_type = "truncation";
            }
            let source_class_map = classes[source_type].get(source_degree);
            let target_class_map = classes[this.target_type].get(target_degree);
            if(!source_class_map || !target_class_map){
                continue;
            }

            let source_slice = dictionaryVectorSum(this.source_slice, dictionaryVectorLinearCombination(this.leibniz_slices, exponent_vector));
            let target_slice = dictionaryVectorSum(this.target_slice, dictionaryVectorLinearCombination(this.leibniz_slices, exponent_vector));

            let sourceClass = source_class_map.get(source_slice);
            let targetClass = target_class_map.get(target_slice);
            

            if(!sourceClass){
                console.log(`Failed to find Leibniz source with da0 = ${source_slice.da0} and da1 = ${source_slice.da1}.`);
                continue;
            }
            if(!targetClass){
                console.log(`Failed to find Leibniz target with da0 = ${target_slice.da0} and da1 = ${target_slice.da1}.`);
                continue;
            }
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
                df.leibniz_slices.pop();
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
                df.leibniz_slices.push(e.args.slice);
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
    addLoadingMessage(`Read JSON in ${getTime()} seconds.`);
    window.classes = {};
    classes.all = new StringifyingMap();
    classes.induced = new StringifyingMap();
    classes.surviving = new StringifyingMap();
    classes.truncation = new StringifyingMap();
    window.sseq = new Sseq();
    sseq.name = sseq_name;
    window.max_x = json.max_x;
    window.max_y = json.max_y;
    window.max_diagonal = json.max_diagonal;
    sseq.xRange = [0, max_x];
    sseq.yRange = [0, max_y];

    y_initial = 30;
    sseq.initialxRange = [0, Math.floor(16/9 * y_initial)];
    sseq.initialyRange = [0, y_initial];
    sseq.class_scale = 0.4;
    dss = sseq.getDisplaySseq();
    dss.squareAspectRatio = true;
    // this is to change the names of the induced classes after d15.
    dss.getClassTooltip = function(c, page){
        let tooltip = dss.getClassTooltipFirstLine(c);
        let extra_info = "";
        if(typeof c.extra_info == "string"){
            extra_info = c.extra_info;
        } else if(page <= 15){
            extra_info = c.extra_info[0];
        } else {
            extra_info = c.extra_info[1];
        }
        extra_info = extra_info.split("\n").map( x => ensureMath(x)).join("\n");
        tooltip += extra_info;
        return tooltip;
    };

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
        c.slice = o.slice;
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
        c.group_list = [c.group];
        if(!classes[o.type].has([c.x, c.y])){
            classes[o.type].set([c.x, c.y], new StringifyingMap(JSON.stringify));
        }
        let entry = classes[o.type].get([c.x,c.y]);
        c.classes_index = entry.length;
        entry.set(c.slice, c);
        if(c.type == "induced" && (c.x - c.y) % 32 === 16){
            c.setPage(15);
        } 
        if(c.type == "induced" && (c.x - c.y) % 32 === 0){
            let s = new sliceMonomial();
            let slices = [];
            if( (c.x + c.y) % 4 === 0){
                let i = (c.x+c.y)/4;
                slices = [[{ da0 : 3, da1 : i-4, sa0 : 2}, { da0 : 2, da1 : i-3, sa0 : 2},
                 { da0 : 1, da1 : i-2, sa0 : 2}, { da0 : 0, da1 : i-1, sa0 : 2}],
                 [{ da0 : 3, da1 : i-4, sa0 : 1, sa1 : 1}, { da0 : 2, da1 : i-3, sa0 : 1, sa1 : 1},
                 { da0 : 1, da1 : i-2, sa0 : 1, sa1 : 1}, { da0 : 0, da1 : i-1, sa0 : 1, sa1 : 1}],
                 [{ da0 : 1, da1 : i-3, sa0 : 3, sa1 : 1}, { da0 : 0, da1 : i-2, sa0 : 3, sa1 : 1}]
                ]
            } else {
                let i = (c.x+c.y-2)/4;
                slices = [
                    [{ da0 : 4, da1 : i-4, sa0 : 1}, { da0 : 3, da1 : i-3, sa0 : 1}, { da0 : 2, da1 : i-2, sa0 : 1},
                    { da0 : 1, da1 : i-1, sa0 : 1}, { da0 : 0, da1 : i, sa0 : 1}],
                    [{ da0 : 2, da1 : i-3, sa0 : 3}, { da0 : 1, da1 : i-2, sa0 : 3}, 
                    { da0 : 0, da1 : i-1, sa0 : 3}], 
                    [{ da0 : 2, da1 : i-3, sa0 : 2, sa1 : 1}, { da0 : 1, da1 : i-2, sa0 : 2, sa1 : 1}, 
                    { da0 : 0, da1 : i-1, sa0 : 2, sa1 : 1}]
                ]
            }
            let extra_info_page_15 = c.extra_info;
            c.extra_info = "";
            for(let slice_list of slices){
                let slice_names = [];
                for(let slice of slice_list){
                    Object.assign(s, slice);
                    slice_names.push(s.toString());
                }
                let str = slice_names.join(", ");
                c.addExtraInfo(`\\(${str}\\)`);
            }
            c.extra_info = [extra_info_page_15, c.extra_info];
        }
    }
    addLoadingMessage(`Added classes in ${getTime()} seconds.`);

    sseq.onDifferentialAdded(d => {
        d.addInfoToSourceAndTarget();
        let source_group = d.source.group_list[d.source.group_list.length - 1];
        let target_group = d.target.group_list[d.target.group_list.length - 1];
        if ( source_group === "Z/4") {
            d.source.group_list.push("Z/2");
            d.source.replace(Groups.Z2sup, (name) => "2\\," + name);
            d.source.setColor(d.source.getColor(0));
        } else if ( source_group === "Z") {
            d.source.group_list.push("2Z");
            d.source.replace(Groups.Zsup, (name) => "2\\," + name);
        } else if ( source_group === "2Z") {
            d.source.group_list.push("4Z");
            d.source.replace(Groups.Zsupsup);
        } else if(source_group === "Z/2"){
            d.source.group_list.push("0");
        }

        if (target_group === "Z/4") {
            d.target.group_list.push("Z/2");
            d.target.replace(Groups.Z2hit);
            d.target.setColor(d.target.getColor(0));
        } else if(target_group === "Z/2"){
            d.target.group_list.push("0");
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
        let source = classes[o.source_type].get(o.source_position).get(o.source_slice);
        let target = classes[o.target_type].get(o.target_position).get(o.target_slice);
        sseq.addDifferential(source, target, o.page);
    }
    addLoadingMessage(`Added differentials in ${getTime()} seconds.`);
    document.getElementById("loading").style.display =  "none";
    sseq.display(w2ui.layout.el('main'));
    // IO.download("BPC8-1.svg", display.toSVG());
    addLoadingMessage(`Displayed in ${getTime()} seconds.`);
    let t1 = performance.now();
    console.log("Rendered in " + (t1 - t0)/1000 + " seconds.");
}).catch((err) => console.log(err))
    .then(() => IO.loadFromLocalStore(differential_local_store_key)) // 
    .then((json) =>{
        return json
    }).catch(err => {
        console.log(err);
        return false;
    }).then((json) => {
        if(json){ // If we succeeded in loading from local store use that
            console.log("Loaded from local store");
            return json;
        }
        console.log("Trying to load from server");
        return IO.loadFromServer(getJSONFilename(differential_local_store_key))
    }).then(json => setupDifferentialInterface(json))
    .catch(err => {
        console.log(err);
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
    // json = undefined;
    if(!json || json.version === undefined || json.version < VERSION){
        if(json) {
            console.log("discarding old version.");
            console.log(json);
        }
        json = {history : [], differentials : []};
    }
    window.json = json;
    let dfamilies = [];
    json.differentials.sort((a,b)=>a.page - b.page);
    for(let d of json.differentials){
        let df = new differential_family(d);
        dfamilies.push(df);
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
            setStatus(`Adding differential. Source: ${name}`);
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
                    source_slice: source.slice,
                    target_type: target.type,
                    target_position: [target.x, target.y],
                    target_slice: target.slice,
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
                setStatus("");
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
        let slice = sseq.display_class_to_real_class.get(c).slice;
        if(df.offset_vectors.map(JSON.stringify).includes(JSON.stringify([dx, dy]))){
            return;
        }
        if(confirm(`Leibniz along vector [${dx},${dy}]?`)){
            undo.startMutationTracking();
            df.offset_vectors.push([dx,dy]);
            df.offset_vector_ranges.push([0,20]);
            df.leibniz_slices.push(slice);

            df.updateDifferentials();
            let event = {action: "leibniz", args : {vector:[dx, dy], range: [0,20], slice : slice}};
            undo.addMutation(df, event, event);
            undo.addMutationsToUndoStack(event);
            sseq.update();
        }
    });

    dss.addEventHandler("onclick", (event) => {
        let c = event.mouseover_class;
        if (!c) {
            return;
        }
        c = sseq.display_class_to_real_class.get(c);
        copyToClipboard(c.name);
    });


    dss.addEventHandler("d", (event) => {
        setStatus("Saving...");
        console.log(differential_family.list);
        undo.addLock();
        IO.saveToLocalStore(differential_local_store_key, differential_family.getSaveObject());
        // IO.download("BPC4-2-differentials.json", differential_family.getSaveObject());
        console.log("Saved.");
        setStatus("Saved.");
        delayedSetStatus("", 2000);
        undo.undoStack.pop();
    });

    dss.addEventHandler("D", (event) => {
        setStatus("Saving...");
        console.log(differential_family.list);
        undo.addLock();
        IO.saveToLocalStore(differential_local_store_key, differential_family.getSaveObject());
        IO.download(differential_filename, differential_family.getSaveObject());
        console.log("Saved.");
        setStatus("Saved.");
        delayedSetStatus("", 2000);
        undo.undoStack.pop();
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

    dss.addEventHandler('backspace', (event) => {
        w2confirm("Delete saved differentials?").yes(() => {
            IO.saveToLocalStore(differential_local_store_key,"");
        });
    });

    dss.addEventHandler("ctrl+z", undo.undo);
    dss.addEventHandler("ctrl+shift+z", undo.redo);

    sseq.updateAll();
    dss.display(w2ui.layout.el('main'));
    setTimeout(() => differential_family.refreshRecords(), 500);
    w2ui.layout.onResize = function onResize(event) {
        event.onComplete = function onResizeComplete(){
            display.resize();
        }
    };
}



function copyToClipboard(text) {
    if (window.clipboardData && window.clipboardData.setData) {
        // IE specific code path to prevent textarea being shown while dialog is visible.
        return clipboardData.setData("Text", text); 

    } else if (document.queryCommandSupported && document.queryCommandSupported("copy")) {
        var textarea = document.createElement("textarea");
        textarea.textContent = text;
        textarea.style.position = "fixed";  // Prevent scrolling to bottom of page in MS Edge.
        document.body.appendChild(textarea);
        textarea.select();
        try {
            return document.execCommand("copy");  // Security exception may be thrown by some browsers.
        } catch (ex) {
            console.warn("Copy to clipboard failed.", ex);
            return false;
        } finally {
            document.body.removeChild(textarea);
        }
    }
}
