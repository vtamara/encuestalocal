// Permite guardar resultados de un formulario/encuesta de Google Docs en 
// base local y su posterior recuperación para ser enviados.
//
// vtamara@pasosdeJesus.org 2014
// vim: set expandtab tabstop=4 shiftwidth=4 foldmethod=marker fileencoding=utf-8:

//  Referencias:
// * http://www.ibm.com/developerworks/web/library/wa-offlinehtml/index.html?ca=drs
// * https://developer.mozilla.org/es/docs/IndexedDB-840092-dup/Usando_IndexedDB
// * http://code.tutsplus.com/tutorials/working-with-indexeddb--net-34673
// * http://www.raymondcamden.com/index.cfm/2012/8/23/Proof-of-Concept--Build-a-download-feature-for-IndexedDB

// Indica si ya fue inicializado --pues ready suele llamarse 2 veces.
var ini;

$(document).ready(function() {
    // nombre de la base de datos depende del titulo de la encuesta
    var ctitulo = function (s) {
        s = s.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/, '');
        return "enl_" + s;
    };
    const BD_NOMBRE = ctitulo($('title').html());
    const BD_VERSION = 1; 
    const BD_NOMBRE_DEPOSITO = 'EncuestaLocal';
    // conexion a base de datos
    var bd = null;
    // Id de la última encuesta recuperada del almacen que se hace la actual
    var actual = null;

    var limpia_formulario = function() {
        $('input:radio').attr('checked', false);
        $("form").each(function() { this.reset(); });
    }

    // Llena campos informativos sobre estado de almacenadas/enviados
    var el_llena = function() {
        if (bd != null) {
            var na = 0;
            var nnoe = 0; 
            var tr = bd.transaction([BD_NOMBRE_DEPOSITO], "readonly");
            var req = tr.objectStore(BD_NOMBRE_DEPOSITO).openCursor();
            req.onsuccess = function(e) {
                var cursor = e.target.result;
                if(cursor) {
                    if (cursor.value["enviado"] === false) {
                        nnoe++;
                    }
                    na++;
                    cursor.continue();
                } else {
                    $('#el_numalm').html(na);
                    $('#el_numnoenv').html(nnoe);
                    if (actual != null) {
                        $('#el_idalm').html(actual);
                    } else {
                        $('#el_idalm').html('&nbsp;');
                    }
                    if (na > 0) {
                        $('#el_siguiente').removeAttr('disabled');
                        $('#el_anterior').removeAttr('disabled');
                    } else {
                        $('#el_siguiente').attr('disabled', 'disabled');
                        $('#el_anterior').attr('disabled', 'disabled');
                    }
                }
            }
        }

    };

    // Prepara
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
        $('#navigation-buttons').prepend("<input type='reset' value='Limpiar'/>");
        $('#navigation-buttons').prepend("<input type='button' value='Almacenar' id='el_almacenar'/>");
        $('#navigation-buttons').append("<div class='informa-encuestalocal'>"
                + "<p>&nbsp; </p><p>&nbsp;</p>"
                + "<p>Encuestas almacenadas: <span id='el_numalm'></span></p>"
                + "<p>Encuestas no enviadas: <span id='el_numnoenv'></span></p>"
                + "<p><button id='el_anterior'>Anterior</button>"
                + "<span style='border: 1px solid #000000' id='el_idalm'>&nbsp;</span>"
                + "<button id='el_siguiente'>Siguiente no enviada</button></p>"
                + "</div>");
        el_llena();
    }

    $("input[type=reset]").click(function(event) {
        actual = null;
        limpia_formulario();
        el_llena();
        return true;
    });

    $("form").submit(function(event) {
        if (navigator.onLine) {
            if (bd != null && actual != null) {
                var tr = bd.transaction([BD_NOMBRE_DEPOSITO], "readwrite");
                var os = tr.objectStore(BD_NOMBRE_DEPOSITO);
                var req = os.get(actual);
                req.onsuccess = function(e) {
                    e.target.result['enviado'] = true;
                    os.put(e.target.result);
                    el_llena();
                }
                alert('Por marcar como enviada');
            }
        }
    });

    var presenta= function(contenido) {
        // Limpiamos formulario
        limpia_formulario();
        //https://gist.github.com/brucekirkpatrick/7026682
        var str = decodeURI(contenido.replace(/\+/g, ' ')); 
        var pairs = str.split('&');
        var obj = {}, p, idx;
        for (var i = 0, n = pairs.length; i < n; i++) {
            var p = pairs[i].split('=');
            var ie = 'input:radio[name="' + p[0] + '"]';
            if ($(ie).size() > 0) {
                $('input[name="' + p[0] + '"]').attr('checked', false);
                var s='input[name="' + p[0] + '"][aria-label="'
                    + p[1] + '"]';
                $(s).attr('checked', true);
            }
        }
        el_llena();
    };

    // Google docs molesta al enviar con método post (pero al parece funciona).
    $(document).on('click', '#el_anterior', function(event) {
        event.preventDefault();
        if (bd != null && actual != null) {
            var tr = bd.transaction([BD_NOMBRE_DEPOSITO], "readonly");
            var req = tr.objectStore(BD_NOMBRE_DEPOSITO).openCursor();
            var rec = false;
            var anterior = null;
            req.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    ida = cursor.value['id'];
                    if (cursor.value['enviado'] === false && !rec) {
                        if (ida == actual && anterior != null) {
                            actual = anterior;
                            rec = true;
                            presenta(contanterior);
                        } else if (ida < actual) {
                            contanterior = cursor.value['contenido'];
                            anterior = ida;
                        }
                    }
                    cursor.continue();
                } 
            }
        }

    });

    $(document).on('click', '#el_siguiente', function(event) {
        event.preventDefault();
        if (bd != null) {
            var tr = bd.transaction([BD_NOMBRE_DEPOSITO], "readonly");
            var req = tr.objectStore(BD_NOMBRE_DEPOSITO).openCursor();
            var rec = false;
            req.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    ida = cursor.value['id'];
                    if (cursor.value['enviado'] === false && !rec &&
                        (actual == null || ida > actual)) {
                        actual = ida;
                        rec = true;
                        presenta(cursor.value['contenido']);
                    }
                    cursor.continue();
                } 
            }
        }
    });

    $(document).on('click', '#el_almacenar', function(event) {
        event.preventDefault();
        if (bd != null) {
            var tx = bd.transaction([BD_NOMBRE_DEPOSITO], "readwrite");
            var encuesta = tx.objectStore(BD_NOMBRE_DEPOSITO);
            var o = {enviado: false, 
                contenido: $('form').serialize(), 
                url: $('form').attr('action')};
            var req = encuesta.add(o);
            req.onsuccess = function(e) {
                console.log("* Resultados agregados");
                // Al llamarlo sin espera puede no hacer bien
                // la cuenta de almacenados.
                setTimeout(function() 
                    {
                        limpia_formulario();
                        el_llena();
                    }, 300);
            }
            req.onerror = function(e) {
                console.log("* No pudo agregarse ", e.target.error.name);
            }
        }
    });
})
