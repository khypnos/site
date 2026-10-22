// Presentation only: no API calls, no estimated percentage, no automatic completion.
const escape=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const starts=new Map();
export function startClock(key,fallback=Date.now(),reset=false){
 if(reset){starts.delete(key);try{sessionStorage.removeItem('khypnos.ux-start.'+key)}catch{}}
 if(starts.has(key))return starts.get(key);
 let value;try{value=Number(sessionStorage.getItem('khypnos.ux-start.'+key))}catch{}
 if(!Number.isFinite(value)||value<=0||value>Date.now())value=Number.isFinite(fallback)&&fallback>0&&fallback<=Date.now()?fallback:Date.now();
 starts.set(key,value);try{sessionStorage.setItem('khypnos.ux-start.'+key,String(value))}catch{}
 return value;
}
export function elapsed(start){const secs=Math.max(0,Math.floor((Date.now()-start)/1000));return String(Math.floor(secs/60)).padStart(2,'0')+':'+String(secs%60).padStart(2,'0');}
export function actionFeedback(button,{key,message,busy=false,tone='idle',start,estimate,estimateSeconds}={}){
 if(!button)return;
 let row=button.parentElement;if(!row.classList.contains('ux-action-row')){row=document.createElement('div');row.className='ux-action-row';button.before(row);row.append(button);}
 let panel=row.querySelector(':scope > .ux-action-feedback');if(!panel){panel=document.createElement('div');panel.className='ux-action-feedback';row.append(panel);}
 panel.dataset.tone=tone;button.setAttribute('aria-busy',String(busy));button.classList.toggle('ux-button-working',busy);
 panel.innerHTML=`<span class="ux-action-message" role="status" aria-live="polite">${busy?'<span class="ux-spinner" aria-hidden="true"></span>':''}${escape(message??'')}</span>${busy&&start?`<span class="ux-action-meta"><span>Temps écoulé : <time data-ux-clock="${start}" aria-hidden="true">${elapsed(start)}</time></span>${estimateSeconds?`<span>Durée indicative : environ ${escape(estimateSeconds)} secondes</span>`:estimate?`<span>Durée indicative : environ ${escape(estimate)} min · cette durée peut varier</span>`:''}</span>`:''}`;
 panel.dataset.key=key??'';
}
export function loadingFeedback(target,{title='Chargement…',hint='Le chargement prend généralement une dizaine de secondes.',estimateSeconds=null,startedAt=null}={}){
 const owner=Symbol();target.__uxLoadingOwner=owner;const start=Number.isFinite(startedAt)&&startedAt>0&&startedAt<=Date.now()?startedAt:Date.now();target.setAttribute('aria-busy','true');
 target.innerHTML=`<div class="ux-loading" role="status" aria-live="polite"><div class="ux-loading-heading"><span class="ux-spinner" aria-hidden="true"></span><strong>${escape(title)}</strong></div><p class="ux-loading-hint">${escape(hint)}</p><div class="ux-loading-track" aria-hidden="true"><span></span></div>${estimateSeconds?`<p class="ux-loading-estimate">Durée indicative : environ ${escape(estimateSeconds)} secondes</p>`:''}<small>Temps écoulé : <time data-ux-clock="${start}" aria-hidden="true">${elapsed(start)}</time><span data-ux-slow hidden> · Plus long que d’habitude, chargement toujours en cours…</span></small></div>`;
 let stopped=false;return ()=>{if(stopped)return;stopped=true;if(target.__uxLoadingOwner!==owner)return;target.setAttribute('aria-busy','false');};
}
let tick;function resume(){clearInterval(tick);tick=setInterval(()=>{for(const el of document.querySelectorAll('[data-ux-clock]')){const start=Number(el.dataset.uxClock);el.textContent=elapsed(start);const slow=el.closest('.ux-loading')?.querySelector('[data-ux-slow]');if(slow)slow.hidden=Date.now()-start<10000;}},500);}
resume();window.addEventListener('pageshow',resume);
window.addEventListener('pagehide',()=>clearInterval(tick));
