"use strict";
let d3 = require("d3");
let Mousetrap = require("mousetrap");
let Konva = require("konva");
window.Sseq = require("./objects.js").Sseq;
window.d3 = d3;

// prevent scrollbars
document.documentElement.style.overflow = 'hidden';  // firefox, chrome
document.body.scroll = "no"; // ie only

Konva.Factory.addGetterSetter(Konva.Shape, 'size');


const boundingRectangle = document.getElementById("main").getBoundingClientRect();
const canvasWidth = boundingRectangle.width;
const canvasHeight = boundingRectangle.height;


// Global constants for grid and setup
let gridColor = "#555"; 
let gridStrokeWidth = 0.5;
let boxSize = 50;

let ZOOM_BASE = 1.1;

// Global variables for the coordinate transformation and graphic state
let transform, zoom_max_transform, pre_zoom_max_transform;
let old_scales_maxed = false;
let scale;
let xmin, xmax, ymin, ymax;
let xTicks, yTicks,
    xGridStep, yGridStep;

let domainOffset = 1/2;

let sseq = new Sseq();

exports.setSseq = function(ss) {
    sseq = ss;
    xScaleInit.domain([sseq.initialxRange[0] - domainOffset, sseq.initialxRange[1] + domainOffset]);
    yScaleInit.domain([sseq.initialyRange[0] - domainOffset, sseq.initialyRange[1] + domainOffset]);
    window.sseq = sseq;
    addClasses();
    drawAll();
};

// The sseq object contains the list of valid pages. Always includes at least 0 and infinity.
let page_idx = 0;
let page = 0;

// Handle left / right mouse buttons to change page.
Mousetrap.bind('left', function(e,n){ 
    if(page_idx > 0){
        page_idx --; 
        page = sseq.page_list[page_idx];
        //pageNumText.text(page);
        window.page = page;
        drawAll();
    }
});

Mousetrap.bind('right', function(e,n){ 
    if(page_idx < sseq.page_list.length - 1){
        page_idx++; 
        page = sseq.page_list[page_idx];        
        if(page_idx === sseq.page_list.length - 1){
            //pageNumText.text("∞");
        } else {
            //pageNumText.text(page);
        }
        window.page = page;
        drawAll();
    }
});

exports.sseq = sseq;
exports.draw = draw;

// Drawing elements
let body = d3.select("body");

let stage = new Konva.Stage({
  container: 'main',
  width: canvasWidth,
  height: canvasHeight
});

let width  = stage.width();
let height = stage.height();

window.stage = stage;

// Layers from back to front. 
let gridLayer = new Konva.Layer();
let edgeLayer = new Konva.Layer();
let classLayer = new Konva.Layer();
// Used for blank white margin squares and axes labels.
let margin = new Konva.Layer();
// This just contains a white square in the bottom right corner to prevent axes labels
// from showing up down there. Also useful for debugging because nothing on this layer gets covered up.
let supermargin = new Konva.Layer();

stage.add(gridLayer);
stage.add(edgeLayer);
stage.add(classLayer);
stage.add(margin);
stage.add(supermargin);

Array.prototype.forEach.call(document.getElementsByTagName("canvas"), 
    (c, idx) => c.setAttribute("id", ["gridLayer", "edgeLayer", "classLayer", "marginLayer", "supermarginLayer"][idx]));


//function resizeCanvasToDisplaySize(canvas) {
//   // look up the size the canvas is being displayed
//   const width = canvas.clientWidth;
//   const height = canvas.clientHeight;
//
//   // If its resolution does not match change it
//   if (canvas.width !== width || canvas.height !== height) {
//     canvas.width = width;
//     canvas.height = height;
//     return true;
//   }
//
//   return false;
//}
//
//resizeCanvasToDisplaySize(gridLayer);
//resizeCanvasToDisplaySize(classLayer);


const zoom = d3.zoom().scaleExtent([0, 4]).on("zoom", drawAll);
d3.select("#supermarginLayer").call(zoom).on("dblclick.zoom", null);
let zoomDomElement = d3.select("#supermarginLayer");
window.zoom = zoom;


let gridLayerContext   = d3.select("#gridLayer").node().getContext("2d");
let edgeLayerContext   = d3.select("#edgeLayer").node().getContext("2d");
let classLayerContext  = d3.select("#classLayer").node().getContext("2d");
let marginLayerContext = d3.select("#marginLayer").node().getContext("2d");
let supermarginLayerContext = d3.select("#supermarginLayer").node().getContext("2d");

const xMarginSize = boxSize/2 + 30;
const yMarginSize = boxSize;

const clipX     = xMarginSize;
const clipY     = -boxSize;
const clipWidth = width;
const clipHeight = height - yMarginSize;

gridLayerContext.rect(clipX, clipY, clipWidth - clipX, clipHeight - clipY);
gridLayerContext.clip();    
gridLayerContext.strokeStyle = gridColor;

edgeLayerContext.rect(clipX, clipY, clipWidth - clipX, clipHeight - clipY);
edgeLayerContext.clip(); 

classLayerContext.rect(clipX, clipY, clipWidth - clipX, clipHeight - clipY);
classLayerContext.clip(); 

supermarginLayerContext.fillStyle = "#FFF";
supermarginLayerContext.rect(0, clipHeight, xMarginSize - 5, boxSize);
supermarginLayerContext.fill();
supermarginLayerContext.fillStyle = "#000";

supermarginLayerContext.beginPath();
supermarginLayerContext.moveTo(xMarginSize, 0);
supermarginLayerContext.lineTo(xMarginSize, clipHeight);
supermarginLayerContext.lineTo(width, clipHeight);
supermarginLayerContext.stroke(); 

window.context = classLayerContext;

let xScaleInit = d3.scaleLinear().range([xMarginSize, width]);
let yScaleInit = d3.scaleLinear().range([height - yMarginSize, 0]);
let xScale, yScale;

function drawAll(){
    transform = d3.zoomTransform(zoomDomElement.node());
    scale  = transform.k;
    xScale = transform.rescaleX(xScaleInit);
    if(!sseq.fixY){
        yScale = transform.rescaleY(yScaleInit);
    } else {
        yScale = yScaleInit;
    }
    
    // We have to call zoom.translateBy when the user hits the boundary of the pan region
    // to adjust the zoom transform. However, this causes the zoom handler (this function) to be called a second time,
    // which is less intuitive program flow than just continuing on in the current function.
    // In order to prevent this, temporarily unset the zoom handler.
    zoom.on("zoom", null); 
    if(!old_scales_maxed){
        if( sseq.xRange ) {
            let xMinOffset = scale > 1 ? 10 * scale : 10;
            let xMaxOffset = xMinOffset;
            if(xScale(sseq.xRange[0]) > xMarginSize + xMinOffset){
                zoom.translateBy(zoomDomElement, (xMarginSize + xMinOffset - xScale(sseq.xRange[0]) - 0.1) / scale, 0);
            } else if(xScale(sseq.xRange[1]) < width - xMaxOffset){
                zoom.translateBy(zoomDomElement, (width - xMaxOffset - xScale(sseq.xRange[1]) + 0.1) / scale, 0);
            }
        }
        
        if( !sseq.fixY ) {
            if( sseq.yRange ) {
                let yMinOffset = scale > 1 ? 10 * scale : 10;
                let yMaxOffset = yMinOffset;
                if(yScale(sseq.yRange[0]) < clipHeight - yMinOffset){
                    zoom.translateBy(zoomDomElement, 0, (clipHeight - yMinOffset - yScale(sseq.yRange[0]) - 0.1) / scale);
                } else if(yScale(sseq.yRange[1]) > yMaxOffset){
                    zoom.translateBy(zoomDomElement, 0, (yMaxOffset - yScale(sseq.yRange[1]) + 0.1) / scale);
                }    
            }
        }
    }

    transform = d3.zoomTransform(zoomDomElement.node());
    xScale = transform.rescaleX(xScaleInit);    
    
    if(!sseq.fixY){
        yScale = transform.rescaleY(yScaleInit);
    }

    xmin = Math.ceil (xScale.invert(xMarginSize));
    xmax = Math.floor(xScale.invert(width));
    ymin = Math.ceil (yScale.invert(height - yMarginSize));
    ymax = Math.floor(yScale.invert(0));

    let xScaleMaxed = false, yScaleMaxed = false;

    if(sseq.xRange && (xmax - xmin) > sseq.xRange[1] - sseq.xRange[0]){ 
        xScaleMaxed = true;
        xScale.domain([sseq.xRange[0] - domainOffset, sseq.xRange[1] + domainOffset]);
    }
    
    if(sseq.yRange && (ymax - ymin) > sseq.yRange[1] - sseq.yRange[0]){
        yScaleMaxed = true;
        yScale.domain([sseq.yRange[0] - domainOffset, sseq.yRange[1] + domainOffset]);
    }

    if(xScaleMaxed && yScaleMaxed){
        if(!old_scales_maxed){
            old_scales_maxed = true;
            zoom_max_transform = transform;
        } else {
            zoom.transform(zoomDomElement, zoom_max_transform);
        }
    } else {
        if(old_scales_maxed){
            //zoom.transform(zoomDomElement, pre_zoom_max_transform);
            old_scales_maxed = false;
        } else {
            pre_zoom_max_transform = transform;
        }
    }
    
    transform = d3.zoomTransform(zoomDomElement.node());
    scale  = transform.k;
    xmin = Math.ceil (xScale.invert(xMarginSize));
    xmax = Math.floor(xScale.invert(width));
    ymin = Math.ceil (yScale.invert(height - yMarginSize));
    ymax = Math.floor(yScale.invert(0));    
    zoom.on("zoom", drawAll);

    window.xmin = xmin;
    window.xmax = xmax;
    window.transform = transform;
    window.xScale = xScale;

    let xZoom = Math.log(scale) / Math.log(ZOOM_BASE);
    let yZoom = xZoom;

    xTicks = xScale.ticks(15);
    yTicks = yScale.ticks();
    
    let xTickStep = xTicks[1] - xTicks[0];
    let yTickStep = yTicks[1] - yTicks[0];

    xGridStep = (Math.floor(xTickStep / 5) === 0) ? 1 : Math.floor(xTickStep / 5) ;
    yGridStep = (Math.floor(yTickStep / 5) === 0) ? 1 : Math.floor(yTickStep / 5) ;


    window.ymin = ymin;
    window.ymax = ymax;
    
    drawGrid();
    drawTicks();
    draw();
    
    
    if(d3.event){
        // The Konvas stage tracks the pointer position using _setPointerPosition.
        // d3 zoom doesn't allow the events it handles to bubble, so Konvas fails to track pointer position.
        // We have to manually tell Konvas to update the pointer position using the event.
        stage._setPointerPosition(d3.event.sourceEvent);
    }
    
    // If there is a tooltip being displayed and the zoom event has modified the canvas so that the cursor is no
    // longer over the 
    if( stage.getPointerPosition() === undefined || stage.getIntersection(stage.getPointerPosition()) === null ){
        handleMouseout();
    }
}

function drawGrid(){
    let context = gridLayerContext;
    context.save();
    context.clearRect(0, 0, width, height);    

    context.beginPath();    
    for(let col = Math.floor(xmin/xGridStep)*xGridStep; col <= xmax; col += xGridStep){
        context.moveTo(xScale(col), 0);
        context.lineTo(xScale(col), clipHeight);
    }
    gridLayerContext.lineWidth = gridStrokeWidth;    
    context.stroke();
    
    context.beginPath();         
    for(let row = Math.floor(ymin/yGridStep)*yGridStep; row <= ymax; row += yGridStep){ 
        context.moveTo(-boxSize, yScale(row));
        context.lineTo(width + boxSize, yScale(row));       
    }
    gridLayerContext.lineWidth = gridStrokeWidth;           
    context.stroke();
    context.restore();  
}


marginLayerContext.font = "15px Arial";
marginLayerContext.textBaseline = "middle";
function drawTicks(){
    let context = marginLayerContext;   
    context.clearRect(0, 0, width, height);     
    context.textAlign = "center";
    for(let i of xTicks){
        context.fillText(i,xScale(i), clipHeight + 20);
    }
    
    context.textAlign = "right";
    for(let i of yTicks){
        context.fillText(i,xMarginSize - 10, yScale(i));
    }
}

let hitCtx = classLayer.getHitCanvas().context;
function getPositionColorKey(x, y){
    return "#" + Konva.Util._rgbToHex(...hitCtx.getImageData(x, y, 1, 1).data);
}

function findBoundaryTowards(shape, x, y){
    const colorKey = shape.colorKey;
    const start_distance = 8;
    let x0 = shape.x();
    let y0 = shape.y();
    let dx = x - x0;
    let dy = y - y0;
    let length = Math.sqrt(dx * dx + dy * dy);

    if(length === 0){
        return {x: x0, y: y0};
    }
    
    dx = dx/length * start_distance;
    dy = dy/length * start_distance;
    length = start_distance;
    while(length > 0.5){
        length /= 2;
        dx /= 2;
        dy /= 2;
        if(getPositionColorKey(x0 + dx, y0 + dy) === colorKey) {  
            x0 += dx;
            y0 += dy;
        }
    }
    return {x: x0, y: y0};
}

function addClasses(){
    let classes = sseq.classes;
    for(let i = 0; i < classes.length; i++) {
        let c = classes[i];
        //if(c.x > 54 || c.x < 0){
//            continue; 
//        }
        c.canvas_shape = new Konva.Shape();
        c.canvas_shape.sseq_class = c;
        c.canvas_shape.on('mouseover', handleMouseover);        
        c.canvas_shape.on('mouseout', handleMouseout);        
        classLayer.add(c.canvas_shape);
    }
}

function setUpEdge(edge){
    let source_shape = edge.source.canvas_shape;
    let target_shape = edge.target.canvas_shape;
    
    source_shape.show();
    source_shape.draw();
    target_shape.show();
    target_shape.draw();

    
    let sourcePt = findBoundaryTowards(source_shape, target_shape.x(), target_shape.y());
    let targetPt = findBoundaryTowards(target_shape, source_shape.x(), source_shape.y());
    edge.sourceOffset = {x : (sourcePt.x - source_shape.x()) , y : (sourcePt.y - source_shape.y())};
    edge.targetOffset = {x : (targetPt.x - source_shape.x()) , y : (targetPt.y - source_shape.y())};
}


function draw() {
    window.layer = classLayer;
    let context = classLayerContext;
    context.clearRect(0, 0, width, height);  
    context.save();   
    sseq.calculateDrawnElements(page, xmin, xmax, ymin, ymax);
    
    
    let classes = sseq.getClasses();
    classLayer.removeChildren();
    
    let default_size = 6;
    let scale_size;
    if(scale < 1/2){
        scale_size = 1/2;
    } else if(scale > 2) {
        scale_size = 2;
    } else {
        scale_size = scale;
    }
    
    for(let i = 0; i < classes.length; i++) {
        let c = classes[i];
        let s = c.canvas_shape;
        if(! s){
            continue;
        }
        let node = c.getNode(page);
        s.setPosition({x : xScale(c.x) + c.getXOffset(), y : yScale(c.y) + c.getYOffset()});
        s.sceneFunc(node.sceneFunc);
        s.setAttrs(c.getNode(page));
        s.size(default_size * scale_size);
        classLayer.add(s);
    }
    
    classLayer.draw();
    
    context = edgeLayerContext; 
    context.clearRect(0, 0, width, height); 
    
    let edges = sseq.getEdges();
    for(let i = 0; i < edges.length; i++){
        let e = edges[i];
        let source_shape = e.source.canvas_shape;
        let target_shape = e.target.canvas_shape;    
        context.beginPath();    
        if(! e.sourceOffset || (e.sourceOffset.x === 0  && e.sourceOffset.y === 0)){
            e.sourceOffset = {x:0, y:0};
            e.targetOffset = {x:0, y:0};
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


let tooltip_div = body.append("div")
    .attr("id", "tooltip_div")	
    .attr("class", "tooltip")				
.style("opacity", 0);

let tooltip_div_dummy = body.append("div")
    .attr("id", "tooltip_div_dummy")	
    .attr("class", "tooltip")				
.style("opacity", 0);


function handleMouseover() {		
    let c = this.sseq_class;
    if(c.tooltip_html){
        tooltip_div_dummy.html(c.tooltip_html);
        setUpTooltipDiv(this);
    } else {
        tooltip_div_dummy.html(`\\(${c.name}\\) -- (${c.x}, ${c.y})` + c.extra_info );     
        MathJax.Hub.Queue(["Typeset",MathJax.Hub,"tooltip_div_dummy"]);
        MathJax.Hub.Queue(() => setUpTooltipDiv(this));
    }
}

function setUpTooltipDiv(shape){
    let rect = tooltip_div.node().getBoundingClientRect();
    let tooltip_width = rect.width;
    let tooltip_height = rect.height;
    shape.sseq_class.tooltip_html = tooltip_div_dummy.html();
    tooltip_div.html(tooltip_div_dummy.html());
    tooltip_div.style("left", (shape.x() + 25) + "px" )  
               .style("top",  (shape.y() - tooltip_height) + "px")
               .style("right", null).style("bottom", null); 
    let bounding_rect = tooltip_div.node().getBoundingClientRect();
    if(bounding_rect.right > width){
        tooltip_div.style("left", null)
            .style("right", (width - shape.x() + 10 ) + "px")
    }
    if(bounding_rect.top < 0){
        tooltip_div.style("top", ( shape.y() + 10 ) + "px")
    }    
    
    tooltip_div.transition()		
            .duration(200)		
            .style("opacity", .9);                   
}

function handleMouseout() {		
    tooltip_div.transition()		
        .duration(500)		
        .style("opacity", 0);	
}
