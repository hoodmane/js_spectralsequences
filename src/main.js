// This MathJax file comes from the MathJax-single-file git archive folder dist/TeXSVGTeX
// It isn't designed to work with node / browserify -- it just installs itself as a global variable.
// because of this, require just "returns" an empty object, so there's no use in saving the output.
require("./mathjax.min.js");

window.infinity = 10000;

window.mod = function(n,d){
    return (n % d + d)%d;
}

window.Shapes = require("./Shape.js");
window.Display = require("./display.js").Display;


window.Sseq = require("./Sseq.js").Sseq;
window.d3 = require("d3");
//require("../examples/KO.js");
