import {wordsItems} from './words-list237.js';
import {wofPanels} from './wof-panels236.js';
export function gameData(game,timeleft){
    const responseData={points:0,timeleft};
    if(game==='WORDS')responseData.items=wordsItems();
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
