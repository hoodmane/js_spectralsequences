/**
 * The Node class controls the display of SseqClass's.
 */
class Node {
    constructor(){
        this.fill = true;
        this.stroke = true;
    }

    copy(){
        return Object.assign(new Node(), this);
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
class SseqClass {
    /**
     * @param sseq The parent spectral sequence.
     *
     */
    constructor(sseq, degree){
        this.sseq = sseq;
        this.degree = degree;
        this.projection = sseq.projection(this);
        this.x = this.projection[0];
        this.y = this.projection[1];

        this.edges = [];
        this.structlines = [];
        this.outgoing_differentials = [];
        this.incoming_differentials = [];
        this.name = "";
        this.extra_info = "";
        this.page_list = [infinity];
        this.node_list = [sseq.default_node.copy()];
        this.visible = true;


        // internal fields only.
        this._last_page = 0;
        this._last_page_idx = 0;
    }

    getDegree(){
        return [this.x, this.y];
    }

    addStructline(sl){
        this.structlines.push(sl);
        this.edges.push(sl);
    }

    getStructlines(){
        return this.structlines;
    }

    getPage(){
        return this.page_list[this.page_list.length - 1];
    }

    setPage(page){
        this.page_list[this.page_list.length - 1] = page;
        return this;
    }

    setName(name){
        this.name = name;
        return this;
    }

    getPageIndex(page){
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
            page_idx = this.page_list.length - 1;
        }
        this._last_page = page;
        this._last_page_idx = page_idx;
        return page_idx;
    }

    getNode(page){
        const idx = this.getPageIndex(page);
        return this.node_list[idx];
    }

    setNode(node, page){
//        if(typeof(node) === "string"){
//            node = node_dict[node];
//        }
        if(node === undefined){
            node = {};
        }
        const idx = this.getPageIndex(page);
        this.node_list[idx] = Object.assign(this.sseq.default_node.copy(), node);
        return this;
    }


    appendPage(page){
        this.page_list.push(page);
        this.node_list.push(this.sseq.default_node.copy());
        return this;
    }

    replace(node){
        this.appendPage(infinity);
//        if(typeof(node) === "string"){
//            node = node_dict[node];
//        }
        this.setNode(node);
        return this;
    }

    addExtraInfo(str){
        this.extra_info += "<hr>" + str;
    }


    getXOffset(){
        let total_classes = this.sseq.num_classes_by_degree.get(this.projection);
        let idx = this.idx;
        return (idx - (total_classes - 1)/2)*this.sseq.offset_size;
    }

    getYOffset(){
        let total_classes = this.sseq.num_classes_by_degree.get(this.projection);
        let idx = this.idx;
        return -(idx - (total_classes - 1)/2)*this.sseq.offset_size;
    }

    toString(){
        return this.name;
    }

    addOutgoingDifferential(differential){
        if(this.getPage() < differential.page){
            //this.handleDoubledDifferential("supporting another" + differential.supportedMessage());
        }
        this.setPage(differential.page);
        this.outgoing_differentials.push(differential);
        this.edges.push(differential);
    }

    addIncomingDifferential(differential){
        if(this.getPage() < differential.page){
            //this.handleDoubledDifferential("receiving another" + differential.hitMessage());
        }
        this.setPage(differential.page);
        this.incoming_differentials.push(differential);
        this.edges.push(differential);
    }

    setStructlinePages(page){
        for(let i = 0; i < this.structlines.length; i++){
            let sl = this.structlines[i];
            if(sl.page > page){
                sl.page = page;
            }
        }
        return this;
    }

    drawOnPageQ(page){
        return this.page_list[this.page_list.length -1] >= page && this.visible;
    }

    inRangeQ(xmin,xmax,ymin,ymax){
        return xmin <= this.x && this.x <= xmax
            && ymin <= this.y && this.y <= ymax;
    }

}

exports.Node = Node;
exports.SseqClass = SseqClass;
