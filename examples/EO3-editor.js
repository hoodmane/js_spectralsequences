// This is an example of how the editor can be used and customized. It is not
// very well-polished --- it is mostly a proof of concept.

const STATE_ADD_DIFFERENTIAL = 1;
const STATE_ADD_EXTENSION = 2;

document.body.style["padding-bottom"] = 0;
let sseq = new Sseq();
let display = new SidebarDisplay("#main");
let sidebar = display.sidebar;

sidebar.footer.newGroup();
sidebar.footer.addButton("Download SVG", () => display.downloadSVG("sseq.svg"));
sidebar.footer.addButton("Save", () => sseq.download(sseq.name ? sseq.name : "sseq.json"));

generalPanel = new Panel.Panel(sidebar.main_div, display);
generalPanel.newGroup();
generalPanel.addButton("New sseq", () => new_sseq_form.open(), { shortcuts: ["n"] }); // Use arrow function because new_sseq_form is not yet defined
generalPanel.addButton("Open sseq", () => open_sseq_form.open(), { shortcuts: ["o"] });
generalPanel.addButton("Add class", () => {
        let c = prompt("Cell dimension");
        addCells(type, [Number.parseInt(c)]);
        type.update(sseq);
}, { shortcuts: ["a"] });

sidebar.addPanel(generalPanel)

differentialPanel = new Panel.DifferentialPanel(sidebar.main_div, display);
Mousetrap.bind('d', () => display.state = STATE_ADD_DIFFERENTIAL);

differentialPanel.newGroup();
differentialPanel.addButton("Add extension", () => display.state = STATE_ADD_EXTENSION, { shortcuts: ["e"] });

sidebar.addPanel(differentialPanel);

Mousetrap.bind('left',  display.previousPage);
Mousetrap.bind('right', display.nextPage);

function _unselect() {
    if (!display.selected) return;

    display.selected.highlight = false;
    display.selected = null;
    display.state = null;

    sidebar.showPanel(generalPanel);
    display._drawSseq();
}

function onClick(type, node) {
    if (!node) {
        _unselect();
        return;
    }

    if (!display.selected) {
        _unselect();
        display.selected = node;
        sidebar.showPanel(differentialPanel);
        display.state = null;
        return;
    }

    let s = display.selected.c;
    let t = node.c;
    switch (display.state) {
        case STATE_ADD_DIFFERENTIAL:
            if(s.x !== t.x + 1){
                _unselect();
                break;
            }
            let length = t.y - s.y;
            addDifferential(type, s, t, length);
            display.state = null;
            type.update(sseq);
            sseq.emit('update');
            break;
        case STATE_ADD_EXTENSION:
            if (!extensions[t.x - s.x]) {
                return;
            }
            let flags = type.addExtensionQueries();
            addExtension(type, s, t, flags);
            display.state = null;
            sseq.emit("update");
            break;
        default:
            _unselect();
            display.selected = node;
            break;
    }
}


let squareNode = new Node().setShape(Shapes.square);
let openSquareNode = new Node().setShape(Shapes.square).setFill("white");

let classes;

let vmin = -12;
let vmax = 9;
let colorList = ["black", "blue", "orange", "green","red","yellow", "purple", "magenta"];





let sseq_types = {};
sseq_types.HFPSS = {};
sseq_types.AHSS = {};
let HFPSS = sseq_types.HFPSS;
let AHSS = sseq_types.AHSS;

AHSS.initialize = function(sseq) {
    sseq.exponents_to_classes = new StringifyingMap();
};
HFPSS.initialize = function(sseq) {
    sseq.colorMap = {};
    sseq.polynomial_classes = sseq.addPolynomialClasses(
        {"a" : [3, 1], "b" : [10, 2], "v" : [24, 0] },
        [["a",0,1],["b",0,30],["v", vmin, vmax]],
        {}
    );
    sseq.polynomial_classes_by_id = sseq.polynomial_classes._tuples_to_ids;

    sseq.exponents_to_classes = sseq.polynomial_classes;
    classes = sseq.polynomial_classes;
    classes.addStructline("a");
    classes.addStructline("b");
};


AHSS.onOpen = function(sseq){
    sseq.exponents_to_classes = new StringifyingMap();
    for(let c of sseq.getClasses()){
        sseq.exponents_to_classes.set(c.exponents, c);
    }
};
HFPSS.onOpen = function(sseq){
    sseq.colorMap = {};
};

let commands = {};

function addCells(type, cells){
    console.log("addcells");
    sseq.startMutationTracking();
    cells.forEach(cell => type.addCell(sseq, cell));
    sseq.addMutationsToUndoStack({command: "addCells", arguments : [cells]});
}
commands.addCells = addCells;


AHSS.addCell = function addAHSSCell(sseq, cell_dim){
    if(!Number.isInteger(cell_dim)){
        return;
    }
    console.log("cell", cell_dim);
    let i = sseq.num_cells;
    sseq.num_cells ++;
    let call = (c) => c.setColor(colorList[i]);
    sseq.on("class-added", call);
    for(let v = vmin; v < vmax; v++ ){
        sseq.xshift = 72*v + cell_dim;
        let o = AHSS.setClassName(sseq.addClass(0,0),[0,0,0,3*v],cell_dim).setNode(squareNode).setColor(colorList[i]);
        AHSS.setClassName(sseq.addClass(24,0),[0,0,0,3*v+1],cell_dim).setNode(openSquareNode).setColor(colorList[i]);
        AHSS.setClassName(sseq.addClass(48,0),[0,0,0,3*v+2],cell_dim).setNode(openSquareNode).setColor(colorList[i]);
        let b = AHSS.setClassName(sseq.addClass(10,2), [0,1,0,3*v], cell_dim);
        let b2 = AHSS.setClassName(sseq.addClass(20,4), [0,2,0,3*v], cell_dim);
        let b3 = AHSS.setClassName(sseq.addClass(30,6), [0,3,0,3*v], cell_dim);
        let b4 = AHSS.setClassName(sseq.addClass(40,8), [0,4,0,3*v], cell_dim);
        let a = AHSS.setClassName(sseq.addClass(3,1), [1,0,0,3*v], cell_dim);
        let ab = AHSS.setClassName(sseq.addClass(13,3), [1,1,0,3*v], cell_dim);
        let x = AHSS.setClassName(sseq.addClass(27,1), [0,0,1,3*v], cell_dim);
        let bx = AHSS.setClassName(sseq.addClass(37,3), [0,1,1,3*v], cell_dim);
        sseq.addStructline(o, a).setProduct("a");
        sseq.addStructline(o, b).setProduct("b");
        sseq.addStructline(b, b2).setProduct("b");
        sseq.addStructline(b2, b3).setProduct("b");
        sseq.addStructline(b3, b4).setProduct("b");
        sseq.addStructline(a, ab).setProduct("b");
        sseq.addStructline(b, ab).setProduct("a");
        sseq.addStructline(x, b3).setProduct("a");
        sseq.addStructline(x, bx).setProduct("b");
        sseq.addStructline(bx, b4).setProduct("a");
        sseq.xshift = 0;
    }
    sseq.removeListener("class-added", call);
    sseq.emit("update");
};
AHSS.setClassName = function setClassName(c, powers, cell){
    c.exponents = powers.slice();
    c.exponents.push(cell);
    sseq.exponents_to_classes.set(c.exponents, c);
    let name = monomialString(["a", "b", "x", "v"], powers, `[${cell}]`);
    c.setName(monomialString(["a", "b", "x", "v"], powers, `[${cell}]`));
    return c;
};



HFPSS.addCell = function addHFPSSCells(sseq, cell_dim){
    if(!Number.isInteger(cell_dim)){
        return;
    }
    let cellName = `[${cell_dim}]`;
    sseq.colorMap[cellName] = colorList[sseq.num_cells];
    sseq.num_cells ++;
    sseq.polynomial_classes.addModuleGenerator(cellName, [cell_dim, 0], HFPSS.classAddedCallback);
    return sseq.polynomial_classes;
};

HFPSS.classAddedCallback = function classAddedCallback(c) {
    if(c.y === 0){
        c.setNode(squareNode);
    }
    c.setColor(sseq.colorMap[c.module_generator]);
    c.exponents = c.vector.getStringifyingMapKey();
};

function addDifferentialEvent(type){
    if (!display.mouseover_class || !display.temp_source_class) {
        return;
    }
    let s = display.temp_source_class;
    let t = display.mouseover_class;
    if(s.x !== t.x + 1){
        return;
    }
    let length = type.getDifferentialLength(s, t);
    if(!Number.isInteger(length) || length < 1){
        return;
    }
    if(confirm(`Add d${length} differential from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)){
        addDifferential(type, s, t, length);
        type.update(sseq);
        sseq.emit("update");
    }
}

function addDifferential(type, s, t, length){
    sseq.startMutationTracking();
    type.addDifferential(s, t, length);
    sseq.addMutationsToUndoStack({"command" : "addDifferential", "arguments" : [s.exponents, t.exponents, length]});
}
commands.addDifferential = addDifferential;


AHSS.getDifferentialLength = function AHSSgetDifferentialLength(s, t){
    return s.exponents[s.exponents.length - 1] - t.exponents[t.exponents.length - 1] ;
};

HFPSS.getDifferentialLength = function HFPSSgetDifferentialLength(s, t){
    return t.y - s.y;
};

AHSS.addDifferential = function addDifferentialAHSS(sc, tc, length) {
    const vIndex = 3;
    console.log(sc, tc);
    for (let v = vmin; v < vmax; v++) {
        let scexp = sc.exponents.slice();
        let tcexp = tc.exponents.slice();
        scexp[vIndex] = scexp[vIndex] + 3 * v;
        tcexp[vIndex] = tcexp[vIndex] + 3 * v;
        if (!sseq.exponents_to_classes.has(scexp) || !sseq.exponents_to_classes.has(tcexp)) {
            continue;
        }
        let e = sseq.addDifferential(sseq.exponents_to_classes.get(scexp), sseq.exponents_to_classes.get(tcexp), length);
    }
};

HFPSS.addDifferential = function addDifferentialHFPSS(sc, tc, length) {
    let source_module_gen = sc.vector._module_generator;
    let target_module_gen = tc.vector._module_generator;
    vPeriod = (length < 5) ? 1 : 3;
    let disp_vec = [];
    for (let i = 0; i < sc.vector.length; i++) {
        disp_vec.push(tc.vector[i] - sc.vector[i]);
    }
    let offsetVector = classes._ring.getElement(disp_vec);
    for (let key_value of classes) {
        let k = key_value[0];
        let s = key_value[1];
        if (k._module_generator === source_module_gen && mod(k[2] - sc.vector[2], vPeriod) === 0) {
            let targetVector = k.multiply(offsetVector);
            targetVector._module_generator = target_module_gen;
            if (classes.get(targetVector)) {
                let t = classes.get(targetVector);
                let e = sseq.addDifferential(s, t, length);
            }
        }
    }
};

let extensions = { 0 : "3", 3 : "alpha", 10 : "beta"};

function addExtensionEvent(type, event) {
    if (!display.mouseover_class || !display.temp_source_class) {
        return;
    }
    let s = display.temp_source_class;
    let t = display.mouseover_class;
    if (!extensions[t.x - s.x]) {
        return;
    }
    if (confirm(`Add ${extensions[t.x - s.x]} extension from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)) {
        let flags = type.addExtensionQueries();
        addExtension(type, s, t, flags);
        sseq.emit("update");
    }
}

function addExtension(type, s, t, flags){
    sseq.startMutationTracking();
    type.addExtension(s, t, flags);
    sseq.addMutationsToUndoStack({"command" : "addExtension", "arguments" : [s.exponents, t.exponents, flags]});
}
commands.addExtension = addExtension;


AHSS.addExtensionQueries = function addExtensionQueries() { return {}; };

AHSS.addExtension = function addExtension(s, t) {
    const vIndex = 3;
    for (let v = vmin; v < vmax; v++) {
        let scexp = s.exponents.slice();
        let tcexp = t.exponents.slice();
        scexp[vIndex] = scexp[vIndex] + 3 * v;
        tcexp[vIndex] = tcexp[vIndex] + 3 * v;
        sseq.addExtension(sseq.exponents_to_classes.get(scexp), sseq.exponents_to_classes.get(tcexp));
    }
};

HFPSS.addExtensionQueries = function addExtensionQueries() {
    let translate = confirm("Translate along products?");
    return {translate : translate};
};

HFPSS.addExtension = function addExtension(s, t, flags) {
    if(flags.translate) {
        HFPSS.addExtensionTranslate(s, t);
    } else {
        HFPSS.addExtensionNoTranslate(s, t);
    }
};


HFPSS.addExtensionTranslate = function(s, t){
    let disp_vec = [];
    for (let i = 0; i < s.vector.length; i++) {
        disp_vec.push(t.vector[i] - s.vector[i]);
    }
    if (!extensions[t.x - s.x]) {
        return;
    }

    let offsetVector = classes._ring.getElement(disp_vec);

    let source_module_gen = s.vector._module_generator;
    let target_module_gen = t.vector._module_generator;
    const vPeriod = 3;
    for (let key_value of classes) {
        let k = key_value[0];
        let c1 = key_value[1];
        if (c1.getPage() < 100) {
            continue;
        }
        if (k._module_generator === source_module_gen && mod(k[2] - s.vector[2], vPeriod) === 0) {
            let targetVector = k.multiply(offsetVector);
            targetVector._module_generator = target_module_gen;
            let targetClass = classes.get(targetVector);
            if (targetClass) {
                let t = classes.get(targetVector);
                let e = sseq.addExtension(c1, t);
            }
        }
    }
};

HFPSS.addExtensionNoTranslate = function(s, t){
    let source_key = s.vector;
    let target_key = t.vector;
    for (let v = vmin; v < vmax; v++) {
        let elt = classes._ring.getElement({"v": 3 * v});
        let translated_source_key = source_key.multiply(elt);
        let translated_target_key = target_key.multiply(elt);
        let translated_source = classes.get(translated_source_key);
        let translated_target  = classes.get(translated_target_key);
        let e = sseq.addExtension(translated_source, translated_target);
    }
};



AHSS.onDifferentialAdded = function(d) {
    d.leibniz(["a", "b"]);
    //d.addInfoToSourceAndTarget();
    if(d.source.y === 0){
        d.replaceSource(openSquareNode);
        let s = d.source;
        s.setColor(d.source.getColor(0));
        s.setStructlinePages(d.page);
    }
};

AHSS.onExtensionAdded = function(d) {
    d.leibniz(["a", "b"]);

};

HFPSS.onDifferentialAdded = function(d){
    if(d.source.y === 0){
        d.replaceSource(openSquareNode);
        let s = d.source;
        s.setColor(d.source.getColor(0));
        s.setStructlinePages(d.page);
    }
};

AHSS.update = function(){};
HFPSS.update = function(sseq){
    HFPSS.updateGuideDifferentials();
};

HFPSS.updateGuideDifferentials = function updateGuideDifferentials(){
    for(let e of sseq.getStructlines()){
        if(e.guide_differential && (HFPSS.btorsionQ(e.source) || HFPSS.btorsionQ(e.target) || e.source.permanent_cycle)){
            sseq.deleteEdge(e);
        }
    }
    for(let c of sseq.getClasses()){
        if(c.vector[1] !== 0 || HFPSS.btorsionQ(c) || c.permanent_cycle){
            continue;
        }
        for(let d of sseq.getStem(c.x - 1)){
            if(d.y > 11 || d.y <= c.y || HFPSS.btorsionQ(d)){

                continue;
            }
            if(c.edges.filter(e => e.otherClass(c) === d).length > 0){
                continue;
            }
            let e = sseq.addStructline(c, d).setColor("red");
            sseq.updateEdge(e);
            e.guide_differential = true;
        }
    }
};


HFPSS.btorsionQ = function btorsionQ(c){
    let v = c.vector;
    v = v.multiply(v._ring.getElement([0,10,0]));
    let cp = sseq.polynomial_classes.get(v);
    return cp.page_list[0] < 10000;
};

function serializeSseq(sseq){
    let res = {};
    res.type = sseq.type;
    res.events = sseq.undo.getEventObjects();
    return res;
}


function save_main(ss, name){
    if(!name){
        return;
    }
    //let key = local_store_prefix + name;
    ss.name = name;
    IO.saveToLocalStore(name, serializeSseq(ss));
}

function saveAsPrompt(ss, prefix){
    let oldName = ss.name || "";
    if(oldName.startsWith(prefix)){
        oldName = oldName.slice(prefix.length);
    }
    let name = prompt("Save as:", oldName);
    if(!name){
        return;
    }
    name = (prefix || "") + name;
    save_main(ss, name);
}

function save(ss, name, prefix){
    if(!name){
        saveAsPrompt(ss, prefix);
    } else {
        save_main(ss, name);
    }
}

function upload() {
    IO.upload().then((fileList) => {
        for (let f of fileList) {
            try {
                let res = f.content;
                if(!f.content.type){
                    res = {};
                    res.type = f.name.includes("AHSS") ? "AHSS" : "HFPSS";
                    res.events = JSON.parse(f.content);
                }
                IO.saveToLocalStore(f.name.split(".")[0].split('_').join(':'), res);
            } catch (e) {
                console.log(f.name, f.content);
                console.log(e);
            }
        }
    }).catch(err => console.log(err));
    return false;
}

async function makeSseqDatalist(prefix){
    let sseqs = await IO.loadKeysFromLocalStoreWithPrefix(prefix);
    sseqs = sseqs.map(e => e.key.slice(prefix.length));
    let datalist = document.createElement("datalist");
    for(let ss of sseqs){
        let e = document.createElement("option");
        e.value = ss;
        datalist.appendChild(e);
    }
    return {sseqs: sseqs, datalist: datalist};
}

let new_sseq_form = new Interface.PopupForm(
    {
        name: 'new_sseq_form',
        fields: [
            { name: "sseq-type", type: 'radio', html : {caption: 'Type'},
                options: {
                    items: [
                        { id: "AHSS", text: '<u>A</u>tiyah Hirzebruch', attributes : { accesskey : 'a' } },
                        { id: "HFPSS", text: '<u>H</u>omotopy Fixed Point', attributes : { accesskey : 'h' } }
                    ]
                }
            },
            { name: 'cell-dimensions', type: 'text', attributes : {accesskey : 'c'}, html: {caption : '<u>C</u>ell Dimensions'} }
        ],
        focus  : 1, // Start out with focus on filename text field.
        record: {
            "sseq-type"   : 'AHSS' // Start out with "AHSS" radio button selected.
        },
        accept_button_name : "Okay",
        onValidate: function(event) {
            let cells = this.record["cell-dimensions"];
            let error = false;
            try {
                cells = JSON.parse("[" + cells + "]");
            } catch(e) {
                error = true;
            }
            if(!error){
                error = !cells.every(Number.isInteger);
            }
            if(error) {
                event.errors.push({ field: this.get('cell-dimensions'),
                    error: 'Not a list of integers.'});
                return;
            }
            this.cells = cells;
        },
        onSuccess: function(event){
            newSseq(this.record['sseq-type'], this.cells);
            display.setSseq(sseq);
        }
    },
    {
        title   : 'New',
        // speed : error_on_toString
    }
);

let open_sseq_form = new Interface.PopupForm(
    {
        name: 'open_sseq_form',
        fields: [
            { name: "sseq-type", type: 'radio', html : {caption: 'Type'},
                options: {
                    items: [
                        { id: "AHSS", text: '<u>A</u>tiyah Hirzebruch', attributes : { accesskey : 'a' } },
                        { id: "HFPSS", text: '<u>H</u>omotopy Fixed Point', attributes : { accesskey : 'h' } }
                    ]
                }
            },
            { name: 'sseq-file-name', type: 'text' , html : {caption: '<u>F</u>ile Name'}, attributes : {accesskey : 'f'} }
        ],
        focus  : 1, // Start out with focus on filename text field.
        record: {
            "sseq-type"   : 'AHSS', // Start out with "AHSS" radio button selected.
            "sseq-file-name" : ''
        },
        accept_button_name : "Open",
        onValidate: function(event){
            let error = false;
            let list = w2ui.open_sseq_form[`${w2ui.open_sseq_form.getType()}_list`];
            if(!list.includes(w2ui.open_sseq_form.getName())){
                event.errors.push({ field: w2ui.open_sseq_form.get('sseq-file-name'),
                    error: 'Not a known file name.'});
            }
        },
        onChange: function(event){
            if(event.target === "sseq-type"){ // If they clicked on the type radio
                let e = document.getElementById("sseq-file-name");
                e.setAttribute("list", event.value_new); // Change the "list" of suggestions for the form field to the new type.
            }
        },
        onSuccess: function(){
            openSseq(w2ui.open_sseq_form.getFullFileName());
        },
        getFullFileName: function getFileName() {
            let type = w2ui.open_sseq_form.record["sseq-type"];
            let name = w2ui.open_sseq_form.record["sseq-file-name"];
            return `EO3-${type}:${name}`;
        },
        getType: function getType() {
            return w2ui.open_sseq_form.record["sseq-type"];
        },
        getName: function getName() {
            return w2ui.open_sseq_form.record["sseq-file-name"];
        },
    },
    {
        title: 'Open',
        onOpen: function (event) {
            let e = document.getElementById("sseq-file-name");
            makeSseqDatalist("EO3-AHSS:").then((obj) => {
                let sseqs = obj.sseqs;
                w2ui.open_sseq_form.AHSS_list = sseqs;
                let datalist = obj.datalist;
                datalist.id = "AHSS";
                e.appendChild(datalist);
            }).catch(err => console.log(err));
            makeSseqDatalist("EO3-HFPSS:").then((obj) => {
                let sseqs = obj.sseqs;
                w2ui.open_sseq_form.HFPSS_list = sseqs;
                let datalist = obj.datalist;
                datalist.id = "HFPSS";
                e.appendChild(datalist);
            }).catch(err => console.log(err));
            document.getElementById('sseq-file-name').setAttribute('list', w2ui.open_sseq_form.record['sseq-type']);
        }
    }
);


function newSseq(typename, cells){
    sseq = new Sseq();
    sseq.type = typename;
    sseq.num_cells = 0;
    sseq.undo = new Interface.Undo(sseq);
    addEventHandlers(sseq);
    setRange(sseq);
    window.type = sseq_types[typename];
    type.initialize(sseq);
    addCells(type, cells);
    type.update(sseq);
    sseq.undo.clear();
}

async function openSseq(key){
    let loaded_sseq = await IO.loadFromLocalStore(key);
    console.log(loaded_sseq);
    if (!loaded_sseq) {
        alert(`Unknown sseq ${key}`);
        throw new Error(`Unknown sseq ${key}`);
    }
    let type = sseq_types[loaded_sseq.type];
    newSseq(loaded_sseq.type, []);
    sseq.name = loaded_sseq.name;
    if(loaded_sseq.events.constructor !== Array){
        loaded_sseq.events = loaded_sseq.events.events;
    }
    for(let e of loaded_sseq.events){
        console.log(e.command);
        if(e.command !== "addCells"){
            e.arguments[0] = sseq.exponents_to_classes.get(e.arguments[0]);
            e.arguments[1] = sseq.exponents_to_classes.get(e.arguments[1]);
        }
        commands[e.command](type, ...e.arguments);
    }
    type.onOpen(sseq);
    type.update(sseq);
    addEventHandlers(sseq);
    setRange(sseq);
    display.setSseq(sseq);
    sseq.fully_loaded = true;
    return true;
}


function selectOddCycles(){
    for(let c of sseq.getSurvivingClasses(10000)){
        if(c.x % 2 !== 0){
            sseq.selectClass(c);
        }
        sseq.emit("update");
    }
}

function setRange(sseq){
    sseq.xRange = [-72, 144];
    sseq.yRange = [0, 20];
    sseq.initialxRange = [0, 72];
    sseq.initialyRange = [0, 15];
}

function addEventHandlers(sseq) {
    const save_prefix = `EO3-${sseq.type}:`;
    const type = sseq_types[sseq.type];
    Mousetrap.bind("ctrl+s", (e) => {
        save(sseq, sseq.name, save_prefix);
        e.preventDefault();
        return true;
    });

    Mousetrap.bind("ctrl+shift+s", () => {
        saveAsPrompt(sseq, save_prefix);
    });
    Mousetrap.bind("u", upload);

    if(sseq.type === 'HFPSS'){
        Mousetrap.bind('c', (event) => {
             if(!display.mouseover_class){ return; }
             display.mouseover_class.permanent_cycle = true;
             HFPSS.updateGuideDifferentials();
             sseq.emit("update");
        })
    }

    Mousetrap.bind("ctrl+z", sseq.undo.undo);
    Mousetrap.bind("ctrl+shift+z", sseq.undo.redo);
    if(type.onDifferentialAdded){
        sseq.on("differential-added", type.onDifferentialAdded);
    }
    if(type.onExtensionAdded){
        sseq.on("extension-added", type.onExtensionAdded);
    }

    display.on("click", (node) => onClick(type, node));
}

newSseq("AHSS", []);
display.setSseq(sseq);
sidebar.showPanel(generalPanel);
