"use strict";

let d3 = require("d3");
let Mousetrap = require("mousetrap");
let Konva = require("konva");
// prevent scrollbars
document.documentElement.style.overflow = 'hidden';  // firefox, chrome
document.body.scroll = "no"; // ie only

Konva.Factory.addGetterSetter(Konva.Shape, 'size');

const boundingRectangle = document.getElementById("main").getBoundingClientRect();
const canvasWidth = boundingRectangle.width;
const canvasHeight = boundingRectangle.height;

class Display {
    constructor(ss) {
        this.sseq = ss;
        ss.disp = this;
        // Global constants for grid and setup
        this.gridColor = "#555";
        this.gridStrokeWidth = 0.5;
        this.boxSize = 50;
        this.ZOOM_BASE = 1.1;

        this.old_scales_maxed = false;

        this.domainOffset = 1 / 2;

        // The sseq object contains the list of valid pages. Always includes at least 0 and infinity.
        this.page_idx = 0;
        this.page = 0;

        // Handle left / right mouse buttons to change page.
        Mousetrap.bind('left', (e, n) => {
            if (this.page_idx > 0) {
                this.page_idx--;
                this.page = this.sseq.page_list[this.page_idx];
                //pageNumText.text(page);
                //window.page = page;
                this.drawAll();
            }
        });

        Mousetrap.bind('right', (e, n) => {
            if (this.page_idx < this.sseq.page_list.length - 1) {
                this.page_idx++;
                this.page = this.sseq.page_list[this.page_idx];
                if (this.page_idx === this.sseq.page_list.length - 1) {
                    //pageNumText.text("∞");
                } else {
                    //pageNumText.text(page);
                }
                //window.page = page;
                this.drawAll();
            }
        });

        // Drawing elements
        this.body = d3.select("body");
        let body = this.body;

        this.tooltip_div = body.append("div")
            .attr("id", "tooltip_div")
            .attr("class", "tooltip")
            .style("opacity", 0);

        this.tooltip_div_dummy = body.append("div")
            .attr("id", "tooltip_div_dummy")
            .attr("class", "tooltip")
            .style("opacity", 0);

        this.stage = new Konva.Stage({
            container: 'main',
            width: canvasWidth,
            height: canvasHeight
        });
        let stage = this.stage;

        this.width = stage.width();
        this.height = stage.height();

        //window.stage = stage;

        // Layers from back to front.
        this.gridLayer = new Konva.Layer();
        this.edgeLayer = new Konva.Layer();
        this.classLayer = new Konva.Layer();
        // Used for blank white margin squares and axes labels.
        this.margin = new Konva.Layer();
        // This just contains a white square in the bottom right corner to prevent axes labels
        // from showing up down there. Also useful for debugging because nothing on this layer gets covered up.
        this.supermargin = new Konva.Layer();

        stage.add(this.gridLayer);
        stage.add(this.edgeLayer);
        stage.add(this.classLayer);
        stage.add(this.margin);
        stage.add(this.supermargin);

        Array.prototype.forEach.call(document.getElementsByTagName("canvas"),
            (c, idx) => c.setAttribute("id", ["gridLayer", "edgeLayer", "classLayer", "marginLayer", "supermarginLayer"][idx]));

        this.gridLayerContext = d3.select("#gridLayer").node().getContext("2d");
        this.edgeLayerContext = d3.select("#edgeLayer").node().getContext("2d");
        this.classLayerContext = d3.select("#classLayer").node().getContext("2d");
        this.marginLayerContext = d3.select("#marginLayer").node().getContext("2d");
        this.supermarginLayerContext = d3.select("#supermarginLayer").node().getContext("2d");

        this.xMarginSize = this.boxSize / 2 + 30;
        this.yMarginSize = this.boxSize;

        this.clipX = this.xMarginSize;
        this.clipY = -this.boxSize;
        this.clipWidth = this.width;
        this.clipHeight = this.height - this.yMarginSize;

        this.gridLayerContext.rect(this.clipX, this.clipY, this.clipWidth - this.clipX, this.clipHeight - this.clipY);
        this.gridLayerContext.clip();
        this.gridLayerContext.strokeStyle = this.gridColor;

        this.edgeLayerContext.rect(this.clipX, this.clipY, this.clipWidth - this.clipX, this.clipHeight - this.clipY);
        this.edgeLayerContext.clip();

        this.classLayerContext.rect(this.clipX, this.clipY, this.clipWidth - this.clipX, this.clipHeight - this.clipY);
        this.classLayerContext.clip();
        this.hitCtx = this.classLayer.getHitCanvas().context;

        this.marginLayerContext.textBaseline = "middle";
        this.marginLayerContext.font = "15px Arial";

        this.supermarginLayerContext.fillStyle = "#FFF";
        this.supermarginLayerContext.rect(0, this.clipHeight, this.xMarginSize - 5, this.boxSize);
        this.supermarginLayerContext.fill();
        this.supermarginLayerContext.fillStyle = "#000";

        this.supermarginLayerContext.beginPath();
        this.supermarginLayerContext.moveTo(this.xMarginSize, 0);
        this.supermarginLayerContext.lineTo(this.xMarginSize, this.clipHeight);
        this.supermarginLayerContext.lineTo(this.width, this.clipHeight);
        this.supermarginLayerContext.stroke();

        //window.context = this.classLayerContext;

        this.xScaleInit = d3.scaleLinear().range([this.xMarginSize, this.width]);
        this.yScaleInit = d3.scaleLinear().range([this.height - this.yMarginSize, 0]);

        this.xScaleInit.domain([this.sseq.initialxRange[0] - this.domainOffset, this.sseq.initialxRange[1] + this.domainOffset]);
        this.yScaleInit.domain([this.sseq.initialyRange[0] - this.domainOffset, this.sseq.initialyRange[1] + this.domainOffset]);

        this.zoomDomElement = d3.select("#supermarginLayer");

        this.drawAll = this.drawAll.bind(this);
        this.drawGrid = this.drawGrid.bind(this);
        this.drawTicks = this.drawTicks.bind(this);
        this.draw = this.draw.bind(this);


        this.zoom = d3.zoom().scaleExtent([0, 4])
        this.zoom.on("zoom", () => this.drawAll());
        this.zoomDomElement.call(this.zoom).on("dblclick.zoom", null);


        //window.sseq = sseq;
        this.addClasses();
        this.drawAll();
    }

    drawAll() {
        let zoomDomElement = this.zoomDomElement;
        this.transform = d3.zoomTransform(zoomDomElement.node());
        this.scale = this.transform.k;
        let scale = this.scale;
        let xScale = this.xScale;
        let yScale = this.yScale;
        let sseq = this.sseq;

        xScale = this.transform.rescaleX(this.xScaleInit);
        if (!sseq.fixY) {
            yScale = this.transform.rescaleY(this.yScaleInit);
        } else {
            yScale = this.yScaleInit;
        }

        // We have to call zoom.translateBy when the user hits the boundary of the pan region
        // to adjust the zoom transform. However, this causes the zoom handler (this function) to be called a second time,
        // which is less intuitive program flow than just continuing on in the current function.
        // In order to prevent this, temporarily unset the zoom handler.
        this.zoom.on("zoom", null);
        if (!this.old_scales_maxed) {
            if (sseq.xRange) {
                let xMinOffset = scale > 1 ? 10 * scale : 10;
                let xMaxOffset = xMinOffset;
                if (xScale(sseq.xRange[0]) > this.xMarginSize + xMinOffset) {
                    this.zoom.translateBy(zoomDomElement, (this.xMarginSize + xMinOffset - xScale(sseq.xRange[0]) - 0.1) / scale, 0);
                } else if (xScale(sseq.xRange[1]) < this.width - xMaxOffset) {
                    this.zoom.translateBy(zoomDomElement, (this.width - xMaxOffset - xScale(sseq.xRange[1]) + 0.1) / scale, 0);
                }
            }

            if (!sseq.fixY) {
                if (sseq.yRange) {
                    let yMinOffset = scale > 1 ? 10 * scale : 10;
                    let yMaxOffset = yMinOffset;
                    if (yScale(sseq.yRange[0]) < this.clipHeight - yMinOffset) {
                        this.zoom.translateBy(zoomDomElement, 0, (this.clipHeight - yMinOffset - yScale(sseq.yRange[0]) - 0.1) / scale);
                    } else if (yScale(sseq.yRange[1]) > yMaxOffset) {
                        this.zoom.translateBy(zoomDomElement, 0, (yMaxOffset - yScale(sseq.yRange[1]) + 0.1) / scale);
                    }
                }
            }
        }

        this.transform = d3.zoomTransform(zoomDomElement.node());
        xScale = this.transform.rescaleX(this.xScaleInit);

        if (!sseq.fixY) {
            yScale = this.transform.rescaleY(this.yScaleInit);
        }

        let xmin = Math.ceil(xScale.invert(this.xMarginSize));
        let xmax = Math.floor(xScale.invert(this.width));
        let ymin = Math.ceil(yScale.invert(this.height - this.yMarginSize));
        let ymax = Math.floor(yScale.invert(0));


        let xScaleMaxed = false, yScaleMaxed = false;

        if (sseq.xRange && (xmax - xmin) > sseq.xRange[1] - sseq.xRange[0]) {
            xScaleMaxed = true;
            xScale.domain([sseq.xRange[0] - this.domainOffset, sseq.xRange[1] + this.domainOffset]);
        }

        if (sseq.yRange && (ymax - ymin) > sseq.yRange[1] - sseq.yRange[0]) {
            yScaleMaxed = true;
            yScale.domain([sseq.yRange[0] - this.domainOffset, sseq.yRange[1] + this.domainOffset]);
        }

        if (xScaleMaxed && yScaleMaxed) {
            if (!this.old_scales_maxed) {
                this.old_scales_maxed = true;
                this.zoom_max_transform = this.transform;
            } else {
                this.zoom.transform(zoomDomElement, this.zoom_max_transform);
            }
        } else {
            if (this.old_scales_maxed) {
                //zoom.transform(zoomDomElement, pre_zoom_max_transform);
                this.old_scales_maxed = false;
            } else {
                this.pre_zoom_max_transform = this.transform;
            }
        }

        this.transform = d3.zoomTransform(zoomDomElement.node());
        this.scale = this.transform.k;
        this.xmin = Math.ceil(xScale.invert(this.xMarginSize));
        this.xmax = Math.floor(xScale.invert(this.width));
        this.ymin = Math.ceil(yScale.invert(this.height - this.yMarginSize));
        this.ymax = Math.floor(yScale.invert(0));
        this.zoom.on("zoom", this.drawAll);
        this.xScale = xScale;
        this.yScale = yScale;

        // window.transform = transform;
        // window.xScale = xScale;

        this.xZoom = Math.log(scale) / Math.log(this.ZOOM_BASE);
        this.yZoom = this.xZoom;

        this.xTicks = this.xScale.ticks(15);
        this.yTicks = this.yScale.ticks();

        this.xTickStep = this.xTicks[1] - this.xTicks[0];
        this.yTickStep = this.yTicks[1] - this.yTicks[0];

        this.xGridStep = (Math.floor(this.xTickStep / 5) === 0) ? 1 : Math.floor(this.xTickStep / 5);
        this.yGridStep = (Math.floor(this.yTickStep / 5) === 0) ? 1 : Math.floor(this.yTickStep / 5);

        this.drawGrid();
        this.drawTicks();
        this.draw();


        if (d3.event) {
            // The Konvas stage tracks the pointer position using _setPointerPosition.
            // d3 zoom doesn't allow the events it handles to bubble, so Konvas fails to track pointer position.
            // We have to manually tell Konvas to update the pointer position using the event.
            this.stage._setPointerPosition(d3.event.sourceEvent);
        }

        // If there is a tooltip being displayed and the zoom event has modified the canvas so that the cursor is no
        // longer over the
        if (this.stage.getPointerPosition() === undefined || this.stage.getIntersection(this.stage.getPointerPosition()) === null) {
            this.handleMouseout();
        }
    }

    drawGrid() {
        let context = this.gridLayerContext;
        context.clearRect(0, 0, this.width, this.height);

        context.beginPath();
        for (let col = Math.floor(this.xmin / this.xGridStep) * this.xGridStep; col <= this.xmax; col += this.xGridStep) {
            context.moveTo(this.xScale(col), 0);
            context.lineTo(this.xScale(col), this.clipHeight);
        }
        this.gridLayerContext.lineWidth = this.gridStrokeWidth;
        context.stroke();

        context.beginPath();
        for (let row = Math.floor(this.ymin / this.yGridStep) * this.yGridStep; row <= this.ymax; row += this.yGridStep) {
            context.moveTo(-this.boxSize, this.yScale(row));
            context.lineTo(this.width + this.boxSize, this.yScale(row));
        }
        this.gridLayerContext.lineWidth = this.gridStrokeWidth;
        context.stroke();
    }




    drawTicks() {
        let context = this.marginLayerContext;
        context.clearRect(0, 0, this.width, this.height);
        context.textAlign = "center";
        for (let i of this.xTicks) {
            context.fillText(i, this.xScale(i), this.clipHeight + 20);
        }

        context.textAlign = "right";
        for (let i of this.yTicks) {
            context.fillText(i, this.xMarginSize - 10, this.yScale(i));
        }
    }


    getPositionColorKey(x, y) {
        return "#" + Konva.Util._rgbToHex(...this.hitCtx.getImageData(x, y, 1, 1).data);
    }

    findBoundaryTowards(shape, x, y) {
        const colorKey = shape.colorKey;
        const start_distance = 8;
        let x0 = shape.x();
        let y0 = shape.y();
        let dx = x - x0;
        let dy = y - y0;
        let length = Math.sqrt(dx * dx + dy * dy);

        if (length === 0) {
            return {x: x0, y: y0};
        }

        dx = dx / length * start_distance;
        dy = dy / length * start_distance;
        length = start_distance;
        while (length > 0.5) {
            length /= 2;
            dx /= 2;
            dy /= 2;
            if (this.getPositionColorKey(x0 + dx, y0 + dy) === colorKey) {
                x0 += dx;
                y0 += dy;
            }
        }
        return {x: x0, y: y0};
    }

    addClasses() {
        let classes = this.sseq.classes;
        for (let i = 0; i < classes.length; i++) {
            let c = classes[i];
            //if(c.x > 54 || c.x < 0){
            //            continue;
            //        }
            c.canvas_shape = new Konva.Shape();
            c.canvas_shape.sseq_class = c;
            let self = this;
            c.canvas_shape.on('mouseover', this.handleMouseover);
            c.canvas_shape.on('mouseout', function() { self.handleMouseout(this) });
            this.classLayer.add(c.canvas_shape);
        }
    }

    setUpEdge(edge) {
        let source_shape = edge.source.canvas_shape;
        let target_shape = edge.target.canvas_shape;

        source_shape.show();
        source_shape.draw();
        target_shape.show();
        target_shape.draw();


        let sourcePt = this.findBoundaryTowards(source_shape, target_shape.x(), target_shape.y());
        let targetPt = this.findBoundaryTowards(target_shape, source_shape.x(), source_shape.y());
        edge.sourceOffset = {x: (sourcePt.x - source_shape.x()), y: (sourcePt.y - source_shape.y())};
        edge.targetOffset = {x: (targetPt.x - source_shape.x()), y: (targetPt.y - source_shape.y())};
    }


    draw() {
        // window.layer = classLayer;
        let context = this.classLayerContext;
        context.clearRect(0, 0, this.width, this.height);
        context.save();
        this.sseq.calculateDrawnElements(this.page, this.xmin, this.xmax, this.ymin, this.ymax);


        let classes = this.sseq.getClasses();
        this.classLayer.removeChildren();

        let default_size = 6;
        let scale_size;
        if (this.scale < 1 / 2) {
            scale_size = 1 / 2;
        } else if (this.scale > 2) {
            scale_size = 2;
        } else {
            scale_size = this.scale;
        }

        for (let i = 0; i < classes.length; i++) {
            let c = classes[i];
            let s = c.canvas_shape;
            if (!s) {
                continue;
            }
            let node = c.getNode(this.page);
            s.setPosition({x: this.xScale(c.x) + c.getXOffset(), y: this.yScale(c.y) + c.getYOffset()});
            s.sceneFunc(node.sceneFunc);
            s.setAttrs(c.getNode(this.page));
            s.size(default_size * scale_size);
            this.classLayer.add(s);
        }

        this.classLayer.draw();

        context = this.edgeLayerContext;
        context.clearRect(0, 0, this.width, this.height);

        let edges = this.sseq.getEdges();
        for (let i = 0; i < edges.length; i++) {
            let e = edges[i];
            let source_shape = e.source.canvas_shape;
            let target_shape = e.target.canvas_shape;
            context.beginPath();
            if (!e.sourceOffset || (e.sourceOffset.x === 0 && e.sourceOffset.y === 0)) {
                e.sourceOffset = {x: 0, y: 0};
                e.targetOffset = {x: 0, y: 0};
                //setTimeout(setUpEdge(e),0);
            }
            context.lineWidth = 1;
            context.strokeStyle = e.color;
            context.moveTo(source_shape.x() + e.sourceOffset.x, source_shape.y() + e.sourceOffset.y);
            context.lineTo(target_shape.x() + e.targetOffset.x, target_shape.y() + e.targetOffset.y);
            context.closePath();
            context.stroke();
        }

    }


    handleMouseover(event) {
        let shape = event.currentTarget;
        let c = shape.sseq_class;
        let disp = c.sseq.disp;
        if (c.tooltip_html) {
            disp.tooltip_div_dummy.html(c.tooltip_html);
            disp.setupTooltipDiv(shape);
        } else {
            if (MathJax && MathJax.Hub) {
                disp.tooltip_div_dummy.html(`\\(${c.name}\\) -- (${c.x}, ${c.y})` + c.extra_info);
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, "tooltip_div_dummy"]);
                MathJax.Hub.Queue(() => disp.setupTooltipDiv(shape));
            } else {
                disp.tooltip_div_dummy.html(`\\(${c.name}\\) -- (${c.x}, ${c.y})` + c.extra_info);
                disp.setupTooltipDiv(this);
            }
        }
    }

    setupTooltipDiv(shape) {
        let rect = this.tooltip_div.node().getBoundingClientRect();
        let tooltip_width = rect.width;
        let tooltip_height = rect.height;
        shape.sseq_class.tooltip_html = this.tooltip_div_dummy.html();
        this.tooltip_div.html(this.tooltip_div_dummy.html());
        this.tooltip_div.style("left", (shape.x() + 25) + "px")
            .style("top", (shape.y() - tooltip_height) + "px")
            .style("right", null).style("bottom", null);
        let bounding_rect = this.tooltip_div.node().getBoundingClientRect();
        if (bounding_rect.right > this.width) {
            this.tooltip_div.style("left", null)
                .style("right", (this.width - shape.x() + 10) + "px")
        }
        if (bounding_rect.top < 0) {
            this.tooltip_div.style("top", (shape.y() + 10) + "px")
        }

        this.tooltip_div.transition()
            .duration(200)
            .style("opacity", .9);
    }

    handleMouseout() {
        this.tooltip_div.transition()
            .duration(500)
            .style("opacity", 0);
    }
}

exports.Display = Display;