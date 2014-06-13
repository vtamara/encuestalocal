// Guarda resultados de un formulario en base local
// Cuando se presiona el botón enviar
// vtamara@pasosdeJesus.org 2014
// vim: set expandtab tabstop=4 shiftwidth=4 foldmethod=marker fileencoding=utf-8:

// Ideas: 
// * http://www.ibm.com/developerworks/web/library/wa-offlinehtml/index.html?ca=drs
// * https://developer.mozilla.org/es/docs/IndexedDB-840092-dup/Usando_IndexedDB
// * http://code.tutsplus.com/tutorials/working-with-indexeddb--net-34673
// http://www.raymondcamden.com/index.cfm/2012/8/23/Proof-of-Concept--Build-a-download-feature-for-IndexedDB
var ini;
$(document).ready(function() {

    var ctitulo = function (s) {
        s = s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/, '');
        return "enl_" + s;
    };
    const BD_NOMBRE = ctitulo($('title').html());
    const BD_VERSION = 1; 
    const BD_NOMBRE_DEPOSITO = 'EncuestaLocal';
    var bd = null;

    var el_llena = function() {
        if (bd != null) {
            var na = 0;
            var ne = 0; 
            bd.transaction([BD_NOMBRE_DEPOSITO], "readonly").objectStore(BD_NOMBRE_DEPOSITO).openCursor().onsuccess = function(e) {
                var cursor = e.target.result;
                if(cursor) {
                    if (cursor.value["enviado"] === true) {
                        ne++;
                    }
                    na++;
                    cursor.continue();
                } else {
                    $('#el_numalm').html(na);
                    $('#el_numenv').html(ne);
                }
            }
        }
    };

    if (!window.indexedDB) {
        alert("Su navegador no soporta una versión estable de IndexDB.\n" +
            "Los datos no fueron almacenados.\n"+
            "Por favor actualice.");
        return;
    } else if (ini != 1) {
        console.log("* Abrir base");
        ini = 1
        var req = indexedDB.open(BD_NOMBRE, BD_VERSION);
        req.onsuccess = function (evt) {
            bd = this.result;
            el_llena();
            console.log("* Abierta");
        };
        req.onerror = function (evt) {
            alert("Problema al abrir base: " + evt.target.errorCode);
            return;
        };
        req.onupgradeneeded = function (evt) {
            console.log("* Crear/actualizar estructura");
            bd = evt.currentTarget.result;
            store = bd.createObjectStore(
                    BD_NOMBRE_DEPOSITO, { keyPath: 'id', autoIncrement: true }
                    );
            console.log("* Deposito creado/actualizado");
        };

        console.log("* Controles");
        $('.ss-form-container').append("<div class='ss-edit-link'>"
                + "<p>&nbsp; </p><p>&nbsp;</p>"
                + "<p>Encuestas almacenadas: <span id='el_numalm'></span></p>"
                + "<p>Encuestas enviadas: <span id='el_numenv'></span></p>"
                + "<p><button id='el_envia'>Enviar las no enviadas</button></p>"
                + "</div>");
        el_llena();
    }

    $(document).on('click', '#el_envia', function(event) {
        if (navigator.onLine) {
            if (bd != null) {
                alert('Enviando ');
                var na = 0;
                var ne = 0; 
                var nn = 0; 
                var req = bd.transaction([BD_NOMBRE_DEPOSITO], "readonly").objectStore(BD_NOMBRE_DEPOSITO).openCursor();
                req.onsuccess = function(e) {
                    var cursor = e.target.result;
                    if(cursor) {
                        if (cursor.value["enviado"] === true) {
                            ne++;
                        } else {
                            $.post(cursor.value["url"], 
                                cursor.value["contenido"], 
                                function(data) {
                                    nn++;
                                    ne++;
                                    alert("Envio: "+ nn + " " + data);
                                });
                        }
                        na++;
                        cursor.continue();
                    } else {
                        alert("Se enviaron " + nn + " encuestas almacenadas");
                        $('#el_numalm').html(na);
                        $('#el_numenv').html(ne);
                    }
                };
                req.onerror = function(e) {
                    console.log("* No pudo iterarse ", e.target.error.name);
                };
            }

        } else {
            alert('El navegador está en modo sin conexión, no se puede enviar');
        }
    });

    $("form").submit(function(event) {
        if (bd != null) {
            event.preventDefault();
            var tx = bd.transaction([BD_NOMBRE_DEPOSITO], "readwrite");
            var encuesta = tx.objectStore(BD_NOMBRE_DEPOSITO);
            var req = encuesta.add({enviado: false, contenido: $(this).serialize(), url: $(this).attr('action')});
            req.onsuccess = function(e) {
                console.log("* Resultados agregados");
                el_llena();
                $("form").each(function() { this.reset(); });
            }
            req.onerror = function(e) {
                console.log("* No pudo agregarse ", e.target.error.name);
            }
        }
    });
})
