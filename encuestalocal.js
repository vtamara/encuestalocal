// Guarda resultados de un formulario en base local
// Cuando se presiona el botón enviar
// vtamara@pasosdeJesus.org 2014
// vim: set expandtab tabstop=4 shiftwidth=4 foldmethod=marker fileencoding=utf-8:


$(document).ready(function() {
    var muere = function (m) {
        alert(m);
        console.error(m);
        throw new Error(m);
    };

    $("form").submit(function(event) {
        event.preventDefault();
        debugger;
        if (!window.indexedDB) {
            muere("Su navegador no soporta una versión estable de IndexDB.\n" +
                "Los datos no fueron almacenados.\n"+
                "Por favor actualice.");
        }
        alert("Todo va bien");

        // Con base en https://developer.mozilla.org/es/docs/IndexedDB-840092-dup/Usando_IndexedDB
        const DB_NAME = 'voces_memoria';
        const DB_VERSION = 1; 
        const DB_STORE_NAME = 'encuesta';
        var db;

        // Used to keep track of which view is displayed to avoid uselessly reloading it
        var current_view_pub_key;

        function openDb() {
            console.log("openDb ...");
            var req = indexedDB.open(DB_NAME, DB_VERSION);
            req.onsuccess = function (evt) {
                // Better use "this" than "req" to get the result to avoid problems with
                // garbage collection.
                // db = req.result;
                db = this.result;
                console.log("openDb DONE");
            };
            req.onerror = function (evt) {
                muere("openDB: " + evt.target.errorCode);
            };

            req.onupgradeneeded = function (evt) {
                console.log("openDb.onupgradeneeded");
                var store = evt.currentTarget.result.createObjectStore(
                        DB_STORE_NAME, { keyPath: 'id', autoIncrement: true });
            // Codigo?   store.createIndex('title', 'title', { unique: false });
            };
        }


    });
})
