if(MathJax && MathJax.Hub){
    MathJax.Hub.Config({
        messageStyle: "none",
        tex2jax: {inlineMath: [['$','$'], ['\\(','\\)']], displayMath: [ ['$$','$$'], ['\[','\]'] ]},
        jax: ["input/TeX","output/SVG"],
        extensions: ["toMathML.js", "AMSsymbols.js","color.js"],
        TeX: {
            extensions: ["color.js"],
            Macros : {
                toda : ["\\langle #1\\rangle",1]
            }
        },
        "HTML-CSS": {
          scale: 100
        }
    });
    MathJax.Hub.Configured();
}
//function toMathML(jax,callback) {
//  var mml;
//  try {
//    mml = jax.root.toMathML("");
//  } catch(err) {
//    if (!err.restart) {throw err} // an actual error
//    return MathJax.Callback.After([toMathML,jax,callback],err.restart);
//  }
//  MathJax.Callback(callback)(mml);
//}
