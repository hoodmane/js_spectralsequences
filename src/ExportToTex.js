let IO = require("./IO.js");

let texHead = "\\documentclass{spectralsequence-example}\n\\makeatletter\n\\begin{document}";
let beginSseqpage = "\\begin{sseqpage}";
let texFoot = "\\end{sseqpage}\n\\end{document}";


function SpectralSequenceToTex(sseq, page, xmin, xmax, ymin, ymax){
    console.log(page);
    if(page){
        sseq._calculateDrawnElements(page, xmin, xmax, ymin, ymax);
    }
    let classes = sseq._getClassesToDisplay();
    let edges = sseq._getEdgesToDisplay();
    this.sseq = sseq;
    let classStrings = [];
    let structlineStrings = [];
    let outputString = [];
    for(let c of classes){
        classStrings.push(latexClassString(c));
    }

    for(let sl of edges){
        structlineStrings.push(latexStructlineString(sl));
    }

    outputString.push(texHead);
    outputString.push(beginSseqpage);
    outputString.push(classStrings.join("\n"));
    outputString.push(structlineStrings.join("\n"));
    outputString.push(texFoot);
    return outputString.join("\n");
}


function DownloadSpectralSequenceTex(filename, sseq, page, xmin, xmax, ymin, ymax){
    IO.download(filename, SpectralSequenceToTex(sseq,page,xmin,xmax,ymin,ymax));
}

function latexClassString(c){
    let options = [];
    options.push(`name=${"id"+c.unique_id}`);
    if(c.x_offset === 0){
        options.push(`offset={(0,0)}`);
    }
    //console.log(`\\class[${options.join(", ")}](${c.x},${c.y})`);
    return `\\class[${options.join(", ")}](${c.x},${c.y})`;
}

function latexStructlineString(sl){
    return `\\structline(${"id"+sl.source.unique_id})(${"id"+sl.target.unique_id})`;
}

exports.SpectralSequenceToTex = SpectralSequenceToTex;
exports.DownloadSpectralSequenceTex = DownloadSpectralSequenceTex;