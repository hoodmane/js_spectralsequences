"use strict"

let EventEmitter = require("events");
let Mousetrap = require("mousetrap");
let Interface = require("./Interface.js");

const STATE_ADD_DIFFERENTIAL = 1;
const STATE_RM_DIFFERENTIAL = 2;
const STATE_ADD_STRUCTLINE = 3;
const STATE_RM_STRUCTLINE = 4;
const STATE_RM_EDGE = 5;

class Panel extends EventEmitter {
    constructor (parentContainer, display) {
        super();

        this.display = display;
        this.parentContainer = parentContainer;
        this.container = document.createElement("div");
        this.parentContainer.appendChild(this.container);
        this.links = [];

        this.currentGroup = this.container;
    }
    hide() {
        this.container.style.display = "none";
    }
    show() {
        this.container.style.removeProperty("display");

        for (let link of this.links) {
            let t = this.display;
            for (let attr of link[0].split(".")) {
                t = t[attr];
                if (t === undefined || t === null) {
                    return;
                }
            }
            link[1].value = t;
        }
        this.emit("show");
    }

    newGroup() {
        this.currentGroup = document.createElement("div");
        this.currentGroup.className = "card-body";
        this.container.appendChild(this.currentGroup);
    }
    endGroup() {
        this.currentGroup = this.container;
    }

    addObject(obj) {
        this.currentGroup.appendChild(obj);
    }

    addButton(text, callback, extra = {}) {
        let o = document.createElement("button");
        if (extra.style)
            o.className = `btn btn-${extra.style} mb-2`;
        else
            o.className = "btn btn-primary mb-2";

        o.style.width = "100%";
        o.innerHTML = text;
        o.addEventListener("click", callback);

        if (extra.tooltip)
            o.addAttribute("title", extra.tooltip);
        if (extra.shortcuts)
            for (let k of extra.shortcuts)
                Mousetrap.bind(k, callback);

        this.currentGroup.appendChild(o);
    }

    addLinkedInput(label, target, type) {
        let o = document.createElement("div");
        o.className = "form-row mb-2";
        o.style.width = "100%";
        this.currentGroup.appendChild(o);

        let l = document.createElement("label");
        l.className = "col-form-label mr-sm-2";
        l.innerHTML = label;
        o.appendChild(l);

        let i = document.createElement("input");
        i.style["flex-grow"] = 1;
        i.setAttribute("type", type);
        o.appendChild(i);

        switch (type) {
            case "text":
                i.setAttribute("size", "1");
                break;
            default:
                i.style.width = "1px";
                break;
        }

        this.links.push([target, i]);

        o.addEventListener("change", (e) => {
            let t = this.display;
            let l = target.split(".");
            for (let i = 0; i < l.length - 1; i++) {
                t = t[l[i]];
                if (!t) return;
            }
            t[l[l.length-1]] = e.target.value;

            this.display.sseq.emit("update");
        });
    }

}

class TabbedPanel extends Panel {
    constructor (parentContainer, display) {
        super(parentContainer, display);

        let head = document.createElement("div");
        head.className = "card-header";
        this.container.appendChild(head);

        this.header = document.createElement("ul");
        this.header.className = "nav nav-tabs card-header-tabs";
        head.appendChild(this.header);

        this.tabs = [];
        this.currentTab = null;
    }

    addTab(name, tab) {
        let li = document.createElement("li");
        li.className = "nav-item";
        this.header.appendChild(li);

        let a = document.createElement("a");
        a.className = "nav-link";
        a.href = "#";
        a.innerHTML = name;
        li.appendChild(a);

        a.addEventListener("click", () => this.showTab(tab));
        this.tabs[this.tabs.length] = [tab, a];

        if (!this.currentTab) this.currentTab = tab;
    }

    show() {
        super.show();
        this.showTab(this.currentTab);
    }

    showTab(tab) {
        this.currentTab = tab;
        for (let t of this.tabs) {
            if (t[0] == tab) {
                t[1].className = "nav-link active";
                t[0].show();
            } else {
                t[1].className = "nav-link";
                t[0].hide();
            }
        }
    }
}

class DifferentialPanel extends Panel {
    constructor(parentContainer, display) {
        super(parentContainer, display);

        this.differential_list = document.createElement("ul");
        this.differential_list.className = "list-group list-group-flush";
        this.differential_list.style["text-align"] = "center";
        this.addObject(this.differential_list);

        this.on("show", () => {
            while(this.differential_list.firstChild)
                this.differential_list.removeChild(this.differential_list.firstChild);

            let edges = this.display.selected.c.edges.filter(e => e.type === "Differential").sort((a, b) => a.page - b.page);

            let sname, tname;
            for (let e of edges) {
                sname = e.source.name ? e.source.name : "?"
                tname = e.target.name ? e.target.name : "?"
                if (e.source == this.display.selected.c)
                    this.addLI(Interface.renderMath(`d_${e.page}({\\color{blue}${sname}}) = ${tname}`));
                else
                    this.addLI(Interface.renderMath(`d_${e.page}(${sname}) = {\\color{blue}${tname}}`));
            }

            this.addLI("<a href='#'>Add differential</a>", () => this.display.state = STATE_ADD_DIFFERENTIAL );
            this.addLI("<a href='#'>Remove differential</a>", () => this.display.state = STATE_RM_DIFFERENTIAL );
        });

    }

    addLI(html, callback) {
        let node = document.createElement("li");
        node.className = "list-group-item";
        node.style = "padding: 0.75rem 0";
        node.innerHTML = html;
        if (callback)
            node.addEventListener("click", callback);
        this.differential_list.appendChild(node);
    }
}

class StructlinePanel extends Panel {
    constructor(parentContainer, display) {
        super(parentContainer, display);

        this.structline_list = document.createElement("ul");
        this.structline_list.className = "list-group list-group-flush";
        this.structline_list.style["text-align"] = "center";
        this.addObject(this.structline_list);

        this.on("show", () => {
            while(this.structline_list.firstChild)
                this.structline_list.removeChild(this.structline_list.firstChild);

            let edges = this.display.selected.c.edges.filter(e => e.type === "Structline").sort((a, b) => a.page - b.page);

            let sname, tname;
            for (let e of edges) {
                sname = e.source.name ? e.source.name : "?"
                tname = e.target.name ? e.target.name : "?"
                if (e.source == this.display.selected.c)
                    this.addLI(Interface.renderMath(`{\\color{blue}${sname}} \\text{---} ${tname}`));
                else
                    this.addLI(Interface.renderMath(`${sname} \\text{---} {\\color{blue}${tname}}`));
            }

            this.addLI("<a href='#'>Add structline</a>", () => this.display.state = STATE_ADD_STRUCTLINE );
            this.addLI("<a href='#'>Remove structline</a>", () => this.display.state = STATE_RM_STRUCTLINE );
        });

    }

    addLI(html, callback) {
        let node = document.createElement("li");
        node.className = "list-group-item";
        node.style = "padding: 0.75rem 0";
        node.innerHTML = html;
        if (callback)
            node.addEventListener("click", callback);
        this.structline_list.appendChild(node);
    }
}

exports.Panel = Panel;
exports.TabbedPanel = TabbedPanel;
exports.DifferentialPanel = DifferentialPanel;
exports.StructlinePanel = StructlinePanel;
