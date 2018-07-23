"use strict";

let d3 = require("d3");
let Mousetrap = require("mousetrap");
let Konva = require("konva");

document.documentElement.style.overflow = 'hidden'; // prevent scrollbars


Konva.Factory.addGetterSetter(Konva.Shape, 'size');
Konva.Shape.prototype.setNode = setNode;

/**
 * Sets the drawing parameters for the class.
 * We have to do any necessary translation here between the naming convention for Konva and the naming conventions
 * that I want to set up for SseqNodes. Any attributes with the same name in both get copied over automagically by setAttrs.
 * @param node A SseqNode
 */
function setNode(node) {
    this.node = node;
    this.setAttrs(node);
    this.sceneFunc(node.shape.draw);
    if (node.shape.hitRegion) {
        this.hitFunc(node.shape.hitRegion);
    }
    this.setFillEnabled(node.fill);
    this.setStrokeEnabled(node.stroke);
    if ((node.fill !== true && node.fill) || node.color) {
        this.fill((node.fill !== true && node.fill) || node.color);
    }
    if ((node.stroke !== true && node.stroke) || node.color) {
        this.stroke((node.stroke !== true && node.stroke) || node.color);
    }
    if(node.opacity){
        this.opacity(node.opacity);
    }

}


class Display {

    constructor(ss) {
        // Drawing elements
        this.body = d3.select("body");

        this.xScaleInit = d3.scaleLinear();
        this.yScaleInit = d3.scaleLinear();

        this.stage = new Konva.Stage({
            container: 'main'
        });

        // This defines "this.nameLayer" and "this.nameLayerContext" etc.
        // The second parameter determines whether to clip or not.
        // gridLayer, edgeLayer, and classLayer are clipped, marginLayer and supermarginLayer are not.
        this._makeLayer("gridLayer");
        this._makeLayer("edgeLayer");
        this._makeLayer("classLayer");
        this._makeLayer("marginLayer");
        this._makeLayer("supermarginLayer");

        let tooltip_divs = ["tooltip_div", "tooltip_div_dummy"].map(id =>
            this.body.append("div")
                .attr("id", id)
                .attr("class", "tooltip")
                .style("opacity", 0)
        );


        this.status_div = this.body.append("div")
            .attr("id", "status")
            .style("position", "absolute")
            .style("left", `20px`)
            .style("bottom",`20px`);

        this.tooltip_div       = tooltip_divs[0];
        this.tooltip_div_dummy = tooltip_divs[1];


        // TODO: improve window resize handling. Currently the way that the domain changes is suboptimal.
        // I think the best would be to maintain the x and y range by scaling.
        this._initializeCanvas.bind(this);
        window.addEventListener("resize", () => {
            this._initializeCanvas();
            this.updateBatch();
        });

        this.setSseq(ss, true);

        // This allows us to use the "update" method as an event handlers -- the "this" will still refer to this "this" rather
        // than the event being handled.

        this.zoom = d3.zoom().scaleExtent([0, 4]);
        this.updateBatch = this.updateBatch.bind(this);
        this.zoom.on("zoom", this.updateBatch);
        this.zoomDomElement = d3.select("#supermarginLayer");
        this.zoomDomElement.call(this.zoom).on("dblclick.zoom", null);


        this.nextPage = this.nextPage.bind(this);
        this.previousPage = this.previousPage.bind(this);
        Mousetrap.bind('left',  this.previousPage);
        Mousetrap.bind('right', this.nextPage);

        // TODO: ad hoc changes here:

        Mousetrap.bind('x',
            () => {
                if(this.mouseover_class){
                    console.log(this.mouseover_class);
                }
            }
        )


        for(let key of Object.getOwnPropertyNames(this.sseq.keyHandlers)){
            Mousetrap.bind(key, (event) => {
                event.mouseover_class = this.mouseover_class;
                this.sseq.keyHandlers[key].call(this.sseq, event);
            });
        }

        this.update();
    }

    /**
     * Initialization method called in constructor. Make Konva layers, add them to DOM and to Stage. Add whatever
     * margins or setup code to the canvases.
     * @private
     */
    _initializeCanvas(){
        // Global constants for grid and setup
        this.gridColor = "#555";
        this.gridStrokeWidth = 0.5;
        this.boxSize = 50; // TODO: Get rid of boxSize.
        this.TICK_STEP_LOG_BASE = 1.1; // Used for deciding when to change tick step.

        const boundingRectangle = document.getElementById("main").getBoundingClientRect();
        const canvasWidth = boundingRectangle.width;
        const canvasHeight = boundingRectangle.height;

        this.stage.clear();
        this.stage.width(canvasWidth).height(canvasHeight);

        this.width = this.stage.width();
        this.height = this.stage.height();

        // TODO: Allow programmatic control over margins.
        this.leftMargin = 30;
        this.rightMargin = 5;
        this.topMargin = 20;
        this.bottomMargin = 30;

        for(let side of ["left", "right", "top", "bottom"]){
            let field = side + "Margin"
            if(this.sseq[field]){
                this[field] = this.sseq[field];
            }
        }



        // Set up clip.
        this.clipX = this.leftMargin;
        this.clipY = this.topMargin;
        this.clipWidth = this.width - this.rightMargin;
        this.clipHeight = this.height - this.bottomMargin;

        this.xScaleInit = this.xScaleInit.range([this.leftMargin, this.width - this.rightMargin]);
        this.yScaleInit = this.yScaleInit.range([this.height - this.bottomMargin, this.topMargin]);

        this.classLayerContext.clearRect(0, 0, this.width, this.height);
        this._clipLayer(this.gridLayerContext);
        this._clipLayer(this.edgeLayerContext);
        this._clipLayer(this.classLayerContext);

        this.hitCtx = this.classLayer.getHitCanvas().context;

        this.gridLayerContext.strokeStyle = this.gridColor;

        // This presumably is set up for the axes labels. Maybe should move it there?
        this.marginLayerContext.textBaseline = "middle";
        this.marginLayerContext.font = "15px Arial";

        // This makes the white square in the bottom left corner which prevents axes labels from appearing to the left
        // or below the axes intercept.
        this.supermarginLayerContext.fillStyle = "#FFF";
        this.supermarginLayerContext.rect(0, this.clipHeight, this.leftMargin - 5, this.bottomMargin);
        this.supermarginLayerContext.fill();
        this.supermarginLayerContext.fillStyle = "#000";

        // Draw the axes.
        this.supermarginLayerContext.beginPath();
        this.supermarginLayerContext.moveTo(this.leftMargin, this.topMargin);
        this.supermarginLayerContext.lineTo(this.leftMargin, this.clipHeight);
        this.supermarginLayerContext.lineTo(this.width - this.rightMargin, this.clipHeight);
        this.supermarginLayerContext.stroke();
    }

    /**
     * Make a Konva layer, add it to the Konva stage, find the resulting canvas DOM element and get the context associated
     * to the canvas, add the layer and the context as fields with names
     *
     * @param layerName The name of the layer.
     * @param clip
     * @private
     */
    _makeLayer(layerName){
        let layer = new Konva.Layer();
        this.stage.add(layer);
        let canvasDOMList = document.getElementsByTagName("canvas");
        canvasDOMList[canvasDOMList.length - 1].setAttribute("id", layerName);
        let context = d3.select("#" + layerName).node().getContext("2d");
        this[layerName] = layer;
        this[layerName + "Context"] = context;
    }

    _clipLayer(context){
        context.rect(this.clipX, this.clipY, this.clipWidth - this.clipX, this.clipHeight - this.clipY);
        context.clip();
    }

    /**
     * Set the spectral sequence to display.
     * @param ss
     */
    setSseq(ss, resetScale = false){
        if(this.sseq){
            this.sseq.registerUpdateListener(undefined);
        }
        this.sseq = ss;
        this.sseq.registerUpdateListener(this.updateBatch.bind(this));
        if(ss.disp !== this){
            ss.disp = this;
        }

        // The sseq object contains the list of valid pages. Always includes at least 0 and infinity.
        if(this.sseq.initial_page_idx){
            this.page_idx = this.sseq.initial_page_idx;
        } else {
            this.page_idx = this.sseq.min_page_idx;
        }
        if(this.page_idx >= this.sseq.page_list.length){
            console.log(`Warning: min_page_idx ${this.sseq.min_page_idx} greater than page list length ${this.sseq.page_list.length}. Using 0 for min_page_idx instead.`);
            this.page_idx = 0;
            this.min_page_idx = 0;
        }
        this.setPage();

        if(resetScale) {
            this._initializeScale();
            this._initializeCanvas();
        }

        this._addClasses();
    }

    _initializeScale(){
        this.old_scales_maxed = false;
        this.domainOffset = 1 / 2;
        this.xScaleInit.domain([this.sseq.initialxRange[0] - this.domainOffset, this.sseq.initialxRange[1] + this.domainOffset]);
        this.yScaleInit.domain([this.sseq.initialyRange[0] - this.domainOffset, this.sseq.initialyRange[1] + this.domainOffset]);
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
            // If the page change has added a class underneath the mouse, display the tooltip.
            if (this.stage.getPointerPosition() && this.stage.getIntersection(this.stage.getPointerPosition())) {
                this._handleMouseover(this.stage.getIntersection(this.stage.getPointerPosition()));
            }
        }
    }

    /**
     * Update this.page and this.pageRange to reflect the value of page_idx.
     * Eventually I should make a display that indicates the current page again, then this can also say what that is.
     */
    setPage(idx){
        if(idx !== undefined){
            this.page_idx = idx;
        }
        this.pageRange = this.sseq.page_list[this.page_idx];
        if(Array.isArray(this.pageRange)){
            this.page = this.pageRange[0];
        } else {
            this.page = this.pageRange;
        }
        if (this.page_idx === this.sseq.page_list.length - 1) {
            //pageNumText.text("∞");
        } else {
            //pageNumText.text(page);
        }
    }

    /**
     * The main update routine.
     */
    updateBatch(){
        this.update(true);
    }

    update(batch = false) {
        this._updateScale();
        this._updateGridAndTickStep();
        this._updateSseq();

        let drawFunc = () => {
            this._drawGrid();
            this._drawTicks();
            this._drawSseq();
        };
        if(batch){
            requestAnimationFrame(drawFunc);
        } else {
            drawFunc();
        }


        if (d3.event) {
            // The Konvas stage tracks the pointer position using _setPointerPosition.
            // d3 zoom doesn't allow the events it handles to bubble, so Konvas fails to track pointer position.
            // We have to manually tell Konvas to update the pointer position using the event.
            this.stage._setPointerPosition(d3.event.sourceEvent);
        }

        // If there is a tooltip being displayed and the zoom event has modified the canvas so that the cursor is no
        // longer over the object the tooltip is attached to, hide the tooltip.
        if (this.stage.getPointerPosition() === undefined || this.stage.getIntersection(this.stage.getPointerPosition()) === null) {
            this._handleMouseout();
        }
    }

    _updateScale(){
        let zoomDomElement = this.zoomDomElement;
        this.transform = d3.zoomTransform(zoomDomElement.node());
        this.scale = this.transform.k;
        let scale = this.scale;
        let xScale, yScale
        let sseq = this.sseq;

        xScale = this.transform.rescaleX(this.xScaleInit);
        yScale = this.transform.rescaleY(this.yScaleInit);
        // TODO: Delete this?
        if (sseq.fixY) {
            yScale = this.yScaleInit;
        }

        // We have to call zoom.translateBy when the user hits the boundary of the pan region
        // to adjust the zoom transform. However, this causes the zoom handler (this function) to be called a second time,
        // which is less intuitive program flow than just continuing on in the current function.
        // In order to prevent this, temporarily unset the zoom handler.
        // TODO: See if we can make the behaviour here less jank.
        this.zoom.on("zoom", null);
        if (!this.old_scales_maxed) {
            if (sseq.xRange) {
                let xMinOffset = scale > 1 ? 10 * scale : 10;
                let xMaxOffset = xMinOffset;
                if (xScale(sseq.xRange[0]) > this.leftMargin + xMinOffset) {
                    this.zoom.translateBy(zoomDomElement, (this.leftMargin + xMinOffset - xScale(sseq.xRange[0]) - 0.1) / scale, 0);
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

        let xmin = Math.ceil(xScale.invert(this.leftMargin));
        let xmax = Math.floor(xScale.invert(this.width));
        let ymin = Math.ceil(yScale.invert(this.height - this.bottomMargin));
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
        this.zoom.on("zoom", this.updateBatch);

        this.transform = d3.zoomTransform(zoomDomElement.node());
        this.scale = this.transform.k;
        this.xmin = Math.ceil(xScale.invert(this.leftMargin));
        this.xmax = Math.floor(xScale.invert(this.width));
        this.ymin = Math.ceil(yScale.invert(this.height - this.bottomMargin));
        this.ymax = Math.floor(yScale.invert(0));

        this.xScale = xScale;
        this.yScale = yScale;
    }

    _updateGridAndTickStep(){
        this.xZoom = Math.log(this.scale) / Math.log(this.TICK_STEP_LOG_BASE);
        this.yZoom = this.xZoom;

        this.xTicks = this.xScale.ticks(15);
        this.yTicks = this.yScale.ticks();

        this.xTickStep = Math.ceil(this.xTicks[1] - this.xTicks[0]);
        this.yTickStep = Math.ceil(this.yTicks[1] - this.yTicks[0]);

        this.xGridStep = (Math.floor(this.xTickStep / 5) === 0) ? 1 : Math.floor(this.xTickStep / 5);
        this.yGridStep = (Math.floor(this.yTickStep / 5) === 0) ? 1 : Math.floor(this.yTickStep / 5);
        if(this.sseq.squareAspectRatio){
            this.xGridStep = this.yGridStep; // TODO: Clean up Danny mod
        }
    }

    _drawGrid() {
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
            context.moveTo(this.leftMargin, this.yScale(row));
            context.lineTo(this.width - this.rightMargin, this.yScale(row));
        }
        this.gridLayerContext.lineWidth = this.gridStrokeWidth;
        context.stroke();
    }


    _drawTicks() {
        let context = this.marginLayerContext;
        context.clearRect(0, 0, this.width, this.height);
        context.textAlign = "center";
        for (let i = Math.floor(this.xTicks[0]); i <= this.xTicks[this.xTicks.length - 1]; i += this.xTickStep) {
            context.fillText(i, this.xScale(i), this.clipHeight + 20);
        }

        context.textAlign = "right";
        for (let i = Math.floor(this.yTicks[0]); i <= this.yTicks[this.yTicks.length - 1]; i += this.yTickStep) {
            context.fillText(i, this.leftMargin - 10, this.yScale(i));
        }
    }

    _updateSseq(){
        this.sseq._calculateDrawnElements(this.pageRange, this.xmin, this.xmax, this.ymin, this.ymax);
        this._updateClasses();
    }

    _updateClasses(){
        let context = this.classLayerContext;
        context.clearRect(0, 0, this.width, this.height);
        context.save();



        let scale_size;
        if (this.scale < 1 / 2) {
            scale_size = 1 / 2;
        } else if (this.scale > 2) {
            scale_size = 2;
        } else {
            scale_size = this.scale;
        }

        this.classLayer.removeChildren();
        for (let c of this.sseq.getClassesToDisplay()) {
            if(!c){ // TODO: should we log these cases?
                continue;
            }

            let s = c.canvas_shape;
            if (!s) {
                continue;
            }

            let invalid_coords = ["x","y"].filter(v => isNaN(c[v]));
            if(invalid_coords.length > 0){
                console.log(`Invalid ${invalid_coords.join(" and ")} coodinate${invalid_coords.length === 2 ? "s" : ""} for class:`);
                console.log(c);
            }
            // let invalid_offsets = ["x","y"].filter((v) => this.sseq[`_get${v.toUpperCase()}Offset`](c));
            // if(invalid_offsets.length > 0){
            //     console.log(`Invalid ${invalid_offsets.join(" and ")} offset${invalid_offsets.length === 2 ? "s" : ""} for class:`);
            //     console.log(c);
            // }

            s.setPosition({x: this.xScale(c.x + this.sseq._getXOffset(c)), y: this.yScale(c.y + this.sseq._getYOffset(c))});

            let node = this.sseq.getClassNode(c,this.page);
            if(node === undefined){
                console.log("Error: node for class is undefined. Using default node."); console.log(c);
                node = this.sseq.default_node;
            }

            s.setNode(node);
            s.size(s.size() * scale_size * this.sseq.class_scale);
            this.classLayer.add(s);
        }
    }

    _drawSseq() {
        this._drawClasses();
        this._drawEdges();
        if(this.sseq.on_draw){
            this.sseq.on_draw(this);
        }
    }


    _drawClasses(){
        this.classLayer.draw();
    }

    _drawEdges(){
        let context = this.edgeLayerContext;
        context.clearRect(0, 0, this.width, this.height);

        let edges = this.sseq.getEdgesToDisplay();
        for (let i = 0; i < edges.length; i++) {
            let e = edges[i];
            if(!e || e.invalid){ // TODO: should probably log some of the cases where we skip an edge...
                continue;
            }
            let source_shape = e.source.canvas_shape;
            let target_shape = e.target.canvas_shape;
            if(!source_shape || ! target_shape){
                continue;
            }
            context.beginPath();
            if (!e.sourceOffset || (e.sourceOffset.x === 0 && e.sourceOffset.y === 0)) {
                e.sourceOffset = {x: 0, y: 0};
                e.targetOffset = {x: 0, y: 0};
                //setTimeout(_setUpEdge(e),0);
            }
            context.lineWidth = 1;
            context.strokeStyle = e.color;
            context.moveTo(source_shape.x() + e.sourceOffset.x, source_shape.y() + e.sourceOffset.y);
            context.lineTo(target_shape.x() + e.targetOffset.x, target_shape.y() + e.targetOffset.y);
            context.closePath();
            context.stroke();
        }
    }


    _getPositionColorKey(x, y) {
        return "#" + Konva.Util._rgbToHex(...this.hitCtx.getImageData(x, y, 1, 1).data);
    }

    // Not currently in use because it is too slow...
    _findBoundaryTowards(shape, x, y) {
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
            if (this._getPositionColorKey(x0 + dx, y0 + dy) === colorKey) {
                x0 += dx;
                y0 += dy;
            }
        }
        return {x: x0, y: y0};
    }

    _addClasses() {
        this.classLayer.removeChildren();
        for (let c of this.sseq.classes) {
            if(!c){ // TODO: should we log invalid classes?
                continue;
            }

            if(! Number.isInteger(c.x) || !Number.isInteger(c.y)){
                console.log("Class has invalid coordinates:\n" ); console.log(c);
                continue;
            }
            c.canvas_shape = new Konva.Shape();
            c.canvas_shape.sseq_class = c;
            c.canvas_shape.on('mouseover', (event) => this._handleMouseover(event.currentTarget));

            let self = this;
            c.canvas_shape.on('mouseout', function () {
                self._handleMouseout(this)
            });
            this.classLayer.add(c.canvas_shape);
        }
    }

    _setUpEdge(edge) {
        let source_shape = edge.source.canvas_shape;
        let target_shape = edge.target.canvas_shape;

        source_shape.show();
        source_shape.draw();
        target_shape.show();
        target_shape.draw();


        let sourcePt = this._findBoundaryTowards(source_shape, target_shape.x(), target_shape.y());
        let targetPt = this._findBoundaryTowards(target_shape, source_shape.x(), source_shape.y());
        edge.sourceOffset = {x: (sourcePt.x - source_shape.x()), y: (sourcePt.y - source_shape.y())};
        edge.targetOffset = {x: (targetPt.x - source_shape.x()), y: (targetPt.y - source_shape.y())};
    }

    _handleMouseover(shape) {
        this.mouseover_class = shape.sseq_class;
        let c = shape.sseq_class;
        // Is the result cached?
        MathJax.Hub.Queue(["Typeset", MathJax.Hub, "tooltip_div_dummy"]);
        if (c.tooltip_html) {
            this.tooltip_div_dummy.html(c.tooltip_html);
            this._setupTooltipDiv(shape);
        } else {
            let tooltip = this.sseq.getClassTooltip(c, this.page).replace(/\n/g, "\n<hr>\n");
            if (MathJax && MathJax.Hub) {
                this.tooltip_div_dummy.html(tooltip);
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, "tooltip_div_dummy"]);
                MathJax.Hub.Queue(() => this._setupTooltipDiv(shape,tooltip));
            } else {
                this.tooltip_div_dummy.html(tooltip);
                this._setupTooltipDiv(this);
            }
        }
        if(this.sseq.onmouseoverClass){
            this.sseq.onmouseoverClass(c);
        }
        if(c.onmouseover){
            c.onmouseover();
        }
    }

    // _checkTooltipDiv(shape, tooltip){
    //     if(this.tooltip_div_dummy.html().includes("\\textcolor")){
    //          this.tooltip_div_dummy.html("\\(\\def\\textcolor#1{}\\)" + tooltip);
    //          MathJax.Hub.Queue(["Typeset", MathJax.Hub, "tooltip_div_dummy"]);
    //          MathJax.Hub.Queue(() => this._setupTooltipDiv(shape));
    //     } else {
    //         this._setupTooltipDiv(shape);
    //     }
    // }

    _setupTooltipDiv(shape) {
        let rect = this.tooltip_div.node().getBoundingClientRect();
        let tooltip_width = rect.width;
        let tooltip_height = rect.height;
        if (!this.tooltip_div_dummy.html().includes("\\(")) {
            // Cache the result of the MathJax so we can display this tooltip faster next time.
            shape.sseq_class.tooltip_html = this.tooltip_div_dummy.html();
        }
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

    _handleMouseout() {
        this.mouseover_class = null;
        this.tooltip_div.transition()
            .duration(500)
            .style("opacity", 0);
    }
}

exports.Display = Display;