# encuestalocal #

Convierte un formulario/encuesta de Google Docs a versión con almacenamiento 
local y envío cuando esté en línea.

### ¿Cómo usar? ###

La encuesta se prepara desde el interprete de comandos como ksh de un 
sistema tipo Unix como OpenBSD.   
Los formularios de Google Docs son generados con HTML que no es del todo 
bien soportado por Firefox, por eso recomendamos llenar tanto encuestas de 
Google Docs como estas una vez convertidas desde Chrome (versiones recientes 
que soporte IndexedDB).

En directorio con fuentes de este convertidor

1. mkdir -p tmp/miencuesta


2. En navegador examine encuesta en modo de llenar y descarguela en 
    tmp/miencuesta --de forma que quede miencuesta.html y miencuesta_files

3. Ejecute: 
    cd tmp/miencuesta
    ../../prep.sh miencuesta

4. Distribuya tmp/miencuesta para llenar la encuesta en computadores donde
  lo requiere.


### ¿Con quien me comunico? ###

* Vladimir Támara. vtamara@pasosdeJesus.org
* La oración siempre funciona.
