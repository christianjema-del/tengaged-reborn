import {spawnSync} from 'node:child_process';
import {mkdirSync,writeFileSync,chmodSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {readSnapshot190,audit,repairSql,repairRequests190,validateTriggers} from './tools/prize-audit189.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));process.chdir(root);
const apply=process.argv.includes('--reparar'),stamp=new Date().toISOString().replace(/[:.]/g,'-'),dir=path.join(root,'..','Tengaged-Auditoria-Premios',stamp);mkdirSync(dir,{recursive:true,mode:0o700});
function wrangler(args){const r=spawnSync('npx',['--yes','wrangler','d1','execute','tengaged-reborn-db','--remote','--json',...args],{encoding:'utf8',maxBuffer:100*1024*1024,cwd:root});if(r.status!==0)throw Error((r.stderr||r.stdout||'Wrangler no ha podido acceder a D1').slice(-4000));let data;try{data=JSON.parse(r.stdout);}catch{throw Error('Wrangler no ha devuelto JSON válido. No continúes con un pago manual.');}if(!Array.isArray(data)||data.some(x=>x.success===false))throw Error('La base de datos ha rechazado la consulta.');return data.flatMap(x=>x.results||[]);}
const save=(name,data)=>{const p=path.join(dir,name);writeFileSync(p,typeof data==='string'?data:JSON.stringify(data,null,2),{mode:0o600});chmodSync(p,0o600);return p;};
function summary(r){console.log(`Partidas revisadas: ${r.totals.games}. Premios de usuarios reales: ${r.totals.awards}. Pendientes: ${r.totals.pending}. Faltan: ${r.totals.karma} karma y ${r.totals.money} T$.`);console.log(`admin1 y mod excluidos. Incidencias que requieren revisión: ${r.issues.length}. Pagos superiores al premio actual: ${r.totals.overpaid} (no se retiran).`);}
const snapshot=()=>readSnapshot190(sql=>wrangler(['--command',sql]),source=>console.log('Leyendo '+source+'…'));
try{
 console.log('Auditoría V190: consultas simples y paginadas. No se reinicia ni avanza ninguna partida.');
 const before=snapshot();save('antes.json',before);const report=audit(before);save('revision-antes.json',report);summary(report);
 if(apply){validateTriggers(before);save('reparacion.sql',repairSql(report,stamp));const requests=repairRequests190(report,stamp);for(let i=0;i<requests.length;i++){if(i===0||i%10===0)console.log('Comprobando abonos: '+i+'/'+(requests.length-1));wrangler(['--command',requests[i]]);}
  const after=snapshot();save('despues.json',after);const checked=audit(after);save('revision-despues.json',checked);
  const journal=wrangler(['--command',`SELECT username,game_type,game_id,placement,delta_karma,delta_money FROM prize_audit189 WHERE batch_id='${stamp}' ORDER BY username,game_type,game_id`]);save('abonos.json',journal);
  console.log('Comprobación posterior:');summary(checked);console.table(journal.map(r=>({usuario:r.username,juego:r.game_type,partida:r.game_id,puesto:r.placement,karma:r.delta_karma,'T$':r.delta_money})));
  const protectedNames=['admin1','mod'];for(const u of before.users.filter(u=>protectedNames.includes(u.username.toLowerCase()))){const v=after.users.find(v=>v.id===u.id);if(!v||u.karma!==v.karma||u.t_money!==v.t_money){console.log('AVISO: el saldo de '+u.username+' cambió durante la ejecución por otra operación; esta auditoría lo excluye.');}}
  if(checked.totals.pending||checked.issues.length){console.log('Quedan incidencias o cambios concurrentes. Envía revision-despues.json para revisarlos.');process.exitCode=2;}else console.log('Todos los premios comprobables están cubiertos por sus registros de pago.');
 }else console.log('Solo revisión. Para completar los premios pendientes: node auditar-premios190.mjs --reparar');
 console.log('Informe y copia anterior: '+dir);
}catch(e){console.error('No se ha podido completar la auditoría: '+e.message);console.error('Conserva los archivos de '+dir+'. Si hubo una interrupción, vuelve a ejecutar el mismo comando: los recibos evitan repetir los abonos.');process.exitCode=1;}
