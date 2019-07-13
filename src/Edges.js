"use strict";

let Util = require("./Util.js");
let infinity = Util.infinity;

class Edge {
    /**
     * Add edge to source and target.
     * @param {SseqClass} source
     * @param {SseqClass} target
     */
    constructor(sseq, source, target){
        // Make sure source has lower y coordinate than target.
        if(source.y > target.y){
            let temp = source;
            source = target;
            target = temp;
        }
        this.sseq = sseq;
        this.source = source;
        this.target = target;
        this.source_name = this.source.last_page_name;
        this.target_name = this.target.last_page_name;
        this.page = infinity;
        this.page_min = 0;
        this.color = "#000";
        this.type = this.constructor.name;
        this.visible = true;
        this.args = [];
    }

    getMemento(){
        return Util.copyFields({}, this);
    }

    restoreFromMemento(memento){
        if(memento.delete){
            if(this.invalid){
                return;
            }
            this.sseq.deleteEdge(this);
            return;
        }
        if(this.invalid){
            this.sseq.reviveEdge(this);
        }
        Util.copyFields(this, memento);
        return this;
    }

    otherClass(c){
        if(this.source === c){
            return this.target;
        } else if(this.target === c) {
            return this.source;
        } else {
            // TODO: Error?
            console.log("Invalid class");
        }
    }


    setMinPage(min_page){
        this.page_min = min_page;
        return this;
    }

    setColor(color){
        if(!color){
            return this;
        }
        this.color = color;
        return this;
    }

    setBend(bend){
        if(!bend){
            return this;
        }
        this.bend = bend;
        return this;
    }


    isDummy(){
        return false;
    }

    // TODO: Should these methods even be here? I guess so....
    delete(){
        this.invalid = true;
        this.display_edge.invalid = true;
        this.source.edges = this.source.edges.filter(e => !e.invalid);
        this.target.edges = this.target.edges.filter(e => !e.invalid);
    }

    revive(){
        this.invalid = false;
        this.display_edge.invalid = false;
        this.source.edges.push(this);
        this.target.edges.push(this);
    }

    static getDummy(){
        if(Edge._dummy){
            return Edge._dummy;
        }
        let dummy = Object.create(Edge);
        Edge._dummy = dummy;

        dummy.isDummy = () => true;
        Util.setPrivateMethodsToInvalidOperation(dummy);
        dummy.setMinPage = Util.getDummyConstantFunction(dummy);
        dummy.constructor = Edge.constructor;
        dummy.otherClass = Util.getDummyConstantFunction(SseqClass.getDummy());
        //getMemento,restoreFromMemento,setColor,setBend,revive,leibniz
        dummy.leibniz = Util.getDummyConstantFunction(dummy);
        dummy.delete = () => true;
        dummy.setColor = Util.getDummyConstantFunction(dummy);

        Util.checkAllCommandsDefined(dummy);

        return dummy;
    }

    leibniz(multiplications){
        for(let variable of multiplications){
            let source = this.source.getProductIfPresent(variable);
            let target = this.target.getProductIfPresent(variable);
            this.sseq["add" + this.constructor.name](source, target, ...this.args).leibniz(multiplications);
        }
        return this;
    }

    /**
     * Determine whether the edge is drawn on the given page. Overridden in subclasses.
     * @param pageRange
     * @returns {boolean}
     * @package
     */
    _drawOnPageQ(pageRange){
        return pageRange[0] <= this.page && this.page_min <= pageRange[0];
    }
}
exports.Edge = Edge;


/**
 * The structline class is just a renamed version of Edge. So far no methods here...
 */
class Structline extends Edge {
    setProduct(variable){
        this.mult = variable;
        return this;
    }
}
exports.Structline = Structline;

/**
 * Only difference between a vanilla edge and an Extension is that Extensions are only drawn on the Einfty page.
 */
class Extension extends Edge {
    _drawOnPageQ(pageRange){
        return pageRange[0] === infinity;
    }

    setProduct(variable){
        this.mult = variable;
        return this;
    }
}
exports.Extension = Extension;


/**
 * Differentials are a bit more complicated.
 */
class Differential extends Edge {
    constructor(sseq, source, target, page){
        super(sseq, source, target);
        this.page = page;
        this.color = "#00F";
        this.args = [page]; // Just for Leibniz command...
    }

    leibniz(multiplications){
        for(let variable of multiplications){
            let source = this.source.getProductIfPresent(variable);
            let target = this.target.getProductIfPresent(variable);
            if(source.isDummy() || target.isDummy()){
                continue;
            }
            if(source.page_list[source.page_list.length - 1] < infinity
            || target.page_list[target.page_list.length - 1] < infinity){
                continue;
            }
            this.sseq["add" + this.constructor.name](source, target, ...this.args).leibniz(multiplications);
        }
        return this;
    }


    static getDummy(){
        if(Differential._dummy){
            return Differential._dummy;
        }
        let dummy = Object.create(Differential);
        Differential._dummy = dummy;

        let edgeDummy = Edge.getDummy();
        Object.assign(dummy, edgeDummy);

        let chainableNoOp = Util.getDummyConstantFunction(dummy);
        Util.setRemainingMethods(dummy, () => true, () => chainableNoOp);
        Util.setPrivateMethodsToInvalidOperation(dummy);
        dummy.toString = Util.getDummyConstantFunction("");
        return dummy;
    }

    delete(){
        let pop_pagelists = [];
        if(this.source.page_list.length !== 1
            && this.source.page_list.indexOf(this.page) === this.source.page_list.length - 2
            && this.source.page_list[this.source.page_list.length-1] === infinity
        ){
            pop_pagelists.push(() => this.source.page_list.pop());
        }
        // else if (this.source.page_list.indexOf(this.page) !== -1 && this.source.page_list.indexOf(this.page) !== this.source.page_list.length - 1) {
        //     console.log("Cannot remove differential, source has done stuff since.");
        //     return false;
        // }
        if(this.target.page_list.length !== 1
            && this.target.page_list.indexOf(this.page) === (this.target.page_list.length - 2)
            && this.target.page_list[this.target.page_list.length-1] === infinity
        ){
            pop_pagelists.push(() => this.target.page_list.pop());
        }
        // else if (this.target.page_list.indexOf(this.page) !== -1 && this.target.page_list.indexOf(this.page) !== this.target.page_list.length - 1) {
        //     console.log("Cannot remove differential, target has done stuff since.");
        //     return false;
        // }
        this.revive_source_page_list = this.source.page_list.slice();
        this.revive_target_page_list = this.target.page_list.slice();
        pop_pagelists.forEach(f => f());
        if (this.source.page_list.indexOf(this.page) !== -1){
            this.source.page_list[this.source.page_list.length - 1] = infinity;
        }
        if (this.target.page_list.indexOf(this.page) !== -1){
            this.target.page_list[this.target.page_list.length - 1] = infinity;
        }
        Edge.prototype.delete.call(this);
        return true;
    }

    revive(){
        this.source.page_list = this.revive_source_page_list.slice();
        this.target.page_list = this.revive_target_page_list.slice();
        Edge.prototype.revive.call(this);
    }

    /**
     * @override
     * @param min_page
     */
    setMinPage(min_page){
        throw "Unsupported operation";
    }


    /**
     * By default, source of differential disappears after the page the differential occurs on. Instead, from now on
     * display the source using `node`.
     * @param {Node} node Specifies any changes in the display of source that occur after this page.
     * @returns {Differential} Chainable
     */
    setKernel(node, lastPageName){
        this.source.replace(node, lastPageName);
        return this;
    }

    /**
     * Synonym for setKernel.
     * @param {Node} node
     * @returns {Differential} Chainable
     */
    replaceSource(node, lastPageName){
        this.setKernel(node, lastPageName);
        return this;
    }

    /**
     * By default, target of differential disappears after the page the differential occurs on. Instead, from now on
     * display the target using `node`.
     * @param {Node} node Specifies any changes in the display of target that occur after this page.
     * @returns {Differential} Chainable
     */
    setCokernel(node, lastPageName){
        this.target.replace(node, lastPageName);
        return this;
    }

    /**
     * Synonym for setCokernel.
     * @param {Node} node
     * @returns {Differential} Chainable
     */
    replaceTarget(node, lastPageName){
        this.setCokernel(node, lastPageName);
        return this;
    }


    /**
     * Sets the name of the target for use in determining the name of the differential. By default the target_name
     * is the name of the target class, but particularly if there is a cokernel it should potentially be something else
     * for instance, if the differential is multiplication by p, the target class might be named `x` but the target
     * should be `px`.
     * @param name
     * @returns {Differential} chainable
     */
    setTargetName(name){
        this.target_name = name;
        return this;
    }

    /**
     * I don't know if this is useful, just included for symmetry with setTargetName.
     * @param name
     * @returns {Differential} chainable
     */
    setSourceName(name){
        this.source_name = name;
        return this;
    }


//    hitMessage(){
//        return "hit on page %d by class %r" % (this.page, this.source);
//    }
//
//    supportedMessage(){
//        return "supported a differential on page %d hitting class %r" % (this.page, this.target);
//    }


    addInfoToSource(){
        this.source.addExtraInfo(this.toString(true,false));
        return this;
    }

    addInfoToTarget(){
        this.target.addExtraInfo(this.toString(false,true));
        return this;
    }

    /**
     * Adds the name of this differntial to the extra_info for the source and target class (so that it gets displayed
     * in a tooltip). Maybe we should do this by default?
     * @returns {Differential} chainable
     */
    addInfoToSourceAndTarget(){
        this.source.addExtraInfo(this.toString(true,false));
        this.target.addExtraInfo(this.toString(false,true));
        return this;
    }

    /**
     * By default, if we use "replace" on the source class (or replaceSource, setKernel), any structlines will continue to be drawn.
     * If that's inappropriate, call this to kill the structlines connecting to the source after this page.
     * @returns {Differential} chainable
     */
    setSourceStructlinePages(){
        this.source.setStructlinePages(this.page);
        return this;
    }


    /**
     * By default, if we use "replace" on the target class (or replaceTarget, setCokernel), any structlines will continue to be drawn.
     * If that's inappropriate, call this to kill the structlines connecting to the target after this page.
     * @returns {Differential} chainable
     */
    setTargetStructlinePages(){
        this.target.setStructlinePages(this.page);
        return this;
    }

    /**
     * Does both setSourceStructlinePages and setTargetStructlinePages
     * @returns {Differential} chainable
     */
    setStructlinePages(){
        let res1 = this.source.setStructlinePages(this.page);
        let res2 = this.target.setStructlinePages(this.page);
        return this;
    }

    toString(highlight_source, highlight_target){
        let source = this.source_name;
        if(!source){
            source = this.source.name;
        }
        let target = this.target_name;
        if(!target){
            target = this.target.name;
        }
        if(highlight_source){
            source = `{\\color{blue}{${source}}}`;
        }
        if(highlight_target){
            target = `{\\color{blue}{${target}}}`
        }
        return `\\(d_{${this.page}}(${source}) = ${target}\\)`;
    }

    /**
     * Draw the differential on "page 0" or on the page corresponding to the differential.
     * @param page
     * @returns {boolean}
     * @package
     * @override
     */
    _drawOnPageQ(pageRange){
        return pageRange[0] === 0 || (pageRange[0] <= this.page && this.page <= pageRange[1]);
    }
}
exports.Differential = Differential;
