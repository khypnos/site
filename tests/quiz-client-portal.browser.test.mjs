// Optional isolated Chromium. No real Supabase, Stripe, password or user data.
import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import http from 'node:http'
import {chromium} from 'playwright'
const bin=process.env.KHYPNOS_CHROMIUM
const moduleSource=await fs.readFile(new URL('../espace-client/qcm-access.js',import.meta.url),'utf8')
test('espace client dans Chromium isolé',{skip:!bin&&'Set KHYPNOS_CHROMIUM'},async t=>{
 const server=http.createServer((req,res)=>{
  if(req.url==='/qcm-access.js'){res.setHeader('Content-Type','text/javascript');return res.end(moduleSource)}
  res.setHeader('Content-Type','text/html');res.end('<!doctype html><main id="slot"></main><script type="module">import{mountQcmAccess}from"/qcm-access.js";window.mount=payload=>mountQcmAccess(document.getElementById("slot"),payload,{readSession:async()=>{window.reads++;return window.session},navigate:url=>window.navigation=url});window.reads=0;window.ready=true;</script>')
 })
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const browser=await chromium.launch({executablePath:bin,headless:true,args:['--no-sandbox']})
 const page=await browser.newPage()
 try{
  await page.goto(`http://127.0.0.1:${server.address().port}`);await page.waitForFunction(()=>window.ready)
  const payload={referenceTime:'2026-10-31T12:00:00Z',quizEntitlements:[{label:'Quiz fondamental',product_type:'quiz_med',status:'active',expires_at:'2026-12-01T00:00:00Z'}]}
  await t.test('quiz actif : décompte et seul accès QCM, aucune donnée auth dans le DOM',async()=>{
   await page.evaluate(p=>window.mount(p),payload)
   assert.equal(await page.locator('h2').textContent(),'Accès QCM');assert.match(await page.locator('#slot').innerText(),/Valable jusqu’au/)
   assert.equal(await page.getByText('Renouveler',{exact:true}).count(),0)
   assert.equal(await page.locator('a').count(),1);assert(!(await page.content()).includes('access_token='))
  })
  await t.test('expiré : renouvellement avec session lue au clic, sans reconnexion',async()=>{
   await page.evaluate(p=>window.mount({...p,quizEntitlements:p.quizEntitlements.map(e=>({...e,status:'expired',expires_at:'2000-01-01T00:00:00Z'}))}),payload)
   assert.match(await page.locator('#slot').innerText(),/Accès expiré/)
   await page.evaluate(()=>{window.session={access_token:'fresh-fixture-token',refresh_token:'fresh-refresh'}})
   await page.getByText('Renouveler',{exact:true}).click();await page.waitForFunction(()=>window.navigation)
   const url=new URL(await page.evaluate(()=>window.navigation));assert.equal(url.search,'');assert(!url.hash.includes("renew="));assert.match(url.hash,/fresh-fixture-token/)
   assert.equal(await page.evaluate(()=>window.reads),1);assert(!(await page.locator('#slot').innerHTML()).includes('fresh-fixture'))
  })
  await t.test('abonnement complet : pas de faux renouvellement pour ancien quiz expiré',async()=>{
   await page.evaluate(p=>window.mount({...p,qcmSubscriptionActive:true}),payload)
   assert.match(await page.locator('#slot').innerText(),/inclus dans ta formation/);assert.equal(await page.getByText('Renouveler',{exact:true}).count(),0)
  })
  await t.test('nom de produit traité en texte, pas en HTML exécutable',async()=>{
   await page.evaluate(p=>window.mount({...p,quizEntitlements:p.quizEntitlements.map(e=>({...e,label:'<img src=x onerror=alert(1)>'}))}),payload)
   assert.equal(await page.locator('#slot img').count(),0);assert.match(await page.locator('strong').textContent(),/<img/)
  })
 }finally{await page.close();await browser.close();await new Promise(r=>server.close(r))}
})
