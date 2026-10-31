// Full HTML dashboard + unchanged dashboard.css + mocked Auth/Edge/SELECT.
// This fixture never connects to a real account, Supabase or Stripe.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import http from 'node:http'
import {chromium} from 'playwright'
const bin=process.env.KHYPNOS_CHROMIUM
const html=await fs.readFile(new URL('../espace-client/index.html',import.meta.url),'utf8')
const module=await fs.readFile(new URL('../espace-client/qcm-access.js',import.meta.url),'utf8')
const auth=`
const fixture=window.__fixture;
export const requireAuth=async()=>fixture.session;
export const supabase={auth:{getSession:async()=>{fixture.sessionReads++;return{data:{session:fixture.session},error:null}}},from(table){
 fixture.tables.push(table);
 const q={select(){return q},eq(k,v){fixture.filters.push([table,k,v]);return q},in(){return q},abortSignal(){return q},
 maybeSingle:async()=>({data:fixture.profile,error:fixture.statusError?{message:'fixture outage'}:null}),
 then(resolve,reject){return Promise.resolve({data:fixture.purchases,error:fixture.statusError?{message:'fixture outage'}:null}).then(resolve,reject)}};
 return q;
}};`
const fresh=()=>({edge:{nom:'Fixture',planLabels:['quiz_med'],hasVideo:false,hasAnnales:false,protectedPages:[]},status:200,
 fixture:{session:{user:{id:'fixture-uid'},access_token:'fixture-initial',refresh_token:'fixture-refresh'},profile:{category:'medecin',subscription_status:'none'},purchases:[{batch_id:'Quiz',category:'medecin',is_active:true,expires_at:'2099-12-01T00:00:00Z'}],sessionReads:0,tables:[],filters:[],statusError:false}})
test('dashboard complet sans déploiement distant',{skip:!bin&&'Set KHYPNOS_CHROMIUM'},async t=>{
 let state=fresh()
 const css=process.env.KHYPNOS_DASHBOARD_CSS?await fs.readFile(process.env.KHYPNOS_DASHBOARD_CSS,'utf8'):''
 const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://fixture.test').pathname
  if(pathname==='/espace-client/index.html'){
   res.setHeader('Content-Type','text/html');return res.end(html.replace('<script type="module">',`<script>window.__fixture=${JSON.stringify(state.fixture).replace(/</g,'\\u003c')};window.FooterManager=class{init(){}};</script><script type="module">`))
  }
  if(pathname==='/espace-client/auth.js'){res.setHeader('Content-Type','text/javascript');return res.end(auth)}
  if(pathname==='/espace-client/qcm-access.js'){res.setHeader('Content-Type','text/javascript');return res.end(module)}
  if(pathname.endsWith('.css')){res.setHeader('Content-Type','text/css');return res.end(pathname==='/css/dashboard.css'?css:'')}
  res.setHeader('Content-Type','text/javascript');res.end('')
 })
 await new Promise(r=>server.listen(0,'127.0.0.1',r))
 const browser=await chromium.launch({executablePath:bin,headless:true,args:['--no-sandbox']})
 const page=await browser.newPage();const url=`http://127.0.0.1:${server.address().port}/espace-client/index.html`
 const errors=[];page.on('pageerror',e=>errors.push(e.message))
 await page.route('https://fbxiynomlxrjasbbcipp.supabase.co/**',route=>route.fulfill({status:state.status,contentType:'application/json',headers:{'Access-Control-Allow-Origin':'*'},body:JSON.stringify(state.edge)}))
 await page.route('https://khypnos-qcm.vercel.app/**',route=>route.fulfill({contentType:'text/html',body:'Fixture QCM receiver'}))
 const open=async()=>{await page.goto(url);await page.locator('.qcm-access-card').waitFor()}
 try{
  await t.test('Quiz seul : libellé lisible, validité, aucune ressource formation ni faux état vide',async()=>{
   state=fresh();await open();assert.equal(await page.locator('.plan-tag').innerText(),'Quiz fondamental')
   assert.match(await page.locator('.qcm-access-card').innerText(),/Valable jusqu’au/)
   assert.equal(await page.locator('.video-access-card,.annales-access-card,.notion-link-card,.notion-empty-state').count(),0)
   assert.deepEqual(await page.evaluate(()=>window.__fixture.tables.sort()),['profiles','user_purchases'])
   assert((await page.evaluate(()=>window.__fixture.filters)).some(([table,k,v])=>table==='user_purchases'&&k==='user_id'&&v==='fixture-uid'))
  })
  await t.test('RFE et fondamental : marqueurs traduits, échéances séparées, renouvellement du seul expiré',async()=>{
   state=fresh();state.edge.planLabels=['quiz_med','quiz_rfe'];state.fixture.purchases.push({batch_id:'Quiz Recommandations SFAR',category:'medecin',is_active:true,expires_at:'2000-01-01T00:00:00Z'})
   await open();assert.deepEqual(await page.locator('.plan-tag').allTextContents(),['Quiz fondamental','Quiz RFE'])
   assert.equal(await page.locator('.qcm-access-card li').count(),2);assert.equal(await page.getByText('Renouveler',{exact:true}).count(),1)
   assert.match(await page.locator('.qcm-access-card').innerText(),/Accès expiré/)
  })
  await t.test('formation existante et concours : cartes autorisées inchangées',async()=>{
   state=fresh();state.edge={...state.edge,planLabels:['Vidéothèque','Concours Blanc 1 — Voie Interne'],hasVideo:true,hasAnnales:true,protectedPages:[{href:'/espace-client/page-protegee.html?slug=cb1',titre:'Correction CB1'}]}
   await open();assert.equal(await page.locator('.video-access-card,.annales-access-card,.notion-link-card').count(),3)
   assert.equal(await page.locator('.notion-link-card').getAttribute('href'),'/espace-client/page-protegee.html?slug=cb1')
  })
  await t.test('panne lecture échéances : lien QCM conservé, pas de déconnexion ni date inventée',async()=>{
   state=fresh();state.fixture.statusError=true;await open();assert.equal(page.url(),url)
   assert.match(await page.locator('[role=status]').innerText(),/temporairement indisponibles/)
   assert.equal(await page.getByText('Ouvrir l’application QCM',{exact:true}).count(),1)
   assert.equal(await page.locator('.notion-empty-state').count(),0)
  })
  await t.test('panne dashboard : Réessayer sans expulsion puis récupération',async()=>{
   state=fresh();state.status=503;await page.goto(url);await page.getByRole('button',{name:'Réessayer'}).waitFor();assert.equal(page.url(),url)
   state.status=200;await page.getByRole('button',{name:'Réessayer'}).click();await page.locator('.qcm-access-card').waitFor()
   assert.equal(await page.locator('#dashboard-retry').count(),0)
  })
  await t.test('champs affichés échappés : pas de HTML injecté',async()=>{
   state=fresh();state.edge.nom='<img src=x onerror=alert(1)>';state.edge.planLabels=['<img src=x onerror=alert(1)>'];await open()
   assert.equal(await page.locator('#app img').count(),0);assert.match(await page.locator('h1').innerText(),/<img/)
  })
  await t.test('mobile : les deux produits et leurs actions restent accessibles',async()=>{
   state=fresh();state.edge.planLabels=['quiz_med','quiz_rfe'];state.fixture.purchases=[...state.fixture.purchases,{batch_id:'Quiz Recommandations SFAR',category:'medecin',is_active:true,expires_at:'2000-01-01T00:00:00Z'}]
   await page.setViewportSize({width:390,height:844});await open();assert(await page.getByText('Renouveler',{exact:true}).isVisible());assert(await page.getByText('Ouvrir l’application QCM',{exact:true}).isVisible())
  })
  await t.test('clic renouveler : session fraîche en fragment, pas de tokens dans le DOM ni reconnexion',async()=>{
   state=fresh();state.fixture.purchases[0].expires_at='2000-01-01T00:00:00Z';await open()
   await page.evaluate(()=>{window.__fixture.session.access_token='fixture-fresh';window.__fixture.session.refresh_token='fixture-fresh-refresh'})
   assert(!(await page.locator('#app').innerHTML()).includes('access_token='))
   await page.getByText('Renouveler',{exact:true}).click();await page.waitForURL(u=>u.origin==='https://khypnos-qcm.vercel.app')
   const destination=new URL(page.url());assert.equal(destination.pathname,'/receive-session');assert.equal(destination.search,'');assert.match(destination.hash,/fixture-fresh/)
  })
  assert.deepEqual(errors,[])
 }finally{await page.close();await browser.close();await new Promise(r=>server.close(r))}
})
