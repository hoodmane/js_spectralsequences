"use strict";

let Shapes = {};

Shapes.circle = {
    draw: function(context, x, y, size, path2d=true) {
        context.beginPath();
        context.arc(x, y, size, 0, 2*Math.PI);
        context.fill();
        context.stroke();

        let path = new Path2D();
        path.arc(x, y, size, 0, 2 * Math.PI);

        return path;
    }
}


Shapes.circlen = {
    draw: function(context, x, y, size, node) {
        context.beginPath();
        context.arc(x, y, size, 0, 2*Math.PI);
        context.fill();
        context.stroke();

        context.textAlign = "center";
        context.fillStyle = "black";
        let fontsize = 2*size | 0;
        context.font = `${fontsize}px Arial`;
        context.fillText(node.order, x, y + size/2);

        let path = new Path2D();
        path.arc(x, y, size, 0, 2 * Math.PI);

        return path;
    }
};

Shapes.square = {
    draw: function(context, x, y, size) {
        context.beginPath();
        context.rect(x-size, y-size, 2*size, 2*size);
        context.fill();
        context.stroke();

        let path = new Path2D();
        path.rect(x-size, y-size, 2*size, 2*size);

        return path;
    }
}

for(let k of Object.getOwnPropertyNames(Shapes)){
    Shapes[k].name = k;
    exports[k] = Shapes[k];
}
