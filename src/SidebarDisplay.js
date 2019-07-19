"use strict"

let Display = require("./Display.js").Display;
let EventEmitter = require("events");
let Panel = require("./Panel.js");
let d3 = require("d3");

class Sidebar {
    constructor(parentContainer) {
        this.parentContainer = parentContainer;

        this.adjuster = parentContainer.append("div")
            .style("background-color", "rgba(0,0,0,0.125)")
            .style("height", "100%")
            .style("cursor", "ew-resize")
            .style("width", "2px");

        this.resize = this.resize.bind(this);
        this.stopResize = this.stopResize.bind(this);

        this.adjuster.node().addEventListener("mousedown", (function(e) {
            e.preventDefault();
            window.addEventListener('mousemove', this.resize);
            window.addEventListener('mouseup', this.stopResize);
        }).bind(this));

        this.sidebar = parentContainer.append("div")
            .style("height", "100%")
            .style("width", "240px")
            .style("border", "none")
            .style("display", "flex")
            .style("flex-direction", "column")
            .attr("class", "card");

        this.main_div = this.sidebar.append("div").style("overflow", "auto").node();
        this.filler_div = this.sidebar.append("div").style("flex-grow", "1");
        this.footer_div = this.sidebar.append("div").node();

        this.panels = [];
        this.currentPanel = null;
    }

    addPanel(panel) {
        this.panels.push(panel);
        return this.panels.length;
    }

    init(display) {
        this.display = display;
        this.footer = new Panel.Panel(this.footer_div, display);
    }

    resize(e) {
        let width = this.sidebar.node().getBoundingClientRect().right - e.pageX;
        this.sidebar.node().style.width = `${width}px`;
    }

    stopResize() {
        window.removeEventListener('mousemove', this.resize);
        window.removeEventListener('mouseup', this.stopResize);
        this.display.resize();
    }

    showPanel(panel) {
        if (!panel) panel = this.currentPanel;
        this.currentPanel = panel;

        for (let x of this.panels) {
            if (x == panel)
                x.show();
            else
                x.hide();
        }
    }
}

class SidebarDisplay extends Display {
    constructor(container, sseq) {
        let parentContainer = d3.select(container);
        parentContainer.style("display", "flex");
        parentContainer.style("display-direction", "row");

        let child = parentContainer.append("div")
            .style("height", "100%")
            .style("min-height", "100%")
            .style("overflow", "hidden")
            .style("position", "relative")
            .style("flex-grow", "1");

        let sidebar = new Sidebar(parentContainer)

        super(child.node(), sseq);
        // Cannot call this before super
        this.parentContainer = parentContainer;

        this.sidebar = sidebar;
        this.sidebar.init(this);
    }
}

exports.SidebarDisplay = SidebarDisplay;
