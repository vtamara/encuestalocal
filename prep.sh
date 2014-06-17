#!/bin/sh
# encuestalocal
# Convierte un formulario de Google Docs a versión con almacenamiento local
# y envío cuando esté en línea.
# 2014. vtamara@pasosdeJesus.org

# En directorio con fuentes de este convertidor
# 1. mkdir -p tmp/miencuesta
# 2. En navegador examine encuesta en modo de llenar y descarguela en 
#    tmp/miencuesta --de forma que quede miencuesta.html y miencuesta_files
# 3. Ejecute: 
#    cd tmp/miencuesta
#    ../../prep.sh miencuesta
# 4. Distribuya tmp/miencuesta para llenar la encuesta en computadores donde
#    lo requiere.
p="$0";
a="$1"
bd=`dirname $p`
if (test ! -f "$a.html") then {
	echo "No existe '$a.html'"
	exit 1;
} fi;
if (test -d "${a}_files") then {
	echo "Renombrando directorio";
	mv "${a}_files" "${a}_archivos"
	cp ${a}.html /tmp/${a}.html.archivos
	sed -e "s/_files/_archivos/g" /tmp/${a}.html.archivos > ${a}.html
} fi;
if (test ! -d "${a}_archivos") then {
	echo "Falta ${a}_archivos";
	exit 1;
} fi;
if (test ! -f "${a}_archivos/jquery-2.1.1.min.js") then {
	echo "Copiando jquery";
	(cd ${a}_archivos; ftp "http://code.jquery.com/jquery-2.1.1.min.js")
	(cd ${a}_archivos; ftp "http://code.jquery.com/jquery-2.1.1.min.map")
} fi;

if (test ! -f "${a}_archivos/encuestalocal.js") then {
	echo "Copiando encuestalocal";
	cp ${bd}/encuestalocal.js ${a}_archivos;
} fi;

grep "${a}_archivos/jquery-2.1.1.min.js" ${a}.html > /dev/null
if (test "$?" != "0") then {
	echo "Introduciendo el uso de jquery en formulario";
	cp ${a}.html /tmp/${a}.html.sinjquery
	sed -e "s/<script type=\"text\/javascript\"> *$/<script type=\"text\/javascript\" src=\"${a}_archivos\/jquery-2.1.1.min.js\"\><\/script> &/g" /tmp/${a}.html.sinjquery > ${a}.html
} fi;

grep "${a}_archivos/encuestalocal.js" ${a}.html > /dev/null
if (test "$?" != "0") then {
	echo "Introduciendo el uso de encuestalocal en formulario";
	cp ${a}.html /tmp/${a}.html.sinjs
	sed -e "s/<script type=\"text\/javascript\"> *$/<script type=\"text\/javascript\" src=\"${a}_archivos\/encuestalocal.js\"\/><\/script> &/g" /tmp/${a}.html.sinjs > ${a}.html
<<<<<<< HEAD
} fi;

grep "www.pasosdeJesus.org" ${a}.html > /dev/null
if (test "$?" != "0") then {
	echo "Créditos";
	cp ${a}.html /tmp/${a}.html.sinpasos
	sed -e "s/<div class=\"ss-logo-image\">/& Encuestalocal por <a href=\"https:\/\/www.pasosdeJesus.org\">Pasos de Jesús<\/a>/g" /tmp/${a}.html.sinpasos > ${a}.html
=======
>>>>>>> acee2da1406d4132e96919a1217d34fb5f2454e3
} fi;
