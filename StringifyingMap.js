"use strict";

function stdCatToString(x){
    return x.catToString();
}



var StringifyingMap = (function () {
    function StringifyingMap(catToString) {
        if(catToString === undefined){
            catToString = stdCatToString
        }
        this.catToString = catToString;
        this.m = new Map();
    }
    StringifyingMap.prototype.set = function (k, v) {
        return this.m.set(this.catToString(k), v);
    };
    StringifyingMap.prototype.get = function (k) {
        return this.m.get(this.catToString(k));
    };
    StringifyingMap.prototype.delete = function (k) {
        return this.m.delete(this.catToString(k));
    };
    StringifyingMap.prototype.has = function (k) {
        return this.m.has(this.catToString(k));
    };    

    StringifyingMap.prototype.getOrElse = function(key, value) {
      return this.has(key) ? this.get(key) : value;
    }
    
    
    Object.defineProperty(StringifyingMap.prototype, "size", {
        get: function () {
            return this.m.size;
        },
        enumerable: true,
        configurable: true
    });
    return StringifyingMap;
}());
//Object.defineProperty(exports, "__esModule", { value: true });
//exports.default = StringifyingMap;
//I wanted to do an Interner but realized I couldn't because JS WeakMaps are weak in the wrong way. The key is weakref'd, not the value. It would need to sort of weakref both at once
// class Interner<T>{ //essentially turns comparisons by reference into comparisons by value. Give the interner the data, a hash function for the data and a true equality function. It will then give you a single reference to the data. Any two references provided by the interner that are equal in contents will be equal by reference too. By using a weakmap, whe interner only holds onto entries that are being used by some other part of the program.
// 	wm = WeakMap<number, T[]>;
// 	constructor(private hash:(T)=>number, private trueEqual:(T,T)=>boolean){}
// 	get(v:T):T {
// 		var res = wm.get(v)
// 	}
// } 
//# sourceMappingURL=StringifyingMap.js.map
