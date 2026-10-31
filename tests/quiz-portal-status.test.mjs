import test from 'node:test'
import assert from 'node:assert/strict'
import {quizPortalStatus,entitlementText,receiverURL,readQuizPortalStatus,planLabel} from '../espace-client/qcm-access.js'
const now=Date.parse('2026-10-31T12:00:00Z'),profile={category:'medecin',subscription_status:'none'}
const row=(batch_id,expires_at,is_active=true,category='medecin')=>({batch_id,expires_at,is_active,category})
test('Quiz et RFE : échéances séparées, pas de module ou de CB inventé',()=>{
 const p=quizPortalStatus([row('Quiz','2026-12-01T00:00:00Z'),row('Quiz Recommandations SFAR','2027-01-01T00:00:00Z'),row('Concours Blanc 1',null)],profile,now)
 assert.equal(p.quizEntitlements.length,2);assert(p.quizEntitlements.every(e=>e.status==='active'));assert(!('batches'in p))
 assert.notEqual(p.quizEntitlements[0].expires_at,p.quizEntitlements[1].expires_at)
})
test('expiré reste affiché avec renouvellement possible, désactivé distinct',()=>{
 const p=quizPortalStatus([row('Quiz','2000-01-01'),row('Quiz Recommandations SFAR','2099-01-01',false)],profile,now)
 assert.equal(p.quizEntitlements[0].status,'expired');assert.equal(p.quizEntitlements[1].status,'inactive')
 assert.equal(entitlementText(p.quizEntitlements[0],now),'Accès expiré')
})
test('achat permanent et ancien achat expiré : ne pas afficher faux expiré',()=>{
 const p=quizPortalStatus([row('Quiz','2000-01-01'),row('Quiz',null)],profile,now)
 assert.equal(p.quizEntitlements[0].expires_at,null);assert.equal(p.quizEntitlements[0].status,'active')
})
test('catégories cloisonnées, ancien NULL seulement si profil médecin',()=>{
 const rows=[row('Quiz',null,true,'iade'),row('Quiz',null,true,null)]
 assert.equal(quizPortalStatus(rows,profile,now).quizEntitlements.length,1)
 assert.equal(quizPortalStatus(rows,{category:'iade'},now).quizEntitlements.length,0)
})
test('formation complète encore valide : masquer invitation inutile à renouveler',()=>{
 assert(quizPortalStatus([],{...profile,subscription_status:'active'},now).qcmSubscriptionActive)
 assert(!quizPortalStatus([],{...profile,subscription_status:'active',subscription_expires_at:'2000-01-01'},now).qcmSubscriptionActive)
})
test('transfert compatible ancienne app, tokens dans fragment, aucun paramètre nouveau',()=>{
 const u=new URL(receiverURL({access_token:'fixture-a',refresh_token:'fixture-r'}));assert.equal(u.search,'');assert.equal(u.origin,'https://khypnos-qcm.vercel.app')
 assert(!u.hash.includes('renew='));assert.match(u.hash,/access_token=/);assert.throws(()=>receiverURL(null))
})
test('lecture des achats filtrée sur UID connecté, erreurs non masquées',async()=>{
 const calls=[];const client={from(table){return {select(){return this},eq(k,v){calls.push([table,k,v]);return this},in(){return this},maybeSingle:async()=>({data:profile}),then(resolve){return Promise.resolve({data:[row('Quiz',null)]}).then(resolve)}}}}
 assert.equal((await readQuizPortalStatus(client,'fixture-uid')).quizEntitlements.length,1)
 assert(calls.some(([t,k,v])=>t==='user_purchases'&&k==='user_id'&&v==='fixture-uid'))
 await assert.rejects(readQuizPortalStatus({from(){return {select(){return this},eq(){return this},in:async()=>({error:Error()}),maybeSingle:async()=>({data:profile})}}},'fixture-uid'))
})

test('libellés de plans : Quiz/RFE lisibles, autres formations inchangées',()=>{
 assert.equal(planLabel('quiz_med'),'Quiz fondamental');assert.equal(planLabel('quiz_rfe'),'Quiz RFE')
 assert.equal(planLabel('Vidéothèque'),'Vidéothèque');assert.equal(planLabel('__proto__'),'__proto__')
})
test('achat désactivé futur ne remplace pas la date du produit réellement expiré',()=>{
 const p=quizPortalStatus([row('Quiz','2000-01-01'),row('Quiz','2099-01-01',false)],profile,now)
 assert.equal(p.quizEntitlements[0].status,'expired');assert(p.quizEntitlements[0].expires_at.startsWith('2000-01-01'))
})
