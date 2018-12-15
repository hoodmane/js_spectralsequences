
let file_name = "EHP";
let on_public_website = new URL(document.location).hostname === "math.mit.edu";



file_name = `json/${file_name}.json`;
if(new URL(document.location).hostname === "math.mit.edu"){
    file_name = "js_spectralsequences/" + file_name;
}

console.log(file_name);
Sseq.loadFromServer(file_name).catch((error) => console.log(error)).then((dss) => {
    window.dss = dss;
    window.sseq = Sseq.getSseqFromDisplay(dss);
    dss.offset_size = 0.2;
    dss._getXOffset = tools.fixed_tower_xOffset.bind(dss);
    dss._getYOffset = (c) => c.y_offset || 0;


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

    sseq.onDraw((display) => {
        console.log("1");
        let context = display.edgeLayerContext;
        context.clearRect(0, 0, this.width, this.height);
        context.save();
        context.lineWidth = 0.3;
        context.strokeStyle = "#818181";
        let xScale = display.xScale;
        let yScale = display.yScale;
        // Truncation lines
        for(let diag = 1; diag <= 40; diag ++){
            context.moveTo(xScale(diag + 2), yScale(-2));
            context.lineTo(xScale(-2), yScale(diag + 2 ));
        }
        context.stroke();
        //context.restore();
        //context.save();
        //context.strokeStyle = "#000";
        //context.lineWidth = 1;

        let x = -0.5;
        let y = 0.5;
        context.moveTo(xScale(x),yScale(y));
        for(let i = 0; i < 10; i++){
            y += 2;
            context.lineTo(xScale(x),yScale(y));
            x += 1;
            context.lineTo(xScale(x),yScale(y));
        }
        context.stroke();
        context.restore();



        context = display.supermarginLayerContext;
        // page number
        context.clearRect(50, 0, 400, 200);
        context.font = "15px Arial";
        context.fillText(`Page ${displayPage(display.pageRange)}`, 100, 15);
        console.log("2");
    });


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
}).catch(err => console.log(err));