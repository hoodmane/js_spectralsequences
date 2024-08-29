import * as IO from "./SaveLoad";

export function SpectralSequenceToTex(sseq, page, xmin, xmax, ymin, ymax){
    let [classes, edges] = sseq.getDrawnElements(page, xmin, xmax, ymin, ymax);
    let classStrings = [];
    let edgeStrings = [];
    let outputString = [];

    let colormap = new Map();
    colormap.context = document.createElement("canvas").getContext("2d");

    for(let c of classes){
        classStrings.push(latexClassString(c, page, colormap));
    }

    for(let edge of edges){
        edgeStrings.push(latexEdgeString(edge, page, colormap));
    }

    outputString.push(getBeginString(page, xmin, xmax, ymin, ymax));
    outputString.push(Array.from(colormap, x => `\\definecolor{${x[1][0]}}{RGB}{${x[1][1][0]},${x[1][1][1]},${x[1][1][2]}} % ${x[0]}`).join("\n"));
    outputString.push(classStrings.join("\n"));
    outputString.push(edgeStrings.join("\n"));
    outputString.push("\\end{sseqpage}");
    return outputString.join("\n");
}


export function DownloadSpectralSequenceTex(filename, sseq, page, xmin, xmax, ymin, ymax){
    IO.download(filename, SpectralSequenceToTex(sseq,page,xmin,xmax,ymin,ymax));
}

function getBeginString(page, xmin, xmax, ymin, ymax) {
    return `\\begin{sseqpage}[degree = {-1}{#1}, x range = {${xmin}}{${xmax}}, y range = {${ymin}}{${ymax}}]`;
}
function latexClassString(c, page, colormap){
    let options = [];
    options.push(`name=${"id"+c.unique_id}`);

    let node = c.getNode(page);
    if (node.fill)
        options.push("fill");

    if (node.color)
        options.push(getTeXColor(node.color, colormap))

    return `\\class[${options.join(", ")}](${c.x},${c.y})`;
}

function latexEdgeString(edge, page, colormap){
    let options = [];

    if (edge.color)
        options.push(getTeXColor(edge.color, colormap));

    switch (edge.type) {
        case "Structline":
            return `\\structline[${options.join(", ")}](${"id"+edge.source.unique_id})(${"id"+edge.target.unique_id})`;
            break;
        case "Differential":
            return `\\d[${options.join(", ")}]${page}(${"id"+edge.source.unique_id}, ${edge.target.idx + 1})`
            break;
        default:
            break;
    }
}

function getTeXColor(color, colormap) {
    if (!colormap.has(color)) {
        colormap.context.fillStyle = "white";
        colormap.context.fillRect(0, 0, 1, 1);
        colormap.context.fillStyle = color;
        colormap.context.fillRect(0, 0, 1, 1);

        colormap.set(color, [randomString(10), colormap.context.getImageData(0, 0, 1, 1).data]);
    }

    return colormap.get(color)[0];
}

function randomChar() {
    return String.fromCharCode(Math.floor(Math.random() * 26) + 97);
}

function randomString(len) {
    let result = "";
    for (let i = 0; i < len; i++)
        result += randomChar();

    return result;
}
