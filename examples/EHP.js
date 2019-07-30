// Name: EHP
// Description: EHP Spectral Sequence for $p=2$. This is based on a combination of output from Strickland's mathematica program and from Mark Behren's tables.

let file_name = getJSONFilename("EHP");

Sseq.loadFromServer(file_name).catch((error) => console.log(error)).then((sseq) => {

    sseq._getYOffset = (c) => c.y_offset || 0;
    let display = new BasicDisplay("#main");

    if (on_public_website) {
        display.setSseq(sseq);
        return;
    }

    tools.install_edit_handlers(display, "EHP");

    let extensions = {
        0 : "2",
        1 : "eta",
        3 : "nu"
    };

    let extension_colors = {
        "2" : "blue",
        "eta" : "black",
        "nu" : "orange"
    };

    Mousetrap.bind('e', function() {
        if (display.mouseover_class && display.temp_source_class) {
            let s = display.temp_source_class;
            let t = display.mouseover_class;
            let degree = (t.x + t.y) - (s.x + s.y);
            console.log(degree);
            if(!extensions[degree]) {
                return;
            }
            let ext_type = extensions[degree];
            if (confirm(`Add *${ext_type} extension from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)) {
                let d = sseq.addExtension(s, t);
                d.color = extension_colors[ext_type];
                d.mult = ext_type;
                sseq.emit("update");
            }
        }
    });

    Mousetrap.bind('t', function() {
        if(display.mouseover_class && display.temp_source_class){
            let s = display.temp_source_class;
            let t = display.mouseover_class;
            console.log(s);
            console.log(t);
            if(s.x - t.x !== t.y - s.y + 1){
                return;
            }
            let length = s.x - t.x;
            if(confirm(`Add d${length} differential from ${tools.getClassExpression(s)} to ${tools.getClassExpression(t)}`)){
                let d = sseq.addDifferential(s, t, length);
                // let sourceOrder = 1;
                // if(d.source.EinftyOrder !== 2){
                //     sourceOrder = prompt(`Kernel order?`, 1)
                // }
                // let targetOrder = 1;
                // if(d.target.EinftyOrder !== 2){
                //     targetOrder = prompt(`Cokernel order?`, 1)
                // }
                //d.target_name = targetOrder + d.target_name;
                // d.addInfoToSourceAndTarget();
                // if(sourceOrder > 1){
                //     d.replaceSource(node_map[sourceOrder]);
                // }
                // if(targetOrder > 1){
                //     d.replaceTarget(node_map[targetOrder]);
                // }
                sseq.emit("update");
            }
        }
    });

    display.on("click", function(n) {
        if (!n) {
            return
        }
        let c = n.c
        if(confirm("Einfty or gen")) {
            let name = prompt("Einfty name?");
            if (name) {
                c.Einfty_name = name;
                c.addExtraInfo("$\\Rightarrow" + name + "$");
                //c.getNode().setFill(true);
                c.setColor("blue");

            }
        } else {
            let gen = prompt("genealogy?");
            if (!gen) {
                if (c.genealogy) {
                    c.setColor("blue", 0);
                }
                return;
            }
            let gen2 = "[" + gen + "]";
            let genObj;
            try {
                genObj = JSON.parse(gen2);
            } catch (e) {

            }

            if (genObj) {
                c.genealogy = genObj;
                c.extra_info = "";
                c.genealogyString = c.genealogy[0] + JSON.stringify(c.genealogy.slice(1));
                c.setColor("orange", 0);
            } else if (gen) {
                c.genealogyString = gen;
                c.setColor("orange", 0);
            }
            if(c.genealogyString){
                let ei = c.extra_info.split("\n");
                ei.splice(1,0,"$" + c.genealogyString + "$");
                c.extra_info = ei.join("\n");
            }
        }
        sseq.emit("update");
    });


    display.setSseq(sseq);
}).catch(err => console.log(err));






// Draws the SVG for the antidiagonal lines and metastable range overlay.
/*    let context = new C2S(
        display.canvasWidth/(display.xmaxFloat - display.xminFloat) * (sseq.xRange[1] - sseq.xRange[0] + 1),
        display.canvasHeight/(display.ymaxFloat - display.yminFloat) * (sseq.yRange[1] - sseq.yRange[0] + 1)
    );
    context.translate(
        - display.xScale(display.xminFloat) + display.xScale(sseq.xRange[0]) - display.leftMargin - display.xMinOffset,
          display.yScale(display.ymaxFloat) - display.yScale(sseq.yRange[1] + 1)
    );

    context.save();
    context.lineWidth = 0.3;
// Truncation lines
    let xScale = display.xScale;
    let yScale = display.yScale;
    for(let diag = 1; diag <= 40; diag ++){
        context.strokeStyle = diag % 2 ?  "#008181" : "#810000"; //"#818181" : "#810081";
        context.beginPath();
        context.moveTo(xScale(diag + 2), yScale(-2));
        context.lineTo(xScale(-2), yScale(diag + 2));
        context.stroke();
    }
    context.restore();

    context.save();
    context.lineWidth = 0.3;
    context.strokeStyle = "#818181";
    let x = 0.5;
    let y = -0.5;
    context.moveTo(xScale(x),yScale(y));
    for(let i = 0; i < 11; i++){
        y += 2;
        context.lineTo(xScale(x), yScale(y));
        x += 1;
        context.lineTo(xScale(x), yScale(y));
    }
    context.stroke();
    context.restore();
    //IO.download("lines.svg",context.getSerializedSvg(true));*/




// Makes a table

// for(let c of classes){
//     if(c.x + c.y > 19 || !c.genealogyString){
//         continue
//     }
//     s = c.x+c.y;
//     let ds = c.getDifferentials().filter( d => d.page > 1);
//     if(ds.length > 0){
//         let d = ds[0];
//         if(d.source === c){
//             continue;
//         }
//         stems[s].push(`${c.genealogyString}\leftarrow ${d.target.genealogyString}`);
//     } else {
//         stems[s].push(`${c.genealogyString}\Rightarrow ${c.Einfty_name})`);
//   }
// }
