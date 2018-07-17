"use strict";

class Edge {
    /**
     * Add edge to source and target.
     * @param {SseqClass} source
     * @param {SseqClass} target
     */
    constructor(source, target){
        this.source = source;
        this.target = target;
        this.page = infinity;
        this.page_min = 0;
        this.color = "#000";
    }

    setMinPage(min_page){
        this.page_min = min_page;
    }

    /**
     * Determine whether the edge is drawn on the given page. Overridden in subclasses.
     * @param page
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
    constructor(source, target){
        super(source, target);
        source._addStructline(this);
        target._addStructline(this);
    }

}
exports.Structline = Structline;

/**
 * Only difference between a vanilla edge and an Extension is that Extensions are only drawn on the Einfty page.
 */
class Extension extends Edge {
    _drawOnPageQ(pageRange){
        return pageRange[1] === infinity;
    }
}
exports.Extension = Extension;


/**
 * Differentials are a bit more complicated.
 */
class Differential extends Edge {
    constructor(source, target, page){
        super(source, target);
        this.page = page;
        this.color = "#00F";
        source._addOutgoingDifferential(this);
        target._addIncomingDifferential(this);
        this.source_name = this.source.last_page_name;
        this.target_name = this.target.last_page_name;
    }


    /**
     * @override
     * @param p
     */
    setMinPage(p){
        throw "Unsupported operation";
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
        this.setKernel(node,lastPageName);
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


    /**
     * Adds the name of this differntial to the extra_info for the source and target class (so that it gets displayed
     * in a tooltip). Maybe we should do this by default?
     * @returns {Differential} chainable
     */
    addInfoToSourceAndTarget(){
        this.source.addExtraInfo(this);
        this.target.addExtraInfo(this);
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
        this.source.setStructlinePages(this.page);
        this.target.setStructlinePages(this.page);
        return this;
    }

    toString(){
        return `\\(d_{${this.page}}(${this.source_name}) = ${this.target_name}\\)`;
    }
}
exports.Differential = Differential;