"use strict";
let d3 = require("d3");
let Mousetrap = require("mousetrap");
window.Sseq = require("./objects.js");
window.d3 = d3;



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
var xshift,yshift; // These are read out of transform
var scale, xscale, yscale;
var xmin, xmax, ymin, ymax; // calculated from transform
var xTickStep, yTickStep, oldxTickStep = 1, oldyTickStep = 1;
var xGridStep, yGridStep; // Not used yet.


// Find out the height of the display. 
let boundingRectangle = document.getElementById("main").getBoundingClientRect();
let width = boundingRectangle.width;
let height = boundingRectangle.height - marginSize; // need to make room for bottom margin
// We want to align things at the bottom, so we need to translate by a half-multiple of the boxSize
let boxMultipleHeight = Math.floor(height/boxSize)*boxSize + boxSize/2; 
let heightOffset = height - boxMultipleHeight;

// Drawing elements
let body = d3.select("body");
let svg = d3.select("#main-svg");

let canvas = svg.append("g").attr("id","canvas");

// Layers from back to front. It's easy to add more later.
let grid = canvas.append("g").attr("id","grid"); 
let background = canvas.append("g").attr("id","background"); // unused.
let foreground = canvas.append("g").attr("id","foreground");
let edgeG = foreground.append("g").attr("id","edgeG");
let classG = foreground.append("g").attr("id","classG");
// Used for blank white margin squares and axes labels.
let margin = svg.append("g").attr("id","margin");  
// This just contains a white square in the bottom right corner to prevent axes labels
// from showing up down there. Also useful for debugging because nothing on this layer gets covered up.
let supermargin = svg.append("g").attr("id", "supermargin"); 


// Move the origin of the canvas to (0,0). y-axis still negative...
canvas.attr("transform", `translate(${marginSize},${heightOffset})`); 


let sseq = new Sseq();
window.sseq = sseq;
exports.setSseq = function(ss){
    sseq = ss;
    window.sseq = sseq;
}

exports.sseq = sseq;
//console.log(sseq);

// The sseq object contains the list of valid pages. Always includes at least 0 and infinity.
let page_idx = 0;
let page = 0;
var pageNumText = supermargin.append("text")
    .attr("x", 200)
    .attr("y", 20)
    .attr("id", "pagenum")
    .text("page: " + page);


// Handle left / right mouse buttons to change page.
Mousetrap.bind('left', function(e,n){ 
    if(page_idx > 0){
        page_idx --; 
        page = sseq.page_list[page_idx];
        pageNumText.text(page);
        updateForeground();
    }
})

Mousetrap.bind('right', function(e,n){ 
    if(page_idx < sseq.page_list.length - 1){
        page_idx++; 
        page = sseq.page_list[page_idx];        
        if(page_idx == sseq.page_list.length - 1){
            pageNumText.text("∞");
        } else {
            pageNumText.text(page);
        }
        updateForeground();
    }
})


// Add some white boxes on top layers to prevent lower layers from peaking out in the margins.
// Maybe we should add some space at top for a title?
margin.append("rect")
    .attr("width",marginSize)
    .attr("height",height)
    .attr("fill", "#FFF");

margin.append("rect")
    .attr("y", height - marginSize)
    .attr("height",marginSize + 20)
    .attr("width",width)
    .attr("fill", "#FFF");

supermargin.append("rect")
    .attr("y", height - marginSize)
    .attr("height",marginSize  + 20)
    .attr("width",marginSize)
    .attr("fill", "#FFF");
    
let tooltip_div = body.append("div")
    .attr("id", "tooltip_div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

// Set up zoom. Currently the scor
svg.call(d3.zoom()
        .scaleExtent([1 / 16, 4])
        .on("zoom", zoomed)).on("dblclick.zoom", null);


zoomed();

// This is the handler for zoom / pan events. It 
function zoomed() {
    transform = d3.zoomTransform(svg.node());
    xshift = transform.x;
    yshift = transform.y;
    scale  = transform.k;   
    xscale = scale;
    yscale = scale;// * 0.5;
    
    // I'm not really sure why we need the 2*yshift here...
    let bottomLeft = transform.invert([0,2*yshift]);
    let topRight = transform.invert([width,height+2*yshift]);
    xmin = Math.floor(bottomLeft[0]/boxSize) - 1;
    xmax = Math.ceil(topRight[0]/boxSize) - 1;
    // - height/yscale + height so we are scaling around bottom of diagram rather than top?
    ymin = Math.floor( (bottomLeft[1] - height/yscale + height )/(boxSize));
    ymax = Math.ceil(  (topRight[1]   - height/yscale + height )/(boxSize)) + 1;

    updateGrid();    
    updateForeground();
    updateAxes();
}
exports.zoomed = zoomed;


// This draws the grid
function updateGrid(){
    grid.attr("transform", `translate(${(xshift)%(boxSize*xscale)},${yshift%(boxSize*yscale)})scale(${scale})`);
    let hboxes = d3.range(0,width/(boxSize*xscale)+1);
    let vboxes = d3.range(0,height/(boxSize*yscale)+1);
    
    let hgrid = grid.selectAll(".horizontalgrid").data(hboxes);
    hgrid.enter()
        .append("line")
        .attr("class", "horizontalgrid")
        .attr("x1", function (d){return d*boxSize})
        .attr("x2", function (d){return d*boxSize;})
        .attr("y1", - boxSize)
        .style("stroke", gridColor)
        .attr("stroke-width", gridStrokeWidth);
    hgrid.exit().remove();
    
    grid.selectAll(".horizontalgrid")
        .attr("y2", 2*height/yscale + boxSize);
        
    let vgrid = grid.selectAll(".verticalgrid").data(vboxes);
    vgrid.enter()
        .append("line")
        .attr("class", "verticalgrid")
        .attr("x1", - boxSize)
        .attr("y1", function (d){return d*boxSize})
        .attr("y2", function (d){return d*boxSize})
        .style("stroke", gridColor)
        .attr("stroke-width", gridStrokeWidth);
    vgrid.exit().remove();
    grid.selectAll(".verticalgrid")
        .attr("x2", 2*width/xscale + boxSize);
}
exports.updateGrid = updateGrid;


// Draw the tick numbers along the axes. So far no actual axes are drawn.
function updateAxes(){
    let zoom = Math.log(scale)/Math.log(ZOOM_BASE);
    let n=0;
    xTickStep = 1;
    for(let i = -zoom; i > 0; i -= TICK_STEP_LOG_BASE){
        if(n % 2 == 0){
            xTickStep *= 5;
        } else {
            xTickStep *= 2;
        }
        n++;
    }
    yTickStep = xTickStep;
    if(xTickStep != oldxTickStep){
        margin.selectAll(".xaxistick").remove();
    }
    if(yTickStep != oldyTickStep){
        margin.selectAll(".yaxistick").remove();
    }
    oldxTickStep = xTickStep;
    oldyTickStep = yTickStep;
    
    let xaxisticks = Array.from({length: Math.floor((xmax - xmin + 2*xTickStep)/xTickStep)}, (x,i) => i*xTickStep + Math.floor(xmin/xTickStep)*xTickStep);
    let yaxisticks = Array.from({length: Math.floor((ymax - ymin + 2*yTickStep)/yTickStep)}, (x,i) => i*yTickStep + Math.floor(ymin/yTickStep)*yTickStep);   
    
    margin.selectAll(".xaxistick")
        .data(xaxisticks)
        .enter()
        .append("text")
        .attr("class","xaxistick")
        .attr("y", height - marginSize + 4)
        .attr("text-anchor","middle")
        .attr("dominant-baseline","hanging");  
    margin.selectAll(".xaxistick").exit().remove();
    margin.selectAll(".xaxistick")
        .text( d => d.toString())
        .attr("x", d => (d+1)*boxSize*xscale + xshift - marginSize*(xscale-1));     
     
    margin.selectAll(".yaxistick")
          .data(yaxisticks)
          .enter()
          .append("text")
          .attr("class","yaxistick")
          .attr("x", marginSize-4)
          .attr("text-anchor","end")
          .attr("dominant-baseline","middle");
    margin.selectAll(".yaxistick").exit().remove();
    margin.selectAll(".yaxistick")
        .text( d => d.toString())
        .attr("y", d => (boxMultipleHeight + heightOffset/yscale - (d+1)*boxSize)*yscale + yshift);         
}
exports.updateAxes = updateAxes;

function updateForeground(){
    classG.attr("transform", transform);
    edgeG.attr("transform", transform);
    sseq.calculateDrawnElements(page, xmin, xmax, ymin, ymax);
    updateClasses();
    updateStructlines();
    updateDifferentials();
}
exports.updateForeground = updateForeground;

function updateClasses(){
    let classSelection = classG.selectAll(".class")  // For new circle, go through the update process
        .data(sseq.getClasses());
    classSelection
        .enter()
        .append("path")
        .attr("class","class")
        .on("click", c => { d3.event.stopPropagation(); structlineDrawHandler(c);})
        .on("mouseover", handleMouseover)					
        .on("mouseout", handleMouseout);  
        
    classSelection.exit().remove(); 
        
    classG.selectAll(".class")
        .attr("d", d => (d3.symbol().type(d.getSymbol(page)).size(d.getSize(page)/scale)()))
        .attr("stroke", d => d.getStrokeColor(page))
        .attr("fill", d => d.getFillColor(page))
        .attr("stroke-width", 1/scale)
        .attr("transform", d => {
            d.cx = d.x * boxSize + boxSize/2 + d.getXOffset(); 
            d.cy = boxMultipleHeight - (d.y  + 1) * boxSize + d.getYOffset();
            return `translate(${d.cx},${d.cy})`;
        }) 
}
exports.updateClasses = updateClasses;

function updateStructlines(){
    let slSelection = edgeG.selectAll(".structline")
        .data(sseq.getStructlines(page,xmin,xmax,ymin,ymax));
    slSelection.enter()
        .append("line")
        .attr("class", "structline");
    slSelection.exit().remove();
    edgeG.selectAll(".structline")
        .attr("stroke" , sl => sl.color )
        .attr("x1", sl => sl.source.cx)
        .attr("y1", sl => sl.source.cy)
        .attr("x2", sl => sl.target.cx)
        .attr("y2", sl => sl.target.cy)
        .attr("stroke-width", strokeWidth/scale);
}
exports.updateStructlines = updateStructlines;

function updateDifferentials(){
    let dSelection = edgeG.selectAll(".differential")
        .data(sseq.getDifferentials(page,xmin,xmax,ymin,ymax));
    dSelection.enter()
        .append("line")
        .attr("class", "differential");
    dSelection.exit().remove();
    foreground.selectAll(".differential")
        .attr("stroke" , sl => sl.color )
        .attr("x1", sl => sl.source.cx)
        .attr("y1", sl => sl.source.cy)
        .attr("x2", sl => sl.target.cx)
        .attr("y2", sl => sl.target.cy)
        .attr("stroke-width", strokeWidth/scale)
        .attr("marker-end", "url(#triangle)");
}
exports.updateDifferentials = updateDifferentials;


var slSource;
function structlineDrawHandler(c){
    if(slSource === undefined){
        slSource = c;
        return;
    } else {
        sseq.addDifferential(slSource,c,2).addInfoToSourceAndTarget();
        updateDifferentials();
        slSource = undefined;
        return;
    }
}

function handleMouseover(d) {		
    tooltip_div.transition()		
        .duration(200)		
        .style("opacity", .9);		
        
    tooltip_div.html(`(${d.x}, ${d.y}) <hr>` + d.extra_info );     
    MathJax.Hub.Queue(["Typeset",MathJax.Hub,"tooltip_div"]);
    let rect = tooltip_div.node().getBoundingClientRect();
    let width = rect.width;
    let height = rect.height;
//    tooltip_div.style("left", ( Number(d3.select(this).attr("cx")) + 45) + "px")     
//               .style("top",  ( Number(d3.select(this).attr("cy")) - height - 10) + "px");        
    tooltip_div
        .style("left", (d3.event.pageX + 10) + "px")		
        .style("top", (d3.event.pageY - height - 10*scale) + "px");

}


function handleMouseout(d) {		
    tooltip_div.transition()		
        .duration(500)		
        .style("opacity", 0);	
}




//
//svg.on("click", function() {
//      var coords = d3.mouse(this);
//      let pt = transform.invert(coords)
//      let x = Math.ceil(pt[0]/boxSize - 1/2/scale) - 1;
//      let y = Math.floor((boxMultipleHeight - pt[1] + heightOffset/scale)/boxSize + 1/2) - 1;      
//      sseq.addClass(x,y).setName(sseq.total_classes);
//      updateForeground();
//})





window.sseq_display = exports;
