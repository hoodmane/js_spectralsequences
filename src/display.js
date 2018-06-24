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
let marginSize = boxSize/2;

let ZOOM_BASE = 1.1;
let TICK_STEP_LOG_BASE = 15;

// Global variables for the coordinate transformation and graphic state
var transform;
var xshift = 0, yshift = 0; // These are read out of transform
var scale_ratio = 1;
var scale = 1, xscale = 1, yscale = scale_ratio;
var xmin, xmax, ymin, ymax; // calculated from transform
var xTickStep, yTickStep;
var xGridStep, yGridStep;

let draw_transform = new Matrix();

var yScaleStartOffset;

let sseq = new Sseq();
window.sseq = sseq;
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


d3.select("#supermarginLayer").call(d3.zoom().scaleExtent([1/16, 4]).on("zoom", drawAll)).on("dblclick.zoom", null);

let gridLayerContext   = d3.select("#gridLayer").node().getContext("2d");
let edgeLayerContext  = d3.select("#edgeLayer").node().getContext("2d");
let classLayerContext  = d3.select("#classLayer").node().getContext("2d");
let marginLayerContext = d3.select("#marginLayer").node().getContext("2d");
let supermarginLayerContext = d3.select("#supermarginLayer").node().getContext("2d");


var randomX = d3.randomNormal(width / 2, 80);
var randomY = d3.randomNormal(height / 2, 80);
var data = d3.range(2000).map(function() { return [randomX(), randomY()]; });

const clipX = boxSize/2 + 30;
const clipY = -boxSize;
const clipWidth = width;
const clipHeight = height - boxSize ;
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
supermarginLayerContext.rect(0, clipHeight, clipX, boxSize);
supermarginLayerContext.fill();
supermarginLayerContext.fillStyle = "#000";

supermarginLayerContext.beginPath();
supermarginLayerContext.moveTo(clipX, 0);
supermarginLayerContext.lineTo(clipX, clipHeight);
supermarginLayerContext.lineTo(width, clipHeight);
supermarginLayerContext.stroke(); 

window.context = classLayerContext;

var scale_ratio = 2;
function drawAll(){
    transform = d3.zoomTransform(d3.select("#supermarginLayer").node());
    xshift = transform.x;
    yshift = transform.y;
    scale  = transform.k;   
    xscale = scale;
    yscale = scale * scale_ratio;
    yScaleStartOffset =  -  14*scale*(scale_ratio - 1)*boxSize - yscale*boxSize/2; 
    // 1   --> 12
    // 2   --> 14 
    // 2.5 --> 13.3
    // 3   --> 13.5
    //

    // I'm not really sure why we need the 2*yshift here...
    let bottomLeft = transform.invert( [ 0,                + 2 * yshift ] );
    let topRight   = transform.invert( [ width, clipHeight + 2 * yshift ] );
    xmin = Math.floor( bottomLeft[0] / boxSize ) - 1;
    xmax = Math.ceil(  topRight[0]   / boxSize ) - 1;
    // - height/yscale + height so we are scaling around bottom of diagram rather than top?
    ymin = Math.floor( (bottomLeft[1] - clipHeight/scale + clipHeight ) / ( scale_ratio * boxSize ) );
    ymax = Math.ceil(  (topRight[1]   - clipHeight/scale + clipHeight ) / ( scale_ratio * boxSize ) ) + 1;

    draw_transform.setTransform(1, 0, 0, 1, 0, 0)
    draw_transform.translate(xshift, yshift);  
    draw_transform.translate( 3/2*boxSize * xscale + 1/10 * boxSize * xscale, clipHeight * yscale + yScaleStartOffset);  
    draw_transform.scale(xscale, xscale);


    let xZoom = Math.log(scale) / Math.log(ZOOM_BASE);
    let yZoom = xZoom + Math.log(scale_ratio) / Math.log(ZOOM_BASE);
    let n=0;
    xTickStep = 1;
    for(let i = -xZoom; i > 0; i -= TICK_STEP_LOG_BASE){
        if(n % 2 == 0){
            xTickStep *= 5;
        } else {
            xTickStep *= 2;
        }
        n++;
    }


    n = 0;
    yTickStep = 1;
    for(let i = -yZoom; i > 0; i -= TICK_STEP_LOG_BASE){
        if(n % 2 == 0){
            yTickStep *= 5;
        } else {
            yTickStep *= 2;
        }
        n++;
    }
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
    context.translate((xshift - clipX*xscale + xGridOffset*xscale) % (boxSize * xscale), (yshift + clipHeight*yscale + yGridOffset) % (boxSize * yscale));
    //context.scale(xscale, yscale);

    let num_cols = width/(boxSize*xscale)+1;
    context.beginPath();    
    for(let col = 0; col < num_cols; col += xGridStep){
        context.moveTo(col * boxSize * xscale, -3 * scale_ratio * boxSize);
        context.lineTo(col * boxSize * xscale, clipHeight);
    }
    gridLayerContext.lineWidth = gridStrokeWidth;    
    context.stroke();
    
    let num_rows = height/(boxSize * yscale)+1;
    context.beginPath();         
    for(let row = 0; row < num_rows; row += yGridStep){ 
        context.moveTo(-boxSize, row * boxSize * yscale);
        context.lineTo(width + boxSize, row * boxSize * yscale);       
    }
    gridLayerContext.lineWidth = gridStrokeWidth/scale_ratio;           
    context.stroke();
    context.restore();  
}


marginLayerContext.font = "15px Arial";
marginLayerContext.textBaseline = "middle";
function drawTicks(){
    let context = marginLayerContext;   
    context.save();
    context.clearRect(0, 0, width, height);    
        
     //    
    context.textAlign = "center";
    context.translate((xshift - clipX*xscale + boxSize * xscale * (5/2 + 1/5)), clipHeight + boxSize/2);
    for(let i = Math.floor(xmin/xTickStep)*xTickStep; i < xmax; i += xTickStep){
        context.fillText(i,xscale * boxSize* i,0);
    }
    context.restore();
    context.save();
    context.textAlign = "right";
    context.translate(boxSize, (yshift + yscale*clipHeight + 0* boxSize * yscale + yScaleStartOffset ));
    for(let i = Math.floor(ymin/yTickStep)*yTickStep; i < ymax; i += yTickStep){
        context.fillText(i,0, - yscale * boxSize * i );
    }
    context.restore();
    
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
        let pt = draw_transform.applyToPoint(c.x * boxSize + c.getXOffset(), - c.y * boxSize * scale_ratio);
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
        s.setPosition(draw_transform.applyToPoint(c.x * boxSize + c.getXOffset(), - c.y * boxSize * scale_ratio));
        s.sceneFunc(node.sceneFunc);
        //s.fill("#AAA");
        s.setAttrs(c.getNode(page));
        //    s.setAttrs({size: 6, fill: "#AAA"});
        //    s.radius = 6;
        s.size(default_size * scale_size);
        classLayer.add(s);
    }
    
    classLayer.draw();
    
    // draw_transform.applyToContext(context) does not work because context doesn't start out as the identity matrix
    // (god only knows why not) and that would overwrite whatever is in the coordinate matrix to start with...
    //context.transform(...draw_transform.toArray());
    
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



