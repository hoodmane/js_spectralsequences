function otherClass(sl,c){
    if(sl.source === c){
        return sl.target;
    } else {
        return sl.source;
    }
}


function getClassExpression(c){
    let out = `(${c.x}, ${c.y})`;
    if(c.name){
        out += ` [${c.name}]`;
    }
    return out;
}


function getStructlinesWithOffset(c, dx, dy){
    return c.structlines.map((sl) => otherClass(sl,c)).filter( (t) => t.x === c.x + dx && t.y === c.y + dy);
}

function addName(c, name){
    if(c.names === undefined){
        c.names = [];
    }
    c.names.push(name);
}


let bpower_regex = /b(\^\{?(.)\}?)?/;
let a1power_regex = /a_1(\^\{?(.)\}?)?/;
function add_g1_name_if_possible(c){
    if(!c.name || !bpower_regex.test(c.name)){
        return;
    }
    let a0_mult_h0_div = c.getProductIfPresent("a0").getDivisorIfPresent("h_0");
    if(a0_mult_h0_div.isDummy()){
        return;
    }
    a1div.name = c.name.replace(bpower_regex,(match, p1, p2) => {
        let bpower;
        if(!p2){
            return "g_1"
        } else {
            bpower = Number.parseInt(match[2]);
            bpower--;
            if(bpower === 1){
                return "g_1b";
            }
            return `g_1b^${bpower}`;
        }
    });
    a1div.setColor("black");
    a1div.tooltip_html = undefined;
    sseq.updateClass(a1div);
}


DisplaySseq.fromJSON("json/ASS-3.json")
    .then((dss) => {
        dss._getYOffset = () => 0;
        dss.offset_size = 0.5;
        dss.class_scale = 0.7;
        dss.xRange = [0,110];
        dss.yRange = [0, 28];
        dss.initialxRange = [0,40];
        dss.initialyRange = [0,10];


        dss.offset_size = 0.2;
        dss._getXOffset = tools.fixed_tower_xOffset.bind(dss);
        dss._getYOffset = () => 0;



        let sseq = Sseq.getSseqFromDisplay(dss);
        window.dss = dss;
        window.sseq = sseq;

        sseq.addPageRangeToPageList([3,100]);

        dss.initial_page_idx = 7;

        dss.setPageChangeHandler((page) => {
            if(page === infinity){
                for(let sl of sseq.getStructlines()){
                    sl.visible = true;
                    sseq.updateEdge(sl);
                }
            } else {
                let visible_mults;
                if(page > 2 || page[0] > 2){
                    visible_mults = ["a_0", "h_0", "v_1", "<h_0,h_0,->"];
                } else {
                    visible_mults = ["a_0", "h_0", "<h_0,h_0,->"];
                }

                for(let sl of sseq.getStructlines()){
                    sl.visible = visible_mults.includes(sl.mult);
                    sseq.updateEdge(sl);
                }
            }
        });



        for(let d of sseq.differentials){
            d.addInfoToSourceAndTarget();
            d.source.update();
            d.target.update();
        }

        // for(let c of sseq.classes){
        //     let bc = c.getProductIfPresent("h_0").getProductIfPresent("<h_0,h_0,->");
        //     if(bc.isDummy()){
        //         bc = c.getProductIfPresent("<h_0,h_0,->").getProductIfPresent("h_0");
        //     }
        //     if(bc.isDummy()){
        //         continue;
        //     }
        //     let sl = sseq.addStructline(c, bc);
        //     sl.mult = "b";
        //     sl.display_edge.mult = "b";
        //     sl.visible = false;
        //     //sl..mult = "b";
        //     sseq.updateEdge(sl);
        // }

        sseq.onDifferentialAdded((d) => {
            d.addInfoToSourceAndTarget();
            d.source.update();
            d.target.update();
            d.leibniz(["a_0", "h_0", "<h_0,h_0,->","b"]);
        });



        for(let c of sseq.classes){
            c.setColor("black");
            sseq.updateClass(c);
        }


        tools.install_edit_handlers(dss,"ASS-3");



        dss.addKeyHandler("onclick", (event) => {
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
                sseq.updateClass(real_class);
                dss.update();
            }
            c.tooltip_html = undefined;
            add_g1_name_if_possible(real_class);
        });

        function setPermanentCycleInfo(real_class,str){
            real_class.permanent_cycle_info = str;
            real_class.display_class.permanent_cycle_info = str;
            real_class.addExtraInfo(`\\(${str}\\)`);
            real_class.setColor("black");
            sseq.updateClass(real_class);
            dss.update();
        }

        function setPermanentCycleInfoRec(c, str){
            if(c.page < infinity){
                return;
            }
            setPermanentCycleInfo(c,str);
            let bc = c.getProductIfPresent("b");
            if(!bc.isDummy() && !bc.permanent_cycle_info){
                setPermanentCycleInfoRec(bc,tools.multiply_monomial("\\beta_{1}",1,str));
            }
            let ac = c.getProductIfPresent("h_0");
            if(!ac.isDummy() && !ac.permanent_cycle_info) {
                setPermanentCycleInfoRec(ac, "\\alpha_{1}" + str);
            }
        }

        dss.addKeyHandler("onclick", (event) => {
            if(!event.mouseover_class){
                return;
            }
            let c = event.mouseover_class;
            let default_text = "";
            if(c.permanent_cycle_info){
                default_text = c.permanent_cycle_info;
            }
            let permanent_cycle_info = prompt(`Enter permanent cycle info for class ${c.name} in position (${c.x},${c.y})`, default_text);
            let real_class = sseq.display_class_to_real_class.get(c);
            if(permanent_cycle_info || permanent_cycle_info === ""){
                real_class.permanent_cycle_info = permanent_cycle_info;
                c.permanent_cycle_info = permanent_cycle_info;
                real_class.extra_info = `\n\\(${permanent_cycle_info}\\)`;
                real_class.update();

                //c.tooltip_html = undefined;
                dss.update();
            }
            c.tooltip_html = undefined;
            add_g1_name_if_possible(real_class);
        });

        dss.display();
    });
