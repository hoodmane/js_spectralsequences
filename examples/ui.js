let layout = document.createElement("div");
layout.id = "layout";
document.body.appendChild(layout);
d3.select("#layout")
  .style("height", "97vh")
  .style("width", "100%");


window.sseq = new Sseq();

let undo = {};
undo.undoStack = [];
undo.redoStack = [];
undo.add = function(undoCallback, redoCallback) {
    undo.undoStack.push({undo: undoCallback, redo: redoCallback});
    undo.redoStack = [];
};

undo.addClass = function(c, lastClass){
    undo.add(() => {
        sseq.deleteClass(c);
        updateLastClass(lastClass);
    }, () => {
        sseq.reviveClass(c);
        updateLastClass(c);
    });
};

undo.addEdge = function(e, edgeMaker){
    undo.add(() => sseq.deleteEdge(e), () => {
        e = edgeMaker();
        e = sseq.display_edge_to_real_edge.get(e);
    });
};

undo.merge = function(){
    let e1 = undo.undoStack.pop();
    let e2 = undo.undoStack.pop();
    undo.add(() => {e1.undo(); e2.undo()}, () => {e2.redo(); e1.redo()});
};

undo.undo = function() {
    if (undo.undoStack.length > 0) {
        let e = undo.undoStack.pop();
        e.undo();
        undo.redoStack.push(e);
    }
};

undo.redo = function() {
    if (undo.redoStack.length > 0) {
        let e = undo.redoStack.pop();
        e.redo();
        undo.undoStack.push(e);
    }
};


// first define a layout
let edgeModes = {};
edgeModes.auto = "auto";
edgeModes.diff = "diff";
edgeModes.structline = "structline";
edgeModes.ext = "ext";

$('#layout').w2layout({
    name: 'layout',
    panels: [
        {type: 'bottom', size: 30},
        {type: 'right', size: 200, resizable: true, style: 'background-color: #FFFFFF;', content: 'left', onClick: (e) => console.log(e)},
        {
            type: 'main', style: 'background-color: #FFFFFF; padding: 5px;',
            toolbar: {
                name : 'toolbar',
                items: [
                    {
                      type: 'menu',
                      id: 'filemenu',
                      text: 'File',
                      items: [
                          { id: 'new',      text: 'New',  icon: "fas fa-file"},
                          { id: 'open',     text: 'Open', icon: "fas fa-folder-open" },
                          { id: 'save',     text: 'Save', icon: "fas fa-save" },
                          { id: 'saveas',   text: 'Save As', icon: "save-as"}, // Need save-as icon for this one.
                          { id: 'upload',   text: 'Upload', icon : "fas fa-file-upload" },
                          { id: 'download', text: 'Download', icon : "fas fa-file-download" }
                      ]
                    },
                    {
                        type: 'radio',
                        text: 'Class',
                        id: 'class',
                        //style: 'background-color: #FFFFFF;',
                        group: 'mode'
                    },
                    {type: 'radio', text: 'Edge', id: 'edge', group: 'mode'},
                    {type: 'menu-radio', text: 'Edge mode', id: 'edge-mode-menu', disabled : true,
                        items: [
                            {id : edgeModes.auto, text: 'Automatic', checked: true},
                            {id : edgeModes.diff, text: 'Differential'},
                            {id : edgeModes.structline, text: 'Structline'},
                            {id : edgeModes.ext, text: 'Extension'}
                        ]
                    }
                ]
            }
        }
    ]
});

let el = w2ui['layout'].el('main');
el.id = "#main";

window.display = BasicDisplay(el, sseq);


w2ui.layout.onResize = function onResize(event) {
    event.onComplete = function onResizeComplete(){
        display.resize();
    }
};

Mousetrap.bind("ctrl+z", undo.undo);
Mousetrap.bind("ctrl+shift+z", undo.redo);

w2ui.toolbar = w2ui.layout_main_toolbar;
w2ui.filemenu =  w2ui.layout_main_toolbar.get('filemenu');


let currentMode;
let modes = {};
let currentEdgeMode = "auto";

w2ui.toolbar.onClick = (event) => {
    event.onComplete = () => {
        if(event.item.group === "mode"){
            updateMode(event.target);
            return;
        }
        if(event.target.startsWith("filemenu:")){
            if(fileMenuHandlers[event.subItem.id]){
                fileMenuHandlers[event.subItem.id]();
            }
            return;
        }
        if(event.target.startsWith("edge-mode-menu:")){
            currentEdgeMode = event.subItem.id;
        }
    };
};

function updateMode(mode){
    exitMode();
    if(mode === currentMode || mode === undefined){
        w2ui.toolbar.uncheck(mode)  ;
        currentMode = undefined;
        return;
    }
    currentMode = mode;
    enterMode();
}

function exitMode(){
    if(!modes[currentMode]){
        return;
    }
    if(modes[currentMode].exit) {
        modes[currentMode].exit();
    }
    if(modes[currentMode].handlers){
        for(let k of Object.keys(modes[currentMode].handlers)){
            Mousetrap.unbind(k);
        }
    }
}

function enterMode(){
    if(modes[currentMode].enter) {
        modes[currentMode].enter();
    }
    if(modes[currentMode].handlers){
        for(let kv of Object.entries(modes[currentMode].handlers)){
            Mousetrap.bind(kv[0], kv[1]);
        }
    }
}


let fileMenuHandlers = {};
fileMenuHandlers.new      = (event) => {console.log("new!")};
fileMenuHandlers.open     = (event) => {};
fileMenuHandlers.save     = (event) => {};
fileMenuHandlers.saveas   = (event) => {};
fileMenuHandlers.upload   = (event) => {};
fileMenuHandlers.download = (event) => {};


modes.class = {};

modes.class.enter = function () {
    display.enableSelection(true);
    for(let prod of sseq.products){
        if(prod.key){
           Mousetrap.bind(prod.key, () => addProduct(prod));
           Mousetrap.bind(`shift+${prod.key}`, () => addDivision(prod));
        }
    }
};

modes.class.exit = function () {
    display.disableSelection();
    for(let prod of sseq.products){
        if(prod.key){
            Mousetrap.unbind(prod.key);
            Mousetrap.unbind(`shift+${prod.key}`);
        }
    }
    updateLastClass(undefined);
};

function updateLastClass(c){
    sseq.unselectClass(modes.class.lastClass);
    sseq.selectClass(c);
    sseq.emit("update");
    modes.class.lastClass = c;
}

function addClass(x,y){
    let c = sseq.addClass(x,y);
    if(c && !c.isDummy()){
        undo.addClass(c);
        updateLastClass(c);
    }
    return c;
}

function addProduct(prod){
    if(!modes.class.lastClass){
        return;
    }
    let c = modes.class.lastClass;
    let c2 = addClass(c.x + prod.stem, c.y + prod.filtration);
    let e = sseq.addStructline(c, c2);
    undo.addEdge(e, () => sseq.addStructline(c, c2));
    undo.merge();
}

function addDivision(prod){
    if(!modes.class.lastClass){
        return;
    }
    let c = modes.class.lastClass;
    let c2 = addClass(c.x - prod.stem, c.y - prod.filtration);
    let e = sseq.addStructline(c2, c);
    undo.addEdge(e, () => sseq.addStructline(c2, c));
    undo.merge();
}

modes.class.handlers = {};
modes.class.handlers["a"] = function(event) {
    let c = addClass(display.selectedX, display.selectedY);
};

modes.class.handlers["onclick"] = function(event){
    let currentClass = display.mouseover_class;
    if (!currentClass) {
        display.updateSelection(event);
        return;
    }
    updateLastClass(currentClass);
};


modes.edge = {};
modes.edge.enter = function () {
    disableClassTableSelection();
    w2ui.toolbar.enable("edge-mode-menu");
};

modes.edge.exit = () => {
    enableClassTableSelection();
    sseq.unselectAll();
    w2ui.toolbar.disable("edge-mode-menu");
};

modes.edge.handlers = {};

modes.edge.handlers.onclick = function(event) {
    let currentClass = display.mouseover_class;
    if (!currentClass) {
        return;
    }
    let savedClass = modes.edge.savedClass;
    if (savedClass) {
        let query;
        let callback;
        switch(currentEdgeMode){
            case edgeModes.auto:
                let qc = sseq.getPossibleEdgesToAdd(savedClass, currentClass);
                query = qc.query;
                callback = qc.callback;
                break;

            case edgeModes.diff:
                break;

            case edgeModes.structline:
                query = sseq.getStructlineQuery(savedClass, currentClass);
                callback = () => sseq.addStructline(savedClass, currentClass);
                break;

            case edgeModes.ext:
                query = sseq.getExtensionQuery(savedClass, currentClass);
                callback = () => sseq.addExtension(savedClass, currentClass);
                break;
        }
        if (query) {
            let addEdgeQ = confirm(query);
            if (addEdgeQ) {
                let e = callback();
                e = sseq.display_edge_to_real_edge.get(e);
                undo.addEdge(e, callback);
                sseq.unselectClass(savedClass);
                sseq.emit("update");
                modes.edge.savedClass = undefined;
            }
            return;
        }
    }
    sseq.unselectClass(savedClass);
    sseq.selectClass(currentClass);
    sseq.emit("update");
    modes.edge.savedClass = currentClass;
};
modes.edge.handlers.esc = function(event) {
    sseq.unselectClass(modes.edge.savedClass);
    sseq.emit("update");
    modes.edge.savedClass = undefined;
};



// then define the sidebar
w2ui['layout'].content('right', $().w2grid({
        name: 'classTable',
        show: {
            toolbar: true
        },
        columns: [
            {field: 'name', caption: 'Name', size: '50px', sortable: true, editable: {type: 'text'}},
            {field: 'x', caption: 'x', size: '10px', 'render': 'int', sortable: true},
            {field: 'y', caption: 'y', size: '10px', 'render': 'int', sortable: true},
        ]
    })
);

recid_to_class_map = new Map();

function updateClassTable(){
    for(let c of sseq.classes){
        c.recid = c.unique_id;
        recid_to_class_map.set(c.recid.toString(), c);
    }
    w2ui.classTable.clear();
    w2ui.classTable.add(sseq.classes.filter(c => !c.invalid));
}

updateClassTable();
// dss._registerUpdateListener("classTable", () => updateClassTable());

function selectByRecId(id){
    let c = recid_to_class_map.get(id.toString());
    sseq.selectClass(c);
}
function unselectByRecId(id){
    let c = recid_to_class_map.get(id.toString());
    sseq.unselectClass(c);
}

let classTableSelections = true;
function disableClassTableSelection(){
    classTableSelections = false;
    sseq.unselectAll();
}

function enableClassTableSelection(){
    classTableSelections = true;
}

w2ui.classTable.on('select', (event) => {
    if(!classTableSelections){
        return;
    }
    if(event.recids){
        event.recids.map(selectByRecId);
        sseq.emit("update");
        return;
    }
    if(event.recid !== undefined){
        selectByRecId(event.recid);
        sseq.emit("update");
        return;
    }

} );

w2ui.classTable.on('unselect', (event) => {
    if(!classTableSelections){
        return;
    }
    if(event.recids){
        event.recids.map(unselectByRecId);
        sseq.emit("update");
        return;
    }
    if(event.recid !== undefined){
        unselectByRecId(event.recid);
        sseq.emit("update");
        return;
    }
    if(event.all){
        sseq.unselectAll();
        return;
    }
} );

w2ui.classTable.onChange = (event) => {
    event.onComplete = function() {
        for(let e of w2ui.classTable.getChanges()){
            let c = recid_to_class_map.get(e.recid.toString());
            c.name = e.name;
            sseq.emit("update");
        }
        w2ui.classTable.save();
    }
};


function cloneSelection(sel_obj){
    let result = {};
    result.indexes = sel_obj.indexes.slice();
    result.columns = Object.assign({}, sel_obj.columns );
    return result;
}

w2ui.classTable.last.selection_correct  = {indexes : [], columns : {}};

function selectFunction() {
    if (arguments.length === 0) return 0;
    var time = (new Date).getTime();
    var selected = 0;
    var sel = this.last.selection_correct;
    if (!this.multiSelect) this.selectNone();

    // event before
    var tmp = { phase: 'before', type: 'select', target: this.name };
    if (arguments.length == 1) {
        tmp.multiple = false;
        if ($.isPlainObject(arguments[0])) {
            tmp.recid  = arguments[0].recid;
            tmp.column = arguments[0].column;
        } else {
            tmp.recid = arguments[0];
        }
    } else {
        tmp.multiple = true;
        tmp.recids   = Array.prototype.slice.call(arguments, 0);
    }
    var edata = this.trigger(tmp);
    if (edata.isCancelled === true) return 0;

    // default action
    for (var a = 0; a < arguments.length; a++) {
        var recid  = typeof arguments[a] == 'object' ? arguments[a].recid : arguments[a];
        var index = this.get(recid, true);
        if (index == null) continue;
        var recEl1 = null;
        var recEl2 = null;
        if (this.searchData.length !== 0 || (index + 1 >= this.last.range_start && index + 1 <= this.last.range_end)) {
            recEl1 = $('#grid_'+ this.name +'_frec_'+ w2utils.escapeId(recid));
            recEl2 = $('#grid_'+ this.name +'_rec_'+ w2utils.escapeId(recid));
        }
        if (sel.indexes.indexOf(index) != -1)
            continue;
        sel.indexes.push(index);
        if (recEl1 && recEl2) {
            recEl1.addClass('w2ui-selected').data('selected', 'yes').find('.w2ui-col-number').addClass('w2ui-row-selected');
            recEl2.addClass('w2ui-selected').data('selected', 'yes').find('.w2ui-col-number').addClass('w2ui-row-selected');
            recEl1.find('.w2ui-grid-select-check').prop("checked", true);
        }
        selected++;
    }
    // need to sort new selection for speed
    sel.indexes.sort(function(a, b) { return a-b; });
    // all selected?
    var areAllSelected = (this.records.length > 0 && sel.indexes.length == this.records.length),
        areAllSearchedSelected = (sel.indexes.length > 0 && this.searchData.length !== 0 && sel.indexes.length == this.last.searchIds.length);
    if (areAllSelected || areAllSearchedSelected) {
        $('#grid_'+ this.name +'_check_all').prop('checked', true);
    } else {
        $('#grid_'+ this.name +'_check_all').prop('checked', false);
    }
    this.status();
    this.addRange('selection');
    // event after
    this.trigger($.extend(edata, { phase: 'after' }));
    return selected;
}

function unselectFunction() {
    var unselected = 0;
    var sel = this.last.selection_correct;
    for (var a = 0; a < arguments.length; a++) {
        var recid  = typeof arguments[a] == 'object' ? arguments[a].recid : arguments[a];
        var record = this.get(recid);
        if (record == null) continue;
        var index  = this.get(record.recid, true);
        if (sel.indexes.indexOf(index) == -1) continue;
        // event before
        var edata = this.trigger({ phase: 'before', type: 'unselect', target: this.name, recid: recid, index: index });
        if (edata.isCancelled === true) continue;
        // default action
        sel.indexes.splice(sel.indexes.indexOf(index), 1);
        let recEl1 = $('#grid_'+ this.name +'_frec_'+ w2utils.escapeId(recid));
        let recEl2 = $('#grid_'+ this.name +'_rec_'+ w2utils.escapeId(recid));
        recEl1.removeClass('w2ui-selected').removeClass('w2ui-inactive').removeData('selected').find('.w2ui-col-number').removeClass('w2ui-row-selected');
        recEl2.removeClass('w2ui-selected').removeClass('w2ui-inactive').removeData('selected').find('.w2ui-col-number').removeClass('w2ui-row-selected');
        if (recEl1.length != 0) {
            recEl1[0].style.cssText = 'height: '+ this.recordHeight +'px; ' + recEl1.attr('custom_style');
            recEl2[0].style.cssText = 'height: '+ this.recordHeight +'px; ' + recEl2.attr('custom_style');
        }
        recEl1.find('.w2ui-grid-select-check').prop("checked", false);
        unselected++;
        // event after
        this.trigger($.extend(edata, { phase: 'after' }));
    }
    // all selected?
    var areAllSelected = (this.records.length > 0 && sel.indexes.length == this.records.length),
        areAllSearchedSelected = (sel.indexes.length > 0 && this.searchData.length !== 0 && sel.indexes.length == this.last.searchIds.length);
    if (areAllSelected || areAllSearchedSelected) {
        $('#grid_'+ this.name +'_check_all').prop('checked', true);
    } else {
        $('#grid_'+ this.name +'_check_all').prop('checked', false);
    }
    // show number of selected
    this.status();
    this.addRange('selection');
    return unselected;
}


w2ui.classTable.select = selectFunction.bind(w2ui.classTable);
w2ui.classTable.unselect = unselectFunction.bind(w2ui.classTable);

function selectWrap(fnName, writeBack){
    let old_fn = w2ui.classTable[fnName].bind(w2ui.classTable);
    w2ui.classTable[fnName] = function(){
        if(this.last.selection_correct){
            this.last.selection = cloneSelection(this.last.selection_correct);
        }
        let result = old_fn(...arguments);
        // if(writeBack){
        //     this.last.selection_correct = cloneSelection(this.last.selection);
        // }
        return result;
    }
}

selectWrap("click");
selectWrap("getSelection");




sseq.products.push({name: "2", stem: 0, filtration: 1, key: "t"});
sseq.products.push({name: "eta", stem: 1, filtration: 1, key: "e"});
sseq.products.push({name: "nu", stem: 3, filtration: 1, key: "r"});

// window.addEventListener("resize", () => {display.resize();});
