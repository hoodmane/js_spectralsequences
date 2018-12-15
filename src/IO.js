exports.download = function(filename, text) {
    let element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
};


exports.saveToLocalStore = function(key, value){
    return sseqDatabase.open().catch((err) => console.log(err))
        .then(() => sseqDatabase.createKey(key, JSON.stringify(value)))
        .then(() => console.log("Successfully saved."));
};

exports.loadFromLocalStore = async function(key){
    await sseqDatabase.open();
    let response = await sseqDatabase.fetchKey(key);
    return JSON.parse(response.value);
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
        const version = 5;

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

            store.createIndex("key", "key");
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
        console.log(datastore.keyPath);
        const transaction = datastore.transaction(['sseq'], 'readwrite');
        const objStore = transaction.objectStore('sseq');

        const keyRange = IDBKeyRange.lowerBound(0);
        const cursorRequest = objStore.openCursor(keyRange);

        const todos = [];

        transaction.oncomplete = function (e) {
            // Execute the callback function.
            console.log("td", todos);
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

        cursorRequest.onerror = sseqDatabase.onerror;
    });
};

sseqDatabase.fetchKey = function(key) {
    return new Promise(function(resolve, reject) {
        const transaction = datastore.transaction(['sseq'], 'readwrite');
        console.log(transaction);
        const objStore = transaction.objectStore('sseq');

        const keyRange = IDBKeyRange.lowerBound(0);
        console.log(key);
        const objectStoreRequest = objStore.index("key").get(key);

        objectStoreRequest.onsuccess = function (e) {
            resolve(objectStoreRequest.result);
        };

        objectStoreRequest.onerror = reject;
    });
};



sseqDatabase.createKey = function(key, value) {
    return new Promise(function(resolve, reject) {
        // Get a reference to the db.
        const db = datastore;

        console.log(db);
        // Initiate a new transaction.
        const transaction = db.transaction(['sseq'], 'readwrite');
        // Get the datastore.
        const objStore = transaction.objectStore('sseq');
        // Create a timestamp for the todo item.
        const timestamp = new Date().getTime();
        // Create an object for the todo item.
        const todo = {
            'key' : key,
            'value': value,
            'timestamp': timestamp
        };
        // Create the datastore request.
        const request = objStore.put(todo);
        // Handle a successful datastore put.
        request.onsuccess = function (e) {
            // Execute the callback function.
            console.log(todo);
            resolve(todo);
        };

        // Handle errors.
        request.onerror = reject;
    });
};


sseqDatabase.deleteTodo = function(id) {
    return new Promise(function(resolve, reject) {
        const db = datastore;
        const transaction = db.transaction(['sseq'], 'readwrite');
        const objStore = transaction.objectStore('sseq');

        const request = objStore.delete(id);

        request.onsuccess = function (e) {
            resolve();
        };

        request.onerror = function (e) {
            console.log(e);
        };
    });
};

exports.sseqDatabase = sseqDatabase;
