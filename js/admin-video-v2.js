// Video refresh only. Does not import or mutate the annales generation state.
import {supabase} from '/espace-client/auth.js?v=private-ca2dcf52bea4152e';
import {actionFeedback,startClock} from '/js/ui-feedback-v2.js?v=private-ca2dcf52bea4152e';
const ENDPOINT='https://fbxiynomlxrjasbbcipp.supabase.co/functions/v1/admin-video-cache-v2';
const $=id=>document.getElementById(id),esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const uuid=v=>typeof v==='string'&&/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v);
const STORE='khypnos.video-refresh.pending.v1';
let job=null,busy=false,checking=false,connected=false,denied=false,uncertain=false,pendingId=null,timer=null,lastLog='',submitStart=null,checkStart=null,actionError='',checkError='';
try{const value=sessionStorage.getItem(STORE);if(uuid(value))pendingId=value;}catch{}
function remember(id){pendingId=id;try{if(id)sessionStorage.setItem(STORE,id);else sessionStorage.removeItem(STORE);}catch{}}
function controls(){
 const active=busy||job?.status==='running',locked=busy||checking||denied;
 $('refresh-video-catalogue').disabled=locked||!connected||uncertain||!!pendingId||['running','attention'].includes(job?.status);
 $('check-video-status').disabled=locked||denied;
 $('video-admin-card').setAttribute('aria-busy',String(active||checking));
 const start=busy?submitStart:job?.status==='running'?startClock('video-'+job.id,Date.parse(job.created_at)):null;
 const text=busy?'Envoi de la demande… réception pas encore confirmée.':job?.status==='running'?'Mise à jour en cours. La confirmation apparaîtra ici.':actionError||((uncertain||pendingId)?'Réception non confirmée : vérifie l’avancement avant toute nouvelle demande.':job?.status==='attention'?'Vérification nécessaire avant une nouvelle mise à jour.':job?.status==='completed'?'Dernière mise à jour confirmée.':'');
 actionFeedback($('refresh-video-catalogue'),{key:'video-update',message:text,busy:active,tone:actionError?'error':active?'working':uncertain||pendingId||job?.status==='attention'?'warning':job?.status==='completed'?'success':'idle',start});
 actionFeedback($('check-video-status'),{key:'video-check',message:checking?'Consultation du suivi… aucune nouvelle mise à jour.':checkError||$('video-checked-at').textContent,busy:checking,tone:checkError?'error':'idle',start:checking?checkStart:null});
}
function activity(text,tone='idle',spinning=false,key=text){$('video-message').textContent=text;$('video-activity').dataset.tone=tone;$('video-spinner').hidden=!spinning;if(lastLog!==key){lastLog=key;const li=document.createElement('li'),time=document.createElement('time'),span=document.createElement('span');time.textContent=new Date().toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',second:'2-digit'});span.textContent=text;li.append(time,span);$('video-log').append(li);while($('video-log').children.length>10)$('video-log').firstChild.remove();}}
function message(e){if(e.status===401)return 'Session expirée : reconnecte-toi. Aucun nouveau lancement autorisé.';if(e.status===403)return 'Accès réservé aux administrateurs autorisés.';if(e.code?.startsWith('CONFIGURATION_MANQUANTE_'))return 'Configuration vidéo manquante côté Supabase : '+e.code.replace('CONFIGURATION_MANQUANTE_','')+'.';if(e.code==='REFRESH_VIDEO_DEJA_ACTIF_OU_A_CONTROLER'||e.status===409)return 'Une mise à jour est déjà en cours ou nécessite une vérification. Vérifie l’avancement ; ne relance pas à l’aveugle.';return 'État vidéo non confirmé'+(e.code?' ('+e.code+')':'')+'. Vérifie l’avancement avant tout nouveau lancement.';}
function failure(e){if([401,403].includes(e.status)){denied=true;connected=false;}activity(message(e),'error');}
async function request({id=null,body=null}={}){const {data,error}=await supabase.auth.getSession();if(error||!data?.session)throw Object.assign(new Error(),{status:401});let r;try{r=await fetch(ENDPOINT+(id?'?id='+encodeURIComponent(id):''),{method:body?'POST':'GET',headers:{Authorization:'Bearer '+data.session.access_token,...(body?{'Content-Type':'application/json'}:{})},...(body?{body:JSON.stringify(body)}:{}),cache:'no-store',signal:AbortSignal.timeout(45000)});}catch{throw Object.assign(new Error(),{code:'RESEAU_VIDEO_INDISPONIBLE'});}const d=await r.json().catch(()=>({}));if(!r.ok)throw Object.assign(new Error(),{status:r.status,code:d.error??'REPONSE_VIDEO_INVALIDE'});if(!Object.hasOwn(d,'job')||(d.job!==null&&(!uuid(d.job.id)||!['running','completed','failed','attention'].includes(d.job.status))))throw Object.assign(new Error(),{code:'REPONSE_VIDEO_INVALIDE'});return d.job;}
function formatDate(value){const d=new Date(value);return value&&Number.isFinite(d.getTime())?d.toLocaleString('fr-FR'):null;}
function category(value){return value==='medecin'?'Médecin':value==='iade'?'IADE':String(value??'');}
function recovered(d){return d?.mode==='recovered_without_diff'&&Number.isInteger(d.count)&&d.count>=0&&Number.isInteger(d.categories?.medecin)&&d.categories.medecin>=0&&Number.isInteger(d.categories?.iade)&&d.categories.iade>=0&&d.count===d.categories.medecin+d.categories.iade;}
function renderResult(j){const box=$('video-refresh-result');box.replaceChildren();box.hidden=true;delete box.dataset.previous;if(j?.status!=='completed')return;
 const d=j.result;
 if(d?.mode==='recovered_without_diff'){
  if(!recovered(d))throw Object.assign(new Error(),{code:'BILAN_VIDEO_INCOMPLET'});
  box.innerHTML=`<div class="admin-video-result-heading"><strong>Ancienne mise à jour confirmée</strong><time>${esc(formatDate(j.finished_at)||'')}</time></div><p>${d.count} entrées du catalogue ont été mises à jour (${d.categories.medecin} Médecin et ${d.categories.iade} IADE). Une erreur de confirmation avait empêché l’affichage du résultat ; le suivi a été corrigé.</p><p class="admin-video-note">Le détail des ajouts et modifications n’a pas été enregistré. Il n’est pas nécessaire de relancer une mise à jour pour corriger ce suivi.</p>`;
  box.hidden=false;return;
 }
 const valid=d&&Array.isArray(d.added)&&Array.isArray(d.changed)&&Array.isArray(d.retained)&&Number.isInteger(d.unchanged)&&d.unchanged>=0&&Number.isInteger(d.count)&&d.count===d.added.length+d.changed.length+d.unchanged;
 if(!valid)throw Object.assign(new Error(),{code:'BILAN_VIDEO_INCOMPLET'});
 const metric=(n,label)=>`<div class="admin-video-metric"><strong>${Number(n)}</strong><span>${label}</span></div>`;
 const list=(rows,changes=false)=>rows.map(x=>`<li><strong>${esc(x.title||'Sans titre')}</strong><span>${esc(category(x.category))}${changes?' · '+esc((Array.isArray(x.fields)?x.fields:[]).join(', ')):''}</span></li>`).join('');
 const group=(title,rows,changes=false,expanded=false)=>rows.length?`<details class="admin-video-details"${expanded?' open':''}><summary>${title} (${rows.length})</summary><ul>${list(rows,changes)}</ul></details>`:'';
 box.innerHTML=`<div class="admin-video-result-heading"><strong>Actualisation confirmée</strong>${formatDate(j.finished_at)?'<time>'+esc(formatDate(j.finished_at))+'</time>':''}</div><div class="admin-video-metrics">${metric(d.added.length,'Ajoutées')}${metric(d.changed.length,'Modifiées')}${metric(d.unchanged,'Inchangées')}</div>${!d.added.length&&!d.changed.length?'<p class="admin-video-note">Aucune vidéo ajoutée ou modifiée lors de cette actualisation.</p>':''}${group('Vidéos ajoutées',d.added,false,true)}${group('Vidéos modifiées',d.changed,true,true)}${d.retained.length?'<p class="admin-video-retained">'+d.retained.length+' vidéo(s) absente(s) des bases Notion restent affichées dans le catalogue du site, sans suppression.</p>'+group('Vidéos conservées hors des bases Notion',d.retained):''}<p class="admin-video-note">Les changements concernent les informations du catalogue (titres, rubriques, descriptions, durées et conditions d’accès). Le bilan ne compare ni le contenu des vidéos ni leurs URL de lecture. Les vidéos ne sont pas réimportées.</p>`;box.hidden=false;
}
function render(){renderResult(job);if(!job){activity(pendingId?'Réception de la demande non confirmée. Aucun nouveau lancement autorisé : vérifie l’avancement.':'Aucune mise à jour enregistrée par cet outil. Le catalogue existant est conservé.',pendingId?'warning':'idle',false);return;}
 const id=job.id.slice(0,8),start=formatDate(job.created_at);if(job.status==='running'){const long=Number.isFinite(Date.parse(job.created_at))&&Date.now()-Date.parse(job.created_at)>180000;activity((long?'Traitement anormalement long : état à contrôler, ne pas relancer.':'Actualisation en cours : lecture des vidéothèques Notion et mise à jour du catalogue.')+(start?' Début : '+start+'.':'')+' Référence '+id+'.',long?'warning':'working',!long,job.id+':running:'+long);}
 else if(job.status==='completed'&&recovered(job.result))activity('Ancienne mise à jour confirmée : '+job.result.count+' entrées du catalogue. Détail des ajouts et modifications indisponible.','success',false,job.id+':recovered');
 else if(job.status==='completed')activity('Catalogue actualisé : '+job.result.added.length+' ajoutée(s), '+job.result.changed.length+' modifiée(s), '+job.result.unchanged+' inchangée(s).','success',false,job.id+':completed');
 else if(job.status==='attention')activity('Résultat de l’écriture non confirmé. Le catalogue a peut-être changé : contrôle nécessaire avant toute reprise.'+(job.error_code?' Code : '+job.error_code+'.':''),'warning',false,job.id+':attention');
 else activity('La mise à jour du catalogue du site a été interrompue.'+(job.error_code?' Code : '+job.error_code+'.':'')+' Aucun succès annoncé.','error',false,job.id+':failed');
}
function schedule(){clearTimeout(timer);if(!denied&&(job?.status==='running'||pendingId))timer=setTimeout(()=>{if(!document.hidden)void follow(false);else schedule();},8000);}
async function follow(manual=true){if(busy||checking||denied)return;checking=true;checkStart=Date.now();checkError='';controls();if(manual)activity('Vérification de l’état vidéo… aucun nouveau lancement.','working',true);try{const found=await request({id:pendingId??(job?.status==='running'?job.id:null)});job=found;connected=true;uncertain=!!pendingId&&!found;if(found&&pendingId===found.id)remember(null);render();actionError='';$('video-checked-at').textContent='Dernier contrôle réussi : '+new Date().toLocaleString('fr-FR');}catch(e){uncertain=true;checkError=message(e);if(!$('video-refresh-result').hidden)$('video-refresh-result').dataset.previous='true';failure(e);}finally{checking=false;controls();schedule();}}
$('check-video-status').addEventListener('click',()=>void follow());
$('refresh-video-catalogue').addEventListener('click',async()=>{
 if($('refresh-video-catalogue').disabled||busy||checking)return;
 if(!confirm('Actualiser les catalogues vidéo Médecin et IADE EN PRODUCTION depuis Notion ?\n\nLes titres, rubriques, descriptions, durées et promotions minimales seront relus. Les vidéos absentes de Notion ne seront pas supprimées.\n\nAucune génération ou publication d’annale.'))return;
 let id;try{id=crypto.randomUUID();}catch{failure({code:'IDENTIFIANT_REQUETE_INDISPONIBLE'});return;}
 busy=true;submitStart=startClock('video-'+id,Date.now(),true);actionError='';checkError='';uncertain=true;remember(id);renderResult(null);controls();activity('Envoi de la demande vidéo… lancement pas encore confirmé.','working',true);
 try{const found=await request({body:{id,confirmed:true}});if(!found||found.id!==id)throw Object.assign(new Error(),{code:'REPONSE_VIDEO_INVALIDE'});job=found;remember(null);uncertain=false;connected=true;render();}
 catch(e){actionError=message(e);failure(e);if(e.status===409){remember(null);job=null;connected=false;} // Server rejected a duplicate: recover the canonical job with GET, never POST again.
 }
 finally{busy=false;controls();schedule();}
 if(!denied&&uncertain)void follow(false);
});
document.addEventListener('visibilitychange',()=>{if(!document.hidden&&(job?.status==='running'||pendingId))void follow(false);});
controls();void follow(false);
