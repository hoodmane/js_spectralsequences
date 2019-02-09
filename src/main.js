// This MathJax file comes from the MathJax-single-file git archive folder dist/TeXSVGTeX
// It isn't designed to work with node / browserify -- it just installs itself as a global variable.
// because of this, require just "returns" an empty object, so there's no use in saving the output.
//require("./mathjax.min.js");

window.infinity = 10000;

window.mod = function(n,d){
    return (n % d + d)%d;
};


window.Util = require("./Util.js");
window.IO = require("./SaveLoad");
window.Interface = require("./Interface");
window.sseqDatabase = IO.sseqDatabase;
window.Shapes = require("./Shape.js");
window.Display = require("./display.js").Display;
//window.C2S = require("canvas2svg");


let Sseqjs = require("./Sseq.js");
window.Sseq = Sseqjs.Sseq;
window.DisplaySseq = Sseqjs.DisplaySseq;
window.SseqClass = Sseqjs.SseqClass;
window.Node = Sseqjs.Node;
window.Edge = Sseqjs.Edge;
window.Differential = Sseqjs.Differential;
window.Structline = Sseqjs.Structline;
window.Extension = Sseqjs.Extension;


window.tools = require("./ass_tools.js");


window.d3 = require("d3");

window.range = Sseqjs.range;
window.monomialString = Sseqjs.monomialString;
window.StringifyingMap = Sseqjs.StringifyingMap;
window.product = Sseqjs.product;
window.vectorSum = Sseqjs.vectorSum;
window.vectorScale = Sseqjs.vectorScale;
window.vectorLinearCombination = Sseqjs.vectorLinearCombination;

window.on_public_website = new URL(document.location).hostname === "math.mit.edu";

window.getJSONFilename = function(file_name){
    file_name = `json/${file_name}.json`;
    if(on_public_website){
        file_name = "js_spectralsequences/" + file_name;
    }
    return file_name;
};
