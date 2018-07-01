let sseq = new Sseq();

sseq.xRange = [0, 1000];
sseq.yRange = [0, 30];
sseq.max_differential_length = 33;

sseq.initialxRange = [0, 54];
sseq.initialyRange = [0, 30];

let bmax = 150;
let vmin = -100;
let vmax = 240;



function dot_mod_16(v){
    // sum(p*q for p,q in zip(v, (0,1,12,15))) % 16;
    let out = 0;
    let dot_vect = [0,1,12,15];
    for(let i = 0; i < 4; i++){
        out += v[i] * dot_vect[i];
    }
    return mod(out,16);
}

Zq = new SseqNode();
Zq.shape = Shapes.square;
Zq.size = 8;
Zq.fill = 'black';

qZq = Zq.copy();
qZq.fill = "white";
qZq.stroke = 'black';

sseq.default_node = Zq;

Zmq = new SseqNode();
Zmq.shape = Shapes.circle;

//sseq.setDefaultStyle('Zq');

classes = sseq.addPolynomialClasses(
    {  "h_1" : [3,1],  "a_2" : [9,1], "b" : [-26,2],  "v" : [6,0] },
      [["h_1", 0, 1], ["a_2", 0, 1], ["b", 0, bmax], ["v", vmin, vmax]]);

for(let kv of classes){
    let k = kv[0];
    let c = kv[1];
    c.getNode(0).fill = ['black', 'gray', 'blue', 'cyan', 'green', 'red', 'pink', 'orange'][ dot_mod_16(k)/2 ];
    c.key = k;
    if(mod(dot_mod_16(k),2) !== 0){
        c.visible = false;
    }
}

classes.addStructline(1,0,0,0);
classes.addStructline(0,0,1,6);//, { callback: sl => sl.setColor('gray',0) } );


// d5(v) = h1 b^2 v^{9}
classes.addDifferential(5, [1,0,2,8], k => mod(k[3], 3) !== 0 && k[0] === 0, d => d.addInfoToSourceAndTarget());


// d9(h1 v^2) = d1 b^5 v^{24}
function d9_callback(d, k){
    //d.setTargetName(monomialString(["d1","h1","a2","b","v"],(1,)+(k+(-1,0,5,22))));
    d.addInfoToSourceAndTarget();
    if(dot_mod_16(d.target.key) === 0){
        d.replaceTarget(Zmq);
    }
}

classes.addDifferential(9, [-1,0,5,22], k => {return mod(k[3], 3) === 2 && k[0] === 1}, d9_callback);



function d17_33_callback(d){
    d.addInfoToSourceAndTarget();
    if(d.source.incoming_differentials.length === 0){
        if(mod(dot_mod_16(d.target.key),4) === 0){
            d.replaceSource(qZq);
        }
    }
}

// d17(v^3) = a2 b^8 v^36
classes.addDifferential(17, [0,1,8,33], 
    k => {
        const vpow = mod(k[3], 9);
        return k[0] === 0 && k[1] === 0 &&  ( vpow === 3 || vpow === 6 ) && dot_mod_16(k) === 0; 
    } ,
    d17_33_callback);
    
// d33(a2 b v^6) = b^18 v^81
classes.addDifferential(33, [0,-1,17,81-6], k => k[0] === 0 && k[1] === 1 && mod(k[3], 9) === 6 && dot_mod_16(k) === 0, d17_33_callback);

for(let a2 of [0,1]){
for(let b of [0,1]){
for(let v of d3.range(-36,121,6)){
    sseq.addExtension(classes.get([1, a2, b, 4 + v + 6*b + 3*a2]),classes.get([0, a2, 3 + b, 18 + v + 6*b + 3*a2]));
}}}



let disp = new Display(sseq);
window.disp = disp;
//display.draw();








