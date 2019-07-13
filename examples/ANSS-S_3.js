
// Name: ANSS $S_3$
// Description: The Adams Novikov spectral sequence for $p=3$.

let sseq = new Sseq();

sseq.initialxRange = [0,15];
sseq.initialyRange = [0,10];
sseq.xRange = [0, 110];
sseq.yRange = [0, 20];

let vars = {  "\\alpha_1" : [3,1], "\\beta_1" : [10,2]};

let var_spec_list = [["\\alpha_1",0,1],["\\beta_1",0,11]];

let module_gens = {
    "" : [0,0],
    "\\beta_2" : [26,2],
    "\\beta_{3/3}" : [34,2],
    "\\beta_{3/2}" : [38,2],
    "\\beta_{3}" : [42,2]
};

sseq.addClass(37,3).setName("x_{37}");


window.classes = sseq.addPolynomialClasses(vars, var_spec_list,module_gens)
    .addStructline([-1,1]).addStructline([1,0]);

new BasicDisplay("#main", sseq);
