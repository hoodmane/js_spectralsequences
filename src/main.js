// This MathJax file comes from the MathJax-single-file git archive folder dist/TeXSVGTeX
// It isn't designed to work with node / browserify -- it just installs itself as a global variable.
// because of this, require just "returns" an empty object, so there's no use in saving the output.
//require("./mathjax.min.js");

import * as Util from "./Util";
import * as IO from "./SaveLoad";
import * as Interface from "./Interface";
import * as Shapes from "./Shape";
import {Display} from "./Display";
import {BasicDisplay} from "./BasicDisplay";
import {SidebarDisplay} from "./SidebarDisplay";
import {EditorDisplay} from "./EditorDisplay";
import { Tooltip } from "./Tooltip.js";
import * as Panel from "./Panel";
import * as ExportToTex from "./ExportToTex";
import {EventEmitter} from "events";
import {Sseq,SseqClass, Edge, Differential, Structline,Extension, Node, range, monomialString, product, vectorSum, vectorScale, vectorLinearCombination, dictionaryVectorScale, dictionaryVectorSum, dictionaryVectorLinearCombination } from "./Sseq";
import * as tools from "./ass_tools"
import * as d3 from "d3-selection";
import * as Mousetrap from "mousetrap";
import StringifyingMap from "./StringifyingMap"
import * as C2S from "canvas2svg";

window.infinity = 10000;

window.mod = function(n,d){
    return (n % d + d)%d;
};

const sseqDatabase = IO.sseqDatabase;

Object.assign(window, {
    Util, IO, Interface, sseqDatabase, Shapes, Display, BasicDisplay, SidebarDisplay, EditorDisplay, Tooltip, Panel, C2S, ExportToTex, EventEmitter,
    Sseq, SseqClass, Node, Edge, Differential, Structline, Extension, tools, d3, Mousetrap, StringifyingMap,
    range, monomialString, product, vectorScale, vectorSum, vectorLinearCombination, dictionaryVectorLinearCombination, dictionaryVectorScale, dictionaryVectorSum
})



window.on_public_website = new URL(document.location).hostname === "math.mit.edu";

window.getJSONFilename = function(file_name){
    file_name = `json/${file_name}.json`;
    if(on_public_website){
        file_name = "js_spectralsequences/" + file_name;
    }
    return file_name;
};
