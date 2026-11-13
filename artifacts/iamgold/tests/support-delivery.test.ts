import test from 'node:test';
import assert from 'node:assert/strict';
import { reconcileSupportMessages, supportRequest } from '../src/pages/member/support-delivery';

test('une requête bloquée expire même si le transfert ignore le signal',async()=>{
  let transportSignal: AbortSignal | undefined;
  await assert.rejects(supportRequest(signal=>{
    transportSignal=signal;
    return new Promise(()=>{});
  },undefined,15),/délai d’envoi.*conservés/);
  assert.equal(transportSignal?.aborted,true);
});

test('annuler la page interrompt la requête et une annulation préalable ne lance aucun transfert',async()=>{
  const controller=new AbortController();
  const waiting=supportRequest(()=>new Promise(()=>{}),controller.signal,1000);
  controller.abort();
  await assert.rejects(waiting,{name:'AbortError'});
  await assert.rejects(supportRequest(async()=>assert.fail('no request after cancellation'),controller.signal),{name:'AbortError'});
});

test('un envoi réussi renvoie sa confirmation directement',async()=>{
  assert.deepEqual(await supportRequest(async()=>({id:'saved',body:'texte et image'})),{id:'saved',body:'texte et image'});
});

test('seul le clientId confirmé remplace un message local, jamais un texte identique',()=>{
  const current=[
    {id:'local-second',clientId:'second',sender:'member',body:'Même texte'},
  ];
  const first={id:'saved-first',clientId:'first',sender:'member',body:'Même texte'};
  assert.equal(reconcileSupportMessages(current,[first]).length,2);
  const second={id:'saved-second',clientId:'second',sender:'member',body:'Même texte'};
  assert.deepEqual(reconcileSupportMessages(current,[second]),[second]);
});

test('une ancienne lecture ne supprime pas une confirmation reçue après le démarrage du sondage',()=>{
  const saved={id:'saved',clientId:'saved-client',sender:'member'};
  assert.deepEqual(reconcileSupportMessages([saved],[]),[saved]);
});
