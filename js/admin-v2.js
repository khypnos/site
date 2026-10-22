import {supabase,requireAuth} from '/espace-client/auth.js';
import {checkAdminAccess} from '/js/admin-access-v2.js';
const API='https://fbxiynomlxrjasbbcipp.supabase.co/functions/v1/';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const active=new Set(['dispatching','submission_unknown','generation_queued','generating','publication_queued','publishing']);
const statuses={dispatching:'Préparation du lancement',submission_unknown:'Soumission à vérifier — ne pas relancer',generation_queued:'Génération en attente',generating:'Génération en cours',awaiting_review:'Aperçus prêts à relire',generation_cancelled:'Demande abandonnée — aucun PDF publiable',generation_failed:'Échec de génération',publication_queued:'Publication en attente',publishing:'Publication en cours',published:'Publication et cache confirmés',partially_published:'Publication partielle validée — autres épreuves à relire',published_cache_pending:'PDF publiés — cache à actualiser',publication_attention:'Publication à contrôler avant toute reprise'};
let allowed=false,jobs=[],current=null,busy=false,refreshing=false,requestId=null,blobUrl=null,loading=false,loadSequence=0,selectedId=null,generationTrackedId=null;
const reviewed=new Map();
const reviewPanel=$('review-panel');
const generationStates=new Set(['dispatching','submission_unknown','generation_queued','generating']);
function identity(j){return new Date(j.created_at).toLocaleString('fr-FR')+' · Génération '+j.id.slice(0,8)+(j.generation_run_id?' · Run #'+j.generation_run_id:'');}
function upsertJob(j){const at=jobs.findIndex(x=>x.id===j.id);if(at<0)jobs.unshift(j);else jobs[at]=j;}

function deny(){allowed=false;$('admin-tools').hidden=true;window.location.replace('/espace-client/index.html?admin=refuse');}
function explain(e){
 if(e.code==='IDENTIFIANT_REQUETE_INDISPONIBLE')return 'Le navigateur ne permet pas de créer un identifiant sécurisé. Ouvre le site sur localhost ou en HTTPS. Aucune demande envoyée.';
 if(e.status===401)return 'Session expirée. Reconnecte-toi.';
 if(e.status===403)return 'Accès réservé aux administrateurs autorisés.';
 if(e.code?.startsWith('CONFIGURATION_MANQUANTE_'))return 'Configuration manquante côté Supabase : '+e.code.replace('CONFIGURATION_MANQUANTE_','')+'.';
 if(e.code==='EXECUTION_GITHUB_PRESENTE_ACTUALISER_OU_ANNULER_DANS_GITHUB')return 'Une exécution GitHub existe désormais. Actualise le suivi ; pour l’arrêter, utilise Annuler dans GitHub. La demande n’a pas été abandonnée.';
 if(e.code==='DEMARRAGE_TROP_RECENT_ATTENDRE')return 'Le démarrage est trop récent : attendre cinq minutes avant de vérifier un abandon.';
 if(e.code==='SOUMISSION_NON_RECONCILIEE_ABANDON_REFUSE')return 'La réception de la demande reste incertaine. Abandon refusé : conserver le suivi et faire vérifier la soumission.';
 if(e.code==='UN_TRAITEMENT_EST_DEJA_EN_COURS')return 'Un traitement est déjà actif. Consulte son suivi avant de relancer.';
 if(e.code?.startsWith('GITHUB_'))return 'Accès GitHub indisponible ('+e.code+'). Vérifie le token et ses permissions ; ne multiplie pas les lancements.';
 return 'Opération non confirmée. '+(e.code?'Code : '+e.code+'. ':'')+'Actualise le suivi avant toute nouvelle tentative.';
}
const lastLog=new Map();
function activity(scope,message,tone='idle',spinning=false,{record=true,key=message}={}){
 const ids={catalogue:'refresh-result',generation:'generation-feedback',follow:'pipeline-result'};
 $(ids[scope]).textContent=message;$(ids[scope]).hidden=false;
 $(scope+'-activity').dataset.tone=tone;$(scope+'-spinner').hidden=!spinning;
 if(record&&lastLog.get(scope)!==key){lastLog.set(scope,key);const li=document.createElement('li'),t=document.createElement('time'),txt=document.createElement('span');t.textContent=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});txt.textContent=message;li.append(t,txt);$(scope+'-log').append(li);while($(scope+'-log').children.length>12)$(scope+'-log').firstChild.remove();}
}
function feedback(message,tone='idle',spinning=false){activity('generation',message,tone,spinning);}
function showError(e,scope='follow'){activity(scope,explain(e),'error');if(e.status===401||e.status===403)deny();}
function jobState(j){const pending=active.has(j.status),warning=['submission_unknown','published_cache_pending','publication_attention'].includes(j.status),error=j.status==='generation_failed';let message=statuses[j.status]??j.status;if(j.status==='awaiting_review')message+=' — aucune publication effectuée.';activity('follow',message,error?'error':warning?'warning':pending?'working':'success',pending,{key:j.id+':'+j.status});}
const startUnconfirmed=j=>j?.error_code==='DEMARRAGE_GITHUB_NON_CONFIRME'&&!j.publication_id&&!j.generation_run_id&&['dispatching','submission_unknown','generation_queued'].includes(j.status);
function generationState(j){generationTrackedId=j.id;generationLink(j);const stalled=startUnconfirmed(j),pending=generationStates.has(j.status),warning=j.status==='submission_unknown'||stalled||j.status==='generation_cancelled',failed=j.status==='generation_failed';let text=summary(j)+' · '+identity(j)+' — '+(stalled?'Démarrage GitHub non confirmé depuis plus de cinq minutes. Aucun aperçu disponible. Vérifie GitHub ou abandonne cette demande.':statuses[j.status]??j.status);if(j.status==='awaiting_review')text+=' ✅ Ouvre sa tuile ci-dessous pour relire ; rien n’est publié.';activity('generation',text,failed?'error':warning?'warning':pending?'working':'success',pending&&!stalled,{key:j.id+':'+j.status+':'+j.error_code});const b=$('cancel-pending-generation');if(b){b.hidden=!stalled;b.disabled=busy||loading||refreshing;}}

function closeReview(){selectedId=null;current=null;loading=false;loadSequence++;reviewPanel.hidden=true;$('review-parking').append(reviewPanel);$('job-detail').innerHTML='';renderJobs();controls();}
async function call(route,{method='GET',body,binary=false}={}){
 const {data,error}=await supabase.auth.getSession();if(error||!data?.session)throw Object.assign(new Error(),{status:401});
 const res=await fetch(API+route,{method,headers:{Authorization:'Bearer '+data.session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(binary?90000:45000)});
 if(res.ok&&binary){if(!(res.headers.get('content-type')??'').startsWith('application/pdf'))throw Object.assign(new Error(),{code:'PDF_INATTENDU'});return res.blob();}
 const payload=await res.json().catch(()=>({}));if(!res.ok)throw Object.assign(new Error(),{status:res.status,code:payload.error??payload.code});return payload;
}
const api=(action,body)=>call('annales-admin-v2?action='+action,{method:body?'POST':'GET',body});
function newRequestId(){
 if(typeof globalThis.crypto?.randomUUID==='function')return globalThis.crypto.randomUUID();
 if(typeof globalThis.crypto?.getRandomValues!=='function')throw Object.assign(new Error(),{code:'IDENTIFIANT_REQUETE_INDISPONIBLE'});
 const b=globalThis.crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;
 const h=[...b].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);
}
function generationLink(j){
 const link=$('generation-actions-link');if(!link)return;
 const id=j?.generation_run_id,valid=Number.isSafeInteger(Number(id))&&Number(id)>0;
 link.href=valid?'https://github.com/khypnos/publi_khypnos/actions/runs/'+Number(id):'https://github.com/khypnos/publi_khypnos/actions?query='+encodeURIComponent('branch:test/compilation-annale-2021');
 link.textContent=valid?'Voir cette génération dans GitHub Actions ↗':'Ouvrir GitHub Actions — branche de test ↗';link.hidden=false;
}
function selection(){return [...document.querySelectorAll('#annales-selection input:checked')].map(x=>({year:Number(x.dataset.year),track:x.dataset.track}));}
function controls(){const cancel=$('cancel-pending-generation');if(cancel)cancel.disabled=!allowed||busy||loading||refreshing;const count=selection().length;$('selection-count').textContent=count+' épreuve(s) sélectionnée(s) — maximum 6 par génération.';$('generate-previews').disabled=!allowed||busy||loading||refreshing||count<1||count>6||jobs.some(j=>active.has(j.status));$('refresh-v2').disabled=!allowed||busy||loading||refreshing;$('refresh-jobs').disabled=!allowed||busy||refreshing||loading;$('refresh-jobs').setAttribute('aria-busy',String(refreshing||loading));document.querySelectorAll('[data-job]').forEach(b=>b.disabled=busy||active.has(jobs.find(j=>j.id===b.dataset.job)?.status)||jobs.find(j=>j.id===b.dataset.job)?.status==='generation_cancelled');document.querySelectorAll('#annales-selection input,#annales-selection button').forEach(b=>b.disabled=busy);if(busy||loading||refreshing)document.querySelectorAll('#job-detail button,#job-detail input').forEach(b=>b.disabled=true);}
function catalog(rows){$('annales-selection').innerHTML=[...rows].sort((a,b)=>b.annee_session-a.annee_session).map(r=>`<fieldset><legend>${esc(r.annee_session)}</legend>${['fondamentale','pratique'].map(t=>`<label><input type="checkbox" data-year="${esc(r.annee_session)}" data-track="${t}"> ${t==='fondamentale'?'Fondamentale':'Pratique'}</label>`).join('')}<button type="button" class="v2-both" data-both="${esc(r.annee_session)}">Les deux</button></fieldset>`).join('');controls();}
$('annales-selection').addEventListener('change',controls);
$('annales-selection').addEventListener('click',e=>{const b=e.target.closest('[data-both]');if(!b||busy)return;const xs=[...b.closest('fieldset').querySelectorAll('input')],yes=!xs.every(x=>x.checked);xs.forEach(x=>x.checked=yes);controls();});
function summary(j){return j.selection.map(x=>x.year+' '+x.track).join(' · ');}
function renderJobs(){
 // Keep the same detail and console nodes (and their listeners) while moving them
 // under the selected card. The detail never appears below the whole list.
 reviewPanel.remove();
 $('jobs-list').innerHTML=jobs.length?jobs.map(j=>{const stalled=startUnconfirmed(j),locked=active.has(j.status)||j.status==='generation_cancelled',ready=['awaiting_review','partially_published'].includes(j.status),opened=j.id===selectedId;return `<article class="admin-job-card ${opened?'is-open':''} ${ready?'is-ready':''} ${locked?'is-locked':''}" data-card="${esc(j.id)}"><button type="button" class="v2-job ${opened?'is-current':''}" data-job="${esc(j.id)}" ${locked?'disabled':''} aria-expanded="${opened}" aria-controls="job-detail"><strong>${esc(summary(j))}</strong><span class="admin-job-badge">${ready?'✅ ':''}${esc(stalled?'Démarrage GitHub non confirmé':statuses[j.status]??j.status)}</span><small>${esc(identity(j))}</small><span class="admin-job-hint">${j.status==='generation_cancelled'?'Demande abandonnée : aucun aperçu ne peut être publié.':stalled?'🔒 Aucun run retrouvé : vérifier ou abandonner dans « Générer les aperçus ».':locked?(generationStates.has(j.status)?'🔒 Génération en cours : voir le suivi dans « Générer les aperçus ».':'🔒 Publication en cours : attendre la confirmation.'):(opened?'Refermer cette génération ▴':'Ouvrir cette génération ▾')}</span></button><div data-slot="${esc(j.id)}"></div></article>`;}).join(''):'<p>Aucun traitement V2 pour le moment.</p>';
 const slot=[...document.querySelectorAll('[data-slot]')].find(x=>x.dataset.slot===selectedId);
 if(slot){slot.append(reviewPanel);reviewPanel.hidden=false;}else{$('review-parking').append(reviewPanel);reviewPanel.hidden=true;}
 controls();
}
function reviewKey(j,k){return j.id+':'+k;}
function renderCurrent(){
 const j=current;if(!j){$('job-detail').innerHTML='';return;}
 const canPublish=['awaiting_review','partially_published'].includes(j.status);
 let html=`<div class="admin-open-identity"><strong>Génération ouverte : ${esc(summary(j))}</strong><small>${esc(identity(j))}</small></div><p class="v2-job-status">${esc(statuses[j.status]??j.status)}</p>`;
 if(j.error_code)html+=`<p class="v2-warning">${esc(j.error_code)}</p>`;
 if(j.generation_run_id)html+=`<a href="https://github.com/khypnos/publi_khypnos/actions/runs/${Number(j.generation_run_id)}" target="_blank" rel="noopener">Journal technique de génération ↗</a>`;
 if(j.publication_run_id)html+=` · <a href="https://github.com/khypnos/publi_khypnos/actions/runs/${Number(j.publication_run_id)}" target="_blank" rel="noopener">Journal de publication ↗</a>`;
 if(j.status==='submission_unknown')html+='<p>Le lancement a peut-être été reçu par GitHub. Le suivi tente de retrouver la demande ; ne crée pas une nouvelle demande et ne supprime pas ce suivi pour contourner le blocage.</p>';
 for(const i of j.manifest?.items??[]){
  const done=j.published_keys.includes(i.key),p=i.pdfs?.find(p=>p.kind==='enrichi'),read=reviewed.get(reviewKey(j,i.key))===p?.sha256;
  html+=`<article class="v2-review-item"><h4>${esc(i.year)} — ${esc(i.track)}</h4>`;
  if(i.status==='failed')html+=`<p class="v2-warning">Échec : ${esc(i.error)}</p>`;
  else {html+=`<p>${done?'✅ Publication confirmée':i.baseline.sha256?'Un PDF existe déjà dans cette propriété ; un remplacement demandera confirmation.':'Aucun PDF actuellement dans cette propriété.'}</p><button type="button" data-preview="${esc(i.key)}" data-kind="enrichi">Relire l’enrichi étudiant</button>`;
   if(canPublish&&!done)html+=`<label class="v2-reviewed"><input type="checkbox" data-reviewed="${esc(i.key)}" ${read?'checked':''} ${j.viewed_hashes?.[i.key]===p.sha256?'':'disabled'}> J’ai relu cet enrichi et je veux le publier.</label><small>Ouvrir l’enrichi avant de cocher. Seuls les enrichis sont générés sur GitHub et publiés sur Notion.</small>`;
  }html+='</article>';
 }
 if(canPublish)html+='<button type="button" id="publish-reviewed">Publier les enrichis cochés et relus</button><p>Publie les fichiers de cette génération, sans nouvelle compilation ; actualise automatiquement le cache V2 après réussite.</p>';
 if(j.status==='published_cache_pending')html+='<button type="button" id="retry-refresh">Réessayer uniquement l’actualisation du cache</button><p>Les PDF sont déjà publiés. Cette action ne les renvoie pas.</p>';
 if(j.status==='publication_attention')html+='<p class="v2-warning">Ne pas republier à l’aveugle : contrôler les reçus et les propriétés Notion. Aucune reprise automatique d’une publication incertaine.</p>';
 $('job-detail').innerHTML=html;$('publish-reviewed')?.toggleAttribute('disabled',busy||loading);controls();
}
async function listJobs(){const d=await api('list');jobs=d.jobs;renderJobs();}
async function loadJob(id){
 const candidate=jobs.find(j=>j.id===id);if(!candidate||active.has(candidate.status)||candidate.status==='generation_cancelled'||busy)return;
 if(selectedId===id&&!loading){closeReview();return;}
 const seq=++loadSequence;selectedId=id;current=null;loading=true;renderJobs();$('job-detail').setAttribute('aria-busy','true');
 $('job-detail').innerHTML='<div class="admin-activity-loading"><span class="admin-activity-spinner" aria-hidden="true"></span><strong>Ouverture de cet aperçu…</strong><p>'+esc(identity(candidate))+'</p></div>';
 activity('follow','Ouverture de l’aperçu sélectionné : '+identity(candidate)+'. Aucun lancement de génération.','working',true,{key:'load:'+id});
 try{const d=await call('annales-admin-v2?action=job&id='+encodeURIComponent(id));if(seq!==loadSequence)return;upsertJob(d.job);if(active.has(d.job.status)){closeReview();if(generationStates.has(d.job.status))generationState(d.job);return;}current=d.job;loading=false;renderJobs();renderCurrent();jobState(current);}
 catch(e){if(seq!==loadSequence)return;current=null;$('job-detail').innerHTML='<p class="v2-warning">Aperçu non chargé. Referme puis rouvre cette tuile pour réessayer. Aucune action de publication disponible.</p>';showError(e);}
 finally{if(seq===loadSequence){loading=false;$('job-detail').setAttribute('aria-busy','false');controls();}}
}
async function refreshFollow(){
 if(!allowed||refreshing||busy||loading||$('admin-pdf-dialog').open)return;
 refreshing=true;const seq=loadSequence;controls();let scope='generation';
 try{
  const d=await api('list');if(seq!==loadSequence)return;jobs=d.jobs;
  // Poll the running job even when a different, older preview is open.
  const running=jobs.filter(j=>active.has(j.status));
  for(const snapshot of running){scope=generationStates.has(snapshot.status)&&!snapshot.publication_id?'generation':'follow';const d=await call('annales-admin-v2?action=job&id='+encodeURIComponent(snapshot.id));if(seq!==loadSequence)return;upsertJob(d.job);if(scope==='generation')generationState(d.job);else if(selectedId===d.job.id){current=d.job;jobState(current);}}
  const tracked=jobs.find(j=>j.id===generationTrackedId)??jobs.find(j=>generationStates.has(j.status)&&!j.publication_id)??jobs[0];
  if(tracked&&!tracked.publication_id)generationState(tracked);
  if(selectedId){const latest=jobs.find(j=>j.id===selectedId);if(latest)current=latest;else{selectedId=null;current=null;}}
  renderJobs();if(current){renderCurrent();if(!generationStates.has(current.status))jobState(current);}
 }catch(e){if(seq===loadSequence)showError(e,scope);}
 finally{refreshing=false;if(!busy&&!loading&&current)renderCurrent();controls();}
}
$('jobs-list').addEventListener('click',e=>{const b=e.target.closest('[data-job]');if(!b||busy||b.disabled)return;void loadJob(b.dataset.job);});
$('refresh-jobs').addEventListener('click',refreshFollow);
$('cancel-pending-generation').addEventListener('click',async()=>{
 if(!allowed||busy||loading||refreshing)return;
 const j=jobs.find(j=>j.id===generationTrackedId);if(!startUnconfirmed(j))return;
 if(!confirm('Abandonner cette demande : '+summary(j)+' — '+identity(j)+' ?\n\nLe serveur vérifiera à nouveau GitHub. Aucun PDF de cette demande ne pourra être publié depuis cet outil. Une exécution GitHub démarrant tardivement pourrait néanmoins compiler : ce bouton ne la tue pas.\n\nAucune nouvelle génération ne sera lancée automatiquement.'))return;
 busy=true;controls();feedback('Vérification GitHub avant abandon… aucune nouvelle génération.','working',true);
 try{const d=await api('cancel-generation',{id:j.id,confirm_abandon:true});upsertJob(d.job);requestId=null;generationState(d.job);renderJobs();}
 catch(e){showError(e,'generation');}
 finally{busy=false;controls();}
});

$('generate-previews').addEventListener('click',async()=>{
 if(!allowed||busy||loading||refreshing)return;const xs=selection();if(xs.length<1||xs.length>6)return;
 if(!confirm('Générer les aperçus de :\n'+xs.map(x=>x.year+' — '+x.track).join('\n')+'\n\nAucun PDF ne sera publié. Les sources doivent être enregistrées dans Drive.'))return;
 busy=true;controls();$('generate-previews').textContent='Envoi en cours…';$('generate-previews').setAttribute('aria-busy','true');
 feedback('Envoi de la demande de génération… Aucun lancement encore confirmé.','working',true);generationLink(null);
 try{
  requestId??=newRequestId();
  const d=await api('generate',{id:requestId,selection:xs});requestId=null;upsertJob(d.job);generationTrackedId=d.job.id;renderJobs();generationState(d.job);
 }catch(e){showError(e,'generation');}
 finally{busy=false;$('generate-previews').textContent='Générer les aperçus';$('generate-previews').setAttribute('aria-busy','false');renderCurrent();controls();}
 if(jobs.some(j=>active.has(j.status)))void refreshFollow();
});
function closePreview(){const dlg=$('admin-pdf-dialog');dlg.close();$('admin-pdf-frame').src='about:blank';if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null;}}
$('close-admin-pdf').addEventListener('click',closePreview);$('admin-pdf-dialog').addEventListener('cancel',e=>{e.preventDefault();closePreview();});
$('job-detail').addEventListener('change',e=>{const input=e.target.closest('[data-reviewed]');if(!input||!current||busy||loading)return;const i=current.manifest.items.find(i=>i.key===input.dataset.reviewed),hash=i.pdfs.find(p=>p.kind==='enrichi').sha256;if(input.checked)reviewed.set(reviewKey(current,i.key),hash);else reviewed.delete(reviewKey(current,i.key));});
$('job-detail').addEventListener('click',async e=>{
 if(busy||loading||refreshing||!current)return;const preview=e.target.closest('[data-preview]');
 if(preview){busy=true;controls();activity('follow','Chargement du PDF pour relecture…','working',true);preview.disabled=true;const j=current,key=preview.dataset.preview,kind=preview.dataset.kind;
  try{const blob=await call('annales-admin-v2?action=preview&id='+j.id+'&key='+encodeURIComponent(key)+'&kind='+kind,{binary:true});blobUrl=URL.createObjectURL(blob);$('admin-pdf-frame').src=blobUrl;$('admin-pdf-label').textContent=key+' — '+kind+' · '+identity(j);$('admin-pdf-dialog').showModal();if(kind==='enrichi'){const p=j.manifest.items.find(i=>i.key===key).pdfs.find(p=>p.kind==='enrichi');j.viewed_hashes[key]=p.sha256;}activity('follow','PDF ouvert pour relecture — aucune publication effectuée.','success');renderCurrent();}catch(e){showError(e);}finally{busy=false;renderCurrent();controls();preview.disabled=false;}return;
 }
 if(e.target.closest('#publish-reviewed')){
  const j=current,items=j.manifest.items.filter(i=>i.status==='generated'&&!j.published_keys.includes(i.key)&&reviewed.get(reviewKey(j,i.key))===i.pdfs.find(p=>p.kind==='enrichi').sha256);
  if(!items.length){activity('follow','Ouvre et relis au moins un enrichi, puis coche sa validation.','warning');return;}
  const replace=items.some(i=>i.baseline.sha256&&i.baseline.sha256!==i.pdfs.find(p=>p.kind==='enrichi').sha256);
  if(!confirm('Publier les enrichis de cette génération : '+identity(j)+'\n\nÉpreuves :\n'+items.map(i=>i.year+' — '+i.track).join('\n')+(replace?'\n\nAttention : les PDF existants de ces épreuves seront remplacés.':'')+'\n\nAucune modification du statut, de la promotion minimale ou des ressources. Aucun PDF imprimé.'))return;
  busy=true;renderCurrent();controls();activity('follow','Envoi de la demande de publication… résultat non encore confirmé.','working',true);
  try{const hashes=Object.fromEntries(items.map(i=>[i.key,i.pdfs.find(p=>p.kind==='enrichi').sha256]));const d=await api('publish',{id:j.id,keys:items.map(i=>i.key),reviewed_hashes:hashes,review_confirmed:true,confirm_replace:replace});current=d.job;upsertJob(current);await listJobs();renderCurrent();activity('follow',current.status==='submission_unknown'?'Soumission à vérifier : actualise le suivi avant toute nouvelle tentative.':'Publication demandée. Les PDF relus seront utilisés tels quels.',current.status==='submission_unknown'?'warning':'working',current.status!=='submission_unknown');}catch(e){showError(e);}finally{busy=false;renderCurrent();controls();}return;
 }
 if(e.target.closest('#retry-refresh')){busy=true;renderCurrent();controls();activity('follow','Actualisation du cache V2 uniquement… aucun nouvel envoi de PDF.','working',true);try{const d=await api('retry-refresh',{id:current.id});current=d.job;upsertJob(current);await listJobs();activity('follow','Cache V2 actualisé, sans réenvoyer les PDF.','success');}catch(e){showError(e);}finally{busy=false;renderCurrent();controls();}}
});
$('refresh-v2').addEventListener('click',async()=>{if(!allowed||busy||loading||refreshing)return;if(!confirm('Actualiser uniquement le catalogue V2 depuis la sandbox Notion ? Aucun PDF ne sera généré ou publié.'))return;busy=true;controls();$('refresh-v2').textContent='Actualisation en cours…';$('refresh-v2').setAttribute('aria-busy','true');activity('catalogue','Lecture de Notion et actualisation du catalogue V2…','working',true);let confirmed=false;try{const d=await call('refresh-annales-cache-v2',{method:'POST'});if(d.ok!==true)throw new Error();confirmed=true;activity('catalogue',d.count+' annales actualisées. Aucun PDF généré ou publié.','success');const c=await call('get-annales-v2');catalog(c.annales);$('admin-catalogue-count').textContent=c.annales.length+' annales dans le catalogue V2.';}catch(e){if(confirmed){activity('catalogue','Actualisation confirmée, mais rechargement de la liste impossible. Recharge la page.','warning');if(e.status===401||e.status===403)deny();}else showError(e,'catalogue');}finally{busy=false;$('refresh-v2').textContent='Actualiser le catalogue V2';$('refresh-v2').setAttribute('aria-busy','false');renderCurrent();controls();}});
try{const session=await requireAuth();if(session){const access=await checkAdminAccess();allowed=true;$('admin-state').textContent='Administration autorisée pour '+(access.email??session.user?.email??'ce compte')+'.';$('admin-tools').hidden=false;$('admin-annales').hidden=false;$('refresh-v2').disabled=false;const c=await call('get-annales-v2');catalog(c.annales);$('admin-catalogue-count').textContent=c.annales.length+' annales dans le catalogue V2.';await refreshFollow();}}catch(e){$('admin-state').textContent=explain(e);if(e.status===401||e.status===403)deny();}
setInterval(()=>{if(allowed&&!document.hidden&&jobs.some(j=>active.has(j.status)))refreshFollow();},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshFollow();});
