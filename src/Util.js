export const infinity = 10000;

export function limited_logger(max_msgs) {
  let log_fn = function logger(msg) {
    if (log_fn.msgs_so_far < log_fn.max_msgs) {
      console.log(msg);
      log_fn.msgs_so_far++;
    }
  };
  log_fn.max_msgs = max_msgs;
  log_fn.msgs_so_far = 0;
  return log_fn;
}

export function download(filename, text) {
  let element = document.createElement("a");
  element.setAttribute(
    "href",
    "data:text/plain;charset=utf-8," + encodeURIComponent(text),
  );
  element.setAttribute("download", filename);

  element.style.display = "none";
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export function getDummyConstantFunction(out) {
  return function () {
    return out;
  };
}

export function getDummyInvalidOperation(dummy, functionName) {
  return function () {
    throw new ReferenceError(
      `Invalid operation: cannot use method ${functionName} on a dummy ${dummy.prototype.constructor.name}.`,
    );
  };
}

export function setDummyMethods(dummy, predicate, property_name_to_method) {
  Object.getOwnPropertyNames(dummy.prototype)
    .filter(predicate)
    .forEach(function (p) {
      dummy[p] = property_name_to_method(p);
    });
}

export function setRemainingMethods(dummy, predicate, property_name_to_method) {
  Object.getOwnPropertyNames(dummy.prototype)
    .filter((p) => !dummy.hasOwnProperty(p))
    .filter(predicate)
    .forEach(function (p) {
      dummy[p] = property_name_to_method(p);
    });
}

export function setPrivateMethodsToInvalidOperation(dummy) {
  setDummyMethods(
    dummy,
    (p) => p[0] === "_",
    (p) => getDummyInvalidOperation(dummy, p),
  );
}

export function checkAllCommandsDefined(dummy) {
  let undefinedFields = Object.getOwnPropertyNames(dummy.prototype).filter(
    (p) => !dummy.hasOwnProperty(p),
  );
  if (undefinedFields.length > 0) {
    let className = dummy.prototype.constructor.name;
    console.log(
      `Not all fields of ${className} have been defined in ${className} dummy. The list of undefined fields is:\n${undefinedFields}`,
    );
    //let error = new assert.AssertionError({ message : `Not all fields of ${className} have been defined in ${className} dummy. The list of undefined fields is:\n${undefinedFields}` });
    //console.log(error.stack);
    //throw error;
  }
}

export function getArguments(func) {
  return (func + "")
    .replace(/[/][/].*$/gm, "") // strip single-line comments
    .replace(/\s+/g, "") // strip white space
    .replace(/[/][*][^/*]*[*][/]/g, "") // strip multi-line comments
    .split("){", 1)[0]
    .replace(/^[^(]*[(]/, "") // extract the parameters
    .replace(/=[^,]+/g, "") // strip any ES6 defaults
    .split(",")
    .filter(Boolean); // split & filter [""]
}

export function checkArgumentsDefined(func, args) {
  for (let i = 0; i < args.length; i++) {
    if (args[i] === undefined) {
      let argName = getArguments(func)[i];
      throw Error(`Argument ${argName} of ${func.name} is undefined`);
    }
  }
}

export function getObjectWithFields(obj, fieldNames) {
  let out = new Object();
  for (let field of fieldNames) {
    out[field] = obj[field];
  }
  return out;
}

export function assignFields(dest, source, fieldNames) {
  for (let field of fieldNames) {
    dest[field] = source[field];
  }
  return dest;
}

export function copyFields(dest, source) {
  for (let kv of Object.entries(source)) {
    let key = kv[0];
    let value = kv[1];
    if (Array.isArray(value)) {
      value = value.slice();
    }
    dest[key] = value;
  }
  return dest;
}

/**
 * Map method get with default.
 * @param key
 * @param value
 * @returns {*}
 */
Map.prototype.getOrElse = function (key, value) {
  return this.has(key) ? this.get(key) : value;
};
