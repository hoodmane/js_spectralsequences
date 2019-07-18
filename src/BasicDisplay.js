"use strict"

let Display = require("./Display.js").Display;
let Interface = require("./Interface.js");
let Mousetrap = require("mousetrap");

class BasicDisplay extends Display {
    constructor(container, sseq) {
        super(container, sseq);

        this.page_indicator_div = this.container.append("div")
            .style("position", "absolute")
            .style("left", "20px")
            .style("top","0px")
            .style("font-family","Arial")
            .style("font-size","15px");

        this.tooltip = new Tooltip(this);

        Mousetrap.bind('left',  this.previousPage);
        Mousetrap.bind('right', this.nextPage);
        Mousetrap.bind('x',
            () => {
                if(this.mouseover_node){
                    console.log(this.mouseover_node.c);
                }
            }
        );

        this.on("page-change", r => this.page_indicator_div.html(this.getPageDescriptor(r)));

        // Trigger page-change to set initial page_indicator_div
        this.setPage();

        this.status_div = this.container.append("div")
            .attr("id", "status")
            .style("position", "absolute")
            .style("left", `20px`)
            .style("bottom",`20px`)
            .style("z-index", 1000);
    }

    setStatus(html){
        if(this.status_div_timer){
            clearTimeout(this.status_div_timer);
        }
        this.status_div.html(html);
    }

    delayedSetStatus(html, delay){
        this.status_div_timer = setTimeout(() => setStatus(html), delay);
    }
}

class Tooltip {
    constructor(display) {
        this.display = display;
        this.tooltip_div = d3.select("body").append("div")
                .attr("class", "tooltip")
                .style("opacity", 0)
                .style("z-index", 999999);
        this.display.on("mouseover", this._onMouseover.bind(this));
        this.display.on("mouseout", this._onMouseout.bind(this));
    }

    _onMouseover (node) {
        let x = node.x;
        let y = node.y;
        let c = node.c;

        let tooltip_html = this.getClassTooltipHTML(c, this.display.page);
        let rect = this.tooltip_div.node().getBoundingClientRect();
        let tooltip_width = rect.width;
        let tooltip_height = rect.height;

        this.tooltip_div.html(tooltip_html);
        this.tooltip_div.style("left", (x + 25) + "px")
            .style("top", (y - tooltip_height) + "px")
            .style("right", null).style("bottom", null);
        let bounding_rect = this.tooltip_div.node().getBoundingClientRect();
        if (bounding_rect.right > this.display.canvasWidth) {
            this.tooltip_div.style("left", null)
                .style("right", (this.display.canvasWidth - x + 10) + "px")
        }
        if (bounding_rect.top < 0) {
            this.tooltip_div.style("top", (y + 10) + "px")
        }

        this.tooltip_div.transition()
            .duration(200)
            .style("opacity", .9);

    }
    _onMouseout () {
        this.tooltip_div.transition()
            .duration(500)
            .style("opacity", 0);
    }

    /**
     * Gets the tooltip for the current class on the given page (currently ignores the page).
     * @param c
     * @param page
     * @returns {string}
     */
    getClassTooltip(c, page) {
        let tooltip = c.getNameCoord();
        let extra_info = Tooltip.toTooltipString(c.extra_info, page);

        if (extra_info)
            tooltip += extra_info;
        return tooltip;
    }

    getClassTooltipHTML(c, page) {
        return Interface.renderLatex(this.getClassTooltip(c,page));
    }    

    static toTooltipString(obj, page) {
        if (!obj) {
            return false;
        }

        if(obj.constructor === String){
            return obj;
        }

        if(obj.constructor === Array) {
            return obj.map((x) => Tooltip.toTooltipString(x, page)).filter((x) => x).join("\n");
        }

        if(obj.constructor === Map){
            let lastkey;
            for (let k of obj.keys()) {
                if (k > page) {
                    break;
                }
                lastkey = k;
            }
            return Tooltip.toTooltipString(obj.get(lastkey));
        }

        return false;
    }
}

exports.BasicDisplay = BasicDisplay;
