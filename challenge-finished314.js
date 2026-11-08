// V314: resultado de la prueba como en tengaged.es (2014): recuadro azul con
// "Felicidades. Has terminado tu prueba" y los puntos en grande. Sin letras verdes.
export function finishedTitle(node){const b=document.createElement('strong');b.textContent='Felicidades.';node.replaceChildren(b,document.createTextNode(' Has terminado tu prueba'));return node;}
export function showFinished(node,points){
 if(!node)return;const p=finishedTitle(document.createElement('p')),score=document.createElement('div'),n=document.createElement('span'),label=document.createElement('span');
 p.className='tg-finished-title';score.className='tg-finished-score';n.className='tg-finished-points';label.className='tg-finished-label';
 n.textContent=String(Number(points)||0);label.textContent='puntos';score.append(n,label);
 node.classList.add('tg-finished');node.replaceChildren(p,score);node.hidden=false;
}
export function clearFinished(node){if(!node)return;node.classList.remove('tg-finished');node.replaceChildren();}
