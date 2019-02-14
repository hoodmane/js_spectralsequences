"use strict";

let d3 = require("d3");
let Mousetrap = require("mousetrap");
let Konva = require("konva");

document.documentElement.style.overflow = 'hidden'; // prevent scrollbars

const gridGo = "go";
const gridChess = "chess";

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
    // Prevent annoy warnings:
    // Konva warning: true is a not valid value for "fill" attribute. The value should be a string.
    let node_copy = Object.assign({}, node);
    node_copy.fill = undefined;
    node_copy.stroke = undefined;
    node_copy.color = undefined;
    this.setAttrs(node_copy);
    this.sceneFunc(node.shape.draw);
    if (node.shape.hitRegion) {
        this.hitFunc(node.shape.hitRegion);
    }
    this.setFillEnabled(node.fill);
    this.setStrokeEnabled(node.stroke);
    let fill_color = (node.fill !== true && node.fill) || node.color;
    if (fill_color) {
        this.fill(fill_color);
    }
    let stroke_color = (node.stroke !== true && node.stroke) || node.color;
    if (stroke_color) {
        this.stroke(stroke_color);
    }
    if(node.opacity){
        this.opacity(node.opacity);
    }
}




class Display {

    constructor(ss) {
        // Drawing elements
        this.body = d3.select("body");
        this.container = d3.select("#main");
        this.container.style("overflow", "hidden")

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
        this.eventHandlerLayer = this.supermarginLayerDOM;

        let tooltip_divs = ["tooltip_div", "tooltip_div_dummy"].map(id =>
            this.container.append("div")
                .attr("id", id)
                .attr("class", "tooltip")
                .style("opacity", 0)
        );


        this.status_div = this.body.append("div")
            .attr("id", "status")
            .style("position", "absolute")
            .style("left", `20px`)
            .style("bottom",`20px`);

        this.page_indicator_div = this.container.append("div")
            .attr("id", "page_indicator")
            .style("position", "absolute")
            .style("left", "120px")
            .style("top","10px")
            .style("font-family","Arial")
            .style("font-size","15px")
            .html("test");

        this.tooltip_div       = tooltip_divs[0];
        this.tooltip_div_dummy = tooltip_divs[1];


        // TODO: improve window resize handling. Currently the way that the domain changes is suboptimal.
        // I think the best would be to maintain the x and y range by scaling.
        this._initializeCanvas.bind(this);
        window.addEventListener("resize",  () => this.resize());

        // This allows us to use the "updateAll" method as an event handlers -- the "this" will still refer to this "this" rather
        // than the event being handled.

        this.zoom = d3.zoom().scaleExtent([0, 4]);
        this.updateBatch = this.updateBatch.bind(this);
        this.zoom.on("zoom", this.updateBatch);
        this.zoomDomElement = d3.select("#supermarginLayer");
        this.zoomDomElement.call(this.zoom).on("dblclick.zoom", null);

        this.nextPage = this.nextPage.bind(this);
        this.previousPage = this.previousPage.bind(this);
        this.gridStyle = gridGo;
        this.setSseq(ss, true);
        this.update();
    }

    /**
     *
     * @param width Optional width. Default to 97% of width of bounding element.
     * @param height Optional height. Default to 97% of height of bounding element.
     */
    resize(width, height){
        let oldxmin = this.xminFloat;
        let oldymin = this.yminFloat;
        // This fixes the scale, but leaves a
        this._initializeCanvas(width, height);
        this._updateScale();
        let dx = this.xminFloat - oldxmin;
        let dy = this.yminFloat - oldymin;
        this.zoom.on("zoom", null);
        this.zoom.translateBy(this.zoomDomElement, this.dxScale(dx), this.dyScale(dy));
        this.zoom.on("zoom", this.updateBatch);
        this.updateBatch();
    }

    /**
     * Initialization method called in constructor. Make Konva layers, add them to DOM and to Stage. Add whatever
     * margins or setup code to the canvases.
     * @private
     */
    _initializeCanvas(width, height){
        // Global constants for grid and setup
        this.gridColor = "#c6c6c6";
        this.gridStrokeWidth = 0.3;
        this.TICK_STEP_LOG_BASE = 1.1; // Used for deciding when to change tick step.

        const boundingRectangle = document.getElementById("main").getBoundingClientRect();
        const canvasWidth = width || 0.99*boundingRectangle.width;
        const canvasHeight = height || 0.97*boundingRectangle.height;

        this.stage.clear();
        this.stage.width(canvasWidth).height(canvasHeight);

        this.canvasWidth = this.stage.width();
        this.canvasHeight = this.stage.height();

        // TODO: Allow programmatic control over margins.
        // this.leftMargin = 40;
        // this.rightMargin = 5;
        // this.topMargin = 20;
        // this.bottomMargin = 60;
        this.leftMargin = 40;
        this.rightMargin = 5;
        this.topMargin = 30;
        this.bottomMargin = 60;

        this.clipWidth = this.canvasWidth - this.rightMargin;
        this.clipHeight = this.canvasHeight - this.bottomMargin;

        this.plotWidth = this.canvasWidth - this.leftMargin - this.rightMargin;
        this.plotHeight = this.canvasHeight - this.bottomMargin - this.topMargin;


        for(let side of ["left", "right", "top", "bottom"]){
            let field = side + "Margin";
            if(this.sseq[field]){
                this[field] = this.sseq[field];
            }
        }


        this.xScaleInit = this.xScaleInit.range([this.leftMargin, this.canvasWidth - this.rightMargin]);
        this.yScaleInit = this.yScaleInit.range([this.canvasHeight - this.bottomMargin, this.topMargin]);


        this.classLayerContext.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        this._clipLayer(this.gridLayerContext);
        this._clipLayer(this.edgeLayerContext);
        this._clipLayer(this.classLayerContext);

        // Draw axes
        this._drawSupermarginLayer();

        this.hitCtx = this.classLayer.getHitCanvas().context;
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
        this[layerName + "DOM"] = canvasDOMList[canvasDOMList.length - 1];
    }

    _clipLayer(context){
        context.rect(this.leftMargin, this.topMargin, this.plotWidth, this.plotHeight);
        context.clip();
    }

    /**
     * Set the spectral sequence to display.
     * @param ss
     */
    setSseq(ss, resetScale = false){
        if(this.sseq){
            this.sseq._removeUpdateListener("display");
            this.eventHandlerLayer.onclick = undefined;
            this.eventHandlerLayer.oncontextmenu = undefined;
            Mousetrap.reset();
        }
        this.sseq = ss;
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

        if(ss.gridStyle){
            this.gridStyle = ss.gridStyle;
        }

        this._updateEventHandlers();
        Mousetrap.bind('left',  this.previousPage);
        Mousetrap.bind('right', this.nextPage);
        Mousetrap.bind('x',
            () => {
                if(this.mouseover_class){
                    console.log(this.mouseover_class);
                }
            }
        );

        this._addClasses();
        this.sseq._registerUpdateListener("display",() => setTimeout(this.updateBatch.bind(this)));
    }

    addEventHandler(type, listener){
        let wrapper = (event) => {
            event.mouseover_class = this.mouseover_class;
            event.selectedX = this.selectedX;
            event.selectedY = this.selectedY;
            listener(event);
        };
        if(["onclick", "oncontextmenu"].includes(type)){
            this.eventHandlerLayer[type] = wrapper;
        } else {
            Mousetrap.bind(type, wrapper);
        }
    }

    removeEventHandler(type){
        if(["onclick", "oncontextmenu"].includes(type)){
            this.eventHandlerLayer[type] = () => false;
        } else {
            Mousetrap.unbind(type);
        }
    }

    _updateEventHandlers(){
        for(let key of Object.getOwnPropertyNames(this.sseq.eventHandlers)){
            if(!this.sseq.eventHandlers[key] || !this.sseq.eventHandlers[key].constructor === Function){
                continue;
            }
            this.addEventHandler(key, this.sseq.eventHandlers[key].bind(this.sseq));
        }
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
        this.page_indicator_div.html(this.sseq.getPageDescriptor(this.pageRange));
        if(this.sseq.pageChangeHandler){
            this.sseq.pageChangeHandler(this.page);
        }
    }

    /**
     * The main updateAll routine.
     */
    updateBatch(){
        this.update(true);
    }

    update(batch = false) {
        let drawFunc = () => {
            this._updateScale();
            this._updateGridAndTickStep();
            this._updateSseq();
            this._drawGrid();
            this._drawTicks();
            this._drawSseq();
            if (d3.event) {
                // The Konvas stage tracks the pointer position using _setPointerPosition.
                // d3 zoom doesn't allow the events it handles to bubble, so Konvas fails to track pointer position.
                // We have to manually tell Konvas to updateAll the pointer position using the event.
                this.stage._setPointerPosition(d3.event.sourceEvent);
            }

            // If there is a tooltip being displayed and the zoom event has modified the canvas so that the cursor is no
            // longer over the object the tooltip is attached to, hide the tooltip.
            if (this.stage.getPointerPosition() === undefined || this.stage.getIntersection(this.stage.getPointerPosition()) === null) {
                this._handleMouseout();
            }
        };
        if(batch){
            requestAnimationFrame(drawFunc);
        } else {
            drawFunc();
        }

    }

    /**
     *
     * @private
     */
    _updateScale(){
        let zoomDomElement = this.zoomDomElement;
        this.transform = d3.zoomTransform(zoomDomElement.node());
        this.scale = this.transform.k;
        let scale = this.scale;
        let xScale, yScale;
        let sseq = this.sseq;

        xScale = this.transform.rescaleX(this.xScaleInit);
        yScale = this.transform.rescaleY(this.yScaleInit);
        // TODO: Delete this?
        if (sseq.fixY) {
            yScale = this.yScaleInit;
        }

        let xMinOffset = scale > 1 ? 10 * scale : 10;
        let xMaxOffset = xMinOffset;
        let yMinOffset = scale > 1 ? 10 * scale : 10;
        let yMaxOffset = yMinOffset;

        this.xMinOffset = xMinOffset;
        this.xMaxOffset = xMaxOffset;
        this.yMinOffset = yMinOffset;
        this.yMaxOffset = yMaxOffset;

        // We have to call zoom.translateBy when the user hits the boundary of the pan region
        // to adjust the zoom transform. However, this causes the zoom handler (this function) to be called a second time,
        // which is less intuitive program flow than just continuing on in the current function.
        // In order to prevent this, temporarily unset the zoom handler.
        // TODO: See if we can make the behaviour here less jank.
        this.zoom.on("zoom", null);
        if (!this.old_scales_maxed) {
            if (sseq.xRange) {
                if (xScale(sseq.xRange[0]) > this.leftMargin + xMinOffset) {
                    this.zoom.translateBy(zoomDomElement, (this.leftMargin + xMinOffset - xScale(sseq.xRange[0]) - 0.1) / scale, 0);
                } else if (xScale(sseq.xRange[1]) < this.canvasWidth - xMaxOffset) {
                    this.zoom.translateBy(zoomDomElement, (this.canvasWidth - xMaxOffset - xScale(sseq.xRange[1] + this.domainOffset) + 0.1) / scale, 0);
                }
            }

            if (!sseq.fixY) {
                if (sseq.yRange) {
                    if (yScale(sseq.yRange[0]) < this.clipHeight - yMinOffset) {
                        this.zoom.translateBy(zoomDomElement, 0, (this.clipHeight - yMinOffset - yScale(sseq.yRange[0]) - 0.1) / scale);
                    } else if (yScale(sseq.yRange[1]) > yMaxOffset) {
                        this.zoom.translateBy(zoomDomElement, 0, (yMaxOffset - yScale(sseq.yRange[1] + this.domainOffset) + 0.1) / scale);
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
        let xmax = Math.floor(xScale.invert(this.canvasWidth));
        let ymin = Math.ceil(yScale.invert(this.canvasHeight - this.bottomMargin));
        let ymax = Math.floor(yScale.invert(0));


        let xScaleMaxed = false, yScaleMaxed = false;

        if (sseq.xRange && (xmax - xmin) > sseq.xRange[1] - sseq.xRange[0]) {
            xScaleMaxed = true;
            xScale.domain([sseq.xRange[0], sseq.xRange[1]]);
            xScale.domain([
                sseq.xRange[0] - (xScale.invert(xMinOffset) - xScale.invert(0)),
                sseq.xRange[1] + (xScale.invert(xMaxOffset) - xScale.invert(0)) + this.domainOffset
            ]);
        }

        if (sseq.yRange && (ymax - ymin) > sseq.yRange[1] - sseq.yRange[0]) {
            yScaleMaxed = true;
            yScale.domain([sseq.yRange[0], sseq.yRange[1]]);
            yScale.domain([
                sseq.yRange[0] + (yScale.invert(yMinOffset) - yScale.invert(0)),
                sseq.yRange[1] - (yScale.invert(yMaxOffset) - yScale.invert(0)) + this.domainOffset
            ]);
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

        this.xminFloat = xScale.invert(this.leftMargin);
        this.xmaxFloat = xScale.invert(this.canvasWidth);
        this.yminFloat = yScale.invert(this.canvasHeight - this.bottomMargin);
        this.ymaxFloat = yScale.invert(0);

        this.xmin = Math.ceil(this.xminFloat);
        this.xmax = Math.floor(this.xmaxFloat);
        this.ymin = Math.ceil(this.yminFloat);
        this.ymax = Math.floor(this.ymaxFloat);

        this.xScale = xScale;
        this.yScale = yScale;
    }

    dxScale(x){
        return this.xScale(x) - this.xScale(0);
    }

    dyScale(x){
        return this.yScale(x) - this.yScale(0);
    }

    _updateGridAndTickStep(){
        this.xZoom = Math.log(this.scale) / Math.log(this.TICK_STEP_LOG_BASE);
        this.yZoom = this.xZoom;

        // TODO: This 70 is a magic number. Maybe I should give it a name?
        this.xTicks = this.xScale.ticks(this.canvasWidth / 70);
        this.yTicks = this.yScale.ticks(this.canvasHeight / 70);

        this.xTickStep = Math.ceil(this.xTicks[1] - this.xTicks[0]);
        this.yTickStep = Math.ceil(this.yTicks[1] - this.yTicks[0]);

        this.xGridStep = (Math.floor(this.xTickStep / 5) === 0) ? 1 : Math.floor(this.xTickStep / 5);
        this.yGridStep = (Math.floor(this.yTickStep / 5) === 0) ? 1 : Math.floor(this.yTickStep / 5);
        // TODO: This is an ad-hoc modification requested by Danny to ensure that the grid boxes are square.
        // Probably it's a useful thing to be able to have square grid boxes, how do we want to deal with this?
        if(this.sseq.squareAspectRatio){
            this.xGridStep = this.yGridStep;
        }
    }

    _drawTicks(context) {
        if(!context){
            context = this.marginLayerContext;
            context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
            context.textBaseline = "middle";
            context.font = "15px Arial";
        }
        context.textAlign = "center";
        for (let i = Math.floor(this.xTicks[0]); i <= this.xTicks[this.xTicks.length - 1]; i += this.xTickStep) {
            context.fillText(i, this.xScale(i), this.clipHeight + 20);
        }

        context.textAlign = "right";
        for (let i = Math.floor(this.yTicks[0]); i <= this.yTicks[this.yTicks.length - 1]; i += this.yTickStep) {
            context.fillText(i, this.leftMargin - 10, this.yScale(i));
        }
    }

    _drawGrid(context){
        if(!context){
            context = this.gridLayerContext;
        }
        context.strokeStyle = this.gridColor;
        context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        context.lineWidth = this.gridStrokeWidth;

        switch(this.gridStyle){
            case gridGo:
                this._drawGoGrid(context);
                break;
            case gridChess:
                this._drawChessGrid(context);
                break;
            default:
                // TODO: an error here?
                break;
        }

        this._drawSelection(context);
    }

    _drawGoGrid(context) {
        this._drawGridWithOffset(context, 0, 0);
    }

    _drawChessGrid(context) {
        this._drawGridWithOffset(context, 0.5, 0.5);
    }

    _drawGridWithOffset(context, xoffset, yoffset){
        context.beginPath();
        for (let col = Math.floor(this.xmin / this.xGridStep) * this.xGridStep - xoffset; col <= this.xmax; col += this.xGridStep) {
            context.moveTo(this.xScale(col), 0);
            context.lineTo(this.xScale(col), this.clipHeight);
        }
        context.stroke();

        context.beginPath();
        for (let row = Math.floor(this.ymin / this.yGridStep) * this.yGridStep - yoffset; row <= this.ymax; row += this.yGridStep) {
            context.moveTo(this.leftMargin, this.yScale(row));
            context.lineTo(this.canvasWidth - this.rightMargin, this.yScale(row));
        }
        context.stroke();
    }

    _drawSupermarginLayer(context){
        if(!context){
            context = this.supermarginLayerContext;
        }
        context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        // This makes the white square in the bottom left corner which prevents axes labels from appearing to the left
        // or below the axes intercept.
        context.fillStyle = "#FFF";
        context.rect(0, this.clipHeight, this.leftMargin - 5, this.bottomMargin);
        context.fill();
        context.fillStyle = "#000";

        // Draw the axes.
        context.beginPath();
        context.moveTo(this.leftMargin, this.topMargin);
        context.lineTo(this.leftMargin, this.clipHeight);
        context.lineTo(this.canvasWidth - this.rightMargin, this.clipHeight);
        context.stroke();
    }


    _updateSseq(){
        this.sseq._calculateDrawnElements(this.pageRange, this.xmin, this.xmax, this.ymin, this.ymax);
        this._updateClasses();
    }

    _updateClasses(){
        let context = this.classLayerContext;
        context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
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
        for (let c of this.sseq._getClassesToDisplay()) {
            if(!c || c.invalid){ // TODO: should we log these cases?
                continue;
            }

            let s = c.canvas_shape;
            if (!s) {
                this._addClass(c);
                s = c.canvas_shape;
            }

            let invalid_coords = ["x","y"].filter(v => isNaN(c[v]));
            if(invalid_coords.length > 0){
                console.log(`Invalid ${invalid_coords.join(" and ")} coodinate${invalid_coords.length === 2 ? "s" : ""} for class:`);
                console.log(c);
            }
            // let invalid_offsets = ["x","y"].filter((v) => this.sseq[`_get${v.toUpperCase()}Offset`](c));
            // if(invalid_offsets.length > 0){
            //     console.log(`Invalid ${invalid_offsets.join(" and "dr)} offset${invalid_offsets.length === 2 ? "s" : ""} for class:`);
            //     console.log(c);
            // }

            s.setPosition({x: this.xScale(c.x + this.sseq._getXOffset(c)), y: this.yScale(c.y + this.sseq._getYOffset(c))});

            let node = this.sseq.getClassNode(c, this.page);
            if(node === undefined){
                console.log("Error: node for class is undefined. Using default node.", c);
                node = this.sseq.default_node;
            }

            s.setNode(node);
            s.size(s.size() * scale_size * this.sseq.class_scale);
            // Highlight selected class code
            if(c.selected){
                let highlight_shape = s.clone();
                highlight_shape.size(s.size() * 1.3);
                highlight_shape.stroke("orange");
                highlight_shape.fill("orange");
                this.classLayer.add(highlight_shape);
            }
            this.classLayer.add(s);
        }
    }

    _drawSseq() {
        this._drawClasses();
        this._drawEdges();
        if(this.sseq.edgeLayerSVG){
            this.drawSVG(this.edgeLayerContext, this.sseq.edgeLayerSVG);
        }
        if(this.sseq.on_draw){
            this.sseq.on_draw(this);
        }
    }


    _drawClasses(){
        this.classLayer.draw();
    }

    _drawEdges(context){
        if(!context){
            context = this.edgeLayerContext;
            context.clearRect(0, 0, this.canvasWidth, this.canvasHeight);
        }
        let edges = this.sseq._getEdgesToDisplay();
        for (let i = 0; i < edges.length; i++) {
            let e = edges[i];
            if(!e || e.invalid || !e.visible){ // TODO: should probably log some of the cases where we skip an edge...
                continue;
            }
            let source_shape = e.source.canvas_shape;
            let target_shape = e.target.canvas_shape;
            if(!source_shape || ! target_shape){
                continue;
            }
            if (!e.sourceOffset || (e.sourceOffset.x === 0 && e.sourceOffset.y === 0)) {
                e.sourceOffset = {x: 0, y: 0};
                e.targetOffset = {x: 0, y: 0};
                //setTimeout(_setUpEdge(e),0);
            }
            context.save();
            context.strokeStyle = e.color;
            if(e.lineWidth){
                context.lineWidth = e.lineWidth;
            }
            if(e.opacity){
                context.opacity = e.opacity;
            }
            if(e.dash){
                context.setLineDash(e.dash)
            }

            let sourceX = source_shape.x() + e.sourceOffset.x;
            let sourceY = source_shape.y() + e.sourceOffset.y;
            let targetX = target_shape.x() + e.targetOffset.x;
            let targetY = target_shape.y() + e.targetOffset.y;

            context.beginPath();
            if(e.bend ){//&& e.bend !== 0
                let distance = Math.sqrt((targetX - sourceX)*(targetX - sourceX) + (targetY - sourceY)*(targetY - sourceY));
                let looseness = 0.4;
                if(e.looseness){
                    looseness = e.looseness;
                }
                let angle = Math.atan((targetY - sourceY)/(targetX - sourceX));
                let bendAngle = - e.bend * Math.PI/180;
                let control1X = sourceX + Math.cos(angle + bendAngle) * looseness * distance;
                let control1Y = sourceY + Math.sin(angle + bendAngle) * looseness * distance;
                let control2X = targetX - Math.cos(angle - bendAngle) * looseness * distance;
                let control2Y = targetY - Math.sin(angle - bendAngle) * looseness * distance;
                context.moveTo(sourceX, sourceY);
                context.bezierCurveTo(control1X, control1Y, control2X, control2Y, targetX, targetY);
                // context.moveTo(sourceX, sourceY);
                // context.lineTo(control1X, control1Y);
                // context.lineTo(control2X, control2Y);
                // context.lineTo(targetX, targetY);
            } else {
                context.moveTo(sourceX, sourceY);
                context.lineTo(targetX, targetY);
            }
            context.stroke();
            context.restore();
        }
    }

    _addClasses() {
        this.classLayer.removeChildren();
        for (let c of this.sseq.classes) {
           this._addClass(c);
        }
    }

    _addClass(c){
        if(!c || c.invalid){ // TODO: should we log invalid classes?
            return;
        }

        if(! Number.isInteger(c.x) || !Number.isInteger(c.y)){
            console.log("Class has invalid coordinates:\n" ); console.log(c);
            return;
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

    // Tooltips
    /**
     *
     * @param shape
     * @private
     */
    _handleMouseover(shape) {
        let c = shape.sseq_class;
        if(!c){
            return;
        }
        this.mouseover_class = c;
        // Is the result cached?
        let tooltip = this.sseq.getClassTooltip(c, this.page).replace(/\n/g, "\n<hr>\n");
        if (c.tooltip_html) {
            this.tooltip_div_dummy.html(c.tooltip_html);
            this._setupTooltipDiv(shape);
            let tooltip = this.sseq.getClassTooltip(c, this.page).replace(/\n/g, "\n<hr>\n");
            this.tooltip_div_dummy.html(c.tooltip);
            MathJax.Hub.Queue(["Typeset", MathJax.Hub, "tooltip_div_dummy"]);
            MathJax.Hub.Queue(() => this.copyTooltipHTMLFromDummyTooltip(shape,tooltip));
        } else {
            this.tooltip_div_dummy.html(tooltip);
            if(window.MathJax && MathJax.Hub) {
                MathJax.Hub.Queue(["Typeset", MathJax.Hub, "tooltip_div_dummy"]);
                MathJax.Hub.Queue(() => this._setupTooltipDiv(shape,tooltip));
            } else {
                this._setupTooltipDiv(shape,tooltip);
            }
        }
        if(this.sseq.onmouseoverClass){
            this.sseq.onmouseoverClass(c);
        }
        if(c.onmouseover){
            c.onmouseover();
        }
    }

    _setupTooltipDiv(shape) {
        let rect = this.tooltip_div.node().getBoundingClientRect();
        let tooltip_width = rect.width;
        let tooltip_height = rect.height;
        this.copyTooltipHTMLFromDummyTooltip(shape);
        this.tooltip_div.html(this.tooltip_div_dummy.html());
        this.tooltip_div.style("left", (shape.x() + 25) + "px")
            .style("top", (shape.y() - tooltip_height) + "px")
            .style("right", null).style("bottom", null);
        let bounding_rect = this.tooltip_div.node().getBoundingClientRect();
        if (bounding_rect.right > this.canvasWidth) {
            this.tooltip_div.style("left", null)
                .style("right", (this.canvasWidth - shape.x() + 10) + "px")
        }
        if (bounding_rect.top < 0) {
            this.tooltip_div.style("top", (shape.y() + 10) + "px")
        }

        this.tooltip_div.transition()
            .duration(200)
            .style("opacity", .9);
    }

    copyTooltipHTMLFromDummyTooltip(shape) {
        if (!this.tooltip_div_dummy.html().includes("\\(")) {
            // Cache the result of the MathJax so we can display this tooltip faster next time.
            shape.sseq_class.tooltip_html = this.tooltip_div_dummy.html();
        }
    }

    _handleMouseout() {
        this.mouseover_class = null;
        this.tooltip_div.transition()
            .duration(500)
            .style("opacity", 0);
    }

    /**
     * Draw an svg onto the canvas.
     * @param context html5 canvas context
     * @param xml An svg string
     */
    drawSVG(context, xml){
        // make it base64
        let svg64 = btoa(xml);
        let b64Start = 'data:image/svg+xml;base64,';

        // prepend a "header"
        let image64 = b64Start + svg64;

        // set it as the source of the img element
        let img = new Image();
        img.src = image64;

        context.drawImage(img,
            this.xScale(this.sseq.xRange[0]) - this.xMinOffset,
            this.yScale(this.sseq.yRange[1] + 1),
            this.canvasWidth  / (this.xmaxFloat - this.xminFloat) * (this.sseq.xRange[1] - this.sseq.xRange[0] + 1),
            this.canvasHeight / (this.ymaxFloat - this.yminFloat) * (this.sseq.yRange[1] - this.sseq.yRange[0] + 1)
        );
    }

    /**
     * Make an SVG of the current canvas. I think this returns a string.
     * TODO: fix clipping.
     */
    toSVG(){
        let ctx = new C2S(this.canvasWidth, this.canvasHeight);
        ctx.translate(10, 20);
        ctx._fill = ctx.fill;
        ctx._stroke = ctx.stroke;
        ctx.fillStrokeShape = Konva.Context.prototype.fillStrokeShape;

        ctx.save();
        //this._clipLayer(ctx);
        this._drawGrid(ctx);
        ctx.restore();

        ctx.save();
        this._drawTicks(ctx);
        ctx.restore();

        ctx.save(); // clip
        // this._clipLayer(ctx);
        this._drawEdges(ctx);
        ctx.restore();

        ctx.save(); // clip
        //this._clipLayer(ctx);
        for (let c of this.sseq._getClassesToDisplay()) {
            let s = c.canvas_shape;
            ctx.save();
            //ctx.transform(1,0,0,-1,50,50);
            ctx.transform(...s.getAbsoluteTransform().m);
            let node = this.sseq.getClassNode(c, display.page);
            let o = {};
            o.setAttrs = () => false;
            this._updateClasses();
            ctx.fillStyle = s.fill();
            ctx.strokeStyle = s.stroke();
            s.sceneFunc().call(s, ctx);
            ctx.restore();
        }
        ctx.restore(); // restore unclipped

        // draw axes
        ctx.beginPath();
        ctx.moveTo(this.leftMargin, this.topMargin);
        ctx.lineTo(this.leftMargin, this.clipHeight);
        ctx.lineTo(this.canvasWidth - this.rightMargin, this.clipHeight);
        ctx.stroke();

        if(this.sseq.on_draw){
            this.sseq.on_draw(this);
        }

        return ctx.getSerializedSvg(true);
    }

    /**
     * This is a click event handler to update the selected cell when the user clicks.
     * @param event A click event.
     */
    updateSelection(event){
        event.mouseover_class = this.mouseover_class;
        this.selectedX = Math.floor(display.xScale.invert(event.layerX) + 0.5);
        this.selectedY = Math.floor(display.yScale.invert(event.layerY) + 0.5);
        this.update();
    }

    /**
     * Enable selection. This changes the grid style to a chess grid and attaches event handlers for clicking
     * @param arrowNavigate
     */
    enableSelection(arrowNavigate){
        this.gridStyle = gridChess;
        this.addEventHandler("onclick",this.updateSelection.bind(this));
        if(arrowNavigate){
            this.addEventHandler('left',  () => {
                if(this.selectedX !== undefined){
                    this.selectedX --;
                    this.update();
                }
            });
            this.addEventHandler('right', () => {
                if(this.selectedX !== undefined){
                    this.selectedX ++;
                    this.update();
                }
            });
            this.addEventHandler('down',  () => {
                if(this.selectedY !== undefined){
                    this.selectedY --;
                    this.update();
                }
            });
            this.addEventHandler('up', () => {
                if(this.selectedY !== undefined){
                    this.selectedY ++;
                    this.update();
                }
            });
        }
        this.update();
    }

    disableSelection(){
        this.selectedX = undefined;
        this.gridStyle = gridGo;
        Mousetrap.bind('left',  this.previousPage);
        Mousetrap.bind('right', this.nextPage);
        this.eventHandlerLayer["onclick"] = (event) => {};
        this.update();
    }

    _drawSelection(context){
        let x = this.selectedX;
        let y = this.selectedY;
        if(x !== undefined && y !== undefined){
            context.fillStyle = this.gridColor;
            context.rect(
                display.xScale(x - 0.5),
                display.yScale(y - 0.5),
                display.dxScale(1),
                display.dyScale(1)
            );
            context.fill();
        }
    }

    /**
     * Move the canvas to contain (x,y)
     * TODO: control speed, control acceptable range of target positions, maybe zoom out if display is super zoomed in?
     * @param x
     * @param y
     */
    seek(x, y){
        return new Promise((resolve) => {
            let dx = 0;
            let dy = 0;
            if (x > this.xmaxFloat - 1) {
                dx = this.xmaxFloat - 1 - x;
            } else if (x < this.xminFloat + 1) {
                dx = this.xminFloat + 1 - x;
            }
            if (y > this.ymaxFloat - 1) {
                dy = this.ymaxFloat - 1 - y;
            } else if (y < this.xminFloat + 1) {
                dy = this.yminFloat + 1 - y;
            }
            if (dx === 0 && dy === 0) {
                return;
            }

            let dxActual = this.dxScale(dx);
            let dyActual = this.dyScale(dy);
            let dist = Math.sqrt(dxActual * dxActual + dyActual * dyActual);
            // steps controls the speed -- doubling steps halves the speed.
            // Of course we could maybe set up some fancy algorithm that zooms and pans.
            let steps = Math.ceil(dist / 10);
            let xstep = dxActual / steps;
            let ystep = dyActual / steps;

            let i = 0;
            let t = d3.interval(() => {
                i++;
                this.translateBy(xstep, ystep);
                if (i >= steps) {
                    t.stop();
                    resolve();
                }
            }, 5);
        });
    }

    translateBy(xstep, ystep){
        this.zoom.on("zoom", null);
        this.zoom.translateBy(this.zoomDomElement, xstep / this.transform.k, ystep / this.transform.k ); //
        this.update();
        this.zoom.on("zoom", this.updateBatch);
    }


    // Only used in unused _findBounaryTowards
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
}

exports.Display = Display;