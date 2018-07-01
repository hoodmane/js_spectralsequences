exports.circle = {
    draw : function(context) {
        context.beginPath();
        context.arc(0, 0, this.size(), 0, 2 * Math.PI, false);
        context.closePath();
        context.fillStrokeShape(this);
    }
}


exports.square = {
    draw : function(context) {
        let size = this.size();
        context.beginPath();
        context.rect(-size, -size, 2*size, 2*size);
        context.closePath();
        context.fillStrokeShape(this);
    }
}