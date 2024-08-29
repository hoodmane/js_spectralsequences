import { Sseq } from "./Sseq";
import * as Mousetrap from "mousetrap";

export function getClassExpression(c) {
  let out = `(${c.x}, ${c.y})`;
  if (c.name) {
    out += ` [${c.name}]`;
  }
  return out;
}

function variablePowerString(variable, power) {
  if (power === 1) {
    return variable;
  }
  return `${variable}^{${power}}`;
}

export function multiply_monomial(variable, power, monomial) {
  let power_regex = new RegExp(
    `${variable}(\\^{?(.)}?)?`
      .replace("\\", "\\\\")
      .replace(/\{/g, "\\{")
      .replace(/\}/g, "\\}"),
  );
  let matcher = power_regex.exec(monomial);
  if (!power_regex.test(monomial)) {
    console.log(monomial);
    return variablePowerString(variable, power) + monomial;
  }
  console.log(power_regex);
  console.log(matcher[2]);
  let old_power = Number.parseInt(matcher[2] || 1);
  let new_power = old_power + power;
  return monomial.replace(power_regex, `${variable}^{${new_power}}`);
}

export function straightenTowers(sseq) {
  markTowers(sseq);
  for (let x = 1; x < xmax; x++) {
    if (!sseq.longest_tower_map.has(x)) {
      continue;
    }
    let longest_tower = sseq.longest_tower_map.get(x);
    if (longest_tower.length > 3) {
      for (let c = longest_tower.base; c; c = c.h0mult[0]) {
        c.x_offset = 0;
        for (let oc of sseq.getClassesInDegree(c.x, c.y)) {
          oc.has_fixed_class = true;
        }
      }
    }
  }
}

export function markTowers(sseq) {
  let column_maps = new Map();
  for (let c of sseq.classes) {
    c.h0div = [];
    c.h0mult = [];
    c.tower = { length: 0, base: c };
  }

  for (let structline of sseq.getStructlines()) {
    if (structline.source.x !== structline.target.x) {
      continue;
    }
    let source, target;
    if (structline.source.y < structline.target.y) {
      source = structline.source;
      target = structline.target;
    } else {
      source = structline.target;
      target = structline.source;
    }
    source.h0mult.push(target);
    target.h0div.push(source);
  }

  let columns = new Map();
  let longest_towers = new Map();

  let xmax = 0;
  let ymax = 0;

  for (let c of sseq.classes) {
    if (!columns.has(c.x)) {
      columns.set(c.x, new Map());
    }
    if (!columns.get(c.x).has(c.y)) {
      columns.get(c.x).set(c.y, []);
    }
    columns.get(c.x).get(c.y).push(c);
    if (c.x > 0 && c.y > ymax) {
      ymax = c.y;
    }
    if (c.x > xmax) {
      xmax = c.x;
    }
  }

  let longest_tower_map = new Map();
  for (let x = 1; x < xmax; x++) {
    if (!columns.has(x)) {
      continue;
    }
    let col = columns.get(x);
    let longest_tower = {};
    let longest_tower_length = -1;
    for (let y = 1; y < ymax; y++) {
      if (!col.has(y)) {
        continue;
      }
      for (let c of col.get(y)) {
        let tower = c.tower;
        for (let div of c.h0div) {
          if (div.tower.length > tower.length) {
            tower = div.tower;
          }
        }
        tower.length++;
        c.tower = tower;
        if (tower.length > longest_tower_length) {
          longest_tower_length = tower.length;
          longest_tower = tower;
        }
      }
    }
    longest_tower_map.set(x, longest_tower);
  }
  sseq.columns = columns;
  sseq.longest_tower_map = longest_tower_map;
}

export function minimizeCrossings(sseq) {
  let cell_class_list = new StringifyingMap();
  for (let stem of sseq.getOccupiedStems()) {
    let classes = sseq.getStem(stem);
    let column = new Map();
    for (let c of sseq.getClasses()) {
      if (!column.has(c.y)) {
        column.set(c.y, []);
      }
      column.get(c.y).push(c);
    }

    for (let cell of column.values()) {
      if (cell.length === 1) {
        continue;
      }
      for (let c of cell) {
        c.crossing_score = 0;
        for (let sl of c.structlines) {
          let t = otherClass(sl, c);
          if (t.x < c.x) {
            c.crossing_score--;
          } else if (t.x > c.x) {
            c.crossing_score++;
          }
        }
      }
      cell.sort((c) => c.crossing_score);
      for (let i = 0; i < cell.length; i++) {
        cell[i].idx = i;
      }
    }
  }
}

export function fixed_tower_xOffset(node, page) {
  let c = node.c;
  if (c.x_offset !== false) {
    return c.x_offset * this.offset_size;
  }
  let total_classes = this.num_classes_by_degree.get([c.x, c.y]);
  let idx = c.idx;
  //console.log(idx);
  let out = idx - (total_classes - 1) / 2;
  if (c.has_fixed_class) {
    let out_old = out;
    if (total_classes % 2 === 0) {
      if (out >= 0) {
        out += 1 / 2;
      } else {
        out -= 1 / 2;
      }
    } else {
      if (out >= 0) {
        out += 1;
      }
    }
  }
  return out * this.offset_size;
}

export function install_edit_handlers(display, download_filename) {
  Mousetrap.bind("q", () => {
    if (!display.mouseover_node) {
      return;
    }
    display.sseq.incrementClassIndex(display.mouseover_node.c);
  });

  Mousetrap.bind("w", () => {
    if (!display.mouseover_node) {
      return;
    }
    display.sseq.decrementClassIndex(display.mouseover_node.c);
  });

  Mousetrap.bind("d", () => {
    display.sseq.download(download_filename + ".json");
  });

  Mousetrap.bind("s", () => {
    if (display.mouseover_node) {
      display.temp_source_class = display.mouseover_node.c;
    }
  });

  Mousetrap.bind("t", () => {
    if (display.mouseover_node && display.temp_source_class) {
      console.log("t");
      let s = display.temp_source_class;
      let t = display.mouseover_node.c;
      console.log(s);
      console.log(t);
      if (s.x !== t.x + 1) {
        return;
      }
      let length = t.y - s.y;
      if (
        confirm(
          `Add d${length} differential from ${getClassExpression(s)} to ${getClassExpression(t)}`,
        )
      ) {
        let d = display.sseq.addDifferential(s, t, length);
        //d.color = differential_colors[d.page];
        display.sseq.emit("update");
      }
    }
  });

  Mousetrap.bind("n", () => {
    if (display.mouseover_node && display.temp_source_class) {
      let s = display.temp_source_class;
      let t = display.mouseover_node.c;
      if (
        confirm(
          `Delete edges ${getClassExpression(s)} to ${getClassExpression(t)}`,
        )
      ) {
        source
          .getEdges()
          .filter((e) => e.otherClass(s) === t)
          .forEach((e) => e.delete());
        display.sseq.emit("update");
      }
    }
  });

  display.on("click", (node) => {
    if (!node) {
      return;
    }
    let c = node.c;
    let default_text = "";
    if (c.name) {
      default_text = c.name;
    }
    let name = prompt(
      `Enter new name for class at position (${c.x},${c.y})`,
      default_text,
    );
    if (name || name === "") {
      c.name = name;
      c.setColor("black");
      display.sseq.emit("update");
    }
    c.tooltip_html = undefined;
  });

  Mousetrap.bind("p", () => {
    if (display.mouseover_node) {
      display.mouseover_node.c.problem = true;
    }
  });
}

export function addProductNames(sseq, variable) {
  let indecomposable_classes = sseq.classes.filter(
    (c) => !c.structlines.some((sl) => otherClass(sl, c).y < c.y && sl.visible),
  );
  for (let c of indecomposable_classes) {
    let name = c.name;
    if (!name) {
      continue;
    }
    let power = 1;
    while (c) {
      let h0mult = c.getProducts(variable);
      if (h0mult.length !== 1) {
        break;
      }
      c = otherClass(h0mult[0], c);
      if (c.name) {
        break;
      }
      c.name = tools.multiply_monomial(variable, power, name);
      sseq.emit("update");
      power++;
    }
  }
}

/*
// Fill in powers of variables with predictable names.
let bpower_regex = /b(\^(.))?/;
let a1power_regex = /a_1(\^(.))?/;
for(let c of sseq.classes.filter(c => c.name)){
    if(c.name && bpower_regex.test(c.name)){
        let bpower_matcher = bpower_regex.exec(c.name);
        console.log(c.name);
        let bpower = Number.parseInt(bpower_matcher[2]) || 1;
        for(let i = 1; true; i++){
            let classes = sseq.getClassesInDegree(c.x + i*10, c.y + i*2).filter((c) => c.getColor() === "blue");
            if(classes.length === 0){
                console.log(c.name + " break")
                break;
            }
            if(classes.length > 1){
                console.log(c.name + " continue")
                continue;
            }
            let bic = classes[0];
            if(bic.name){
                console.log(c.name + " has name: " + bic.name)
                break;
            }
            console.log(bic);
            bic.name = c.name.replace(bpower_regex, `b^{${bpower + i}}`);
            bic.setColor("black");
            console.log(c.name + ", " + bic.name);
        }
    }
}
sseq.updateAll();

for(let c of sseq.classes.filter(c => c.name)){
    if(c.name && a1power_regex.test(c.name)){
        let a1power_matcher = a1power_regex.exec(c.name);
        console.log(c.name);
        let a1power = Number.parseInt(a1power_matcher[2]) || 1;
        for(let i = 1; true; i++){
            let classes = sseq.getClassesInDegree(c.x + i*12, c.y + i*3).filter((c) => c.getColor() === "blue");
            if(classes.length === 0){
                break;
            }
            if(classes.length > 1){
                continue;
            }
            let bic = classes[0];
            if(bic.name){
                break;
            }
            console.log(bic);
            bic.name = c.name.replace(a1power_regex, `a_1^{${a1power + i}}`);
            bic.setColor("black");
        }
    }
}
sseq.updateAll();
*/
