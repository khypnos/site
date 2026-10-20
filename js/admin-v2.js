import {supabase,requireAuth} from '/espace-client/auth.js';
import {checkAdminAccess} from '/js/admin-access-v2.js';
const API='https://fbxiynomlxrjasbbcipp.supabase.co/functions/v1/';
const $=id=>document.getElementById(id), esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const active=new Set(['dispatching','submission_unknown','generation_queued','generating','publication_queued','publishing']);
const statuses={dispatching:'Préparation du lancement',submission_unknown:'Soumission à vérifier — ne pas relancer',generation_queued:'Génération en attente',generating:'Génération en cours',awaiting_review:'Aperçus prêts à relire',generation_failed:'Échec de génération',publication_queued:'Publication en attente',publishing:'Publication en cours',published:'Publication et cache confirmés',partially_published:'Publication partielle validée — autres épreuves à relire',published_cache_pending:'PDF publiés — cache à actualiser',publication_attention:'Publication à contrôler avant toute reprise'};
let allowed=false,jobs=[],current=null,busy=false,refreshing=false,requestId=null,blobUrl=null;
const reviewed=new Map();
function deny(){allowed=false;$('admin-tools').hidden=true;window.location.replace('/espace-client/index.html?admin=refuse');}
function explain(e){
 if(e.code==='IDENTIFIANT_REQUETE_INDISPONIBLE')return 'Le navigateur ne permet pas de créer un identifiant sécurisé. Ouvre le site sur localhost ou en HTTPS. Aucune demande envoyée.';
 if(e.status===401)return 'Session expirée. Reconnecte-toi.';
 if(e.status===403)return 'Accès réservé aux administrateurs autorisés.';
 if(e.code?.startsWith('CONFIGURATION_MANQUANTE_'))return 'Configuration manquante côté Supabase : '+e.code.replace('CONFIGURATION_MANQUANTE_','')+'.';
 if(e.code==='UN_TRAITEMENT_EST_DEJA_EN_COURS')return 'Un traitement est déjà actif. Consulte son suivi avant de relancer.';
 if(e.code?.startsWith('GITHUB_'))return 'Accès GitHub indisponible ('+e.code+'). Vérifie le token et ses permissions ; ne multiplie pas les lancements.';
 return 'Opération non confirmée. '+(e.code?'Code : '+e.code+'. ':'')+'Actualise le suivi avant toute nouvelle tentative.';
}
function feedback(message){$('pipeline-result').textContent=message;if($('generation-feedback')){$('generation-feedback').textContent=message;$('generation-feedback').hidden=false;}}
function showError(e){feedback(explain(e));if(e.status===401||e.status===403)deny();}
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
function controls(){const count=selection().length;$('selection-count').textContent=count+' épreuve(s) sélectionnée(s) — maximum 6 par génération.';$('generate-previews').disabled=!allowed||busy||count<1||count>6||jobs.some(j=>active.has(j.status));}
function catalog(rows){$('annales-selection').innerHTML=[...rows].sort((a,b)=>b.annee_session-a.annee_session).map(r=>`<fieldset><legend>${esc(r.annee_session)}</legend>${['fondamentale','pratique'].map(t=>`<label><input type="checkbox" data-year="${esc(r.annee_session)}" data-track="${t}"> ${t==='fondamentale'?'Fondamentale':'Pratique'}</label>`).join('')}<button type="button" class="v2-both" data-both="${esc(r.annee_session)}">Les deux</button></fieldset>`).join('');controls();}
$('annales-selection').addEventListener('change',controls);
$('annales-selection').addEventListener('click',e=>{const b=e.target.closest('[data-both]');if(!b)return;const xs=[...b.closest('fieldset').querySelectorAll('input')],yes=!xs.every(x=>x.checked);xs.forEach(x=>x.checked=yes);controls();});
function summary(j){return j.selection.map(x=>x.year+' '+x.track).join(' · ');}
function renderJobs(){
 $('jobs-list').innerHTML=jobs.length?jobs.map(j=>`<button type="button" class="v2-job ${j.id===current?.id?'is-current':''}" data-job="${esc(j.id)}"><strong>${esc(summary(j))}</strong><span>${esc(statuses[j.status]??j.status)}</span><small>${esc(new Date(j.created_at).toLocaleString('fr-FR'))}</small></button>`).join(''):'<p>Aucun traitement V2 pour le moment.</p>';controls();
}
function reviewKey(j,k){return j.id+':'+k;}
function renderCurrent(){
 const j=current;if(!j){$('job-detail').innerHTML='';return;}
 generationLink(j);
 const canPublish=['awaiting_review','partially_published'].includes(j.status);
 let html=`<h3>${esc(summary(j))}</h3><p class="v2-job-status">${esc(statuses[j.status]??j.status)}</p>`;
 if(j.error_code)html+=`<p class="v2-warning">${esc(j.error_code)}</p>`;
 if(j.generation_run_id)html+=`<a href="https://github.com/khypnos/publi_khypnos/actions/runs/${Number(j.generation_run_id)}" target="_blank" rel="noopener">Journal technique de génération ↗</a>`;
 if(j.publication_run_id)html+=` · <a href="https://github.com/khypnos/publi_khypnos/actions/runs/${Number(j.publication_run_id)}" target="_blank" rel="noopener">Journal de publication ↗</a>`;
 if(j.status==='submission_unknown')html+='<p>Le lancement a peut-être été reçu par GitHub. Le suivi tente de retrouver la demande ; ne crée pas une nouvelle demande et ne supprime pas ce suivi pour contourner le blocage.</p>';
 for(const i of j.manifest?.items??[]){
  const done=j.published_keys.includes(i.key),p=i.pdfs?.find(p=>p.kind==='enrichi'),read=reviewed.get(reviewKey(j,i.key))===p?.sha256;
  html+=`<article class="v2-review-item"><h4>${esc(i.year)} — ${esc(i.track)}</h4>`;
  if(i.status==='failed')html+=`<p class="v2-warning">Échec : ${esc(i.error)}</p>`;
  else {html+=`<p>${done?'✅ Publication confirmée':i.baseline.sha256?'Un PDF existe déjà dans cette propriété ; un remplacement demandera confirmation.':'Aucun PDF actuellement dans cette propriété.'}</p><button type="button" data-preview="${esc(i.key)}" data-kind="enrichi">Relire l’enrichi étudiant</button> <button type="button" data-preview="${esc(i.key)}" data-kind="imprime">Voir l’imprimé (livre uniquement)</button>`;
   if(canPublish&&!done)html+=`<label class="v2-reviewed"><input type="checkbox" data-reviewed="${esc(i.key)}" ${read?'checked':''} ${j.viewed_hashes?.[i.key]===p.sha256?'':'disabled'}> J’ai relu cet enrichi et je veux le publier.</label><small>Ouvrir l’enrichi avant de cocher. L’imprimé ne sera jamais publié sur Notion.</small>`;
  }html+='</article>';
 }
 if(canPublish)html+='<button type="button" id="publish-reviewed">Publier les enrichis cochés et relus</button><p>Publie les fichiers de cette génération, sans nouvelle compilation ; actualise automatiquement le cache V2 après réussite.</p>';
 if(j.status==='published_cache_pending')html+='<button type="button" id="retry-refresh">Réessayer uniquement l’actualisation du cache</button><p>Les PDF sont déjà publiés. Cette action ne les renvoie pas.</p>';
 if(j.status==='publication_attention')html+='<p class="v2-warning">Ne pas republier à l’aveugle : contrôler les reçus et les propriétés Notion. Aucune reprise automatique d’une publication incertaine.</p>';
 $('job-detail').innerHTML=html;$('publish-reviewed')?.toggleAttribute('disabled',busy);
}
async function listJobs(){const d=await api('list');jobs=d.jobs;renderJobs();}
async function loadJob(id){const d=await call('annales-admin-v2?action=job&id='+encodeURIComponent(id));current=d.job;const at=jobs.findIndex(j=>j.id===current.id);if(at>=0)jobs[at]=current;else jobs.unshift(current);renderJobs();renderCurrent();if(['generation_queued','generating','awaiting_review','generation_failed','submission_unknown'].includes(current.status))feedback((statuses[current.status]??current.status)+(current.status==='generation_queued'?' — demande enregistrée, attente de prise en charge par GitHub.':current.status==='generating'?' — compilation en cours dans GitHub.':''));}
async function refreshFollow(){if(!allowed||refreshing||busy)return;refreshing=true;try{await listJobs();const id=current?.id??jobs.find(j=>active.has(j.status))?.id??jobs[0]?.id;if(id)await loadJob(id);}catch(e){showError(e);}finally{refreshing=false;}}
$('jobs-list').addEventListener('click',async e=>{const b=e.target.closest('[data-job]');if(!b||busy)return;try{await loadJob(b.dataset.job);}catch(e){showError(e);}});
$('refresh-jobs').addEventListener('click',refreshFollow);
$('generate-previews').addEventListener('click',async()=>{
 if(!allowed||busy)return;const xs=selection();if(xs.length<1||xs.length>6)return;
 if(!confirm('Générer les aperçus de :\n'+xs.map(x=>x.year+' — '+x.track).join('\n')+'\n\nAucun PDF ne sera publié. Les sources doivent être enregistrées dans Drive.'))return;
 busy=true;controls();$('generate-previews').textContent='Envoi en cours…';$('generate-previews').setAttribute('aria-busy','true');
 feedback('Envoi de la demande de génération… Aucun lancement encore confirmé.');
 try{
  requestId??=newRequestId();
  const d=await api('generate',{id:requestId,selection:xs});current=d.job;requestId=null;
  jobs=[current,...jobs.filter(j=>j.id!==current.id)];renderJobs();renderCurrent();generationLink(current);
  feedback(current.status==='submission_unknown'?'Soumission à vérifier : le lancement n’est pas confirmé. Ne relance pas ; actualise le suivi.':'Demande enregistrée. GitHub va prendre en charge la génération ; le suivi confirmera le démarrage.');
 }catch(e){showError(e);}
 finally{busy=false;$('generate-previews').textContent='Générer les aperçus';$('generate-previews').setAttribute('aria-busy','false');renderCurrent();controls();}
 if(current&&jobs.some(j=>active.has(j.status)))void refreshFollow();
});
function closePreview(){const dlg=$('admin-pdf-dialog');dlg.close();$('admin-pdf-frame').src='about:blank';if(blobUrl){URL.revokeObjectURL(blobUrl);blobUrl=null;}}
$('close-admin-pdf').addEventListener('click',closePreview);$('admin-pdf-dialog').addEventListener('cancel',e=>{e.preventDefault();closePreview();});
$('job-detail').addEventListener('change',e=>{const input=e.target.closest('[data-reviewed]');if(!input||!current)return;const i=current.manifest.items.find(i=>i.key===input.dataset.reviewed),hash=i.pdfs.find(p=>p.kind==='enrichi').sha256;if(input.checked)reviewed.set(reviewKey(current,i.key),hash);else reviewed.delete(reviewKey(current,i.key));});
$('job-detail').addEventListener('click',async e=>{
 if(busy||!current)return;const preview=e.target.closest('[data-preview]');
 if(preview){busy=true;controls();preview.disabled=true;const j=current,key=preview.dataset.preview,kind=preview.dataset.kind;
  try{const blob=await call('annales-admin-v2?action=preview&id='+j.id+'&key='+encodeURIComponent(key)+'&kind='+kind,{binary:true});blobUrl=URL.createObjectURL(blob);$('admin-pdf-frame').src=blobUrl;$('admin-pdf-label').textContent=key+' — '+kind;$('admin-pdf-dialog').showModal();if(kind==='enrichi'){const p=j.manifest.items.find(i=>i.key===key).pdfs.find(p=>p.kind==='enrichi');j.viewed_hashes[key]=p.sha256;}renderCurrent();}catch(e){showError(e);}finally{busy=false;renderCurrent();controls();preview.disabled=false;}return;
 }
 if(e.target.closest('#publish-reviewed')){
  const j=current,items=j.manifest.items.filter(i=>i.status==='generated'&&!j.published_keys.includes(i.key)&&reviewed.get(reviewKey(j,i.key))===i.pdfs.find(p=>p.kind==='enrichi').sha256);
  if(!items.length){$('pipeline-result').textContent='Ouvre et relis au moins un enrichi, puis coche sa validation.';return;}
  const replace=items.some(i=>i.baseline.sha256&&i.baseline.sha256!==i.pdfs.find(p=>p.kind==='enrichi').sha256);
  if(!confirm('Publier dans la sandbox Notion les enrichis relus suivants :\n'+items.map(i=>i.year+' — '+i.track).join('\n')+(replace?'\n\nAttention : les PDF existants de ces épreuves seront remplacés.':'')+'\n\nAucune modification du statut, de la promotion minimale ou des ressources. Aucun PDF imprimé.'))return;
  busy=true;renderCurrent();controls();
  try{const hashes=Object.fromEntries(items.map(i=>[i.key,i.pdfs.find(p=>p.kind==='enrichi').sha256]));const d=await api('publish',{id:j.id,keys:items.map(i=>i.key),reviewed_hashes:hashes,review_confirmed:true,confirm_replace:replace});current=d.job;await listJobs();renderCurrent();$('pipeline-result').textContent='Publication demandée. Les PDF relus seront utilisés tels quels.';}catch(e){showError(e);}finally{busy=false;renderCurrent();controls();}return;
 }
 if(e.target.closest('#retry-refresh')){busy=true;renderCurrent();try{const d=await api('retry-refresh',{id:current.id});current=d.job;await listJobs();$('pipeline-result').textContent='Cache V2 actualisé, sans réenvoyer les PDF.';}catch(e){showError(e);}finally{busy=false;renderCurrent();controls();}}
});
$('refresh-v2').addEventListener('click',async()=>{if(!allowed||busy)return;if(!confirm('Actualiser uniquement le catalogue V2 depuis la sandbox Notion ? Aucun PDF ne sera généré ou publié.'))return;busy=true;$('refresh-v2').disabled=true;try{const d=await call('refresh-annales-cache-v2',{method:'POST'});if(d.ok!==true)throw new Error();$('refresh-result').textContent=d.count+' annales actualisées.';const c=await call('get-annales-v2');catalog(c.annales);}catch(e){showError(e);}finally{busy=false;$('refresh-v2').disabled=false;controls();}});
try{const session=await requireAuth();if(session){const access=await checkAdminAccess();allowed=true;$('admin-state').textContent='Administration autorisée pour '+(access.email??session.user?.email??'ce compte')+'.';$('admin-tools').hidden=false;$('admin-annales').hidden=false;$('refresh-v2').disabled=false;const c=await call('get-annales-v2');catalog(c.annales);$('admin-catalogue-count').textContent=c.annales.length+' annales dans le catalogue V2.';await refreshFollow();}}catch(e){$('admin-state').textContent=explain(e);if(e.status===401||e.status===403)deny();}
setInterval(()=>{if(allowed&&!document.hidden&&jobs.some(j=>active.has(j.status)))refreshFollow();},15000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshFollow();});
