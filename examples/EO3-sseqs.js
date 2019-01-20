let sseq = new Sseq();
let dss = sseq.getDisplaySseq();

let squareNode = new Node().setShape(Shapes.square);
let openSquareNode = new Node().setShape(Shapes.square).setFill("white");

let classes;

let vmin = -12;
let vmax = 9;
let colorList = ["black", "blue", "orange", "green","red","yellow", "purple", "magenta"];



let exponents_to_classes = new StringifyingMap();
function setClassName(c, powers, cell){
    c.exponents = powers.slice();
    c.exponents.push(cell);
    exponents_to_classes.set(c.exponents, c);
    c.setName(monomialString(["a", "b", "x", "v"], powers, `[${cell}]`));
    return c;
}

let sseq_types = {};
sseq_types.HFPSS = {};
sseq_types.AHSS = {};
let HFPSS = sseq_types.HFPSS;
let AHSS = sseq_types.AHSS;

AHSS.addCells = function addAHSSCells(sseq, cells){
    let cellMap = {};
    let colorMap = {};
    for(let i = 0; i < cells.length; i++){
        for(let v = vmin; v < vmax; v++ ){
            sseq.xshift = 72*v + cells[i];
            sseq.onClassAdded((c) => c.setColor(colorList[i]));
            let o = setClassName(sseq.addClass(0,0),[0,0,0,3*v],cells[i]).setNode(squareNode).setColor(colorList[i])
            setClassName(sseq.addClass(24,0),[0,0,0,3*v+1],cells[i]).setNode(openSquareNode).setColor(colorList[i]);
            setClassName(sseq.addClass(48,0),[0,0,0,3*v+2],cells[i]).setNode(openSquareNode).setColor(colorList[i]);
            let b = setClassName(sseq.addClass(10,2), [0,1,0,3*v], cells[i]);
            let b2 = setClassName(sseq.addClass(20,4), [0,2,0,3*v], cells[i]);
            let b3 = setClassName(sseq.addClass(30,6), [0,3,0,3*v], cells[i]);
            let b4 = setClassName(sseq.addClass(40,8), [0,4,0,3*v], cells[i]);
            let a = setClassName(sseq.addClass(3,1), [1,0,0,3*v], cells[i]);
            let ab = setClassName(sseq.addClass(13,3), [1,1,0,3*v], cells[i]);
            let x = setClassName(sseq.addClass(27,1), [0,0,1,3*v], cells[i]);
            let bx = setClassName(sseq.addClass(37,3), [0,1,1,3*v], cells[i]);
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
    }
};
HFPSS.addCells = function addHFPSSCells(sseq, cells){
    let cellMap = {};
    let colorMap = {};
    for(let i = 0; i < cells.length; i++){
        cellMap[`[${cells[i]}]`] = [cells[i], 0];
        colorMap[`[${cells[i]}]`] = colorList[i];
    }

    sseq.polynomial_classes = sseq.addPolynomialClasses(
        {"a" : [3, 1], "b" : [10, 2], "v" : [24, 0] },
        [["a",0,1],["b",0,30],["v", vmin, vmax]],
        cellMap
    );

    sseq.polynomial_classes_by_id = sseq.polynomial_classes._tuples_to_ids;

    classes = sseq.polynomial_classes;

    for(let kv of sseq.polynomial_classes){
        let k = kv[0];
        let c = kv[1];
        if(c.y === 0){
            c.setNode(squareNode);
        }
        c.setColor(colorMap[k._module_generator]);
    }

    sseq.onDifferentialAdded((d) => {
        if(d.source.y === 0){
            d.replaceSource(openSquareNode);
            let s = d.source;
            s.setColor(d.source.getColor(0));
            s.setStructlinePages(d.page);
        }
    });

    sseq.polynomial_classes.addStructline("a");
    sseq.polynomial_classes.addStructline("b");
    return sseq.polynomial_classes;
};


AHSS.addDifferential = function addDifferentialAHSS(event){
    if(!event.mouseover_class || !dss.temp_source_class) {
        return;
    }
    let s = dss.temp_source_class;
    let t = event.mouseover_class;
    if(s.x !== t.x + 1){
        return;
    }
    let sc = sseq.display_class_to_real_class.get(s);
    let tc = sseq.display_class_to_real_class.get(t);
    console.log(sc);
    console.log(tc);
    let length = sc.exponents[sc.exponents.length - 1] -  tc.exponents[tc.exponents.length - 1];
    if(confirm(`Add d${length} differential from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)){
        let vIndex = 3;
        for(let v = vmin; v < vmax; v++){
            let scexp = sc.exponents.slice();
            let tcexp = tc.exponents.slice();
            scexp[vIndex] =  scexp[vIndex] + 3*v;
            tcexp[vIndex] =  tcexp[vIndex] + 3*v;
            sseq.addDifferential(exponents_to_classes.get(scexp), exponents_to_classes.get(tcexp),length);
        }
        //d.color = differential_colors[d.page];
        dss.update();
    }
};
HFPSS.addDifferential = function addDifferentialHFPSS(event) {
    if (!event.mouseover_class || !dss.temp_source_class) {
        return;
    }
    let s = dss.temp_source_class;
    let t = event.mouseover_class;
    let sc = sseq.display_class_to_real_class.get(s);
    let tc = sseq.display_class_to_real_class.get(t);
    let disp_vec = [];
    for (let i = 0; i < sc.vector.length; i++) {
        disp_vec.push(tc.vector[i] - sc.vector[i]);
    }
    let source_module_gen = sc.vector._module_generator;
    let target_module_gen = tc.vector._module_generator;


    if (s.x !== t.x + 1) {
        return;
    }
    let length = t.y - s.y;
    if (confirm(`Add d${length} differential from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)) {
        vPeriod = (length < 5) ? 1 : 3;
        let offsetVector = classes._ring.getElement(disp_vec);
        let edge_list = [];
        for (let key_value of classes) {
            let k = key_value[0];
            let c1 = key_value[1];
            if (k._module_generator === source_module_gen && mod(k[2] - sc.vector[2], vPeriod) === 0) {
                let targetVector = k.multiply(offsetVector);
                targetVector._module_generator = target_module_gen;
                if (classes.get(targetVector)) {
                    let t = classes.get(targetVector);
                    let e = sseq.addDifferential(c1, t, length);
                    edge_list.push(e);
                }
            }
        }
        undo.addEdgeList(edge_list);
        dss.update();
    }
};

let extensions = { 0 : "3", 3 : "alpha", 10 : "beta"};

AHSS.addExtension = function addExtension(event) {
    if (!event.mouseover_class || !dss.temp_source_class) {
        return;
    }
    let s = dss.temp_source_class;
    let t = event.mouseover_class;
    let sc = sseq.display_class_to_real_class.get(s);
    let tc = sseq.display_class_to_real_class.get(t);

    if (!extensions[t.x - s.x]) {
        return;
    }

    if (confirm(`Add ${extensions[t.x - s.x]} extension from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)) {
        let vIndex = 3;
        let edge_list = [];
        for (let v = vmin; v < vmax; v++) {
            let scexp = sc.exponents.slice();
            let tcexp = tc.exponents.slice();
            scexp[vIndex] = scexp[vIndex] + 3 * v;
            tcexp[vIndex] = tcexp[vIndex] + 3 * v;
            let e = sseq.addExtension(exponents_to_classes.get(scexp), exponents_to_classes.get(tcexp));
            edge_list.push(e);
        }
        undo.addEdgeList(edge_list);
        dss.update();
    }
};
HFPSS.addExtension = function addExtension(event) {
    if (!event.mouseover_class || !dss.temp_source_class) {
        return;
    }
    let s = dss.temp_source_class;
    let t = event.mouseover_class;
    let sc = sseq.display_class_to_real_class.get(s);
    let tc = sseq.display_class_to_real_class.get(t);
    let disp_vec = [];
    for (let i = 0; i < sc.vector.length; i++) {
        disp_vec.push(tc.vector[i] - sc.vector[i]);
    }
    let source_module_gen = sc.vector._module_generator;
    let target_module_gen = tc.vector._module_generator;


    if (!extensions[t.x - s.x]) {
        return;
    }


    if (confirm(`Add ${extensions[t.x - s.x]} extension from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)) {
        vPeriod = 3;
        let offsetVector = classes._ring.getElement(disp_vec);
        if (!confirm("Translate along products?")) {
            let source_key = sc.vector;
            let target_key = tc.vector;
            for (let v = vmin; v < vmax; v++) {
                let elt = classes._ring.getElement({"v": 3 * v});
                let translated_source_key = source_key.multiply(elt);
                let translated_target_key = target_key.multiply(elt);
                let sc = classes.get(translated_source_key);
                let tc = classes.get(translated_target_key);
                sseq.addExtension(sc, tc);
            }
            dss.update();
            return;
        }
        for (let key_value of classes) {
            let k = key_value[0];
            let c1 = key_value[1];
            if (c1.getPage() < 100) {
                continue;
            }
            if (k._module_generator === source_module_gen && mod(k[2] - sc.vector[2], vPeriod) === 0) {
                let targetVector = k.multiply(offsetVector);
                targetVector._module_generator = target_module_gen;
                let targetClass = classes.get(targetVector);
                if (targetClass) {
                    let t = classes.get(targetVector);
                    sseq.addExtension(c1, t);
                }
            }
        }
        dss.update();
    }
}

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


function save_main(ss, name){
    if(!name){
        return;
    }
    //let key = local_store_prefix + name;
    ss.name = name;
    ss.saveToLocalStore(name);
}

function saveAsPrompt(ss){
    let name = prompt("Save as:", ss.name);
    save_main(ss, name);
}

function save(ss, name){
    if(!name){
        saveAsPrompt(ss);
    } else {
        save_main(ss,name);
    }
}

function upload() {
    IO.upload().then((fileList) => {
        for (let f of fileList) {
            try {
                let dss = DisplaySseq.fromJSONObject(JSON.parse(f.content));
                let sseq = Sseq.getSseqFromDisplay(dss);
                save(sseq, sseq.name);
            } catch (e) {
                console.log(f.name, f.content);
                console.log(e);
            }
        }
    }).catch(err => console.log(err));
    return false;
}

// This copies form.record into form.save_record to avoid a race condition between:
//    the onClose writes over form.record with form.original
//    the success code writes over form.original with form.record.
function backupRecord(form){
    form.save_record = {};
    Object.assign(form.save_record,form.record);
}

// Write over form.original and form.record with form.save_record. Better have called backupRecord first!
function saveRecord(form){
    Object.assign(form.original, form.save_record);
    Object.assign(form.record,   form.save_record);
}

// Write over form.record with form.original. Goes in the onClose handler.
function restoreRecord(form){
    Object.assign(form.record, form.original);
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
            "sseq-type"   : 'AHSS' // Start out with "AHSS" radio button selected.
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

let error_on_toString = {};
error_on_toString.toString = 1;

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
        }
    },
    {
        title   : 'New',
        // speed : error_on_toString
    }
);


async function openSseq(key){
    console.log(key);
    let loaded_dss = await Sseq.loadFromLocalStore(key);
    if(!loaded_dss){
        alert(`Unknown sseq ${key}`);
        throw new Error(`Unknown sseq ${key}`);
    }
    dss = loaded_dss;
    sseq = Sseq.getSseqFromDisplay(dss);
    sseq.type = w2ui.open_sseq_form.getType();
    sseq.addSseqFieldToSerialize("type");
    dss.type = sseq.type;
    setRange(sseq);
    addEventHandlers(sseq, dss);
    sseq.display();
    return true;
}

function newSseq(type, cells){
    sseq = new Sseq();
    sseq.undo = new Interface.Undo(sseq);
    console.log(sseq.undo);
    window.undo = sseq.undo;
    sseq.addSseqFieldToSerialize(["name","type", "polynomial_classes","differentials_source_target"]);
    sseq.differentials_source_target = [];
    sseq.addClassFieldToSerialize("vector");
    dss = sseq.getDisplaySseq();
    sseq.type = type;
    dss.type = type;
    setRange(sseq);
    addEventHandlers(sseq, dss);
    sseq_types[type].addCells(sseq, cells);
    sseq.getDisplaySseq();
    sseq.display();
}

function selectOddCycles(){
    for(let c of sseq.getSurvivingClasses(10000)){
        if(c.x % 2 !== 0){
            sseq.selectClass(c);
        }
        sseq.update();
    }
}

function setEdgeSource(event){
    if(event.mouseover_class){
        let c = event.mouseover_class;
        dss.temp_source_class = c;
        console.log(c);
        let sc = sseq.display_class_to_real_class.get(c);
        console.log(sc);
        display.status_div.html(`Adding differential. Source: ${tools.getClassExpression(c)}`);
    }
}



function setRange(sseq){
    sseq.xRange = [-24, 96];
    sseq.yRange = [0, 20];
    sseq.initialxRange = [0, 72];
    sseq.initialyRange = [0, 15];
}

function addEventHandlers(sseq, dss) {
    dss.addEventHandler("ctrl+s", (e) => {
        if (sseq.name || dss.name) {
            save(sseq, sseq.name || dss.name);
        } else {
            saveAsPrompt(sseq);
        }
        e.preventDefault();
        return true;
    });

    dss.addEventHandler("ctrl+shift+s", () => saveAsPrompt(sseq));
    dss.addEventHandler("u", upload);
    dss.addEventHandler("o", open_sseq_form.open);
    dss.addEventHandler("n", new_sseq_form.open);

    dss.addEventHandler('s', (event) => {
        if(event.mouseover_class){
            let c = event.mouseover_class;
            dss.temp_source_class = c;
            let sc = sseq.display_class_to_real_class.get(c);
            display.status_div.html(`Adding differential. Source: ${tools.getClassExpression(c)}`);
        }
    });

    dss.addEventHandler('t', sseq_types[dss.type].addDifferential);
    dss.addEventHandler('e', sseq_types[dss.type].addExtension);
    dss.addEventHandler("ctrl+z", sseq.undo.undo);
    dss.addEventHandler("ctrl+shift+z", sseq.undo.redo);
    if(sseq_types[dss.type].onDifferentialAdded){
        sseq.onDifferentialAdded(sseq_types[dss.type].onDifferentialAdded);
    }
}

setRange(sseq);
dss.type = "AHSS";
sseq.undo = new Interface.Undo(sseq);
addEventHandlers(sseq, dss);
sseq.display();
// display.addEventHandler("ctrl+z", undo.undo);
// display.addEventHandler("ctrl+shift+z", undo.redo);