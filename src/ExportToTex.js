let IO = require("./SaveLoad.js");

function SpectralSequenceToTex(sseq, page, xmin, xmax, ymin, ymax){
    let [classes, edges] = sseq.getDrawnElements(page, xmin, xmax, ymin, ymax);
    let classStrings = [];
    let edgeStrings = [];
    let outputString = [];
    for(let c of classes){
        classStrings.push(latexClassString(c, page));
    }

    for(let edge of edges){
        edgeStrings.push(latexEdgeString(edge, page));
    }

    outputString.push(getBeginString(page, xmin, xmax, ymin, ymax));
    outputString.push(classStrings.join("\n"));
    outputString.push(edgeStrings.join("\n"));
    outputString.push("\\end{sseqpage}");
    return outputString.join("\n");
}


function DownloadSpectralSequenceTex(filename, sseq, page, xmin, xmax, ymin, ymax){
    IO.download(filename, SpectralSequenceToTex(sseq,page,xmin,xmax,ymin,ymax));
}

function getBeginString(page, xmin, xmax, ymin, ymax) {
    return `\\begin{sseqpage}[degree = {-1}{#1}, x range = {${xmin}}{${xmax}}, y range = {${ymin}}{${ymax}}]`;
}
function latexClassString(c, page){
    let options = [];
    options.push(`name=${"id"+c.unique_id}`);

    let node = c.getNode(page);
    if (node.fill)
        options.push("fill");

    let color = getTeXColor(node.color);
    if (color)
        options.push(color)

    return `\\class[${options.join(", ")}](${c.x},${c.y})`;
}

function latexEdgeString(edge, page){
    let options = [];

    let color = getTeXColor(edge.color);
    if (color)
        options.push(color);

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

function getTeXColor(color) {
    if (!color.startsWith("#"))
        return color;
}

exports.SpectralSequenceToTex = SpectralSequenceToTex;
exports.DownloadSpectralSequenceTex = DownloadSpectralSequenceTex;
