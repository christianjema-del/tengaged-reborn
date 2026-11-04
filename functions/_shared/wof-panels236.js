// Paneles de Wheel of Fortune. Wof.swf impone estas reglas (comprobadas en el juego):
// - Enunciado: una sola linea de hasta 26 caracteres. Su fuente no incluye tildes, enes ni signos.
// - Respuesta: solo A-Z y espacios. El teclado del juego no tiene la Ñ.
// Por eso las respuestas son palabras que no llevan tilde ni Ñ en castellano,
// y los enunciados se escriben sin necesidad de ellas. tests/wof-panels236.test.mjs lo vigila.
export const WOF_PANELS=Object.freeze([
 ['Capital de Italia','ROMA'],['Capital de Portugal','LISBOA'],['Capital de Grecia','ATENAS'],['Capital de Noruega','OSLO'],
 ['Capital de Cuba','LA HABANA'],['Capital de Egipto','EL CAIRO'],['Capital de Argentina','BUENOS AIRES'],['Capital de Austria','VIENA'],
 ['Capital de Chile','SANTIAGO'],['Capital de Venezuela','CARACAS'],['Capital de Uruguay','MONTEVIDEO'],['Capital de Escocia','EDIMBURGO'],
 ['Capital de Inglaterra','LONDRES'],['Capital de Polonia','VARSOVIA'],['Capital de Suecia','ESTOCOLMO'],['Capital de Dinamarca','COPENHAGUE'],
 ['Capital de Ecuador','QUITO'],['Capital de Galicia','SANTIAGO DE COMPOSTELA'],
 ['Ciudad de la Alhambra','GRANADA'],['Ciudad de la Giralda','SEVILLA'],['Ciudad del Camp Nou','BARCELONA'],['Ciudad de las Fallas','VALENCIA'],
 ['Pasa por Zaragoza','EL EBRO'],['Pasa por Madrid','EL MANZANARES'],['Isla mayor de Baleares','MALLORCA'],
 ['Animal que ladra','EL PERRO'],['Insecto que da miel','LA ABEJA'],['Animal con trompa','EL ELEFANTE'],['Animal con joroba','EL CAMELLO'],
 ['Animal de cuello largo','LA JIRAFA'],['Caballo a rayas','LA CEBRA'],['Anfibio que croa','LA RANA'],['Ave que canta al alba','EL GALLO'],
 ['Da leche y hace mu','LA VACA'],['Animal que da lana','LA OVEJA'],['Salta y lleva bolsa','EL CANGURO'],['Vive entre hielos','EL OSO POLAR'],
 ['Plato de Valencia','LA PAELLA'],['Sopa andaluza fresca','EL GAZPACHO'],['Se hace con huevo y patata','LA TORTILLA'],['Bebida de uvas','EL VINO'],
 ['Bebida con espuma','LA CERVEZA'],['Se unta en la tostada','LA MANTEQUILLA'],['Legumbre del cocido','EL GARBANZO'],['Churros con','CHOCOLATE'],
 ['Se toma en cucurucho','EL HELADO'],['Postre de leche y huevo','EL FLAN'],['Base de tomate y queso','LA PIZZA'],['Fruta de la sidra','LA MANZANA'],
 ['Doce en Nochevieja','LAS UVAS'],
 ['Dicho popular','A QUIEN MADRUGA DIOS LE AYUDA'],['Dicho popular','EN ABRIL AGUAS MIL'],['Dicho popular','PERRO LADRADOR POCO MORDEDOR'],
 ['Dicho popular','AL MAL TIEMPO BUENA CARA'],['Dicho popular','A BUEN HAMBRE NO HAY PAN DURO'],['Dicho popular','QUIEN ROMPE PAGA'],
 ['Dicho popular','QUIEN AVISA NO ES TRAIDOR'],['Dicho popular','CADA LOCO CON SU TEMA'],['Dicho popular','DE TAL PALO TAL ASTILLA'],
 ['Dicho popular','OBRAS SON AMORES'],['Dicho popular','A LA TERCERA VA LA VENCIDA'],['Dicho popular','HABLANDO SE ENTIENDE LA GENTE'],
 ['Dicho popular','EL TIEMPO ES ORO'],['Dicho popular','OJO POR OJO DIENTE POR DIENTE'],['Dicho popular','AL PAN PAN Y AL VINO VINO'],
 ['Apaga incendios','EL BOMBERO'],['Cuida a los enfermos','LA ENFERMERA'],['Reparte cartas','EL CARTERO'],['Hace pan cada noche','EL PANADERO'],
 ['Trabaja en una escuela','LA MAESTRA'],['Arregla los grifos','EL FONTANERO'],['Corta el pelo','EL PELUQUERO'],['Trabaja entre fogones','EL COCINERO'],
 ['Escribe noticias','EL PERIODISTA'],['Cuida los dientes','EL DENTISTA'],['Vende filetes','EL CARNICERO'],['Trabaja con madera','EL CARPINTERO'],
 ['Sirve para abrir puertas','LA LLAVE'],['Da la hora','EL RELOJ'],['Se usa cuando llueve','EL PARAGUAS'],['Sirve para barrer','LA ESCOBA'],
 ['Mueble para dormir','LA CAMA'],['Mueble para sentarse','LA SILLA'],['Conserva la comida','LA NEVERA'],['Sirve para verte la cara','EL ESPEJO'],
 ['Sirve para cortar papel','LAS TIJERAS'],['Da luz por la noche','LA BOMBILLA'],['Se ponen en los pies','LOS ZAPATOS'],['Abriga el cuello','LA BUFANDA'],
 ['Tiene hojas y se lee','EL LIBRO'],
 ['Tiene dos ruedas y pedales','LA BICICLETA'],['Transporte del mar','EL BARCO'],['Va bajo tierra','EL METRO'],['Viaja al espacio','EL COHETE'],
 ['Coche de pago','EL TAXI'],['Tren de alta velocidad','EL AVE'],
 ['Sirven para ver','LOS OJOS'],['Sirve para oler','LA NARIZ'],['Tiene cinco dedos','LA MANO'],['Sirven para masticar','LOS DIENTES'],
 ['Brilla en la noche','LA LUNA'],['Astro rey','EL SOL'],['Cae del cielo en invierno','LA NIEVE'],['Sale tras la lluvia','EL ARCO IRIS'],
 ['Agua congelada','EL HIELO'],['Zona seca llena de arena','EL DESIERTO'],['Viene tras la primavera','EL VERANO'],['Mes de la Navidad','DICIEMBRE'],
 ['Primer mes','ENERO'],['Planeta rojo','MARTE'],['Planeta con anillos','SATURNO'],['Planeta en que vivimos','LA TIERRA'],
 ['Autor del Quijote','CERVANTES'],['Pintor del Guernica','PABLO PICASSO'],['Escudero de Don Quijote','SANCHO PANZA'],['Amada de Don Quijote','DULCINEA'],
 ['Deporte de canasta','EL BALONCESTO'],['Deporte de raqueta','EL TENIS'],['Rey dama y peones','EL AJEDREZ'],['Cuarenta cartas','LA BARAJA'],['De oca a oca','LA OCA'],
 ['Reality de la casa','GRAN HERMANO'],['Mago con gafas','HARRY POTTER'],['Princesa de hielo','ELSA'],['Cine de un barco hundido','TITANIC'],['Gorila gigante','KING KONG'],
 ['Vive en Gotham','BATMAN'],['Hombre de acero','SUPERMAN'],['Marinero de Disney','EL PATO DONALD'],['Nariz que crece','PINOCHO'],['Zapato de cristal','LA CENICIENTA'],
 ['Siete enanitos','BLANCANIEVES'],['Seis cuerdas','LA GUITARRA'],['Teclas blancas y negras','EL PIANO'],['Soplas y suena','LA FLAUTA']
].map(([question,answer])=>Object.freeze({question,answer})));
export const WOF_PANELS_PER_GAME=40;
export function wofPanels(random=Math.random){const pool=[...WOF_PANELS];for(let i=pool.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[pool[i],pool[j]]=[pool[j],pool[i]];}return pool.slice(0,WOF_PANELS_PER_GAME).map(p=>({...p}));}
