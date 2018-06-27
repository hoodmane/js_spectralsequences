// This MathJax file comes from the MathJax-single-file git archive folder dist/TeXSVGTeX
// It isn't designed to work with node / browserify -- it just installs itself as a global variable.
// because of this, require just "returns" an empty object, so there's no use in saving the output.
require("./mathjax.min.js");

window.mod = function(n,d){
    return (n % d + d)%d;
}

window.Display = require("./display.js").Display;
window.Sseq = require("./objects.js").Sseq;
window.d3 = require("d3");
require("../examples/EO32.js");
