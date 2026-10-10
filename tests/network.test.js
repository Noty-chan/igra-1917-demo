import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {once} from 'node:events';
import WebSocket from 'ws';

test('network party cycle: permissions, disclosure, broadcasts, dice and SQLite restart',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'igra-network-')),port=18489,base=`http://127.0.0.1:${port}`;
 let child,errors='',ws;
 async function start(){
  child=spawn(process.execPath,['server/index.js'],{env:{...process.env,PORT:String(port),DB_PATH:join(dir,'game.sqlite'),GM_PASSWORD:'gm-test',PLAYER_PASSWORD:'player-test'}});
  child.stderr.on('data',d=>errors+=d);
  for(let i=0;i<100;i++){try{if((await fetch(base+'/api/health')).ok)return;}catch{}await new Promise(r=>setTimeout(r,40));}
  throw Error(errors||'server failed to start');
 }
 async function stop(){child.kill();await once(child,'exit');}
 async function request(path,cookie,body){const r=await fetch(base+path,{method:body?'POST':'GET',headers:{...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined});return {status:r.status,data:await r.json(),cookie:r.headers.get('set-cookie')?.split(';')[0]};}
 const login=(name,password,role)=>request('/api/login',null,{name,password,role});
 const action=(cookie,a)=>request('/api/action',cookie,a);
 try{
  await start();
  assert.equal((await request('/api/session')).status,401);
  assert.equal((await fetch(base+'/content/%67ame.js')).status,403);
  assert.equal((await login('bad','player-test','gm')).status,401);
  const gm=await login('gm','gm-test','gm'),alice=await login('Алиса','player-test','player'),bob=await login('Борис','player-test','player');
  assert.equal(gm.status,200);assert.equal(alice.status,200);
  assert.equal(gm.data.content.npcs.length,14);
  assert.equal(alice.data.content.npcs.length,0);
  const npc='npc-lakey',edit={name:'Лакей после правки',role:'Лакей',summary:'Новое открытое описание',privateText:'SECRET-NPC-EDIT'};
  assert.equal((await action(alice.cookie,{type:'save-npc-text',id:npc,item:edit})).status,400);
  assert.equal((await action(gm.cookie,{type:'save-npc-text',id:npc,item:edit})).status,200);
  await action(gm.cookie,{type:'set-npc-visible',id:npc,visible:true});
  const npcView=(await request('/api/session',alice.cookie)).data;
  assert.equal(npcView.content.npcs[0].summary,edit.summary);
  assert.equal(npcView.content.npcs[0].layers.length,0);
  assert.equal(JSON.stringify(npcView).includes('SECRET-NPC-EDIT'),false);

  assert.equal(alice.data.content.gmGuide.length,0);
  assert.equal(alice.data.content.characters[0].goals.traitor,'');
  assert.equal(alice.data.content.rooms.find(r=>r.id==='room-altar').layers.length,0);
  assert.equal((await action(alice.cookie,{type:'adjust-masquerade',delta:-1,actor:{role:'gm'}})).status,400);
  assert.equal((await login('watch','player-test','spectator')).status,403);
  assert.equal((await action(alice.cookie,{type:'reserve-character',id:'character-01'})).status,200);
  assert.equal((await action(bob.cookie,{type:'reserve-character',id:'character-01'})).status,400);
  assert.equal((await action(alice.cookie,{type:'confirm-character',id:'character-01'})).status,200);
  ws=new WebSocket(`ws://127.0.0.1:${port}/ws`,{headers:{Cookie:alice.cookie}});
  const first=JSON.parse((await once(ws,'message'))[0]);assert.equal(first.type,'snapshot');
  const update=once(ws,'message');
  await action(gm.cookie,{type:'set-goal-visibility',id:'character-01',kind:'main',visible:true});
  const revealed=JSON.parse((await update)[0]).snapshot;assert.ok(revealed.content.characters[0].goals.main.personal);
  assert.equal(revealed.content.characters[0].goals.traitor,'');
  const b=await request('/api/session',bob.cookie);assert.equal(b.data.content.characters[0].goals.main.personal,'');
  await action(gm.cookie,{type:'set-blood-visibility',id:'character-01',visible:true});
  assert.equal((await action(alice.cookie,{type:'set-blood-pool',id:'character-01',value:4})).status,200);
  assert.equal((await action(bob.cookie,{type:'set-blood-pool',id:'character-01',value:99})).status,400);
  const own=(await request('/api/session',alice.cookie)).data,will=own.state.characters['character-01'].willpowerCurrent;
  const c=own.content.characters[0];
  const roll=await action(alice.cookie,{type:'record-roll',id:'roll-test',characterId:c.id,attribute:c.attributes[0].key,ability:c.abilities[0].key,modifier:0,pool:50,dice:Array(50).fill(10),difficulty:6,willpower:true,note:'test'});
  assert.equal(roll.status,200);assert.equal(roll.data.state.journal.at(-1).pool,c.attributes[0].value+c.abilities[0].value);
  assert.equal(roll.data.state.characters[c.id].willpowerCurrent,will-1);
  await action(gm.cookie,{type:'post-message',id:'hidden-test',note:'hidden secret',hidden:true});
  assert.equal((await request('/api/session',bob.cookie)).data.state.journal.some(e=>e.id==='hidden-test'),false);
  await action(gm.cookie,{type:'save-room-description',id:'room-vestibule',text:'Новый проход'});
  await action(gm.cookie,{type:'set-room-visible',id:'room-altar',visible:true});
  await action(gm.cookie,{type:'set-public-viewer',visible:true});
  const watcher=await login('watch','player-test','spectator');assert.equal(watcher.status,200);
  assert.equal((await action(watcher.cookie,{type:'reserve-character',id:'character-02'})).status,400);
  await action(gm.cookie,{type:'set-public-viewer',visible:false});
  assert.equal((await request('/api/session',watcher.cookie)).status,403);
  ws.close();await once(ws,'close');ws=null;
  await stop();await start();
  const restored=(await request('/api/session',alice.cookie)).data;
  assert.equal(restored.state.characters[c.id].bloodPool,4);
  assert.equal(restored.content.npcs.find(n=>n.id===npc).name,edit.name);
  assert.equal((await request('/api/session',gm.cookie)).data.state.npcOverrides[npc].privateText,edit.privateText);
  assert.equal(restored.state.characters[c.id].claim.ownerId,alice.data.actor.id);
  assert.equal(restored.state.rooms['room-vestibule'].description,'Новый проход');
  assert.ok(restored.state.journal.some(e=>e.id==='roll-test'));
  const returning=await login('Алиса','player-test','player');assert.equal(returning.data.actor.id,alice.data.actor.id);
 }finally{ws?.terminate();if(child?.exitCode===null)await stop();await rm(dir,{recursive:true,force:true});}
});
