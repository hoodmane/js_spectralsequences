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
window.Display = require("./Display.js").Display;
window.BasicDisplay = require("./BasicDisplay.js").BasicDisplay;
window.SidebarDisplay = require("./SidebarDisplay.js").SidebarDisplay;
window.EditorDisplay = require("./EditorDisplay.js").EditorDisplay;
window.Tooltip = require("./Tooltip.js").Tooltip;
window.Panel = require("./Panel.js");
window.C2S = require("canvas2svg");
window.ExportToTex = require("./ExportToTex.js");


let Sseqjs = require("./Sseq.js");
window.Sseq = Sseqjs.Sseq;
window.SseqClass = Sseqjs.SseqClass;
window.Node = Sseqjs.Node;
window.Edge = Sseqjs.Edge;
window.Differential = Sseqjs.Differential;
window.Structline = Sseqjs.Structline;
window.Extension = Sseqjs.Extension;


window.tools = require("./ass_tools.js");


window.d3 = require("d3-selection");
window.Mousetrap = require("mousetrap");

window.range = Sseqjs.range;
window.monomialString = Sseqjs.monomialString;
window.StringifyingMap = require('./StringifyingMap.js');
window.product = Sseqjs.product;
window.vectorSum = Sseqjs.vectorSum;
window.vectorScale = Sseqjs.vectorScale;
window.vectorLinearCombination = Sseqjs.vectorLinearCombination;
window.dictionaryVectorSum = Sseqjs.dictionaryVectorSum;
window.dictionaryVectorScale = Sseqjs.dictionaryVectorScale;
window.dictionaryVectorLinearCombination = Sseqjs.dictionaryVectorLinearCombination;


window.on_public_website = new URL(document.location).hostname === "math.mit.edu";

window.getJSONFilename = function(file_name){
    file_name = `json/${file_name}.json`;
    if(on_public_website){
        file_name = "js_spectralsequences/" + file_name;
    }
    return file_name;
};
