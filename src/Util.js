let assert = require("assert");

exports.infinity = 10000;

exports.limited_logger = function(max_msgs){
    let log_fn = function(msg){
        if(log_fn.msgs_so_far < log_fn.max_msgs){
            console.log(msg);
            log_fn.msgs_so_far++;
        }
    };
    log_fn.max_msgs = max_msgs;
    log_fn.msgs_so_far = 0;
    return log_fn;
};


exports.download = function(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};

exports.getDummyConstantFunction = function(out) {
    return function () {
        return out;
    }
}

exports.getDummyInvalidOperation = function(dummy, functionName) {
    return function () {
        throw new ReferenceError(`Invalid operation: cannot use method ${functionName} on a dummy ${dummy.prototype.constructor.name}.`);
    }
}


exports.setDummyMethods = function(dummy, predicate, property_name_to_method){
    Object.getOwnPropertyNames(dummy.prototype).filter(predicate).forEach(function(p){
        dummy[p] = property_name_to_method(p);
    });
}

exports.setRemainingMethods = function(dummy, predicate, property_name_to_method){
    Object.getOwnPropertyNames(dummy.prototype).filter((p) => !dummy.hasOwnProperty(p)).filter(predicate).forEach(function(p){
        dummy[p] = property_name_to_method(p);
    });
}

exports.setPrivateMethodsToInvalidOperation = function(dummy){
    exports.setDummyMethods(dummy, p => p[0] === "_", p => exports.getDummyInvalidOperation(dummy, p));
}

exports.checkAllCommandsDefined = function(dummy){
    let undefinedFields = Object.getOwnPropertyNames(dummy.prototype).filter((p) => !dummy.hasOwnProperty(p));
    if(undefinedFields.length > 0){
        let className = dummy.prototype.constructor.name;
        console.log(`Not all fields of ${className} have been defined in ${className} dummy. The list of undefined fields is:\n${undefinedFields}`);
        //let error = new assert.AssertionError({ message : `Not all fields of ${className} have been defined in ${className} dummy. The list of undefined fields is:\n${undefinedFields}` });
        //console.log(error.stack);
        //throw error;
    }
}


exports.getArguments = function(func) {
    return (func + '')
        .replace(/[/][/].*$/mg,'') // strip single-line comments
        .replace(/\s+/g, '') // strip white space
        .replace(/[/][*][^/*]*[*][/]/g, '') // strip multi-line comments
        .split('){', 1)[0].replace(/^[^(]*[(]/, '') // extract the parameters
        .replace(/=[^,]+/g, '') // strip any ES6 defaults
        .split(',').filter(Boolean); // split & filter [""]
}

exports.checkArgumentsDefined = function(func, args){
    for(let i = 0; i < args.length; i++){
        if(args[i] === undefined){
            let argName = exports.getArguments(func)[i];
            throw Error(`Argument ${argName} of ${func.name} is undefined`);
        }
    }
}


exports.getObjectWithFields = function(obj, fieldNames){
    let out = new Object();
    for(let field of fieldNames){
        out[field] = obj[field];
    }
    return out;
}

exports.assignFields = function(dest, source, fieldNames){
    for(let field of fieldNames){
        dest[field] = source[field];
    }
    return dest;
}

/**
 * Map method get with default.
 * @param key
 * @param value
 * @returns {*}
 */
Map.prototype.getOrElse = function(key, value) {
    return this.has(key) ? this.get(key) : value;
};