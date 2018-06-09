"use strict";

let gridColor = "#555"; //"#333"; //
let gridStrokeWidth = "0.5";
let boxSize = 50;
let marginSize = boxSize/2;

let svg = d3.select("#main")
	.append("svg")
	.attr("width","100%")
	.attr("height","96%");

let canvas = svg.append("g").attr("id","canvas");


let body = d3.select("body");
let grid = canvas.append("g").attr("id","grid");
let foreground = canvas.append("g").attr("id","foreground");
let edgeG = foreground.append("g").attr("id","edgeG");
let classG = foreground.append("g").attr("id","classG");
let margin = svg.append("g").attr("id","margin");
let supermargin = svg.append("g");


let boundingRectangle = document.getElementById("main").getBoundingClientRect();
let width = boundingRectangle.width;
let height = boundingRectangle.height;
let boxMultipleHeight = Math.floor(height/boxSize)*boxSize + boxSize/2;
let heightOffset = height - boxMultipleHeight


canvas.attr("transform", `translate(${marginSize},${heightOffset})`);

margin.append("rect")
    .attr("width",marginSize)
    .attr("height",height)
    .attr("fill", "#FFF");

margin.append("rect")
    .attr("y", height - marginSize)
    .attr("height",marginSize)
    .attr("width",width)
    .attr("fill", "#FFF");

supermargin.append("rect")
    .attr("y", height - marginSize)
    .attr("height",marginSize)
    .attr("width",marginSize)
    .attr("fill", "#FFF");    
    
let tooltip_div = body.append("div")	
    .attr("class", "tooltip")				
    .style("opacity", 0);

var transform;
var xshift,yshift;
var scale, xscale, yscale;
var xmin, xmax, ymin, ymax;
var xTickStep;
var yTickStep;

let sseq = new Sseq();

svg.call(d3.zoom()
        .scaleExtent([1 / 2, 4])
        .on("zoom", zoomed)).on("dblclick.zoom", null);


svg.on("click", function() {
      var coords = d3.mouse(this);
      let pt = transform.invert(coords)
      let x = Math.ceil(pt[0]/boxSize - 1/2/scale) - 1;
      let y = Math.floor((boxMultipleHeight - pt[1] + heightOffset/scale)/boxSize + 1/2) - 1;
      sseq.addClass(x,y).setName(sseq.total_classes);
      updateForeground();
})


zoomed();

function zoomed() {
    transform = d3.zoomTransform(svg.node());
    xshift = transform.x;
    yshift = transform.y;
    scale  = transform.k;   
    xscale = scale;
    yscale = scale;
    
    let bottomLeft = transform.invert([0,2*yshift]);
    let topRight = transform.invert([width,height+2*yshift]);
   // sseq.addClass(Math.round(bottomLeft[0]/boxSize),Math.round(bottomLeft[1]/boxSize))
    xmin = Math.floor(bottomLeft[0]/boxSize) - 1;
    xmax = Math.ceil(topRight[0]/boxSize) - 1;
    ymin = Math.floor( (bottomLeft[1] - height/scale + height )/(boxSize));
    ymax = Math.ceil(  (topRight[1]   - height/scale + height )/(boxSize)) + 1;

    updateGrid();    
    updateForeground();
    updateAxes();
}

function updateGrid(){
    grid.attr("transform", `translate(${(xshift)%(boxSize*scale)},${yshift%(boxSize*scale)})scale(${scale})`);
    let hboxes = d3.range(0,width/(boxSize*scale)+1);
    let vboxes = d3.range(0,height/(boxSize*scale)+1);
    
    let hgrid = grid.selectAll(".horizontalgrid").data(hboxes);
    hgrid.enter()
        .append("line")
        .attr("class", "horizontalgrid")
        .attr("x1", function (d){return d*boxSize})
        .attr("x2", function (d){return d*boxSize;})
        .attr("y1", - boxSize)
        .attr("y2", 2*height + boxSize)
        .style("stroke", gridColor)
        .attr("stroke-width", gridStrokeWidth);
    hgrid.exit().remove();
        
    let vgrid = grid.selectAll(".verticalgrid").data(vboxes);
    
    vgrid.enter()
        .append("line")
        .attr("class", "verticalgrid")
        .attr("x1", - boxSize)
        .attr("x2", 2*width + boxSize)
        .attr("y1", function (d){return d*boxSize})
        .attr("y2", function (d){return d*boxSize})
        .style("stroke", gridColor)
        .attr("stroke-width", gridStrokeWidth);
    vgrid.exit().remove();
}

function updateAxes(){
//    xTickStep = 3*1/scale;
//    xTickStep = 3*1/scale;
    
    let xaxisticks = Array.from({length: xmax - xmin}, (x,i) => i + xmin);
    let yaxisticks = Array.from({length: ymax - ymin}, (x,i) => i + ymin);   
    
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
        .attr("x", d => (d+1)*boxSize*scale + xshift - marginSize*(scale-1));     
     
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
        .attr("y", d => (boxMultipleHeight - (d+1)*boxSize)*scale + yshift);         
}

function updateForeground(){
    updateClasses();
    updateStructlines();
    updateDifferentials();
}

function updateClasses(){
    classG.selectAll(".class")  // For new circle, go through the update process
        .data(sseq.classes)
        .enter()
        .append("circle")
        .attr("class","class")
        .on("click", c => { d3.event.stopPropagation(); structlineDrawHandler(c);})
        .on("mouseover", handleMouseover)					
        .on("mouseout", handleMouseout);        
        
    classG.selectAll(".class")
        .attr("transform", transform)
        .attr("r", 5)
        .attr("fill", d => d.color )
        .attr("cx", d => {d.cx = d.x * boxSize + boxSize/2; return d.cx;})         
        .attr("cy", d => {d.cy = boxMultipleHeight - (d.y  + 1) * boxSize + d.getYOffset(); return d.cy;});
}

function updateStructlines(){
    edgeG.selectAll(".structline")
        .data(sseq.structlines)
        .enter()
        .append("line")
        .attr("class", "structline");
    edgeG.selectAll(".structline")
        .attr("transform", transform)
        .attr("stroke" , sl => sl.color )
        .attr("x1", sl => sl.source.cx)
        .attr("y1", sl => sl.source.cy)
        .attr("x2", sl => sl.target.cx)
        .attr("y2", sl => sl.target.cy);
}

function updateDifferentials(){
    edgeG.selectAll(".differential")
        .data(sseq.differentials)
        .enter()
        .append("line")
        .attr("class", "differential");
    foreground.selectAll(".differential")
        .attr("transform", transform)
        .attr("stroke" , sl => sl.color )
        .attr("x1", sl => sl.source.cx)
        .attr("y1", sl => sl.source.cy)
        .attr("x2", sl => sl.target.cx)
        .attr("y2", sl => sl.target.cy);
}


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
    tooltip_div.html("(" + d.x + ", " + d.y + ") <br>" + d.extra_info )	
        .style("left", (d3.event.pageX) + "px")		
        .style("top", (d3.event.pageY - 28) + "px");	
}


function handleMouseout(d) {		
    tooltip_div.transition()		
        .duration(500)		
        .style("opacity", 0);	
}
