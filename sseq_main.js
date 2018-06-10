"use strict";

let gridColor = "#555"; //"#333"; //
let gridStrokeWidth = "0.5";
let strokeWidth = 1;
let boxSize = 50;
let marginSize = boxSize/2;

var transform;
var xshift,yshift;
var scale, xscale, yscale;
var xmin, xmax, ymin, ymax;
var xTickStep, yTickStep, oldxTickStep = 1, oldyTickStep = 1;
let ZOOM_BASE = 1.1;
let TICK_STEP_LOG_BASE = 20;

let sseq = new Sseq();

let svg = d3.select("#main")
	.append("svg")
	.attr("width","100%")
	.attr("height","96%");

//svg.append("defs").selectAll("marker")
//        .data(["triangle"])
//        .enter().append("marker")
//        .attr("id", function(d) { return d; })
//        .attr("viewBox", "0 0 10 10")
//        .attr("refX", 1)
//        .attr("refY", 5)
//        .attr("markerWidth", 6)
//        .attr("markerHeight", 6)
//        .attr("markerUnits","strokeWidth")
//        .attr("orient", "auto")
//        .append("polygon")
//        .attr("points", "0 0, 10 3.5, 0 7")
//        .attr("fill","red");


let canvas = svg.append("g").attr("id","canvas");


let body = d3.select("body");
let grid = canvas.append("g").attr("id","grid");
let foreground = canvas.append("g").attr("id","foreground");
let edgeG = foreground.append("g").attr("id","edgeG");
let classG = foreground.append("g").attr("id","classG");
let margin = svg.append("g").attr("id","margin");
let supermargin = svg.append("g");

//
//supermargin.append("polyline")
//     .attr("transform","translate(100,100)")
//     .attr("points","10,90 50,80 90,20")
//     .attr("fill", "none")
//     .attr("stroke","black")
//     .attr("stroke-width","2")
//     .attr("marker-end","url(#triangle)");

let boundingRectangle = document.getElementById("main").getBoundingClientRect();
let width = boundingRectangle.width;
let height = boundingRectangle.height - 30;
let boxMultipleHeight = Math.floor(height/boxSize)*boxSize + boxSize/2;
let heightOffset = height - boxMultipleHeight

let page_idx = 0;
let page = 0;
var pageNumText = supermargin.append("text")
    .attr("x", 200)
    .attr("y", 20)
    .attr("id", "pagenum")
    .text("page: " + page);

canvas.attr("transform", `translate(${marginSize},${heightOffset})`);

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




svg.call(d3.zoom()
        .scaleExtent([1 / 8, 4])
        .on("zoom", zoomed)).on("dblclick.zoom", null);


//svg.on("click", function() {
//      var coords = d3.mouse(this);
//      let pt = transform.invert(coords)
//      let x = Math.ceil(pt[0]/boxSize - 1/2/scale) - 1;
//      let y = Math.floor((boxMultipleHeight - pt[1] + heightOffset/scale)/boxSize + 1/2) - 1;
//      sseq.addClass(x,y).setName(sseq.total_classes);
//      updateForeground();
//})


zoomed();

function zoomed() {
    transform = d3.zoomTransform(svg.node());
    xshift = transform.x;
    yshift = transform.y;
    scale  = transform.k;   
    xscale = scale;
    yscale = scale;// * 0.5;
    
    let bottomLeft = transform.invert([0,2*yshift]);
    let topRight = transform.invert([width,height+2*yshift]);
    xmin = Math.floor(bottomLeft[0]/boxSize) - 1;
    xmax = Math.ceil(topRight[0]/boxSize) - 1;
    ymin = Math.floor( (bottomLeft[1] - height/yscale + height )/(boxSize));
    ymax = Math.ceil(  (topRight[1]   - height/yscale + height )/(boxSize)) + 1;

    updateGrid();    
    updateForeground();
    updateAxes();
}

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

function updateForeground(){
    classG.attr("transform", transform);
    edgeG.attr("transform", transform);
    updateClasses();
    updateStructlines();
    updateDifferentials();
}

function updateClasses(){
    let classSelection = classG.selectAll(".class")  // For new circle, go through the update process
        .data(sseq.getClasses(page,xmin,xmax,ymin,ymax));
    classSelection
        .enter()
        .append("path")
        .attr("class","class")
        .on("click", c => { d3.event.stopPropagation(); structlineDrawHandler(c);})
        .on("mouseover", handleMouseover)					
        .on("mouseout", handleMouseout);  
        
    classSelection.exit().remove(); 
        
    classG.selectAll(".class")
        .attr("d", d => (d3.symbol().type(d.getSymbol()).size(d.getSize()/scale)()))
        .attr("stroke", d => d.getStrokeColor())
        .attr("fill", d => d.getFillColor())
        .attr("stroke-width",1/scale)
        .attr("transform", d => {
            d.cx = d.x * boxSize + boxSize/2; 
            d.cy = boxMultipleHeight - (d.y  + 1) * boxSize + d.getYOffset();
            return `translate(${d.cx},${d.cy})`;
        }) 
}

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
        .attr("marker-end","url(#triangle)");
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
        pageNumText.text(page);
        updateForeground();
    }
})


