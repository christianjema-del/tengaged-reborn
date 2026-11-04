import {wofPanels} from './wof-panels236.js';
export function gameData(game,timeleft){
    const dictionary=[
      ['Animal','TIGER'],['Nature','ISLAND'],['Food','AVOCADO'],
      ['Object','COMPASS'],['Animal','PENGUIN'],['Nature','CANYON'],
      ['Food','LOBSTER'],['Object','CALENDAR'],['Nature','THUNDER'],
      ['Activity','READING'],['Animal','DOLPHIN'],['Object','BICYCLE'],
      ['Food','PANCAKE'],['Nature','DESERT'],['Animal','ELEPHANT'],
      ['Object','TELESCOPE']
    ];
    const items=Array.from({length:64},(_,i)=>({question:dictionary[i%dictionary.length][0],answer:dictionary[i%dictionary.length][1]}));
    const responseData={points:0,timeleft};
    if(game==='WORDS')responseData.items=items;
    if(game==='WOF')responseData.items=wofPanels();
    if(game==='MATCHTHREE'){
      // Contrato de prueba específico. Los símbolos se observan en MatchThree.swf;
      // la estructura exacta del backend original no está documentada.
      responseData.timeleft=timeleft;
      responseData.gameTotalTimeLeft=timeleft;
      responseData.points=0;
      responseData.dataPoints=0;
      responseData.finalPoints=0;
      responseData.total_won=0;
    }
return responseData;
}
