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
        $('input:checkbox').attr('checked', false);
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
                + "<p><button id='el_anterior'>Anterior no enviada</button>"
                + "<span style='border: 1px solid #000000' id='el_idalm'>&nbsp;</span>"
                + "<button id='el_siguiente'>Siguiente no enviada</button></p>"
                + "<button id='el_resnoenviados'>Exportar encuestas no enviados</button>"
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
            }
        }
    });

    /* Ejemplo de entradas y correspondiente HTML en formularios de
       Google Docs a Junio de 2014

       Radio:
       <input type="radio" name="entry.122063182" value="Mujer" id="group_122063182_1" role="radio" class="ss-q-radio" aria-label="Mujer">
       <input type="radio" name="entry.122063182" value="Hombre" id="group_122063182_2" role="radio" class="ss-q-radio" aria-label="Hombre">


       Fecha:
       <input type="date" name="entry.2092848773" value="" class="ss-q-date valid" dir="auto" id="entry_2092848773" aria-label="Fecha de diligenciamiento  "> 
       entry.2092848773=2014-06-16

        Texto:
        <input type="text" name="entry.563383882.other_option_response" value="" class="ss-q-other" id="entry_563383882_other_option_response" dir="auto" aria-label="Other">
        entry.563383882.other_option_response=otra+7

	Area de texto:
	<textarea name="entry.354409088" rows="8" cols="0" class="ss-q-long valid" id="entry_354409088" dir="auto" aria-label="21. Observaciones y/o Sugerencias  "></textarea>

	Cajas de verificacion:

        */

    /**
     * Itera sobre cada resultado de contenido y
     * por cada uno llama bien a la función fradio si es contenido
     * tipo radio o a ftexto.
     */
    var itera_cont = function(contenido, param, fradio, ftexto) {
        // Limpiamos formulario
        //https://gist.github.com/brucekirkpatrick/7026682
        var str = decodeURI(contenido.replace(/\+/g, ' ')); 
        var pairs = str.split('&');
        var obj = {}, p, idx;
        for (var i = 0, n = pairs.length; i < n; i++) {
            var p = pairs[i].split('=');
            if ($('input:radio[name="' + p[0] + '"]').size() > 0) {
                fradio(param, p[0], p[1], true);
            } else if ($('input:checkbox[name="' + p[0] + '"]').size() > 0) {
                fradio(param, p[0], p[1], false);
            } else if ($('input[name="' + p[0] + '"]').size() == 1 ||
			$('textarea[name="' + p[0] + '"]').size() == 1) {
                ftexto(param, p[0], p[1]);
            }
        }
    };

    var fradio_llenaformulario = function(param, nombre, valor, limpia) {
	if (limpia) {
        	$('input[name="' + nombre + '"]').attr('checked', false);
	} else {
		debugger;
	}
        var s='input[name="' + nombre + '"][value="'
            + valor + '"]';
        $(s).attr('checked', true);
    };

    var ftexto_llenaformulario = function(param, nombre, valor) {
        $('input[name="' + nombre + '"]').val(valor);
        $('textarea[name="' + nombre + '"]').val(valor);
    };

    var fentrada_objeto = function(param, nombre, valor) {
        param[nombre] = valor;
    }

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
                            limpia_formulario();
                            itera_cont(contanterior, null, 
                                fradio_llenaformulario,
                                ftexto_llenaformulario);
                            el_llena();
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
                        //presenta(cursor.value['contenido']);
                        limpia_formulario();
                        itera_cont(cursor.value['contenido'], null,
                            fradio_llenaformulario,
                            ftexto_llenaformulario);
                        el_llena();
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
            var h = new Date();
            var o = {enviado: false, 
                contenido: $('form').serialize(), 
                url: $('form').attr('action'),
                // Timestamp en locale usado por googledocs
                timestamp: h.getDate() + "/" + (h.getMonth()+1) + "/" + 
                    h.getFullYear() + " " + h.getHours() + ":" + 
                    h.getMinutes() + ":" + h.getSeconds()
            };
            var req = encuesta.add(o);
            req.onsuccess = function(e) {
                console.log("* Resultados agregados");
                actual = null;
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


    $(document).on('click', '#el_resnoenviados', function(event) {
        event.preventDefault();
        if (bd != null) {
            var nv = window.open();
            var tr = bd.transaction([BD_NOMBRE_DEPOSITO], "readonly");
            var req = tr.objectStore(BD_NOMBRE_DEPOSITO).openCursor();
            var res ="<!DOCTYPE html>\n"
                + "<html>\n"
                + "  <head><title>Resultados de " 
                + $('title').html() + "</title></head>\n"
                + "  <body>\n"
                + "    <table border='1' style='font-family: Arial; font-size: 8px;border-collapse:collapse;'>\n"
                + "      <thead>";
            tit = {};
            $('input[name^="entry"]').each(function (index) {
                if ($(this).attr('type') == 'radio') {
                    tit[$(this).attr('name')] = 
                        $(this).closest('.ss-choices').attr('aria-label').trim();
                } else if ($(this).attr('name').indexOf('other_option_response') < 0) {
                    tit[$(this).attr('name')] = 
                        $(this).parent().find('.ss-q-title').text().trim();
                }
            });
            res += "<th>Marca Temporal</th>";
            for(var k in tit) {
                res += "<th>" + tit[k] + "</th>";
            }
            req.onsuccess = function(e) {
                var cursor = e.target.result;
                if (cursor) {
                    ida = cursor.value['id'];
                    if (cursor.value['enviado'] === false) {
                        res += "<tr>";
                        ind = {};
                        itera_cont(cursor.value['contenido'], ind, 
                                fentrada_objeto, fentrada_objeto);
                
                        res += "<td>" + cursor.value['timestamp'] + "</td>";
                        for(var k in tit) {
                            res += "<td>";
                            if (k in ind) {
                                if (ind[k] == '__other_option__') {
                                    res += ind[k + '.other_option_response'];
                                } else {
                                    res += ind[k];
                                }
                            }
                            res += "</td>";
                        };
                        res += "</tr>";
                    }
                    cursor.continue();
                }  else {
                    res += "</table>\n"
                        + "</body>\n"
                        + "</html>\n";
                    nv.document.write(res);
                }
            }

        }

    });
})
