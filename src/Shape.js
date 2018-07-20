"use strict";

let Shapes = {};

Shapes.circle = {
    draw : function(context) {
        context.beginPath();
        context.arc(0, 0, this.size(), 0, 2 * Math.PI, false);
        context.closePath();
        context.fillStrokeShape(this);
    },
    hitRegion : function(context) {
        context.beginPath();
        context.arc(0, 0, this.size(), 0, 2 * Math.PI, false);
        context.closePath();
        let save_fill = this.fillEnabled();
        this.fillEnabled(true);
        context.fillStrokeShape(this);
        this.fill(save_fill);
    }
}


Shapes.square = {
    draw : function(context) {
        let size = this.size();
        context.beginPath();
        context.rect(-size, -size, 2*size, 2*size);
        context.closePath();
        context.fillStrokeShape(this);
    },
    hitRegion : function(context) {
        let size = this.size();
        context.beginPath();
        context.rect(-size, -size, 2*size, 2*size);
        context.closePath();
        let save_fill = this.fillEnabled();
        this.fillEnabled(true);
        context.fillStrokeShape(this);
        this.fillEnabled(save_fill);
    }
}

for(let k of Object.getOwnPropertyNames(Shapes)){
    Shapes[k].name = k;
    exports[k] = Shapes[k];
}