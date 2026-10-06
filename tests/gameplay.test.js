import test from 'node:test';
import { atmosphereLevel, corruptedTitle } from '../dist/core/atmosphere.js';
import assert from 'node:assert/strict';
import { gameContent as game } from '../dist/content/game.js';
import { hydrateState, transition } from '../dist/core/state.js';
import { evaluateRoll, damagePenalty, visibleJournal } from '../dist/core/dice.js';
import { createLocalSession } from '../dist/core/local-session.js';

const alice={id:'alice',name:'Алиса',role:'player'},bob={id:'bob',name:'Борис',role:'player'},gm={id:'gm',name:'Ведущий',role:'gm'};
const id='character-01',createdAt='2026-10-05T18:00:00.000Z';
function claimed(){
  let s=transition(game,hydrateState(game),{type:'reserve-character',id},alice);
  return transition(game,s,{type:'confirm-character',id},alice);
}
function roll(s,extra={}){
  const c=game.characters[0],a=c.attributes[0],b=c.abilities[0],pool=a.value+b.value;
  return {type:'record-roll',id:'roll-test',createdAt,characterId:id,attribute:a.key,ability:b.key,difficulty:6,dice:Array(pool).fill(6),...extra};
}

test('ones cancel ordinary successes while the willpower success survives',()=>{
  assert.deepEqual(evaluateRoll([1,1,6],6,true),{raw:1,ones:2,ordinary:0,automatic:1,successes:1,outcome:'success'});
  assert.equal(evaluateRoll([1,1,2],6,true).successes,1);
  assert.equal(evaluateRoll([6,1],6).outcome,'failure');
  assert.equal(evaluateRoll([1,2,3],6).outcome,'botch');
  assert.equal(evaluateRoll([2,3],6).outcome,'failure');
  assert.throws(()=>evaluateRoll([0,11],6));
});

test('a player edits only their confirmed, disclosed blood pool',()=>{
  let s=claimed();
  assert.throws(()=>transition(game,s,{type:'set-blood-pool',id,value:4},alice));
  s=transition(game,s,{type:'set-blood-visibility',id,visible:true},gm);
  s=transition(game,s,{type:'set-blood-pool',id,value:0},alice);
  assert.equal(s.characters[id].bloodPool,0);
  assert.throws(()=>transition(game,s,{type:'set-blood-pool',id,value:1},bob));
  assert.throws(()=>transition(game,s,{type:'set-blood-pool',id,value:-1},alice));
});

test('willpower is spent once and a rejected roll spends nothing',()=>{
  let s=claimed(),initial=s.characters[id].willpowerCurrent;
  const before=structuredClone(s);
  assert.throws(()=>transition(game,s,roll(s,{dice:[],willpower:true}),alice));
  assert.deepEqual(s,before);
  s=transition(game,s,roll(s,{willpower:true}),alice);
  assert.equal(s.characters[id].willpowerCurrent,initial-1);
  assert.equal(s.journal[0].result.automatic,1);
  assert.throws(()=>transition(game,s,roll(s),alice));
  s=transition(game,s,{type:'set-willpower',id,value:0},gm);
  assert.throws(()=>transition(game,s,roll(s,{id:'roll-next',willpower:true}),alice));
  assert.throws(()=>transition(game,s,{type:'set-willpower',id,value:game.characters[0].willpower+1},alice));
});

test('wounds reduce the player pool and incapacitation blocks player rolls',()=>{
  let s=claimed();
  s=transition(game,s,{type:'set-health',id,health:[1,2,0,0,0,0,0]},alice);
  assert.equal(damagePenalty(s.characters[id].health),1);
  const action=roll(s);action.dice.pop();
  s=transition(game,s,action,alice);
  assert.equal(s.journal[0].pool,action.dice.length);
  assert.match(s.journal[0].label,/ранения −1/);
  assert.throws(()=>transition(game,s,{type:'set-health',id,health:[1,2,0,0,0,0,0]},bob));
  s=transition(game,s,{type:'set-health',id,health:[1,1,1,1,1,1,1]},gm);
  assert.equal(damagePenalty(s.characters[id].health),null);
  assert.throws(()=>transition(game,s,roll(s,{id:'roll-hurt',dice:[]}),alice));
});

test('the GM sees hidden rolls and messages, players and spectators do not',()=>{
  let s=claimed();
  s=transition(game,s,roll(s),alice);
  s=transition(game,s,{type:'record-roll',id:'roll-secret',createdAt,pool:2,difficulty:6,dice:[8,1],hidden:true,note:'Тайный NPC'},gm);
  s=transition(game,s,{type:'post-message',id:'message-secret',createdAt,note:'Тайная заметка',hidden:true},gm);
  s=transition(game,s,{type:'comment-roll',id:'roll-secret',createdAt,text:'Комментарий к тайному броску'},gm);
  assert.equal(visibleJournal(s,gm).length,3);
  assert.deepEqual(visibleJournal(s,alice).map(r=>r.id),['roll-test']);
  assert.deepEqual(visibleJournal(s,{role:'spectator'}).map(r=>r.id),['roll-test']);
  assert.throws(()=>transition(game,s,roll(s,{id:'roll-player-secret',hidden:true}),alice));
  assert.throws(()=>transition(game,s,{type:'comment-roll',id:'roll-test',createdAt,text:'Подмена'},bob));
  assert.throws(()=>transition(game,s,{type:'post-message',id:'message-guest',createdAt,note:'Вмешательство'},{id:'guest',role:'spectator'}));
});

test('only the GM creates, updates, announces and deletes events',()=>{
  let s=hydrateState(game);
  assert.equal(s.events[0].visible,false);
  const event={type:'save-event',id:'event-new',title:'Запрет',text:'Новый текст правил',dayId:null,visible:false};
  assert.throws(()=>transition(game,s,event,alice));
  s=transition(game,s,event,gm);
  s=transition(game,s,{type:'toggle-event',id:event.id,visible:true},gm);
  assert.equal(s.events.find(e=>e.id===event.id).visible,true);
  s=transition(game,s,{...event,text:'Исправленный текст',visible:true},gm);
  assert.equal(s.events.filter(e=>e.id===event.id).length,1);
  assert.throws(()=>transition(game,s,{...event,dayId:'wrong-day'},gm));
  s=transition(game,s,{type:'delete-event',id:event.id},gm);
  assert.equal(s.events.some(e=>e.id===event.id),false);
});

test('old saved sessions migrate and journal comments persist across refresh',()=>{
  const old={characters:{[id]:{bloodPool:0,bloodVisible:true}},cleanNightVisible:true};
  const migrated=hydrateState(game,old);
  assert.deepEqual(migrated.characters[id].health,Array(7).fill(0));
  assert.equal(migrated.characters[id].willpowerCurrent,game.characters[0].willpower);
  assert.equal(migrated.events[0].visible,true);
  let raw=JSON.stringify(claimed());
  const storage={getItem:()=>raw,setItem:(_,value)=>{raw=value}};
  const session=createLocalSession(game,storage);
  session.dispatch(roll(session.read()),alice);
  session.dispatch({type:'comment-roll',id:'roll-test',text:'Проверено',createdAt},gm);
  const second=createLocalSession(game,storage);
  assert.equal(second.read().journal[0].comments[0].text,'Проверено');
  assert.equal(second.read().characters[id].claim.ownerId,'alice');
});
test('unrevealed masquerade does not leak through decoration; zero and full remain readable', () => {
  const state={masquerade:{value:1,visible:false}};
  assert.equal(atmosphereLevel(state,'player'),5);
  assert.equal(atmosphereLevel(state,'spectator'),5);
  assert.equal(atmosphereLevel(state,'gm'),1);
  state.masquerade.visible=true;
  assert.equal(atmosphereLevel(state,'player'),1);
  const title='Ночь первая · 1917';
  assert.equal(corruptedTitle(title,5),title);
  assert.equal(corruptedTitle(title,0),title);
  const marked=corruptedTitle(title,1);
  assert.equal(marked.replace(/\p{M}/gu,''),title);
  assert.ok(marked.includes('1917'));
});


test('journal deletion enforces ownership, survives hydration and never refunds willpower',()=>{
 let s=transition(game,claimed(),roll(claimed(),{willpower:true}),alice);
 const spent=s.characters[id].willpowerCurrent;
 assert.throws(()=>transition(game,s,{type:'delete-journal',id:'roll-test'},bob));
 s=transition(game,s,{type:'delete-journal',id:'roll-test'},alice);
 assert.equal(s.characters[id].willpowerCurrent,spent);
 assert.equal(hydrateState(game,s).journal.length,0);
 s=transition(game,s,{type:'post-message',id:'message-gm',createdAt,note:'test',hidden:true},gm);
 assert.throws(()=>transition(game,s,{type:'delete-journal',id:'message-gm'},alice));
 assert.equal(transition(game,s,{type:'delete-journal',id:'message-gm'},gm).journal.length,0);
});

test('custom NPCs remain hidden until revealed, survive refresh and reject unsafe portraits',()=>{
 const item={id:'custom-test',name:'Гость',role:'Врач',summary:'Описание',portrait:{src:'data:image/jpeg;base64,YQ=='}};
 let s=hydrateState(game);
 assert.throws(()=>transition(game,s,{type:'save-custom-npc',item},alice));
 assert.throws(()=>transition(game,s,{type:'save-custom-npc',item:{...item,portrait:{src:'javascript:alert(1)'}}},gm));
 s=transition(game,s,{type:'save-custom-npc',item},gm);
 assert.equal(s.npcs[item.id].visible,false);
 s=transition(game,s,{type:'set-npc-visible',id:item.id,visible:true},gm);
 s=hydrateState(game,JSON.parse(JSON.stringify(s)));
 assert.equal(s.npcs[item.id].visible,true);assert.equal(s.customNpcs[0].portrait.src,item.portrait.src);
 assert.throws(()=>transition(game,s,{type:'delete-custom-npc',id:item.id},alice));
 s=transition(game,s,{type:'delete-custom-npc',id:item.id},gm);
 assert.equal(s.customNpcs.length,0);assert.equal(s.npcs[item.id],undefined);
});

test('a failed custom portrait save does not pretend to persist or change the session',()=>{
 const storage={getItem:()=>null,setItem:()=>{throw new Error('quota');}};
 const session=createLocalSession(game,storage);
 assert.throws(()=>session.dispatch({type:'save-custom-npc',item:{id:'custom-test',name:'Гость',role:'',summary:'',portrait:null}},gm),/хранилище/);
 assert.equal(session.read().customNpcs.length,0);
});

test('secret locations start hidden and only the GM can disclose them',()=>{
 let s=hydrateState(game);const secret='room-altar';assert.equal(s.rooms[secret].visible,false);
 assert.equal(s.rooms['room-vestibule'].visible,true);
 assert.throws(()=>transition(game,s,{type:'set-room-visible',id:secret,visible:true},alice));
 s=transition(game,s,{type:'set-room-visible',id:secret,visible:true},gm);
 assert.equal(hydrateState(game,s).rooms[secret].visible,true);
 s=transition(game,s,{type:'set-room-visible',id:secret,visible:false},gm);
 assert.equal(hydrateState(game,s).rooms[secret].visible,false);
});
