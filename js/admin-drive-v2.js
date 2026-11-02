import {driveStatus} from '/js/annales-drive-status.mjs?v=drive-20261102c';
const $=id=>document.getElementById(id);
const pause=ms=>new Promise(r=>setTimeout(r,ms));
export function initDriveScanner({call,actionFeedback,onSelectionChange,onAuthError}){
 let available=false,checking=false,items=[];
 const button=$('check-drive-files'),select=$('select-drive-changed'),message=$('drive-status-message');
 function controls(){button.disabled=!available||checking;select.disabled=!available||checking||!items.some(x=>['changed','new'].includes(x.status.code));}
 function clear(){items=[];document.querySelectorAll('#annales-selection .drive-badge').forEach(x=>x.remove());controls();}
 function paint(rows){
  clear();items=rows.map(x=>({...x,status:driveStatus(x)}));
  for(const i of items){const input=[...document.querySelectorAll('#annales-selection input')].find(x=>Number(x.dataset.year)===i.year&&x.dataset.track===i.track);if(!input)continue;const badge=document.createElement('span');badge.className='drive-badge drive-badge--'+i.status.tone;badge.textContent=i.status.label;let info=i.status.description;if(i.yearPublishedAt&&Number.isFinite(Date.parse(i.yearPublishedAt)))info+=' Dernière publication de l’année : '+new Date(i.yearPublishedAt).toLocaleString('fr-FR')+' (pas nécessairement pour cette épreuve).';badge.title=info;badge.tabIndex=0;badge.setAttribute('aria-label',i.status.label+' · '+info);input.parentElement.append(' ',badge);}
  controls();
 }
 async function check(){
  if(!available||checking)return;checking=true;clear();controls();actionFeedback(button,{key:'drive-check',message:'Vérification des modifications sur Drive…',busy:true,tone:'working',start:Date.now(),estimateSeconds:60});message.textContent='Comparaison des documents en cours.';
  try{
   const s=await call('annales-drive-v2?action=start',{method:'POST'});if(!s.scan_id||!s.commit)throw Error('Demande de vérification invalide');
   let result;for(let attempt=0;attempt<60;attempt++){await pause(3000);result=await call('annales-drive-v2?action=check&id='+encodeURIComponent(s.scan_id)+'&sha='+encodeURIComponent(s.commit));if(result.status==='completed')break;if(result.status!=='pending')throw Error('État de vérification invalide');}
   if(result?.status!=='completed'||!Array.isArray(result.items))throw Error('La vérification prend trop de temps. Réessaie plus tard.');
   paint(result.items);actionFeedback(button,{key:'drive-check',message:'✓ Vérification terminée.',tone:'success'});const modified=items.filter(x=>['changed','new'].includes(x.status.code)).length,missing=items.filter(x=>x.status.code==='missing').length,unknown=items.filter(x=>x.status.code==='unknown').length;
   message.textContent='Vérifié le '+new Date(result.checked_at).toLocaleString('fr-FR')+' · '+modified+' épreuve(s) à générer'+(missing?' · '+missing+' fichier(s) introuvable(s)':'')+(unknown?' · '+unknown+' état(s) à vérifier':'')+'. Aucune génération ni publication effectuée.';
  }catch(e){clear();actionFeedback(button,{key:'drive-check',message:'Vérification non confirmée.',tone:'error'});message.textContent='Vérification non confirmée : aucun état « à jour » n’est affiché. '+(e.code?'Code : '+e.code+'. ':'')+(e.message||'Réessaie.');onAuthError(e);}
  finally{checking=false;controls();}
 }
 function selectChanged(){
  if(!available||checking)return;const inputs=[...document.querySelectorAll('#annales-selection input')],count=inputs.filter(i=>i.checked).length;let room=Math.max(0,6-count),added=0,remaining=0;
  for(const i of items.filter(i=>['changed','new'].includes(i.status.code))){const input=inputs.find(x=>Number(x.dataset.year)===i.year&&x.dataset.track===i.track);if(!input||input.checked)continue;if(room>0){input.checked=true;room--;added++;}else remaining++;}
  onSelectionChange();message.textContent=added+' épreuve(s) ajoutée(s) à la sélection.'+(remaining?' '+remaining+' autre(s) à traiter après cette génération (maximum 6).':'');
 }
 button.addEventListener('click',()=>void check());select.addEventListener('click',selectChanged);
 return {setAvailable(v){available=v;controls();},catalogChanged(){clear();message.textContent='Vérifie les fichiers Drive pour actualiser les signalements.';}};
}
