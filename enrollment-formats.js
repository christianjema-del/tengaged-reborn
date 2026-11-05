export const ENROLLMENT_FORMATS={
 fasting:{name:'Fasting',image:'fasting.png',implemented:false},
 casting:{name:'Casting',image:'casting.png',implemented:true,fee:0,capacity:20,description:'20 participantes. Días de 12 horas. Primero llaves; después manzanas + tics verdes; minijuegos para desempatar. Primer día sin nominaciones; final al quedar cinco. Solo admin1 puede iniciar.'},
 frookies:{name:'Frookies',image:'frookies.png',implemented:true,fee:10,capacity:13,description:'13 concursantes. HoH, nominaciones, PoV por minijuego, sustitución y votos de expulsión. Final de dos con jurado de los puestos 9.º a 3.º durante cuatro horas. Entrada: 10 T$. Se inicia al completar plazas; los bots solo los añade admin1.'},
 rookies:{name:'Rookies',image:'rookies.png',implemented:true,fee:0,capacity:13,description:'13 concursantes. Días de 24 horas con HoH, nominaciones por puntos, PoV secreto y final de cuatro. Admite apuestas durante los dos primeros días. Solo admin1 puede iniciar el juego al completar las plazas.'},
 duel:{name:'El Duelo',image:'duel.png',implemented:true,fee:0,capacity:12,description:'12 participantes. Cadena de salvación sin inmunidad, listas ordenadas de preferencias y eliminaciones uno contra uno. Los tres finalistas compiten por la victoria. Solo admin1 puede iniciar; completar las 12 plazas no inicia el juego. Primera versión gratuita, sin premios económicos.'},
 survivor:{name:'Survivor',image:'survivor.png',implemented:false},
 hunger:{name:'Hunger Games',image:'hunger.png',implemented:true,fee:20,capacity:30,description:'Hasta 30 tributos, un superviviente. Comida compartida, armas, flechas, combates y patrocinadores. Solo empieza cuando admin1 pulsa Iniciar. Las plazas libres no se completan automáticamente con bots.'},
 stars:{name:'Stars',image:'stars.svg',implemented:false}
};
