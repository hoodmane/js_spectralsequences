let Sseqjs = require("./Sseq.js");
let Sseq = Sseqjs.Sseq;

exports.getClassExpression = function(c){
    let out = `(${c.x}, ${c.y})`;
    if(c.name){
        out += ` [${c.name}]`;
    }
    return out;
};

function variablePowerString(variable, power){
    if(power === 1){
        return variable;
    }
    return `${variable}^{${power}}`;
}

exports.multiply_monomial = function(variable, power, monomial){
    let power_regex = new RegExp(`${variable}(\\^{?(.)}?)?`.replace("\\","\\\\").replace(/\{/g,"\\{").replace(/\}/g,"\\}"));
    let matcher = power_regex.exec(monomial);
    if(!power_regex.test(monomial)){
        console.log(monomial);
        return variablePowerString(variable, power) + monomial;
    }
    console.log(power_regex);
    console.log(matcher[2]);
    let old_power = Number.parseInt(matcher[2] || 1);
    let new_power = old_power + power;
    return monomial.replace(power_regex, `${variable}^{${new_power}}`);
};


exports.straightenTowers = function(sseq){
    let column_maps = new Map();
    for(let c of sseq.classes){
        c.h0div = [];
        c.h0mult = [];
        c.tower = {length : 0, base : c};
    }

    for(let structline of sseq.getStructlines()){
        if(structline.source.x !== structline.target.x) {
            continue;
        }
        let source, target;
        if(structline.source.y < structline.target.y){
            source = structline.source;
            target = structline.target;
        } else {
            source = structline.target;
            target = structline.source;
        }
        source.h0mult.push(target);
        target.h0div.push(source);
    }

    let columns = new Map();
    let longest_towers = new Map();

    let xmax = 0;
    let ymax = 0;


    for(let c of sseq.classes){
        if(!columns.has(c.x)){
            columns.set(c.x, new Map());
        }
        if(!columns.get(c.x).has(c.y)){
            columns.get(c.x).set(c.y,[]);
        }
        columns.get(c.x).get(c.y).push(c);
        if(c.x > 0 && c.y > ymax){
            ymax = c.y;
        }
        if(c.x > xmax){
            xmax = c.x;
        }
    }

    let longest_tower_map = new Map();
    for(let x = 1; x < xmax; x++){
        if(!columns.has(x)){
            continue;
        }
        let col = columns.get(x);
        let longest_tower = {};
        let longest_tower_length = -1;
        for(let y = 1; y < ymax; y++){
            if(!col.has(y)){
                continue;
            }
            for(let c of col.get(y)){
                let tower = c.tower;
                for(let div of c.h0div){
                    if(div.tower.length > tower.length){
                        tower = div.tower;
                    }
                }
                tower.length ++;
                c.tower = tower;
                if(tower.length > longest_tower_length){
                    longest_tower_length = tower.length;
                    longest_tower = tower;
                }
            }
        }
        if(longest_tower.length > 3){
            for(let c = longest_tower.base; c ; c = c.h0mult[0]){
                c.x_offset = 0;
                sseq.updateClass(c);
                for(let oc of sseq.getClassesInDegree(c.x,c.y)){
                    oc.display_class.has_fixed_class = true;
                }
            }
        }
    }
};


exports.minimizeCrossings = function(sseq){
    let cell_class_list = new StringifyingMap();
    for(let stem of sseq.getOccupiedStems()){
        let classes = sseq.getStem(stem);
        let column = new Map();
        for(let c of sseq.getClasses()){
            if(!column.has(c.y)){
                column.set(c.y, []);
            }
            column.get(c.y).push(c);
        }

        for(let cell of column.values()){
            if(cell.length === 1){
                continue;
            }
            for(let c of cell){
                c.crossing_score = 0;
                for(let sl of c.structlines){
                    let t = otherClass(sl,c);
                    if(t.x < c.x){
                        c.crossing_score --;
                    } else if(t.x > c.x){
                        c.crossing_score ++;
                    }
                }
            }
            cell.sort((c) => c.crossing_score);
            for(let i = 0; i < cell.length; i++){
                cell[i].idx = i;
            }

        }
    }
}



exports.fixed_tower_xOffset = function(c,page){
    if(c.x_offset !== false){
        return c.x_offset * this.offset_size;
    }
    let total_classes = this.num_classes_by_degree.get([c.x, c.y]);
    let idx = c.idx;
    //console.log(idx);
    let out = (idx - (total_classes - 1)/2);
    if(c.has_fixed_class){
        let out_old = out;
        if(total_classes % 2 === 0){
            if(out >= 0){
                out += 1/2;
            } else {
                out -= 1/2;
            }
        } else {
            if(out >= 0){
                out += 1;
            }
        }
    }
    return out * this.offset_size;
};

exports.install_edit_handlers = function(dss, download_filename){
    dss.addEventHandler("q", (event) => {
        if(!event.mouseover_class){
            return;
        }
        sseq.incrementClassIndex(sseq.display_class_to_real_class.get(event.mouseover_class));
    });

    dss.addEventHandler("w", (event) => {
        if(!event.mouseover_class){
            return;
        }
        sseq.decrementClassIndex(sseq.display_class_to_real_class.get(event.mouseover_class));
    });

    dss.addEventHandler("d", (event) => {
        dss.real_sseq.download(download_filename + ".json");
    });

    dss.addEventHandler('s', (event) => {
        if(event.mouseover_class){
            let c = event.mouseover_class;
            dss.temp_source_class = c;
            display.status_div.html(`Adding differential. Source: ${exports.getClassExpression(c)}`);
        }
    });



    dss.addEventHandler('t', (event) => {
        if(event.mouseover_class && dss.temp_source_class){
            let s = dss.temp_source_class;
            let t = event.mouseover_class;
            console.log(s);
            console.log(t);
            if(s.x !== t.x + 1){
                return;
            }
            let length = t.y - s.y;
            if(confirm(`Add d${length} differential from ${exports.getClassExpression(s)} to ${exports.getClassExpression(t)}`)){
                let d = sseq.addDifferential(sseq.display_class_to_real_class.get(s), sseq.display_class_to_real_class.get(t), length);
                //d.color = differential_colors[d.page];
                d.display_edge.color = d.color;
                dss.update();
            }
        }
    });

    dss.addEventHandler('n', (event) => {
        if(event.mouseover_class && dss.temp_source_class){
            let s = dss.temp_source_class;
            let t = event.mouseover_class;
            let source = sseq.display_class_to_real_class.get(s);
            let target = sseq.display_class_to_real_class.get(t);
            if(confirm(`Delete edges ${exports.getClassExpression(s)} to ${exports.getClassExpression(t)}`)){
                source.getEdges().filter((e) => e.otherClass(source) === target).forEach(e => e.delete());
                dss.update();
            }
        }
    });

    // dss.addEventHandler("onclick", (event) => {
    //     console.log(event);
    // });

    dss.addEventHandler("onclick", (event) => {
        let sseq = dss.real_sseq;
        if(!event.mouseover_class){
            return;
        }
        let c = event.mouseover_class;
        let default_text = "";
        if(c.name){
            default_text = c.name;
        }
        let name = prompt(`Enter new name for class at position (${c.x},${c.y})`, default_text);
        let real_class = sseq.display_class_to_real_class.get(c);
        if(name || name === ""){
            real_class.name = name;
            real_class.setColor("black");
            sseq.update();
        }
        c.tooltip_html = undefined;
        //add_g1_name_if_possible(real_class);
    });


    dss.addEventHandler("p", (event) => {
        if(event.mouseover_class){
            event.mouseover_class.problem = true;
        }
    });
}


exports.addProductNames = function(sseq, variable){
    let indecomposable_classes = sseq.classes.filter(c => !c.structlines.some( sl => otherClass(sl,c).y < c.y && sl.visible));
    for(let c of indecomposable_classes){
        let name = c.name;
        if(!name){
            continue;
        }
        let power = 1;
        while(c){
            let h0mult = c.getProducts(variable);
            if(h0mult.length !== 1){
                break;
            }
            c = otherClass(h0mult[0], c);
            if(c.name){
                break;
            }
            c.name = tools.multiply_monomial(variable, power, name);
            sseq.update();
            power ++;
        }
    }
}



/*
// Fill in powers of variables with predictable names.
let bpower_regex = /b(\^(.))?/;
let a1power_regex = /a_1(\^(.))?/;
for(let c of sseq.classes.filter(c => c.name)){
    if(c.name && bpower_regex.test(c.name)){
        let bpower_matcher = bpower_regex.exec(c.name);
        console.log(c.name);
        let bpower = Number.parseInt(bpower_matcher[2]) || 1;
        for(let i = 1; true; i++){
            let classes = sseq.getClassesInDegree(c.x + i*10, c.y + i*2).filter((c) => c.getColor() === "blue");
            if(classes.length === 0){
                console.log(c.name + " break")
                break;
            }
            if(classes.length > 1){
                console.log(c.name + " continue")
                continue;
            }
            let bic = classes[0];
            if(bic.name){
                console.log(c.name + " has name: " + bic.name)
                break;
            }
            console.log(bic);
            bic.name = c.name.replace(bpower_regex, `b^{${bpower + i}}`);
            bic.setColor("black");
            console.log(c.name + ", " + bic.name);
        }
    }
}
sseq.update();

for(let c of sseq.classes.filter(c => c.name)){
    if(c.name && a1power_regex.test(c.name)){
        let a1power_matcher = a1power_regex.exec(c.name);
        console.log(c.name);
        let a1power = Number.parseInt(a1power_matcher[2]) || 1;
        for(let i = 1; true; i++){
            let classes = sseq.getClassesInDegree(c.x + i*12, c.y + i*3).filter((c) => c.getColor() === "blue");
            if(classes.length === 0){
                break;
            }
            if(classes.length > 1){
                continue;
            }
            let bic = classes[0];
            if(bic.name){
                break;
            }
            console.log(bic);
            bic.name = c.name.replace(a1power_regex, `a_1^{${a1power + i}}`);
            bic.setColor("black");
        }
    }
}
sseq.update();
*/
