"use strict";


let Util = require("./Util.js");
let infinity = Util.infinity;


/**
 * The Node class controls the display of SseqClass's.
 * The fields are:
 *    color -- the color to draw with. Default black.
 *    fill -- either a boolean or a color. "true" means fill it, and use the color field to decide what color.
 *            Specifying a color overrides the value of the color key.
 *    stroke -- similar to fill except for the stroke.
 *    shape -- an object with a key "draw" with value a drawing function. Optionally a second key "hitRegion" which
 *             determines what region the shape lies over.
 *    size  -- this key should determine the scaling of the node. It is the responsibility of the draw function to
 *             consider the value of this key when drawing the shape.
 *
 *  TODO: currently merge and copy ignore dummies. Is this the right behavior? Maybe they should throw errors?
 */
class Node {
    constructor(obj){
        this.opacity = 1;
        this.color = "black";
        if(obj){
            Object.assign(this, obj);
        }
    }

    copy(){
        if(this.isDummy()){
            return new Node();
        }
        return Object.assign(new Node(), this);
    }

    getShape(){
        return this.shape;
    }

    setShape(shape){
        this.shape = shape;
        return this;
    }

    getSize(){
        return this.size;
    }

    setSize(size){
        this.size = size;
        return this;
    }

    getColor(){
        return this.color;
    }

    setColor(color){
        this.color = color;
        return this;
    }

    setFill(color){
        this.fill = color;
        return this;
    }

    setStroke(color){
        this.stroke = color;
        return this;
    }

    setOpacity(op){
        this.opacity = op;
        return this;
    }

    isDummy(){
        return false;
    }

    setPosition(x, y, scale) {
        this.x = x;
        this.y = y;
        this.scale = scale;
    }

    draw(context) {
        context.save();

        if (this.opacity) {
            context.opacity = this.opacity;
        }
        if (this.color) {
            context.fillStyle = this.color;
            context.strokeStyle = this.color;
        }
        if (this.stroke && this.stroke !== true) {
            context.strokeStyle = this.stroke;
        }
        if (this.fill && this.fill !== true) {
            context.fillStyle = this.fill;
        }
        if (this.highlight) {
            if (this.hcolor) {
                context.fillStyle = this.hcolor;
                context.strokeStyle = this.hcolor;
            }
            if (this.hstroke) {
                context.strokeStyle = this.hstroke;
            }
            if (this.hfill) {
                context.fillStyle = this.hfill;
            }
        }
        context.lineWidth = this.scale * 2;

        this.path = this.shape.draw(context, this.x, this.y, this.size * this.scale, this);

        context.restore();
    }

    static getDummy(){
        if(Node._dummy){
            return Node._dummy;
        }
        let dummy = new Node();
        let chainableNoOp = Util.getDummyConstantFunction(dummy);
        dummy.isDummy = function(){ return true; };
        dummy.setShape = chainableNoOp;
        dummy.setColor = chainableNoOp;
    }

    /**
     * @param {...Node} nodes -- a list of nodes to merge. Merges them into a new object.
     * @returns {Node} -- a new node formed by merging the list of nodes passed as arguments. Later arguments have
     *    priority over earlier ones.
     */
    static merge(...nodes){
        let root = new Node();
        for ( var i = 0; i < nodes.length; i++ ) {
            if(nodes[i].isDummy && nodes[i].isDummy()){
                continue;
            }
            for (var key in nodes[i]) {
                root[key] = nodes[i][key];
            }
        }
        return root;
    }
}






/**
 *  A SseqClass represents a particular subgroup of some bidegree in the E2 page of the spectral sequence, and should
 *  contain the information about the fate of that subgroup -- what differentials does it support, what subquotients
 *  live to each page, what differentials, structure lines, and extensions occur.
 *
 *  A class contains the following fields:
 *    degree  -- an object representing the multidegree the class lives in
 *    name    -- the name of this class (a string)
 *    extra_info -- extra information about this class (a string)
 *    edges, structlines, etc -- lists of edges incident to this class
 *    page_list -- a list of pages on which the class supports or receives a differential
 *    node_list -- a list of nodes that control the display of the class in each range
 *
 *  The page_list and node_list should be the same length. Here's an example to explain page_list and node_list:
 *  suppose the class represents a group that
 *  starts out being Z on the E2 page, say on page 5 it supports a differential with kernel pZ and on page 9 it's hit by
 *  a differential with cokernel pZ/p^2Z. Then:
 *     `page_list = [5, 9, infinity]` and
 *     `node_list = [ Znode, pZnode, Zmpnode]`,
 *  where maybe Znode is a filled black square, pZnode is an unfilled black square (just the border) and Zmpnode is a
 *  filled black circle. This means that on page range [0,5] the class is displayed using Znode, on page range [6,9]
 *  it's displayed using pZnode, and on [10, infinity] it's displayed using Zmpnode.
 *
 *  If instead the d9 were surjective, then the class shouldn't be displayed at all after page 9. This would be
 *  represented as `page_list = [5, 9]` and `node_list = [ Znode, pZnode ]`.
 */
let unique_id = 0;
class SseqClass {
    /**
     * @param sseq The parent spectral sequence.
     * @package
     */
    constructor(sseq, degree){
        this.sseq = sseq;
        this.degree = degree;
        this.projection = sseq.projection(this); // Needed by display
        this.x = this.projection[0];
        this.y = this.projection[1];
        this.x_offset = false;
        this.y_offset = false;
        this.idx = 0; // Set by addClass.
        this.unique_id = unique_id ++;

        this.edges = [];
        this.structlines = [];
        this.name = "";
        this.last_page_name = "";
        this.extra_info = "";
        this.differential_strings = [];
        this.page_list = [infinity];
        this.node_list = [sseq.default_node.copy()];
        this.visible = true;


        // internal fields only.
        this._last_page = 0;
        this._last_page_idx = 0;
    }

    getMemento(){
        let res = Util.copyFields({}, this);
        res.node_list = res.node_list.map( n => new Node(n));
        return res;
    }

    restoreFromMemento(memento){
        if(memento.delete){
            if(this.invalid){
                return;
            }
            this.sseq.deleteClass(this);
            return;
        }
        if(this.invalid){
            this.sseq.reviveClass(this);
        }
        let res = Util.copyFields(this, memento);
        this.node_list = this.node_list.map( n => n.copy());
        return this;
    }

    static getDummy(){
        if(SseqClass._dummy){
            return SseqClass._dummy;
        }
        let dummy = Object.create(SseqClass);
        SseqClass._dummy = dummy;

        let chainableNoOp = Util.getDummyConstantFunction(dummy);

        dummy.isDummy = Util.getDummyConstantFunction(true);
        dummy.getName = Util.getDummyConstantFunction("dummy");
        dummy.getColor = Util.getDummyConstantFunction("black");
        dummy.getShape = Util.getDummyConstantFunction(null);
        dummy.getTooltip = Util.getDummyConstantFunction("");
        dummy.getPage = Util.getDummyConstantFunction(-1);
        dummy.getNode = Util.getDummyConstantFunction(Node.getDummy());
        dummy.toString = dummy.getName;
        dummy.constructor = SseqClass.constructor;

        dummy.replace = chainableNoOp;
        dummy.addExtraInfo = chainableNoOp;
        dummy.isAlive = Util.getDummyConstantFunction(false);

        for(let field of ["getEdges", "getDifferentials", "getIncomingDifferentials", "getOutgoingDifferentials",
            "getStructlines", "getIncomingStructlines", "getOutgoingStructlines", "getProducts", "getDivisors",
            "getExtensions" ]){
            dummy[field] = Util.getDummyConstantFunction([])
        }

        dummy.getProductIfPresent = Util.getDummyConstantFunction(dummy);
        dummy.getDivisorIfPresent = Util.getDummyConstantFunction(dummy);

        dummy.getStringifyingMapKey = Util.getDummyInvalidOperation(dummy, "getStringifyingMapKey");
        Util.setPrivateMethodsToInvalidOperation(dummy);
        Util.setDummyMethods(dummy, p => p.startsWith("set"), () => chainableNoOp );

        Util.checkAllCommandsDefined(dummy, SseqClass);
        return dummy;
    }

    isDummy(){
        return false;
    }

    /* Public methods: */

    getName(){
        return this.name;
    }

    setName(name){
        this.name = name;
        this.last_page_name = name;
        return this;
    }

    getNameCoord(){
        let tooltip = "";
        if (this.name !== "") {
            tooltip = `\\(\\large ${this.name}\\)&nbsp;&mdash;&nbsp;`;
        }
        tooltip += `(${this.x}, ${this.y})`;
        return tooltip;
    }

    getNameCoordHTML(){
        return Interface.renderLatex(this.getNameCoord());
    }

    /**
     * @returns {int} The page this class dies on (or infinity if it lives forever).
     */
    getPage(){
        return this.page_list[this.page_list.length - 1];
    }

    setPage(page){
        this.page_list[this.page_list.length - 1] = page;
        return this;
    }

    isAlive(page){
        if(!page){
            page = infinity - 1;
        }
        return this.getPage() > page;
    }



    /**
     * Get the node that controls the display of the class on the given page.
     * @param page
     * @returns {Node} The node that controls the display of this class on page `page`.
     */
    getNode(page){
        const idx = this._getPageIndex(page);
        return this.node_list[idx];
    }

    /**
     * Sets the node that controls the display on the given page.
     * Properties that are missing from the given node are left unchanged.
     * @param {Node} node
     * @param {int} page
     * @returns {SseqClass} Chainable
     */
    setNode(node, page){
        if(node === undefined){
            node = {};
        }
        let pre = this.getMemento();
        const idx = this._getPageIndex(page);
        this.node_list[idx] = Node.merge(this.node_list[idx], node);
        let post = this.getMemento();
        this.sseq.addMutation(this, pre, post);
        return this;
    }

    getColor(page){
        return this.getNode(page).getColor();
    }

    setColor(color, page){
        let pre = this.getMemento();
        this.getNode(page).setColor(color);
        let post = this.getMemento();
        this.sseq.addMutation(this, pre, post);
        return this;
    }

    getShape(page){
        return this.getNode(page).getShape();
    }

    setShape(shape, page){
        let pre = this.getMemento();
        this.getNode(page).setShape(shape);
        let post = this.getMemento();
        this.sseq.addMutation(this, pre, post);
        return this;
    }

    /**
     * Set the page of every structline incident to this class. Structlines are not displayed on pages later than their
     * page.
     * @param page
     * @returns {SseqClass}
     */
    setStructlinePages(page){
        let structlines = this.getStructlines();
        for(let i = 0; i < structlines.length; i++){
            let sl = structlines[i];
            if(sl.page > page){
                let pre = sl.getMemento();
                sl.page = page;
                let post = sl.getMemento();
                this.sseq.addMutation(sl, pre, post);
            }
        }
        return this;
    }


    /**
     * Replace a "dead" class.
     * @param node Control the way the display of the "replaced" class changes. If the node is undefined, no change
     *   in appearance will occur.
     * @returns {SseqClass}
     */
    replace(node, lastPageName){
        let pre = this.getMemento();
        if(lastPageName){
            if(typeof lastPageName === "string"){
                this.last_page_name = lastPageName;
            } else {
                this.last_page_name = lastPageName(this.name);
            }

        }
        this._appendPage(infinity);
        this.setNode(node);
        let post = this.getMemento();
        this.sseq.addMutation(this, pre, post);
        return this;
    }

    /**
     * Adds a string to extra_info (in practice, this controls the tooltip for the class).
     * @param str
     * @returns {SseqClass} Chainable
     */
    addExtraInfo(str){
        let pre = this.getMemento();
        this.extra_info += "\n" + str;
        let post = this.getMemento();
        this.sseq.addMutation(this, pre, post);
        return this;
    }

    setPermanentCycleInfo(str){
        let pre = this.getMemento();
        this.permanent_cycle_info = str;
        this.addExtraInfo(this.permanent_cycle_info);
        let post = this.getMemento();
        this.sseq.addMutation(this, pre, post);
        return this;
    }

    getEdges(){
        return this.edges;
    }

    getDifferentials(){
        return this.edges.filter(e => e.type === "Differential");
    }

    getOutgoingDifferentials(){
        return this.edges.filter(e => e.type === "Differential" && this === e.source);
    }

    getIncomingDifferentials(){
        return this.edges.filter(e => e.type === "Differential" && this === e.target);
    }


    getStructlines(){
        return this.edges.filter(e => e.type === "Structline");
    }

    getOutgoingStructlines(){
        return this.edges.filter(e => e.type === "Structline" && this === e.source);
    }

    getIncomingStructlines(){
        return this.edges.filter(e => e.type === "Structline" && this === e.target);
    }

    getExtensions(){
        return this.edges.filter(e => e.type === "Extension");
    }

    getProducts(variable){
        let multiplications  = this.edges.filter(sl => sl.type === "Structline" && sl.otherClass(this).y > this.y);
        if(variable){
            multiplications = multiplications.filter(sl => sl.mult === variable);
        }
        return multiplications;
    }

    getDivisors(variable){
        let divisors  = this.edges.filter(sl => sl.type === "Structline" && sl.otherClass(this).y < this.y);
        if(variable){
            divisors = divisors.filter(sl => sl.mult === variable);
        }
        return divisors;
    }

    getProductIfPresent(variable){
        let products = this.getProducts(variable);
        if(products.length === 1){
            return products[0].otherClass(this);
        } else {
            return SseqClass.getDummy();
        }
    }

    getDivisorIfPresent(variable){
        let products = this.getDivisors(variable);
        if(products.length === 1){
            return products[0].otherClass(this);
        } else {
            return SseqClass.getDummy();
        }
    }

    toString(){
        return this.name;
    }

    getStringifyingMapKey(){
        return this.x + "," + this.y + "," + this.idx;
    }

    /* Package / private methods: */

    /**
     * This gets the index of a specified page in the page list. What this means is that if the page list is of the
     * form [5, 9, infinity], this divides the pages into three intervals, [0,5], [6,9], and [10, infinity].
     * If page is in the range from 0 to 5, the pageIndex is zero, if it is in the range 6 to 9, the index is 1,
     * and in the range 10 to infinity, it is 2.
     *
     * If the page_list does not end in infinity and page is larger than the largest entry in page_list then this throws
     * an error.
     * @param {int} page
     * @returns {int} the index
     * @private
     */
    _getPageIndex(page){
        if( page === undefined ) {
            return this.page_list.length - 1;
        } else if( page === this._last_page ) {
            return this._last_page_idx;
        }
        let page_idx;
        for(let i = 0; i < this.page_list.length; i++){
            if(this.page_list[i] >= page){
                page_idx = i;
                break;
            }
        }
        if(page_idx === undefined){
            console.log(new Error("Page too large. This probably shouldn't happen."));
        }
        this._last_page = page;
        this._last_page_idx = page_idx;
        return page_idx;
    }

    /* Used by Sseq: */

    /**
     * Appends a page to the list of pages and sets the corresponding node to be the previous node.
     * @param {int} page The page to append. Really should always be infinity...
     * @returns {SseqClass} Chainable
     * @private
     */
    _appendPage(page){
        this.page_list.push(page);
        this.node_list.push(this.node_list[this.node_list.length - 1].copy());
        return this;
    }


    /**
     * Add a structline to this class. Called by sseq.addStructline.
     * @param sl The
     * @package
     */
    _addStructline(sl){
        this.edges.push(sl);
    }

    /**
     * Adds an outgoing differential. Called by the sseq.addDifferential.
     * @param differential
     * @package
     */
    _addOutgoingDifferential(differential, set_page){
        if(this.getPage() < differential.page){
            //this.handleDoubledDifferential("supporting another" + differential.supportedMessage());
        }
        if(set_page){
            this.setPage(differential.page);
        }
        this.edges.push(differential);
        this._updateDifferentialStrings();
    }

    /**
     * Adds an incoming differential. Called by the sseq.addDifferential.
     * @param differential
     * @package
     */
    _addIncomingDifferential(differential, set_page){
        if(this.getPage() < differential.page){
            //this.handleDoubledDifferential("receiving another" + differential.hitMessage());
        }
        if(set_page){
            this.setPage(differential.page);
        }
        this.edges.push(differential);
        this._updateDifferentialStrings();
    }

    _updateDifferentialStrings(){
        let differentials = this.getDifferentials().sort((a,b) => a.page > b.page);
        this.differential_strings = differentials.map( d => d.toString(d.source === this, d.target === this));
    }


    /**
     * Determines whether this class is drawn on the given page.
     * @param page
     * @returns {boolean}
     * @package
     */
    _drawOnPageQ(page){
        return this.page_list[this.page_list.length -1] >= page && this.visible;
    }

    /**
     * Determines wither the class is in the given range.
     * @param xmin
     * @param xmax
     * @param ymin
     * @param ymax
     * @returns {boolean}
     * @package
     */
    _inRangeQ(xmin, xmax, ymin, ymax){
        return xmin <= this.x && this.x <= xmax
            && ymin <= this.y && this.y <= ymax;
    }

}

exports.Node = Node;
exports.SseqClass = SseqClass;
