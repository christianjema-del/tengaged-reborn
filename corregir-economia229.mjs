import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync} from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {plan229,sql229} from './tools/economy-fix229.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));process.chdir(root);
const args=process.argv.slice(2);if(args.length!==1||args[0]!=='--aplicar'){console.log('Descuenta solo los excesos revisados de Casting 7 y 8: 94 karma y 36 T$.\nHunger, admin1 y mod no se modifican.\nEjecuta: node corregir-economia229.mjs --aplicar');process.exit(0);}
const out=path.resolve(root,'..','Tengaged-Correccion-Economia',new Date().toISOString().replace(/[:.]/g,'-'));mkdirSync(out,{recursive:true,mode:0o700});
const save=(n,d)=>writeFileSync(path.join(out,n),typeof d==='string'?d:JSON.stringify(d,null,2),{mode:0o600});
function run(extra){const r=spawnSync('npx',['--yes','wrangler','d1','execute','tengaged-reborn-db','--remote','--json',...extra],{encoding:'utf8',maxBuffer:30*1024*1024});if(r.status!==0)throw Error((r.stderr||r.stdout).slice(-2500));const d=JSON.parse(r.stdout);if(!Array.isArray(d)||d.some(x=>x.success===false))throw Error('Respuesta de D1 incompleta');return d.flatMap(x=>x.results||[]);}
try{
 save('plan.json',plan229);
 save('usuarios-antes.json',run(['--command','SELECT id,username,karma,t_money FROM users ORDER BY id']));
 save('recibos-antes.json',run(['--command','SELECT * FROM casting_results WHERE match_id IN (7,8)']));
 save('ajuste.sql',sql229());console.log('Aplicando corrección con recibos únicos y comprobación de puestos y premios…');
 run(['--file',path.join(out,'ajuste.sql')]);
 const ledger=run(['--command','SELECT * FROM economy_fix229 ORDER BY match_id,user_id']);save('ajustes-aplicados.json',ledger);
 if(!plan229.every(([m,id])=>ledger.some(r=>r.match_id===m&&r.user_id===id)))throw Error('Faltan ajustes por verificar.');
 save('usuarios-despues.json',run(['--command','SELECT id,username,karma,t_money FROM users ORDER BY id']));
 console.log('Corrección verificada: los 8 ajustes constan registrados. Repetir el comando no vuelve a descontar.\nCopias e informe: '+out+'\nAhora ejecuta: node revisar-economia228.mjs');
}catch(e){console.error('No se ha podido completar: '+e.message+'\nArchivos conservados en '+out+'\nPuede haber ajustes ya aplicados. El registro evita repetirlos al ejecutar de nuevo el mismo comando.');process.exitCode=1;}
