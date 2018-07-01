class Edge {
    constructor(source, target){
        this.source = source;
        this.target = target;
        this.page = infinity;
        this.page_min = 0;
        this.color = "#000";
    }

    drawOnPageQ(page){
        return page <= this.page;
    }
}
exports.Edge = Edge;


class Structline extends Edge {}
exports.Structline = Structline;

class Extension extends Edge {
    drawOnPageQ(page){
        return page === infinity;
    }
}
exports.Extension = Extension;


class Differential extends Edge {
    constructor(source, target, page){
        super(source, target);
        this.page = page;
        this.color = "#00F";
        source.addOutgoingDifferential(this);
        target.addIncomingDifferential(this);
        this.source_name = this.source.toString();
        this.target_name = this.target.toString();
    }

    drawOnPageQ(page){
        return page === 0 || this.page === page;
    }

    setKernel(nodeStyle){
        this.source.replace(nodeStyle);
        return this;
    }

    setCokernel(nodeStyle){
        this.target.replace(nodeStyle);
        return this;
    }

    replaceSource(nodeStyle){
        this.setKernel(nodeStyle);
        return this;
    }

    replaceTarget(nodeStyle){
        this.setCokernel(nodeStyle);
        return this;
    }

    setSourceName(){
        this.source_name = name;
        return this;
    }

    setTargetName(){
        this.target_name = name;
        return this;
    }

//    hitMessage(){
//        return "hit on page %d by class %r" % (this.page, this.source);
//    }
//
//    supportedMessage(){
//        return "supported a differential on page %d hitting class %r" % (this.page, this.target);
//    }

    addInfoToSourceAndTarget(){
        this.source.addExtraInfo(this);
        this.target.addExtraInfo(this);
        return this;
    }

    setSourceStructlinePages(){
        this.source.setStructlinePages(this.page);
        return this;
    }

    setTargetStructlinePages(){
        this.target.setStructlinePages(this.page);
        return this;
    }

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