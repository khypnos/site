import {loadingFeedback} from '/js/ui-feedback-v2.js?v=private-512fdc885acff734';
import { recentPublication } from '/js/annales-publication-v2.js?v=private-512fdc885acff734';
import { supabase, requireAuth } from '/espace-client/auth.js?v=private-512fdc885acff734';
import * as pdfjsLib from 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc='https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.0.379/pdf.worker.min.mjs';

// Hardwired V2 routes: no URL parameter can redirect this pilot to production.
const API='https://fbxiynomlxrjasbbcipp.supabase.co/functions/v1/';
const ROUTES=Object.freeze({list:'get-annales-v2',detail:'get-annale-content-v2'});
const $=id=>document.getElementById(id);
const labels={disponible:'Disponible',en_cours:'En cours',non_disponible:'Non disponible'};
let session, currentId, currentEmail, detailVersion=0, pdfVersion=0, listVersion=0;
let pdfTask=null, returnToList=null, returnToDetail=null;
const documents=new Map();
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function safeUrl(value,protocols=['https:']){try{const u=new URL(String(value));return protocols.includes(u.protocol)?u.href:'';}catch{return '';}}
function publicationBadge(value,card=false){
 if(!value)return '';const d=new Date(value);if(!Number.isFinite(d.getTime()))return '';
 const label=new Intl.DateTimeFormat('fr-FR',{day:'numeric',month:'long',year:'numeric',timeZone:'Europe/Paris'}).format(d);
 const recent=recentPublication(value);const css=recent?'v2-publication-badge':'v2-publication-text';
 if(card)return `<span class="ac-card-publication">${recent?'<span class="ac-recent-label"><span class="ac-recent-dot" aria-hidden="true"></span>Mis à jour récemment</span>':''}<span class="ac-publication-date">Dernière publication · <time datetime="${esc(value)}">${esc(label)}</time></span></span>`;
 return `<span class="${css}">${recent?'<span aria-hidden="true">🗓</span> ':''}Dernière publication : <time datetime="${esc(value)}">${esc(label)}</time></span>`;
}
const loading=()=>'<div class="loading-state"><div class="spinner"></div><span>Chargement…</span></div>';
function errorText(e){
 const c=e.code??'';
 if(e.status===401)return 'Session expirée ou invalide. Reconnecte-toi sur ce même site local, puis recharge la page.';
 if(c==='APERCU_V2_RESERVE_ADMIN'||e.status===403)return 'Cet aperçu V2 est réservé aux administrateurs autorisés dans Supabase.';
 if(c.startsWith('CONFIGURATION_MANQUANTE_'))return 'Configuration Supabase V2 incomplète : '+c.replace('CONFIGURATION_MANQUANTE_','')+'.';
 if(c==='ANNALE_V2_ABSENTE_DU_CACHE')return 'Cette annale est absente du cache V2. Actualise le catalogue, puis réessaie.';
 if(c.startsWith('NOTION_V2_'))return 'Lecture de la sandbox Notion impossible. Vérifie le partage et le token Supabase, puis réessaie. ('+c+')';
 if(c==='REPONSE_V2_INATTENDUE')return 'La réponse du backend V2 ne correspond pas au format attendu. Aucun contenu V1 n’a été utilisé.';
 if(e.name==='TimeoutError'||e.name==='AbortError')return 'Le serveur met trop de temps à répondre. Réessaie dans un instant.';
 return 'Chargement impossible. '+(c?'Code : '+c+'.':'Vérifie la connexion réseau, puis réessaie.');
}
function showError(target,e,retry){target.innerHTML=`<div class="v2-error" role="alert"><p>${esc(errorText(e))}</p>${retry?'<button class="v2-retry" type="button">Réessayer</button>':''}</div>`;target.querySelector('.v2-retry')?.addEventListener('click',retry);}
async function api(route,{query='',method='GET'}={}){
 const {data,error}=await supabase.auth.getSession();
 if(error||!data?.session){const e=new Error();e.status=401;throw e;}
 session=data.session;
 const r=await fetch(API+route+query,{method,headers:{Authorization:'Bearer '+session.access_token},cache:'no-store',signal:AbortSignal.timeout(45000)});
 let payload;try{payload=await r.json();}catch{payload={};}
 if(!r.ok){const e=new Error();e.status=r.status;e.code=typeof payload.error==='string'?payload.error:payload.code??'';throw e;}
 if(!payload||typeof payload!=='object'){const e=new Error();e.code='REPONSE_V2_INATTENDUE';throw e;}
 return payload;
}
function requirePreview(data){if(data.mode!=='apercu_admin'){const e=new Error();e.code='REPONSE_V2_INATTENDUE';throw e;}}
function notice(target,email){target.textContent='🔒 Espace personnel de '+(email??'l’administrateur')+' — Document strictement personnel, ne pas partager.';target.hidden=false;}
async function loadList(){
 const version=++listVersion;$('annales-grid').innerHTML=loading();
 try{
  const data=await api(ROUTES.list);if(version!==listVersion)return;requirePreview(data);
  if(!Array.isArray(data.annales))throw Object.assign(new Error(),{code:'REPONSE_V2_INATTENDUE'});
  currentEmail=data.student?.email??session.user?.email;notice($('doc-notice'),currentEmail);
  const rows=[...data.annales].sort((a,b)=>Number(b.annee_session)-Number(a.annee_session));
  if(!rows.length){$('annales-grid').innerHTML='<p class="v2-empty">Aucune annale à afficher pour le moment.</p>';return;}
  $('annales-grid').innerHTML=rows.map(a=>{
   const status=Object.hasOwn(labels,a.statut)?a.statut:'non_disponible';
   const year=Number(a.annee_session),validYear=Number.isInteger(year)&&year>=1900&&year<=2200;
   const heading=validYear?year:a.titre;
   return `<button type="button" class="annale-card ${a.locked?'is-locked':''}" data-status="${status}" data-id="${esc(a.notion_page_id)}" aria-label="${esc(a.titre)} — ${labels[status]}${a.locked?' — Accès verrouillé':''}" ${a.locked?'disabled':''}>
    <span class="annale-card-header"><span class="ac-session"><span class="ac-session-label">${validYear?'Session':'Annale'}</span><span class="ac-session-year">${esc(heading)}</span></span><span class="ac-card-status"><span class="ac-status-dot" aria-hidden="true"></span>${labels[status]}</span></span>
    ${publicationBadge(a.derniere_mise_a_jour,true)}
    ${a.locked?'<span class="annale-lock">🔒 Accès verrouillé</span>':''}</button>`;
  }).join('');
  $('annales-grid').querySelectorAll('button[data-id]:not(:disabled)').forEach(b=>b.addEventListener('click',()=>openAnnale(b.dataset.id,b)));
 }catch(e){if(version===listVersion)showError($('annales-grid'),e,loadList);}
}
function lockScroll(){const open=$('annale-modal').classList.contains('active')||$('pdf-modal').classList.contains('active');document.documentElement.style.overflow=open?'hidden':'';document.body.style.overflow=open?'hidden':'';}
function setModal(id,open){$(id).classList.toggle('active',open);$(id).setAttribute('aria-hidden',String(!open));$('annales-main').inert=$('annale-modal').classList.contains('active')||$('pdf-modal').classList.contains('active');$('annale-modal').inert=$('pdf-modal').classList.contains('active');lockScroll();}
function closeDetail(){$('detail-content').setAttribute('aria-busy','false');detailVersion++;closePdf(false);setModal('annale-modal',false);documents.clear();$('detail-content').replaceChildren();currentId=null;returnToList?.focus();}
function closePdf(focus=true){$('pdf-canvas-wrap').setAttribute('aria-busy','false');pdfVersion++;const task=pdfTask;pdfTask=null;if(task)Promise.resolve(task.destroy()).catch(()=>{});setModal('pdf-modal',false);$('pdf-canvas-wrap').replaceChildren();if(focus)returnToDetail?.focus();}
function rich(text){return (Array.isArray(text)?text:[]).map(t=>{let s=esc(t.text);if(t.code)s=`<code>${s}</code>`;if(t.bold)s=`<strong>${s}</strong>`;if(t.italic)s=`<em>${s}</em>`;if(t.strike)s=`<s>${s}</s>`;const u=t.href?safeUrl(t.href,['https:','http:','mailto:','tel:']):'';return u?`<a class="inline-link" href="${esc(u)}" target="_blank" rel="noopener noreferrer">🔗 ${s}</a>`:s;}).join('');}
function pdfCard(b,label){
 const url=safeUrl(b?.url);if(!url)return '<p class="v2-warning">PDF indisponible : URL non prise en charge.</p>';
 const key=String(documents.size);documents.set(key,{...b,url,label});
 return `<button type="button" class="pdf-card" data-pdf="${key}"><span class="pdf-icon">PDF</span><span class="pdf-label">${esc(label)}</span></button>`;
}
function blocks(content,depth=0){if(depth>12)return '<p class="v2-warning">Contenu trop imbriqué.</p>';return (Array.isArray(content)?content:[]).map(b=>{
 switch(b.type){
  case 'h1':case 'h2':return `<h2 class="question-title">${rich(b.text)}</h2>`;
  case 'h3':return `<h3>${rich(b.text)}</h3>`;
  case 'p':return b.text?.length?`<p>${rich(b.text)}</p>`:'';
  case 'li_bullet':return `<ul><li>${rich(b.text)}</li></ul>`;
  case 'li_number':return `<ol><li>${rich(b.text)}</li></ol>`;
  case 'quote':return `<blockquote>${rich(b.text)}</blockquote>`;
  case 'code':return `<pre><code>${esc((b.text??[]).map(t=>t.text).join(''))}</code></pre>`;
  case 'callout':return `<div class="question-section"><div class="question-text">${esc(b.icon??'💡')} ${rich(b.text)}</div>${blocks(b.children,depth+1)}</div>`;
  case 'toggle':return `<details class="question-section"><summary class="question-title">${rich(b.text)}</summary>${blocks(b.children,depth+1)}</details>`;
  case 'pdf':return pdfCard(b,b.caption?.length?b.caption.map(t=>t.text).join(''):(b.name??'Document PDF'));
  case 'image':{const u=safeUrl(b.url);return u?`<figure class="image-container"><img class="question-image" src="${esc(u)}" alt="${esc((b.caption??[]).map(t=>t.text).join(''))}" loading="lazy"><figcaption>${rich(b.caption)}</figcaption></figure>`:'';}
  case 'link':{const u=safeUrl(b.url,['https:','http:']);return u?`<a class="link-card" href="${esc(u)}" target="_blank" rel="noopener noreferrer"><span class="link-icon">🔗</span><span class="pdf-label">${esc(b.title||u)}</span></a>`:'<p class="v2-warning">Lien non pris en charge.</p>';}
  case 'video':return '<p class="v2-muted">🎬 Vidéo non prise en charge dans cette page pour le moment.</p>';
  case 'hr':return '<hr>';
  default:return '<p class="v2-warning">Un bloc de ressource n’est pas encore pris en charge dans cet aperçu.</p>';
 }
 }).join('');}
function renderDetail(data){
 if(!Array.isArray(data.content))throw Object.assign(new Error(),{code:'REPONSE_V2_INATTENDUE'});
 documents.clear();let offset=0;let corrections='';
 for(const [present,label] of [[data.has_pdf_fondamentale,'Épreuve fondamentale'],[data.has_pdf_pratique,'Épreuve pratique']]){
  if(!present){corrections+=`<p class="v2-muted">${label} : aucun PDF enrichi publié.</p>`;continue;}
  const b=data.content[offset++];if(b?.type!=='pdf')throw Object.assign(new Error(),{code:'REPONSE_V2_INATTENDUE'});
  corrections+=pdfCard(b,label);
 }
 const status=Object.hasOwn(labels,data.statut)?labels[data.statut]:'Non disponible';
 const body=blocks(data.content.slice(offset));
 $('detail-content').innerHTML=`<div class="v2-detail-meta"><span class="annale-badge annale-badge--${esc(Object.hasOwn(labels,data.statut)?data.statut:'non_disponible')}">${esc(status)}</span>${publicationBadge(data.derniere_mise_a_jour)}</div>
  ${data.warnings?.length?'<p class="v2-warning">Certains blocs Notion ne sont pas pris en charge. Vérifier les ressources avant la bascule.</p>':''}
  <section class="v2-section"><h2>Corrigés enrichis</h2>${corrections}</section>
  <section class="v2-section"><h2>💡 Ressources complémentaires</h2>${body||'<p class="v2-muted">Aucune ressource complémentaire.</p>'}</section>`;
 $('detail-content').querySelectorAll('button[data-pdf]').forEach(b=>b.addEventListener('click',()=>openPdf(documents.get(b.dataset.pdf),b)));
}
async function openAnnale(id,source){
 const version=++detailVersion;currentId=id;returnToList=source??returnToList;
 $('annale-modal-title').textContent='Chargement…';$('annale-modal-notice').hidden=true;const stopDetailLoading=loadingFeedback($('detail-content'),{title:'Ouverture de l’annale…',hint:'Lecture des corrigés et des ressources. Généralement une dizaine de secondes.'});setModal('annale-modal',true);$('detail-close').focus();
 try{
  const data=await api(ROUTES.detail,{query:'?notion_page_id='+encodeURIComponent(id)});
  if(version!==detailVersion)return;requirePreview(data);currentEmail=data.student?.email??session.user?.email;
  $('annale-modal-title').textContent=data.titre??'Annale';notice($('annale-modal-notice'),currentEmail);renderDetail(data);
 }catch(e){if(version===detailVersion){$('annale-modal-title').textContent='Annale V2';showError($('detail-content'),e,()=>openAnnale(id));}}
 finally{if(version===detailVersion)stopDetailLoading();}
}
async function openPdf(doc,source){
 if(!doc)return;
 // Refresh the detail before displaying an expired signed URL. Never silently select a different file.
 if(doc.expires_at&&Date.parse(doc.expires_at)<Date.now()+30000){await openAnnale(currentId);const p=document.createElement('p');p.className='v2-warning';p.textContent='Les liens PDF ont été actualisés. Ouvre à nouveau le document souhaité.';$('detail-content').prepend(p);return;}
 closePdf(false);const version=++pdfVersion;returnToDetail=source;
 $('pdf-modal-title').textContent=doc.label;const stopPdfLoading=loadingFeedback($('pdf-canvas-wrap'),{title:'Ouverture du PDF…',hint:'Téléchargement et préparation du document.'});setModal('pdf-modal',true);$('pdf-modal-close').focus();
 try{
  const task=pdfjsLib.getDocument({url:doc.url,withCredentials:false});pdfTask=task;
  const pdf=await task.promise;if(version!==pdfVersion)return;const loadingCard=$('pdf-canvas-wrap').querySelector('.ux-loading');
  const dpr=Math.min(window.devicePixelRatio||1,2);const available=Math.max(120,Math.min($('pdf-canvas-wrap').clientWidth-40,window.innerWidth-48));
  for(let pageNum=1;pageNum<=pdf.numPages;pageNum++){
   if(version!==pdfVersion)return;const page=await pdf.getPage(pageNum);if(version!==pdfVersion)return;
   const base=page.getViewport({scale:1});const cssScale=Math.min(available/base.width,2);const viewport=page.getViewport({scale:cssScale*dpr});
   const box=document.createElement('div');box.className='pdf-canvas-container';box.style.width=Math.floor(base.width*cssScale)+'px';
   const canvas=document.createElement('canvas');canvas.width=Math.floor(viewport.width);canvas.height=Math.floor(viewport.height);canvas.style.width='100%';canvas.style.height='auto';box.append(canvas);
   const watermark=document.createElement('div');watermark.className='pdf-watermark';const text=document.createElement('div');text.className='pdf-watermark-text';
   for(let i=0;i<15;i++){text.append(document.createTextNode((currentEmail??session.user?.email??'Administrateur')+' • Document strictement personnel • Khypnos'),document.createElement('br'));}
   watermark.append(text);box.append(watermark);$('pdf-canvas-wrap').append(box);
   await page.render({canvasContext:canvas.getContext('2d'),viewport}).promise;if(version!==pdfVersion)return;if(pageNum===1)loadingCard?.remove();page.cleanup?.();
  }
 }catch{if(version===pdfVersion){$('pdf-canvas-wrap').innerHTML='<div class="v2-error" role="alert">Impossible d’afficher ce PDF. Ferme le viewer puis recharge l’annale pour obtenir un lien frais.</div>';}}
 finally{if(version===pdfVersion)stopPdfLoading();}
}
$('detail-close').addEventListener('click',closeDetail);$('pdf-modal-close').addEventListener('click',()=>closePdf());
document.addEventListener('keydown',e=>{
 const modal=$('pdf-modal').classList.contains('active')?$('pdf-modal'):$('annale-modal').classList.contains('active')?$('annale-modal'):null;
 if(e.key==='Escape'&&modal){e.preventDefault();if(modal.id==='pdf-modal')closePdf();else closeDetail();return;}
 if(e.key==='Tab'&&modal){const controls=[...modal.querySelectorAll('button:not(:disabled),a[href],summary,[tabindex="0"]')].filter(x=>x.getClientRects().length);const first=controls[0],last=controls.at(-1);if(!first){e.preventDefault();modal.focus();}else if(e.shiftKey&&(document.activeElement===first||!modal.contains(document.activeElement))){e.preventDefault();last.focus();}else if(!e.shiftKey&&(document.activeElement===last||!modal.contains(document.activeElement))){e.preventDefault();first.focus();}}
 // Dissuasive only; browser-side controls are not DRM.
 if((e.ctrlKey||e.metaKey)&&['p','s'].includes(e.key.toLowerCase())){e.preventDefault();alert('Fonction désactivée sur cet espace.');}
});
document.addEventListener('contextmenu',e=>e.preventDefault());
try{session=await requireAuth();if(session)await loadList();}catch(e){showError($('annales-grid'),e,loadList);}
