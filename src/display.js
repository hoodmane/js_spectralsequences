"use strict";                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       
let d3 = require("d3");
let Mousetrap = require("mousetrap");
let Konva = require("konva");
let Matrix = require("transformation-matrix-js").Matrix;
window.Sseq = require("./objects.js");
window.d3 = d3;

Konva.Factory.addGetterSetter(Konva.Shape, 'size');


const boundingRectangle = document.getElementById("main").getBoundingClientRect();
const canvasWidth = boundingRectangle.width;
const canvasHeight = boundingRectangle.height;


// Global constants for grid and setup
let gridColor = "#555"; //"#333"; //
let gridStrokeWidth = 0.5;
let strokeWidth = 1;
let boxSize = 50;

let ZOOM_BASE = 1.1;
let TICK_STEP_LOG_BASE = 15;

// Global variables for the coordinate transformation and graphic state
var transform;
var xshift = 0, yshift = 0; // These are read out of transform
var scale;
var xmin, xmax, ymin, ymax; // calculated from transform
var xTicks,    yTicks,
    xGridStep, yGridStep;

let sseq = new Sseq();
exports.setSseq = function(ss){
    sseq = ss;
    window.sseq = sseq;
    addClasses();
        
}

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
        draw();
    }
})

Mousetrap.bind('right', function(e,n){ 
    if(page_idx < sseq.page_list.length - 1){
        page_idx++; 
        page = sseq.page_list[page_idx];        
        if(page_idx == sseq.page_list.length - 1){
            //pageNumText.text("∞");
        } else {
            //pageNumText.text(page);
        }
        window.page = page;
        draw();
    }
})

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


let tooltip_div = body.append("div")
    .attr("id", "tooltip_div")	
    .attr("class", "tooltip")				
.style("opacity", 0);

Array.prototype.forEach.call(document.getElementsByTagName("canvas"), 
    (c, idx) => c.setAttribute("id", ["gridLayer", "edgeLayer", "classLayer", "marginLayer", "supermarginLayer"][idx]));
//
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


var zoom = d3.zoom().scaleExtent([1/16, 4]).on("zoom", drawAll);
d3.select("#supermarginLayer").call(zoom).on("dblclick.zoom", null);
let zoomDomElement = d3.select("#supermarginLayer");
window.zoom = zoom;


let gridLayerContext   = d3.select("#gridLayer").node().getContext("2d");
let edgeLayerContext  = d3.select("#edgeLayer").node().getContext("2d");
let classLayerContext  = d3.select("#classLayer").node().getContext("2d");
let marginLayerContext = d3.select("#marginLayer").node().getContext("2d");
let supermarginLayerContext = d3.select("#supermarginLayer").node().getContext("2d");


var randomX = d3.randomNormal(width / 2, 80);
var randomY = d3.randomNormal(height / 2, 80);
var data = d3.range(2000).map(function() { return [randomX(), randomY()]; });

const xMarginSize = boxSize/2 + 30;
const yMarginSize = boxSize;

const clipX     = xMarginSize
const clipY     = -boxSize
const clipWidth = width;
const clipHeight = height - yMarginSize;
const xGridOffset = 10;
const yGridOffset = 0;

gridLayerContext.rect(clipX, clipY, clipWidth - clipX, clipHeight - clipY);
gridLayerContext.clip();    
gridLayerContext.strokeStyle = gridColor;

window.ctx = gridLayerContext;

edgeLayerContext.rect(clipX, clipY, clipWidth - clipX, clipHeight - clipY);
edgeLayerContext.clip(); 

classLayerContext.rect(clipX, clipY, clipWidth - clipX, clipHeight - clipY);
classLayerContext.clip(); 

supermarginLayerContext.fillStyle = "#FFF";
supermarginLayerContext.rect(0, clipHeight, xMarginSize, boxSize);
supermarginLayerContext.fill();
supermarginLayerContext.fillStyle = "#000";

supermarginLayerContext.beginPath();
supermarginLayerContext.moveTo(xMarginSize, 0);
supermarginLayerContext.lineTo(xMarginSize, clipHeight);
supermarginLayerContext.lineTo(width, clipHeight);
supermarginLayerContext.stroke(); 

window.context = classLayerContext;

var xScaleInit = d3.scaleLinear().range([xMarginSize, width]),
    yScaleInit = d3.scaleLinear().range([height - yMarginSize, 0]);
    
var xScale, yScale; 


xScaleInit.domain([0 -1/2, 54 + 1/2]);
yScaleInit.domain([0 -1/2, 30 + 1/2]);


function drawAll(){
    transform = d3.zoomTransform(zoomDomElement.node());
    xshift = transform.x;
    yshift = transform.y;
    scale  = transform.k;
    
    xScale = transform.rescaleX(xScaleInit);
    if(xScale(0) > xMarginSize + 30){
        zoom.translateBy(zoomDomElement, (xMarginSize + 30 - xScale(0) - 0.1)/scale,0);
        return;
    }
    yScale = yScaleInit; 
    //yScale = transform.rescaleY(yScaleInit); 

    xmin = Math.ceil (xScale.invert(xMarginSize));
    xmax = Math.floor(xScale.invert(width));
    ymin = Math.ceil (yScale.invert(height - yMarginSize));
    ymax = Math.floor(yScale.invert(0));

    window.xmin = xmin;
    window.xmax = xmax;
    window.transform = transform;
    window.xScale = xScale;

    let xZoom = Math.log(scale) / Math.log(ZOOM_BASE);
    let yZoom = xZoom;
    let n=0;

    xTicks = xScale.ticks(15);
    yTicks = yScale.ticks();
    
    let xTickStep = xTicks[1] - xTicks[0];
    let yTickStep = yTicks[1] - yTicks[0];

    xGridStep = (Math.floor(xTickStep / 5) == 0) ? 1 : Math.floor(xTickStep / 5) ;
    yGridStep = (Math.floor(yTickStep / 5) == 0) ? 1 : Math.floor(yTickStep / 5) ;            


    window.ymin = ymin;
    window.ymax = ymax;
    
    drawGrid();
    drawTicks();
    draw();
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

function getRndColor() {
    var r = 255*Math.random()|0,
        g = 255*Math.random()|0,
        b = 255*Math.random()|0;
    return 'rgb(' + r + ',' + g + ',' + b + ')';
}




let hitCtx = classLayer.getHitCanvas().context;
function getPositionColorKey(x, y){
    return "#" + Konva.Util._rgbToHex(...hitCtx.getImageData(x, y, 1, 1).data);
}

function findBoundaryTowards(shape, x, y){
    const colorKey = shape.colorKey;
    const start_distance = 8;
    var x0 = shape.x();
    var y0 = shape.y();    
    var dx = x - x0;
    var dy = y - y0;
    var length = Math.sqrt( dx * dx + dy * dy);

    if(length == 0){    
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
        let shape_type = Konva.Circle;
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
}


function draw() {
    window.layer = classLayer;
    let context = classLayerContext;
    context.clearRect(0, 0, width, height);  
    context.save();   
    sseq.calculateDrawnElements(page, xmin, xmax, ymin, ymax);
    
    
    let classes = sseq.getClasses();
    let class_shapes = classLayer.getChildren();
//    for(let i = 0; i < class_shapes.length; i++){
//        let s = class_shapes[i];
//        s.hide();
//    }
    classLayer.removeChildren();
    
    let default_size = 6;
    var scale_size;
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
        s.setPosition({x : xScale(c.x), y : yScale(c.y)});
        s.sceneFunc(node.sceneFunc);
        //s.fill("#AAA");
        s.setAttrs(c.getNode(page));
        //    s.setAttrs({size: 6, fill: "#AAA"});
        //    s.radius = 6;
        s.size(default_size * scale_size);
        classLayer.add(s);
    }
    
    classLayer.draw();
    
    context = edgeLayerContext; 
    context.clearRect(0, 0, width, height); 
    
    let structlines = sseq.getStructlines();
    for(let i = 0; i < structlines.length; i++){
        let sl = structlines[i];
        if(sl.page < page){
            continue;
        }
        let source_shape = sl.source.canvas_shape;
        let target_shape = sl.target.canvas_shape;    
        context.beginPath();    
        if(! sl.sourceOffset || (sl.sourceOffset.x == 0  && sl.sourceOffset.y == 0)){
            sl.sourceOffset = {x:0, y:0};
            sl.targetOffset = {x:0, y:0};
            //setTimeout(setUpEdge(sl),0);
        }    
        context.lineWidth = 1;
        context.strokeStyle = sl.color;
        context.moveTo(source_shape.x() + sl.sourceOffset.x, source_shape.y() + sl.sourceOffset.y);
        context.lineTo(target_shape.x() + sl.targetOffset.x, target_shape.y() + sl.targetOffset.y);
        context.closePath();        
        context.stroke();
    }
    
    let differentials = sseq.getDifferentials();
    for(let i = 0; i < differentials.length; i++){
        let sl = differentials[i];
        let source_shape = sl.source.canvas_shape;
        let target_shape = sl.target.canvas_shape;
        //    console.log(!sl.sourceOffset);
        if(! sl.sourceOffset || (sl.sourceOffset.x == 0  && sl.sourceOffset.y == 0)){
            sl.sourceOffset = {x:0, y:0};
            sl.targetOffset = {x:0, y:0};
            //setTimeout(setUpEdge(sl),0);
        }
        context.beginPath();    
        context.lineWidth = 1;
        context.strokeStyle = sl.color;
        context.moveTo(source_shape.x() + sl.sourceOffset.x, source_shape.y() + sl.sourceOffset.y);
        context.lineTo(target_shape.x() + sl.targetOffset.x, target_shape.y() + sl.targetOffset.y);
        context.closePath();
        context.stroke();
    }  
}


drawAll();


function handleMouseover(evt) {		
    let c = this.sseq_class;
    if(c.tooltip_html){
        tooltip_div.html(c.tooltip_html);
        setUpTooltipDiv();
    }	
    tooltip_div.html(`\\(${c.name}\\) -- (${c.x}, ${c.y})` + c.extra_info );     
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"tooltip_div"]);
    MathJax.Hub.Queue(() => setUpTooltipDiv(this));
}

function setUpTooltipDiv(shape){
    let rect = tooltip_div.node().getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;
    tooltip_div.style("left", ( (shape.x() + 25) + "px"))    
               .style("top",  ( (shape.y() - height) + "px")); 
    tooltip_div.transition()		
            .duration(200)		
            .style("opacity", .9);                   
}

function handleMouseout(d) {		
    tooltip_div.transition()		
        .duration(500)		
        .style("opacity", 0);	
}



