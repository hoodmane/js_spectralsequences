exports.download = function(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
};


exports.saveToLocalStore = function(key, value, collection){
    return sseqDatabase.open().catch((err) => console.log(err))
        .then(() => sseqDatabase.createKey(key, JSON.stringify(value), collection))
        .then(() => console.log("Successfully saved."));
};

function nextString(str){
    return str.substring(0,str.length-1)+String.fromCharCode(str.charCodeAt(str.length-1)+1);
}

exports.loadKeysFromLocalStoreWithPrefix = async function(prefix){
    let endStr = nextString(prefix);
    await sseqDatabase.open();
    return await sseqDatabase.fetchKeyRange(prefix, endStr);
};

exports.loadFromLocalStore = async function(key){
    await sseqDatabase.open();
    let response = await sseqDatabase.fetchKey(key);
    if(!response || !response.value){
        return undefined;
    }
    return JSON.parse(response.value);
};

exports.deleteFromLocalStore = async function(key){
    await sseqDatabase.open();
    await sseqDatabase.deleteKey(key);
    return;
};

exports.loadFromServer = async function(path){
    let response = await fetch(path);
    return await response.json();
};


const sseqDatabase = {};
let datastore = null;

sseqDatabase.open = function() {
    return new Promise(function(resolve,reject) {
        if(datastore){
            resolve();
            return;
        }
        // Database version.
        const version = 6;

        // Open a connection to the datastore.
        const request = indexedDB.open('sseq', version);

        // Handle datastore upgrades.
        request.onupgradeneeded = function (e) {
            const db = e.target.result;

            e.target.transaction.onerror = sseqDatabase.onerror;

            // Delete the old datastore.
            if (db.objectStoreNames.contains('sseq')) {
                db.deleteObjectStore('sseq');
            }

            // Create a new datastore.
            const store = db.createObjectStore('sseq', {
                keyPath: 'key'
            });

            store.createIndex("key", "key",  { unique: true });
            store.createIndex("collection", "collection", { unique: false });
        };

        // Handle successful datastore access.
        request.onsuccess = function (e) {
            // Get a reference to the DB.
            datastore = e.target.result;
            // Execute the callback.
            resolve();
        };

        // Handle errors when opening the datastore.
        request.onerror = reject;
    });
};


sseqDatabase.fetchAllKeys = function() {
    return new Promise(function(resolve, reject) {
        const transaction = datastore.transaction(['sseq'], 'readwrite');
        const objStore = transaction.objectStore('sseq');

        const keyRange = IDBKeyRange.lowerBound(0);
        const cursorRequest = objStore.openCursor(keyRange);

        const todos = [];

        transaction.oncomplete = function (e) {
            // Execute the callback function.
            resolve(todos);
        };

        cursorRequest.onsuccess = function (e) {
            let result = e.target.result;

            if (!!result == false) {
                return;
            }

            todos.push(result.value);

            result.continue();
        };

        cursorRequest.onerror = reject;
    });
};

sseqDatabase.fetchKey = function(key) {
    return new Promise(function(resolve, reject) {
        const transaction = datastore.transaction(['sseq'], 'readwrite');
        const objStore = transaction.objectStore('sseq');

        const keyRange = IDBKeyRange.lowerBound(0);
        const objectStoreRequest = objStore.index("key").get(key);

        objectStoreRequest.onsuccess = function (e) {
            resolve(objectStoreRequest.result);
        };

        objectStoreRequest.onerror = reject;
    });
};


sseqDatabase.fetchKeyRange = function(min,max) {
    return new Promise(function(resolve, reject) {
        const transaction = datastore.transaction(['sseq'], 'readwrite');
        const objStore = transaction.objectStore('sseq');

        const keyRange = IDBKeyRange.bound(min, max, true, false);
        const cursorRequest = objStore.openCursor(keyRange);

        const todos = [];

        transaction.oncomplete = function (e) {
            // Execute the callback function.
            resolve(todos);
        };

        cursorRequest.onsuccess = function (e) {
            let result = e.target.result;

            if (!!result === false) {
                return;
            }

            todos.push(result.value);

            result.continue();
        };

        cursorRequest.onerror = reject;
    });
};

sseqDatabase.fetchCollection = function(collection) {
    return new Promise(function(resolve, reject) {
        const transaction = datastore.transaction(['sseq'], 'readwrite');
        const objStore = transaction.objectStore('sseq');

        console.log(collection);
        const cursorRequest = objStore.index("collection").openCursor(collection);

        const todos = [];

        transaction.oncomplete = function (e) {
            // Execute the callback function.
            resolve(todos);
        };

        cursorRequest.onsuccess = function (e) {
            let result = e.target.result;

            if (!!result == false) {
                return;
            }

            todos.push(result.value);

            result.continue();
        };

        cursorRequest.onerror = reject;
    });
};

sseqDatabase.createKey = function(key, value, collection) {
    return new Promise(function(resolve, reject) {
        // Get a reference to the db.
        const db = datastore;

        // Initiate a new transaction.
        const transaction = db.transaction(['sseq'], 'readwrite');
        // Get the datastore.
        const objStore = transaction.objectStore('sseq');
        // Create a timestamp for the item.
        const timestamp = new Date().getTime();
        // Create an object for the item.
        const item = {
            'key' : key,
            'value': value,
            'collection' : collection,
            'timestamp': timestamp
        };
        // Create the datastore request.
        const request = objStore.put(item);
        // Handle a successful datastore put.
        request.onsuccess = function (e) {
            // Execute the callback function.
            resolve(item);
        };

        // Handle errors.
        request.onerror = reject;
    });
};


sseqDatabase.deleteKey = function(id) {
    return new Promise(function(resolve, reject) {
        const db = datastore;
        const transaction = db.transaction(['sseq'], 'readwrite');
        const objStore = transaction.objectStore('sseq');

        const request = objStore.delete(id);

        request.onsuccess = function (e) {
            resolve();
        };

        request.onerror = reject;
    });
};

exports.sseqDatabase = sseqDatabase;
