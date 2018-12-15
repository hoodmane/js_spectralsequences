// Name: ASS $S_2$
// Description: Adams Spectral Sequence for $S_2$. The $E_2$ page was generated by Amelia Perry's resolution program, the differentials and extensions were copied from Dan Isaksen.

"use strict";


let file_name = "ASS-S_2";
let on_public_website = new URL(document.location).hostname === "math.mit.edu";



file_name = `json/${file_name}.json`;
if(new URL(document.location).hostname === "math.mit.edu"){
    file_name = "js_spectralsequences/" + file_name;
}

let UASS_file_name = "UASS-S^100";



let UASS_full_file_name = `json/${UASS_file_name}.json`;
if(new URL(document.location).hostname === "math.mit.edu"){
    UASS_full_file_name = "js_spectralsequences/" + UASS_full_file_name;
}

//DisplaySseq.loadFromServer(UASS_full_file_name).catch((error) => console.log(error)).then((disp_uass) => {
    Sseq.loadFromServer(file_name).catch((error) => console.log(error)).then((dss) => {
        console.log(dss);
        dss.xRange = [0, 70];
        dss.yRange = [0, 40];
        window.dss = dss;
        window.sseq = Sseq.getSseqFromDisplay(dss);
        dss.offset_size = 0.2;
        dss._getXOffset = tools.fixed_tower_xOffset.bind(dss);
        dss._getYOffset = (c) => c.y_offset || 0;

        console.log(dss.classes[0].lambda_monomial);
        // sseq.addClassFieldToSerialize("lambda_monomial");
        // console.log(disp_uass);
        // let uass = Sseq.getSseqFromDisplay(disp_uass);
        // window.uass = uass;
        // for(let c of sseq.getClasses()){
        //     let cDeg = uass.getClassesInDegree(c.x,c.y);
        //     let candidates = [];
        //     let ctargets = [];
        //     for(let e of c.getStructlines()){
        //         let oc = e.otherClass(c);
        //         ctargets.push([oc.x,oc.y]);
        //     }
        //     ctargets.sort();
        //     for(let candidate of cDeg){
        //         let targets = [];
        //         for(let e of candidate.getStructlines()){
        //             let oc = e.otherClass(candidate);
        //             targets.push([oc.x,oc.y]);
        //         }
        //         if(targets.length !== ctargets.length){
        //             continue;
        //         }
        //         targets.sort();
        //         let okay = true;
        //         let i = 0;
        //         for(i=0; i<targets.length; i++){
        //             if(targets[i][0] !== ctargets[i][0] || targets[i][1] !== ctargets[i][1]){
        //                 okay = false;
        //                 break;
        //             }
        //         }
        //         if(c.x ===15 && c.y ===5){
        //             console.log(ctargets);
        //             console.log(targets);
        //             console.log(okay, i);
        //         }
        //         if(okay){
        //             candidates.push(candidate);
        //         }
        //     }
        //     if(candidates.length === 1){
        //         c.lambda_monomial = candidates[0].lambda_monomial;
        //         c.addExtraInfo(c.lambda_monomial);
        //         //c.setColor("blue");
        //     }
        // }

        function displayPage(pageRange) {
            if (pageRange === infinity) {
                return "∞";
            }
            if (pageRange === 0) {
                return "2 with all differentials";
            }
            if (pageRange === 1) {
                return "2 with no differentials";
            }
            if (pageRange.length) {
                return `${pageRange[0]} – ${pageRange[1]}`.replace(infinity, "∞");
            }
            return pageRange;
        }

        dss.on_draw = (display) => {
            let context = display.supermarginLayerContext;
            // page number
            context.clearRect(50, 0, 400, 200);
            context.font = "15px Arial";
            context.fillText(`Page ${displayPage(display.pageRange)}`, 100, 15);
        };

        if (on_public_website) {
            dss.display();
            return;
        }


        tools.install_edit_handlers(dss, "ASS-S_2");

        dss.addEventHandler("onclick", (event) => {
            if (!event.mouseover_class) {
                return;
            }
            let c = sseq.display_class_to_real_class.get(event.mouseover_class);
            let x_offset = Number.parseFloat(prompt(`x nudge ${c.name}`));
            if (x_offset) {
                let old_x_offset = c.x_offset || (dss._getXOffset(c.display_class) / dss.offset_size);
                c.x_offset = old_x_offset + x_offset;
            }

            let y_offset = Number.parseFloat(prompt(`y nudge ${c.name}`));
            if (y_offset) {
                let old_y_offset = c.y_offset || (dss._getYOffset(c.display_class) / dss.offset_size);
                c.y_offset = old_y_offset + y_offset;
            }
            console.log(c.x_offset);
            console.log(c.y_offset);
            sseq.update();
        });

        // dss.addEventHandler("onclick", (event) => {
        //     if(!event.mouseover_class){
        //         return;
        //     }
        //     let c = event.mouseover_class;
        //     let default_text = "";
        //     if(c.permanent_cycle_info){
        //         default_text = c.permanent_cycle_info;
        //     }
        //     let permanent_cycle_info = prompt(`Enter permanent cycle info for class ${c.name} in position (${c.x},${c.y})`, default_text);
        //     let real_class = sseq.display_class_to_real_class.get(c);
        //     if(permanent_cycle_info || permanent_cycle_info === ""){
        //         real_class.permanent_cycle_info = permanent_cycle_info;
        //         c.permanent_cycle_info = permanent_cycle_info;
        //         real_class.extra_info = `\n\\(${permanent_cycle_info}\\)`;
        //         sseq.update();
        //     }
        //     c.tooltip_html = undefined;
        // });

        // dss.addEventHandler("onclick", (event) => {
        //     if(!event.mouseover_class){
        //         return;
        //     }
        //     let c = sseq.display_class_to_real_class.get(event.mouseover_class);
        //     let exts = c.getExtensions();
        //     if(exts.length === 0){
        //         return;
        //     }
        //     let e = exts[0];
        //     let bend = Number.parseInt(prompt(`Enter bend angle`, e.bend));
        //     if(bend !== NaN){
        //         e.bend = bend;
        //         sseq.update();
        //     }
        // });

        let ext_colors = {"2": "orange", "\\eta": "purple", "\\nu": "brown"}

        dss.addEventHandler('e', (event) => {
            if (event.mouseover_class && dss.temp_source_class) {
                let s = dss.temp_source_class;
                let t = event.mouseover_class;
                let ext_type = {0: 2, 1: "\\eta", 3: "\\nu"}[t.x - s.x];
                if (!ext_type) {
                    return;
                }
                if (confirm(`Add *${ext_type} extension from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)) {
                    let d = sseq.addExtension(sseq.display_class_to_real_class.get(s), sseq.display_class_to_real_class.get(t));
                    d.color = ext_colors[ext_type];
                    d.mult = ext_type;
                    d.display_edge.mult = ext_type;
                    d.display_edge.color = d.color;
                    sseq.update();
                }
            }
        });

        console.log(dss.classes[0]);


        dss.display();
    });
//});