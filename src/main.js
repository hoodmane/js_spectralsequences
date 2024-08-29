// This MathJax file comes from the MathJax-single-file git archive folder dist/TeXSVGTeX
// It isn't designed to work with node / browserify -- it just installs itself as a global variable.
// because of this, require just "returns" an empty object, so there's no use in saving the output.

export * as Util from "./Util";
export * as IO from "./SaveLoad";
export * as Interface from "./Interface";
export * as Shapes from "./Shape";
export { Display } from "./Display";
export { BasicDisplay } from "./BasicDisplay";
export { SidebarDisplay } from "./SidebarDisplay";
export { EditorDisplay } from "./EditorDisplay";
export { Tooltip } from "./Tooltip";
export * as Panel from "./Panel";
export * as ExportToTex from "./ExportToTex";
export { EventEmitter } from "events";
export {
  Sseq,
  SseqClass,
  Edge,
  Differential,
  Structline,
  Extension,
  Node,
  range,
  monomialString,
  product,
  vectorSum,
  vectorScale,
  vectorLinearCombination,
  dictionaryVectorScale,
  dictionaryVectorSum,
  dictionaryVectorLinearCombination,
} from "./Sseq";
export * as tools from "./ass_tools";
export * as d3 from "d3-selection";
export * as Mousetrap from "mousetrap";
export * as C2S from "canvas2svg";
export { infinity } from "./Util";
export { sseqDatabase } from "./SaveLoad";
import StringifyingMap from "./StringifyingMap";
export { StringifyingMap };

export function mod(n, d) {
  return ((n % d) + d) % d;
}

window.on_public_website =
  new URL(document.location).hostname === "math.mit.edu";

window.getJSONFilename = function (file_name) {
  file_name = `json/${file_name}.json`;
  if (on_public_website) {
    file_name = "js_spectralsequences/" + file_name;
  }
  return file_name;
};
