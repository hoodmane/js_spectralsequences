// Name: HFPSS $EO(3,2)$
// Description: The homotopy fixed point spectral sequence for $E_4^{hC_3 \rtimes C_{16}}$ for $p=3$.

let sseq = new Sseq();

sseq.xRange = [-54, 1000];
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

Zq = new Node();
Zq.shape = Shapes.square;
Zq.scale = 1.3;

qZq = Zq.copy();
qZq.fill = "white";
qZq.stroke = "black";

sseq.default_node = Zq;

Zmq = new Node();
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

classes.addStructline("h_1");
classes.addStructline({"b" : 1, "v" : 6});//, { callback: sl => sl.setColor('gray',0) } );


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
    if(d.source.getIncomingDifferentials().length === 0){
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
for(let v of range(-36,121,6)){
    sseq.addExtension(classes.get([1, a2, b, 4 + v + 6*b + 3*a2]),classes.get([0, a2, 3 + b, 18 + v + 6*b + 3*a2]));
}}}

new BasicDisplay("#main", sseq);
window.saveSseq = function saveSseq(){
    min_x = sseq.xRange[0];
    max_x = sseq.xRange[1];
    max_y = sseq.yRange[1];
    let result = {};
    result.max_x = max_x;
    result.max_y = max_y;
    result.classes = [];
    result.differentials = [];
    result.structlines = [];
    let classes = new Set(sseq.getClasses().filter(c =>  min_x <= c.x && c.x <= max_x && c.y <= max_y));
    let differentials = sseq.getDifferentials().filter(d => d.source.x >= min_x && d.source.x <= max_x + 1 && d.source.y <= max_y);
    let structlines = sseq.getStructlines().filter(d => d.source.x >= min_x && d.target.x <= max_x && d.target.y <= max_y);
    for(let d of differentials){
        classes.add(d.target);
        if(d.source.x === max_x + 1){
            classes.add(d.source);
        }
        if(d.source.x === min_x){
            classes.add(d.target);
        }
    }
    classes = Array.from(classes);

    for(let c of classes) {
        let o = {};
        o.x = c.x;
        o.y = c.y;        
        o.name = c.name;
        o.color = c.node_list[0].fill;
        o.page_list = c.page_list;
        o.node_list_length = c.node_list.length;
        c.json_idx = result.classes.length;
        result.classes.push(o);
    }
    for(let d of differentials){
        let o = {};
        o.source = d.source.json_idx;
        o.target = d.target.json_idx;
        o.page = d.page;
        result.differentials.push(o);
    }

    for(let sl of structlines){
        let o = {};
        o.source = sl.source.json_idx;
        o.target = sl.target.json_idx;
        result.structlines.push(o);
    }

    return result;
};