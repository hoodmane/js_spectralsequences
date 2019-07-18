"use strict"

let Display = require("./Display.js").Display;
let Interface = require("./Interface.js");
let Mousetrap = require("mousetrap");
let d3 = require("d3");
let tools = require("./ass_tools.js");

const STATE_ADD_DIFFERENTIAL = 1;
const STATE_RM_DIFFERENTIAL = 2;

const LAYOUT = [
  {
    name: "general_panel",
    tag: "div",
    children: [
      {
        tag: "div",
        class: "form-inline card-body",
        children: [
          {
            tag: "inputgroup",
            label: "Min X",
            type: "number",
            link: ["sseq", "minX"]
          },
          {
            tag: "inputgroup",
            label: "Max X",
            type: "number",
            link: ["sseq", "maxX"]
          },
          {
            tag: "inputgroup",
            label: "Min Y",
            type: "number",
            link: ["sseq", "minY"]
          },
          {
            tag: "inputgroup",
            label: "Max Y",
            type: "number",
            link: ["sseq", "maxY"]
          }
        ]
      }
    ]
  },
  {
    name: "node_panel",
    tag: "div",
    children: [
      {
        tag: "div",
        class: "card-header",
        children: [
          {
            name: "node_header",
            tag: "ul",
            class: "nav nav-tabs card-header-tabs"
          }
        ]
      },
      {
        name: "differentials",
        tag: "div",
        children: [
          {
            name: "differential_list",
            tag: "ul",
            class: "list-group list-group-flush",
            style: {"text-align": "center"}
          }
        ]
      },
      {
        name: "node",
        tag: "div",
        children: [
          {
            name: "title",
            tag: "div",
            class: "card-body",
            children: [
              {
                name: "title_text",
                tag: "span"
              },
              {
                name: "title_edit_link",
                tag: "a",
                class: "card-link-body",
                attr: { "href": "#" },
                style: { "float" : "right" },
                content: "Edit",
                listen: { "click": "_onTitleEditClick" }
              },
              {
                name: "title_edit_input",
                tag: "input",
                class: "form-control mt-2",
                attr: { "type": "text", "placeholder": "Enter class name" }
              }
            ]
          },
          {
            tag: "div",
            class: "form-inline card-body",
            children: [
              {
                tag: "inputgroup",
                label: "Color",
                type: "text",
                link: ["node", "color"]
              },
              {
                tag: "inputgroup",
                label: "Size",
                type: "number",
                link: ["node", "size"]
              }
            ]
          }
        ]
      }
    ]
  },
  {
    tag: "div",
    class: "card-body",
    style: { "height": "100%", "padding": "0", "margin": "0" } // fill space
  },
  {
    tag: "div",
    class: "card-body",
    children: [
      {
        tag: "button",
        class: "btn btn-primary mb-2",
        style: { "width": "100%" },
        content: "Download SVG",
        listen: { "click": "_onDownloadSVG" },
        attr: { "title": "Download SVG image of the current view of the spectral sequence" }
      },
      {
        tag: "button",
        class: "btn btn-primary",
        style: { "width": "100%" },
        content: "Save",
        listen: { "click": "_onSave" }
      }
    ]
  }
]

const NODE_TABS = new Map([["Node", "node"], ["Diff", "differentials"]]);

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
            .style("overflow", "auto")
            .style("border", "none")
            .attr("class", "card");
    }

    build(display) {
        this.links = [];
        this.display = display;
        this._processLayout(this.sidebar.node(), LAYOUT);

        for (let [title, div] of NODE_TABS) {
            let li = document.createElement("li");
            li.className = "nav-item";

            let a = document.createElement("a");
            a.className = "nav-link";
            a.href = "#";
            a.innerHTML = title;
            a.addEventListener("click", this.updateNodePanel.bind(this));

            li.appendChild(a);
            this.node_header.appendChild(li);
        }
        this.active = "Node";
        this.showGeneral();
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

    addDLI(html, callback) {
        let node = document.createElement("li");
        node.className = "list-group-item";
        node.style = "padding: 0.75rem 0";
        node.innerHTML = html;
        if (callback)
            node.addEventListener("click", callback);
        this.differential_list.appendChild(node);
    }

    _createInputGroup(p, item) {
        let o = document.createElement("div");
        o.className = "form-row mb-2";
        o.style.width = "100%";
        p.appendChild(o);

        let l = document.createElement("label");
        l.className = "col-form-label mr-sm-2";
        l.innerHTML = item.label;
        o.appendChild(l);

        let i = document.createElement("input");
        i.style["flex-grow"] = 1;
        i.setAttribute("type", item.type);
        o.appendChild(i);

        switch (item.type) {
            case "text":
                i.setAttribute("size", "1");
                break;
            case "number":
                i.style.width = "1px";
                break;
            default:
                break;
        }
        item.link.push(i);
        this.links.push(item.link);
        switch (item.link[0]){
            case "node":
                o.addEventListener("change", (e) => {
                    this.display.selected[item.link[1]] = e.target.value;
                    this.display.sseq.emit("update");
                });
                break;
            case "sseq":
                o.addEventListener("change", ((e) => {
                    this.display.sseq[item.link[1]] = e.target.value;
                    this.display.sseq.emit("update");
                }).bind(this));
                break;
            default:
                break;
        }

    }
    _processLayout(p, layout) {
        for (let item of layout) {
            if (item.tag == "inputgroup") {
                this._createInputGroup(p, item)
                continue;
            }
            let o = document.createElement(item.tag);
            p.appendChild(o);

            if (item.name) this[item.name] = o;
            if (item.class) o.className = item.class;

            if (item.style)
                for (let [k, v] of Object.entries(item.style))
                    o.style[k] = v;

            if (item.content) o.innerHTML = item.content;

            if (item.attr)
                for (let [k, v] of Object.entries(item.attr))
                    o.setAttribute(k, v);

            if (item.link) {
                item.link.push(o);
                this.links.push(item.link);
                switch (item.link[0]){
                    case "node":
                        o.addEventListener("change", ((e) => {
                            this.display.selected[item.link[1]] = e.target.value;
                            this.display.sseq.emit("update");
                        }).bind(this))
                        break;
                    default:
                        break;
                }
            }

            if (item.listen)
                for (let [k, v] of Object.entries(item.listen))
                    o.addEventListener(k, this[v].bind(this))

            if (item.children) this._processLayout(o, item.children);
        }
    }

    showGeneral() {
        this.node_panel.style.display = "none";
        this.general_panel.style.removeProperty("display");

        if (!this.display.sseq) return;

        for (let l of this.links)
            if (l[0] == "sseq")
                l[2].value = this.display.sseq[l[1]];
    }

    updateNodePanel(e) {
        if (e)
            this.active = e.target.innerHTML;

        for (let c of this.node_header.children) {
            let f = c.firstChild;
            if (f.innerHTML == this.active) {
                f.className = "nav-link active";
                this[NODE_TABS.get(f.innerHTML)].style.removeProperty("display");
            } else {
                f.className = "nav-link";
                this[NODE_TABS.get(f.innerHTML)].style.display = "none";
            }
        }
    }

    showNode(c) {
        this.general_panel.style.display = "none";
        this.node_panel.style.removeProperty("display");

        this.title_edit_link.innerHTML = "Edit";
        this.title_edit_input.value = "";
        this.title_edit_input.style.display = "none";

        if (c.name) {
            this.title_text.innerHTML = Interface.renderLaTeX(Interface.ensureMath(c.name)) + ` - (${c.x}, ${c.y})`;
        } else {
            this.title_text.innerHTML = `<span style='color: gray'>unnamed</span> - (${c.x}, ${c.y})`;
        }

        this.updateNodePanel();

        for (let l of this.links)
            if (l[0] == "node")
                l[2].value = c.node[l[1]];

        while(this.differential_list.firstChild)
            this.differential_list.removeChild(this.differential_list.firstChild);

        let edges = c.edges.filter(e => e.type === "Differential").sort((a, b) => a.page - b.page);

        let sname, tname;
        for (let e of edges) {
            sname = e.source.name ? e.source.name : "?"
            tname = e.target.name ? e.target.name : "?"
            if (e.source == c)
                this.addDLI(Interface.renderMath(`d_${e.page}({\\color{blue}${sname}}) = ${tname}`));
            else
                this.addDLI(Interface.renderMath(`d_${e.page}(${sname}) = {\\color{blue}${tname}}`));
        }

        this.addDLI("<a href='#'>Add differential</a>", this._addD.bind(this));
        this.addDLI("<a href='#'>Remove differential</a>", this._rmD.bind(this));
    }

    _onTitleEditClick() {
        let c = this.display.selected.c;

        if (this.title_edit_link.innerHTML == "OK") {
            c.name = this.title_edit_input.value;
            this.display.sseq.emit("update");
            this.showNode(c);
        } else {
            this.title_edit_link.innerHTML = "OK";
            if (c.name) this.title_edit_input.value = c.name;
            this.title_edit_input.style.removeProperty("display");
        }
    }

    _onNodeColorChange(e) {
        this.display.selected.c.node.color = e.target.value;
        this.display.update();
    }

    _onNodeSizeChange(e) {
        this.display.selected.c.node.size = e.target.value;
        this.display.update();
    }

    _addD() {
        this.display.state = STATE_ADD_DIFFERENTIAL;
    }
    _rmD() {
        this.display.state = STATE_RM_DIFFERENTIAL;
    }

    _onDownloadSVG() {
        this.display.downloadSVG("sseq.svg");
    }

    _onSave() {
        this.display.sseq.download("sseq.json");
    }
}
class EditorDisplay extends Display {
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

        this.sidebar = sidebar;
        this.sidebar.build(this);

        // Cannot call this before super
        this.parentContainer = parentContainer;
        this.sidebar = sidebar;

        this.differentialColors = {};


        this.tooltip = new Tooltip(this);

        // Page change
        this.page_indicator_div = this.container.append("div")
            .style("position", "absolute")
            .style("left", "20px")
            .style("top","0px")
            .style("font-family","Arial")
            .style("font-size","15px");

        Mousetrap.bind('left',  this.previousPage);
        Mousetrap.bind('right', this.nextPage);
        Mousetrap.bind('x', () => { if(this.mouseover_node){ console.log(this.mouseover_node.c); } });

        Mousetrap.bind('d', (() => this.state = STATE_ADD_DIFFERENTIAL).bind(this));
        Mousetrap.bind('r', (() => this.state = STATE_RM_DIFFERENTIAL).bind(this));

        this.on("mouseover", this._onMouseover.bind(this));
        this.on("mouseout", this._onMouseout.bind(this));
        this.on("click", this.__onClick.bind(this)); // Display already has an _onClick
        this.on("page-change", this._onPageChange.bind(this));
        this.setPage();

        this._onDifferentialAdded = this._onDifferentialAdded.bind(this);
    }

    setSseq(sseq) {
        if (this.sseq)
            this.sseq.removeListener("differential-added", this._onDifferentialAdded);

        super.setSseq(sseq)

        this.sidebar.showGeneral();
        this.sseq.on("differential-added", this._onDifferentialAdded);
    }

    setDifferentialColor(page, color) {
        this.differentialColors[page] = color;
    }

    getPageDescriptor(pageRange) {
        let basePage = 2;
        if(this.sseq.page_list.includes(1)){
            basePage = 1;
        }
        if (pageRange === infinity) {
            return "Page ∞";
        }
        if (pageRange === 0) {
            return `Page ${basePage} with all differentials`;
        }
        if (pageRange === 1 && basePage === 2) {
            return `Page ${basePage} with no differentials`;
        }
        if (pageRange.length) {
            if(pageRange[1] === infinity){
                return `Page ${pageRange[0]} with all differentials`;
            }
            if(pageRange[1] === -1){
                return `Page ${pageRange[0]} with no differentials`;
            }

            if(pageRange[0] === pageRange[1]){
                return `Page ${pageRange[0]}`;
            }

            return `Pages ${pageRange[0]} – ${pageRange[1]}`.replace(infinity, "∞");
        }
        return `Page ${pageRange}`;
    }

    nextPage(){
        if (this.page_idx < this.sseq.page_list.length - 1) {
            this.setPage(this.page_idx + 1);
            this.update();
        }
    }

    previousPage(){
        if (this.page_idx > this.sseq.min_page_idx) {
            this.setPage(this.page_idx - 1);
            this.update();
        }
    }

    _onMouseout() {
        // when mouseout is detected, the node is un-highlighted. We re-highlight if ti is selected.
        if (this.selected) this.selected.highlight = true;
        if (!this.selected) this.sidebar.showGeneral();
    }

    _onMouseover(node) {
        if (this.selected) return;

        this.sidebar.showNode(node.c);
    }

    _unselect() {
        if (!this.selected) return;

        this.selected.highlight = false;
        this.selected = null;
        this.state = null;

        this._onMouseout();

        this._drawSseq(this.context);
    }

    __onClick(node) {
        if (!node) {
            this._unselect();
            return;
        }

        if (!this.selected) {
            this._unselect();
            this.selected = node;
            this.state = null;
            return;
        }

        let s = this.selected.c;
        let t = node.c;
        switch (this.state) {
            case STATE_ADD_DIFFERENTIAL:
                if(s.x !== t.x + 1){
                    this._unselect();
                    break;
                }
                let length = t.y - s.y;
                this.sseq.addDifferential(s, t, length);
                this.state = null;
                display.sseq.emit('update');
                this.sidebar.showNode(s);
                break;
            case STATE_RM_DIFFERENTIAL:
                for (let e of s.edges)
                    if (e.target == t)
                        sseq.deleteEdge(e);

                this.state = null;
                display.sseq.emit('update');
                this.sidebar.showNode(s);
                break;
            default:
                this._unselect();
                this.selected = node;
                this.sidebar.showNode(t);
                break;
        }
    }

    _onPageChange(r) {
        this.page_indicator_div.html(this.getPageDescriptor(r))
        this._unselect();
    }

    _onDifferentialAdded(d) {
        if (this.differentialColors[d.page])
            d.color = this.differentialColors[d.page];
    }
}

class Tooltip {
    constructor(display) {
        this.display = display;
        this.tooltip_div = display.container.append("div")
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

        let tooltip_html = `(${c.x}, ${c.y})`;
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
}
exports.EditorDisplay = EditorDisplay;
