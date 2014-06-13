# encuestalocal #

Convierte un formulario de Google Docs a versión con almacenamiento local
y envío cuando esté en línea.

### ¿Cómo usar? ###

Hemos preparado encuestas en OpenBSD desde el interprete de comandos ksh, una vez preparada debe
poderse usar con cualquier navegador que soporte IndexedDB.

 En directorio con fuentes de este convertidor
* mkdir -p tmp/miencuesta
* En navegador examine encuesta en modo de llenar y descarguela en 
    tmp/miencuesta --de forma que quede miencuesta.html y miencuesta_files
* Ejecute: 
    cd tmp/miencuesta
    ../../prep.sh miencuesta
* Distribuya tmp/miencuesta para llenar la encuesta en computadores donde
  lo requiere.


### ¿Con quien me comunico? ###

* Vladimir Támara. vtamara@pasosdeJesus.org
* La oración siempre funciona.