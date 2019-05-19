// Name: Unstable ASS $S_2$
// Description: Unstable Adams Spectral Sequences for 2-local $S^3$, $S^5$, $S^7$ and $S^9$. The $E_2$ page was generated by scraping the data from Tangora's book, the names for the Toda range classes I got from Strickland's program, and I guessed a few differentials. Press + and - to switch spectral sequence.


"use strict";


let file_names = [];
let displayNames = [];

for(let n = 3; n <= 25; n += 2){
    file_names.push(`UASS-S^${n}`);
    displayNames.push(`S^${n}`);
}
file_names.push("ASS-S_2");
displayNames.push("Stable");

let full_file_names = file_names.map(getJSONFilename);


let file_idx = 0;
let max_file_idx = file_names.length - 1;

let dss_promises = full_file_names.map(Sseq.loadFromDataStoreOrServer);

window.stem_groups_by_sphere = [];

function setupDSS(dss, dss_list){
    dss.xRange = [0, 50];
    dss.yRange = [0, 20];
    dss.name = displayNames[file_idx];
    window.dss = dss;
    window.sseq = Sseq.getSseqFromDisplay(dss);
    dss.offset_size = 0.2;
    sseq.class_scale = 0.7;
    dss.class_scale = 0.7;
    // dss._getXOffset = tools.fixed_tower_xOffset.bind(dss);
    // dss._getYOffset = (c) => c.y_offset || 0;

    let stem_groups = [];
    for(let i = 1; i <= 19; i++){
        let stem_group = [];
        for(let c of sseq.getStem(i)){
            if(c.getPage() < 100){
                continue;
            }
            if(c.getDivisors().map((e) => e.otherClass(c)).filter((d) =>d.x === c.x && d.getPage()>100).length === 0){
                let n = 2;
                let name = c.name || "";
                while(true){
                    let prods = c.getProducts().map((e) => e.otherClass(c)).filter((d) => d.x === c.x && d.getPage()>100);
                    if(prods.length === 0){
                        break;
                    } else {
                        n *= 2;
                        c = prods[0];
                    }
                }
                stem_group.push([name,n]);
            }
        }
        stem_groups.push(stem_group)
    }
    stem_groups_by_sphere.push(stem_groups);




    dss.addEventHandler('+', (event) => {
        if(file_idx < max_file_idx){
            file_idx ++;
            switchToSseq(file_idx);
        }
    });

    dss.addEventHandler('-', (event) => {
        if(file_idx > 0) {
            file_idx --;
            switchToSseq(file_idx);
        }
    });

    dss.addEventHandler('=', (event) => {
        if(file_idx < max_file_idx){
            file_idx ++;
            switchToSseq(file_idx);
        }
    });

    if (on_public_website) {
        dss.display();
        return;
    }


    tools.install_edit_handlers(dss, file_names[file_idx]);

    let ext_colors = {"2": "orange", "\\eta": "purple", "\\nu": "brown"};

    for (let c of sseq.getClasses()) {
        if (c.lambda_tag) {
            c.setColor("blue");
        }
    }

    dss.addEventHandler('e', (event) => {
        if (event.mouseover_class && dss.temp_source_class) {
            let s = dss.temp_source_class;
            let t = event.mouseover_class;
            let ext_type = {0: 2, 1: "\\eta", 3: "\\nu"}[t.x - s.x];
            if (!ext_type) {
                return;
            }
            if (confirm(`Add *${ext_type} structline from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)) {
                let d = sseq.addStructline(sseq.display_class_to_real_class.get(s), sseq.display_class_to_real_class.get(t));
                d.color = ext_colors[ext_type];
                d.mult = ext_type;
                d.display_edge.mult = ext_type;
                d.display_edge.color = d.color;
                sseq.updateAll();
            }
        }
    });

    dss.addEventHandler('a', (event) => sseq.saveToLocalStore(sseq.path));

    return dss;
}
;
let ready_dss_list = new Array(dss_promises.length).fill(undefined);

let sphere_div = document.createElement("div");
sphere_div.style.setProperty("position", "absolute");
sphere_div.style.setProperty("top", "10px");
sphere_div.style.setProperty("left", "400px");
sphere_div.style.setProperty("font-family", "Arial");
sphere_div.style.setProperty("font-size","15px");
document.body.appendChild(sphere_div);

function switchToSseq(index){
    // if(!ready_dss_list[index]){
        dss_promises[index].then((dss) => {
            let x = setupDSS(dss);
            sphere_div.innerHTML = display.renderLaTeX(`UASS for $S^{${2*index+3}}$. Press +/- to change sphere.`);
        }).catch(err => console.log(err));
        return;
    // }
    // sphere_div.innerHTML = `UASS for S^{${2*index+3}}$. Press +/- to change sphere.`; //display.renderLaTeX(`UASS for S^{${2*index+3}}$. Press +/- to change sphere.`);
}

switchToSseq(0);