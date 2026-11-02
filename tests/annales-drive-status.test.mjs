import {test} from 'node:test';
import assert from 'node:assert/strict';
import {driveStatus,itemsToGenerate} from '../js/annales-drive-status.mjs';
const f=(id='one',modifiedTime='2026-10-22T10:00:00Z')=>({id,modifiedTime});
const state=(source=f(),published=f(),preview=null,extra={})=>driveStatus({source,published:published?{source:published}:null,preview,hasPublishedPdf:true,...extra}).code;
test('existing baseline can be an explicitly assumed snapshot',()=>assert.equal(state(),'current'));
test('opening alone does not change the source',()=>assert.equal(state(f(),f()),'current'));
test('modified source or replacement warns',()=>{assert.equal(state(f('one','2026-10-22T10:00:01Z')),'changed');assert.equal(state(f('other')),'changed')});
test('unverified sources and baseline never claim current',()=>{assert.equal(state(null),'unknown');assert.equal(state(f(),null),'unknown');assert.equal(state(f(),f(),null,{error:'INACCESSIBLE'}),'unknown')});
test('current preview awaiting publication is distinct from published',()=>{const s=f('one','2026-10-23T10:00:00Z');assert.equal(state(s,f(),{publishable:true,source:s}),'ready');assert.equal(state(s,f(),{publishable:false,source:s}),'changed')});
test('missing published PDF needs generation unless preview is ready',()=>{assert.equal(state(f(),null,null,{hasPublishedPdf:false}),'new');assert.equal(state(f(),null,{publishable:true,source:f()},{hasPublishedPdf:false}),'ready')});
test('selection respects six-item limit and excludes unknown and ready',()=>{const xs=Array.from({length:8},(_,year)=>({year,track:'pratique',status:{code:'changed'}}));xs.push({year:9,track:'pratique',status:{code:'unknown'}});assert.equal(itemsToGenerate(xs).length,6);assert.deepEqual(itemsToGenerate(xs,1),[{year:0,track:'pratique'}])});
test('missing expected files are distinct from ambiguity or access errors',()=>{
 for(const error of ['SOURCE_ABSENTE','DOSSIER_ABSENT']){const s=driveStatus({error,hasPublishedPdf:false});assert.equal(s.code,'missing');assert.equal(s.label,'Fichier absent');assert.match(s.description,/introuvable/);}
 for(const error of ['SOURCE_AMBIGUE : plusieurs correspondances','ACCES_DRIVE_REFUSE','RESSOURCE_DRIVE_INTROUVABLE_OU_INACCESSIBLE']){const s=driveStatus({error});assert.equal(s.code,'unknown');assert.equal(s.label,'À vérifier');}
});
test('compact badges retain full meaning',()=>{
 assert.match(driveStatus({source:f('one','2026-10-23T10:00:00Z'),published:{source:f()},hasPublishedPdf:true}).description,/régénérer et republier/);
 assert.match(driveStatus({source:f(),preview:{publishable:true,source:f()},hasPublishedPdf:false}).description,/prêt à publier/);
});
