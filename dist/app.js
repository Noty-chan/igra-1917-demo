import {networkLogin,createNetworkSession} from './core/network-session.js?v=18';
const network=window.IGRA_NETWORK===true;
let initial=network?await networkLogin():null;
let game=network?initial.content:(await import('./content/game.js?v=18')).gameContent;
import { disciplineReference } from './content/disciplines.js?v=18';
import { archetypeReference } from './content/archetypes.js?v=18';
import { ownedCharacter } from './core/state.js?v=18';
import { createLocalSession } from './core/local-session.js?v=18';
import { healthLevels, damagePenalty, throwD10, visibleJournal } from './core/dice.js?v=18';
import { applyAtmosphere, decorateTitles } from './core/atmosphere.js?v=18';
import { requireDemoLogin } from './core/access.js';

if(!network)await requireDemoLogin();
let storage;
try { storage = window.localStorage; } catch { storage = null; }
const session = network?createNetworkSession(initial):createLocalSession(game, storage, 'igra-workbench-v2');
let playerIdentity = {id:'preview-player',name:'Игрок 1'};
try {
  const saved = JSON.parse(storage?.getItem('igra-preview-identity-v1') || 'null');
  if(typeof saved?.id==='string' && typeof saved?.name==='string') playerIdentity=saved;
} catch {}
if(network)playerIdentity={id:initial.actor.id,name:initial.actor.name};
let state=session.read(), role=network?initial.actor.role:'player', opened=null, selectedSheetCharacter=null;
const views=['house','roster','sheet','npcs','journal'];
let view=views.includes(location.hash.slice(1))?location.hash.slice(1):'house';
let editingNpc=null;
const allNpcs=()=>[...game.npcs,...state.customNpcs];
let editingEvent=null, commentFor=null, journalFilter='all', journalCount=50;
let rollDraft={pool:5,difficulty:6,modifier:0,attribute:'',ability:'',characterId:'',willpower:false,hidden:false,note:'',label:''};
const main=document.querySelector('#content'), dialog=document.querySelector('#detail');
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const prose=v=>String(v??'').split(/\n\s*\n/).filter(Boolean).map(p=>`<p>${esc(p).replace(/\n/g,'<br>')}</p>`).join('');
const actor=()=>network?initial.actor:role==='gm'?{id:'preview-gm',role,name:'Ведущий'}:{...playerIdentity,role};
const day=()=>game.days.find(d=>d.id===state.dayId);
const owner=()=>ownedCharacter(state,playerIdentity.id);
const sheetCharacter=()=>role==='gm'?(selectedSheetCharacter||owner()):owner();
const title=(text,subtitle='')=>`<div class="title-block"><h1>${esc(text)}</h1>${subtitle?`<p>${esc(subtitle)}</p>`:''}</div>`;
const uuid=prefix=>`${prefix}-${crypto.randomUUID()}`;
const timestamp=()=>new Date().toISOString();
const generation=c=>c.generation?`${parseInt(c.generation,10)}-е поколение`:'';
const publicFacts=c=>c.concealedIdentity?'Клан · ??? / Секта · ??? / Поколение · ???':[c.clan,c.affiliation,generation(c)].filter(Boolean).join(' · ');
const privateFacts=c=>[c.clan,c.affiliation,generation(c)].filter(Boolean).join(' · ');
const publicDescription=c=>c.concealedIdentity?'???':c.description;
const publishedEvents=()=>state.events.filter(e=>e.visible&&(!e.dayId||e.dayId===state.dayId));
function asset(src) {
  if(typeof src!=='string'||!src)return '';
  if(typeof src==='string'&&/^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/.test(src))return src;
  try { const u=new URL(src,location.href);return u.protocol==='https:'||(u.origin===location.origin&&/^https?:$/.test(u.protocol))?u.href:''; } catch{return '';}
}
function illustration(data,className='') {
  const src=asset(data?.src);
  return src?`<img class="${className}" src="${esc(src)}" alt="${esc(data.alt)}" loading="lazy">`:'';
}
function portrait(c,dead=Boolean(state.characters[c.id]?.death)) {
  const data=dead&&c.deathPortrait?c.deathPortrait:c.portrait, src=asset(data?.src);
  if(!src)return '<div class="portrait absent" aria-label="Портрет ожидается">И</div>';
  if(Number.isInteger(data.cell))return `<div class="portrait atlas" role="img" aria-label="${esc(data.alt)}" style="background-image:url('${esc(src)}');background-position:${data.cell%3*50}% ${Math.floor(data.cell/3)*50}%"></div>`;
  return illustration(data,`portrait${dead?' death-art':''}`);
}
function toast(message) {
  const el=document.querySelector('#toast');el.textContent=message;el.classList.add('show');
  clearTimeout(toast.timer);toast.timer=setTimeout(()=>el.classList.remove('show'),4000);
}
function navigate(next,hash=true) {
  if(!views.includes(next))throw new Error('Неизвестный раздел.');
  view=next;dialog.close();if(hash)history.replaceState(null,'',`#${next}`);render();
  window.scrollTo({top:0,behavior:'instant'});
}
async function act(action,message='') {
  try {state=await session.dispatch(action,actor());if(!network){render();if(opened)renderDialog();}if(message)toast(message);return true;}
  catch(error){toast(error.message||'Действие не выполнено.');return false;}
}
function levelControl(kind,item,current) {
  return item.layers.length?`<label class="level-control">Общие сведения<select data-level="${kind}" data-id="${esc(item.id)}">${Array.from({length:item.layers.length+1},(_,i)=>`<option value="${i}" ${current===i?'selected':''}>${i===0?'Базовые':`${i} · ${esc(item.layers[i-1].title)}`}</option>`).join('')}</select></label>`:'';
}
function layers(item,level,gm=role==='gm') {
  return item.layers.map((l,i)=>i<level||gm?`<section class="disclosure ${i>=level?'behind-screen':''}"><h3>${i>=level?'За ширмой · ':''}${esc(l.title)}</h3>${prose(l.text)}</section>`:'').join('');
}
function dots(value,max=5) {
  const n=Math.max(0,Math.min(max,Number(value)||0));
  return `<span class="dot-rating" aria-label="${n} из ${max}">${Array.from({length:max},(_,i)=>`<i class="rating-dot ${i<n?'filled':''}" aria-hidden="true"></i>`).join('')}</span>`;
}
function dotList(items,discipline=false) {
  return `<dl class="dot-list">${items.map(x=>`<div><dt>${discipline?`<button class="discipline-link text-button" data-discipline="${esc(x.name)}" data-rating="${x.value}">${esc(x.name)}</button>`:esc(x.name)}</dt><dd>${dots(x.value,x.max||(x.value>5?10:5))}</dd></div>`).join('')}</dl>`;
}
function statGroups(c) {
  const attr=[
    ['Физические',['strength','dexterity','stamina']],
    ['Социальные',['charisma','manipulation','appearance']],
    ['Ментальные',['perception','intelligence','wits']]
  ];
  const groups=(values)=>values.map(([name,items])=>`<section class="stat-group"><h3>${name}</h3>${dotList(items,name==='Дисциплины')}</section>`).join('');
  return `<section class="sheet-section"><h2>Характеристики</h2><div class="stat-row">${groups(attr.map(([n,keys])=>[n,c.attributes.filter(a=>keys.includes(a.key))]))}</div></section><section class="sheet-section"><h2>Способности</h2><div class="stat-row">${groups(['Таланты','Навыки','Знания'].map(n=>[n,c.abilities.filter(a=>a.group===n)]))}</div></section><section class="sheet-section"><div class="stat-row">${groups([['Дисциплины',c.disciplines],['Добродетели',c.virtues],['Постоянные значения',[{name:'Сила воли',value:c.willpower,max:10},{name:'Человечность',value:c.humanity,max:10}]]])}</div></section>`;
}
function archetypeLinks(c) {
  return `<div class="archetype-pair"><div><span>Натура</span><button class="text-button" data-archetype="${esc(c.nature)}">${esc(c.nature)}${c.natureNote?` (${esc(c.natureNote.toLowerCase())})`:''}</button></div><div><span>Маска</span><button class="text-button" data-archetype="${esc(c.mask)}">${esc(c.mask)}</button></div></div>`;
}
function objectivePanel(c,s) {
  const mainGoal=s.goals.mainVisible,traitor=s.goals.traitorVisible,isGM=role==='gm';
  return `<section class="sheet-section goals-block"><h2>Цели</h2>${isGM||mainGoal?`<details id="goals-main-${c.id}" class="objective-card" ${isGM?'':'open'}><summary>Две основные цели${isGM?` · ${mainGoal?'открыты':'скрыты'}`:''}</summary><p><strong>Личная:</strong> ${esc(c.goals.main.personal)}</p><p><strong>Игровая:</strong> ${esc(c.goals.main.game)}</p>${isGM?`<button data-goal="main" data-id="${c.id}" data-visible="${!mainGoal}">${mainGoal?'Скрыть от игрока':'Открыть игроку'}</button>`:''}</details>`:'<p class="closed-message">Основные цели ещё не открыты.</p>'}${isGM||traitor?`<details id="goals-traitor-${c.id}" class="objective-card" ${isGM?'':'open'}><summary>Цель предателя${isGM?` · ${traitor?'открыта':'скрыта'}`:''}</summary>${prose(c.goals.traitor)}${isGM?`<button data-goal="traitor" data-id="${c.id}" data-visible="${!traitor}">${traitor?'Скрыть от игрока':'Открыть игроку'}</button>`:''}</details>`:'<p class="closed-message">Отдельная цель ещё не открыта.</p>'}</section>`;
}
function bloodPanel(c,s) {
  if(role!=='gm'&&!s.bloodVisible)return '<section class="resource-card"><h3>Запас крови</h3><p>Пока скрыт ведущим.</p></section>';
  return `<section class="resource-card"><h3>Запас крови</h3><div class="resource-value"><button data-blood-step="-1" data-id="${c.id}" aria-label="Потратить кровь" ${s.bloodPool===0?'disabled':''}>−</button><input aria-label="Запас крови" type="number" min="0" max="100" step="1" value="${s.bloodPool}" data-blood="${c.id}"><button data-blood-step="1" data-id="${c.id}" aria-label="Добавить кровь">+</button></div>${role==='gm'?`<button data-blood-visible="${c.id}" data-visible="${!s.bloodVisible}">${s.bloodVisible?'Скрыть от игрока':'Показать игроку'}</button>`:''}</section>`;
}
function willpowerPanel(c,s) {
  return `<section class="resource-card"><h3>Воля</h3><div class="resource-value"><button data-will-step="-1" data-id="${c.id}" aria-label="Потратить волю" ${s.willpowerCurrent===0?'disabled':''}>−</button><strong>${s.willpowerCurrent} / ${c.willpower}</strong><button data-will-step="1" data-id="${c.id}" aria-label="Восстановить волю" ${s.willpowerCurrent===c.willpower?'disabled':''}>+</button></div><a href="#journal" data-link-view="journal">Бросок с автоуспехом →</a></section>`;
}
function healthPanel(c,s) {
  const marks=['□','/','×','✱'],labels=['Нет повреждения','Ударный','Летальный','Агравированный'];
  const penalty=damagePenalty(s.health),count=s.health.filter(Boolean).length;
  return `<section class="resource-card health-panel"><h3>Повреждения</h3><p>${count?penalty===null?'Обездвижен':`Штраф к пулу: −${penalty}`:'Здоров'}</p><div class="health-levels">${healthLevels.map((l,i)=>`<button class="damage-type type-${s.health[i]}" data-health="${i}" data-id="${c.id}" aria-label="${l.name}: ${labels[s.health[i]]}; сменить тип" title="Нажатие: пусто → ударный → летальный → агравированный"><span>${marks[s.health[i]]}</span><span>${esc(l.name)}</span><small>${l.penalty===null?'—':l.penalty?`−${l.penalty}`:'0'}</small></button>`).join('')}</div><small>/ ударный · × летальный · ✱ агравированный</small></section>`;
}
function roomDescription(r){return state.rooms[r.id].description??(r.layers.map(l=>l.text).join('\n\n')||r.summary);}
function masqueradePanel() {
  if(role!=='gm'&&!state.masquerade.visible)return '';
  return `<section class="masquerade-panel"><div><h2>Маскарад</h2>${role==='gm'?'<p>0–5</p>':''}</div><strong>${state.masquerade.value}</strong>${role==='gm'?`<div class="inline-controls"><button data-masquerade="-2">−2</button><button data-masquerade="-1">−1</button><button data-masquerade="1">+1</button><button data-masquerade="2">+2</button><button data-masquerade-visible="${!state.masquerade.visible}">${state.masquerade.visible?'Скрыть от игроков':'Открыть игрокам'}</button></div>`:''}</section>`;
}
function eventCards(items,management=false) {
  return items.map(e=>`<article class="event-card ${management&&!e.visible?'draft':''}"><span class="eyebrow">${esc(e.dayId?game.days.find(d=>d.id===e.dayId)?.title:'Все ночи')}${management?` · ${e.visible?'объявлено':'черновик'}`:''}</span><h2>${esc(e.title)}</h2>${prose(e.text)}${management?`<div class="inline-controls"><button data-edit-event="${e.id}">Изменить</button><button data-toggle-event="${e.id}" data-visible="${!e.visible}">${e.visible?'Скрыть':'Объявить'}</button><button data-delete-event="${e.id}" class="danger-button">Удалить</button></div>`:''}</article>`).join('');
}
function house() {
  const announcements=publishedEvents();
  const rooms=game.rooms.filter(r=>role==='gm'||state.rooms[r.id].visible).map(r=>{
    const s=state.rooms[r.id];
    return `<article class="room-card ${!s.visible?'locked':''}"><h3>${esc(r.name)}</h3>${r.image?illustration(r.image,'room-preview'):''}${prose(roomDescription(r))}<button data-room="${r.id}">Осмотреть</button>${role==='gm'?`<button data-room-visible="${r.id}">${s.visible?'Скрыть локацию':'Открыть игрокам'}</button>`:''}</article>`;
  }).join('');
  return `<section class="hero"><h1>Особняк Вяземских</h1><figure class="manor-frame"><i class="frame-corner top-left" aria-hidden="true"></i><i class="frame-corner top-right" aria-hidden="true"></i><i class="frame-corner bottom-left" aria-hidden="true"></i><i class="frame-corner bottom-right" aria-hidden="true"></i>${illustration(game.house.image)}</figure><div class="house-copy">${prose(game.house.intro.replace(/\n/g,' '))}${prose(game.house.history.replace(/\n/g,' '))}</div></section><section class="locations"><div class="section-heading"><h2>Локации</h2></div><div class="room-grid">${rooms}</div></section>${announcements.length?`<section class="house-announcements" aria-label="Объявления">${eventCards(announcements)}</section>`:''}<details id="house-rules" class="rule-card house-rules"><summary>Правила игры</summary><div class="rules-grid">${game.playerGuide.map(r=>`<article class="rule-card"><h2>${esc(r.title)}</h2>${prose(r.text)}</article>`).join('')}</div></details>${role==='gm'?houseManagement():masqueradePanel()}`;
}
function houseManagement() {
  return `<details id="house-controls" class="rule-card"><summary>Управление ведущего</summary>${masqueradePanel()}<section class="viewer-control"><h3>Зрительский режим</h3><button data-public-viewer="${!state.publicViewerEnabled}">${state.publicViewerEnabled?'Закрыть зрительский режим':'Включить зрительский режим'}</button></section><details id="house-event-editor" class="rule-card" ${editingEvent?'open':''}><summary>Объявления и новые правила</summary>${eventEditor()}</details><details class="rule-card"><summary>Что снижает Маскарад</summary><ul class="masquerade-events">${game.masqueradeEvents.map(x=>`<li><span>${esc(x.label)}</span><strong>${x.change>0?'+':''}${x.change}</strong>${x.note?`<small>${esc(x.note)}</small>`:''}</li>`).join('')}</ul></details><details class="rule-card"><summary>Памятка ведущему</summary>${game.gmGuide.map(r=>`<details class="rule-card"><summary>${esc(r.title)}</summary>${prose(r.text)}</details>`).join('')}</details></details>`;
}

function roster() {
  return `<div class="roster-stage"><div class="puppeteer" aria-hidden="true"><img src="assets/puppeteer-engraving.png" alt=""></div><div class="roster" aria-label="Игроки: девять портретов">${game.characters.map(c=>`<button class="portrait-button ${state.characters[c.id].death?'dead':''}" data-character="${c.id}" aria-label="Открыть: ${esc(c.name)}${state.characters[c.id].death?' · погиб':''}">${portrait(c)}</button>`).join('')}</div></div>`;
}
function sheet() {
  const id=sheetCharacter(),c=game.characters.find(c=>c.id===id);
  if(!c)return `<div class="empty-state"><h1>${role==='gm'?'Выберите персонажа':'Мой персонаж'}</h1><p>${role==='gm'?'Откройте портрет во вкладке «Игроки».':'Лист станет доступен после подтверждения персонажа.'}</p><button class="gold-button" data-view="roster">Игроки</button></div>`;
  const s=state.characters[id],noteOwner=s.claim?.ownerId||playerIdentity.id;
  return title(c.name,privateFacts(c))+`<div class="sheet-layout"><aside class="sheet-sidebar"><div class="${s.death?'dead':''}">${portrait(c)}</div>${s.death?`<p class="death-date">Погиб · ${esc(s.death.label)}</p>`:''}${role==='gm'?`<label>Персонаж<select id="gm-sheet-select">${game.characters.map(x=>`<option value="${x.id}" ${x.id===id?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><div class="inline-controls"><button data-death="${id}" class="danger-button">${s.death?'Отменить смерть':'Отметить смерть'}</button>${s.claim?`<button data-release="${id}">Освободить</button>`:''}</div>${levelControl('character',c,s.level)}`:''}<section class="character-description"><h2>Досье</h2>${prose(c.description)}</section></aside><article class="sheet-copy">${archetypeLinks(c)}${statGroups(c)}<div class="resources">${bloodPanel(c,s)}${willpowerPanel(c,s)}${healthPanel(c,s)}</div>${c.curse?`<section class="curse sheet-section"><h2>Проклятие</h2>${prose(c.curse)}</section>`:''}${layers(c,s.level)}${objectivePanel(c,s)}<section class="sheet-section"><h2>Заметки</h2><textarea id="notes" rows="5" ${role==='gm'?'readonly':''} placeholder="Личные записи">${esc(state.notes[`${noteOwner}:${id}`]||'')}</textarea><small id="notes-status">${role==='gm'?'Заметки владельца':'Сохранение при вводе'}</small></section></article></div>`;
}
function npcEditor() {
  const n=allNpcs().find(n=>n.id===editingNpc);
  return `<details id="npc-editor" class="panel"><summary>${n?'Изменить действующее лицо':'Добавить действующее лицо'}</summary><form id="npc-form"><label>Имя<input name="name" maxlength="120" required value="${esc(n?.name)}"></label><label>Роль<input name="role" maxlength="120" value="${esc(n?.role)}" placeholder="Например, гость особняка"></label><label>Описание<textarea name="summary" rows="5" maxlength="10000">${esc(n?.summary)}</textarea></label><label>Портрет<input name="portrait" type="file" accept="image/png,image/jpeg,image/webp"></label>${n?.portrait?'<label class="checkbox-label"><input type="checkbox" name="removePortrait">Убрать портрет</label>':''}<p>Персонаж появится скрытым. Нажмите «Представить игрокам», когда будет нужно.</p><small>${network?'Сохранение на сервере.':'Сохранение в этом браузере.'} Изображение будет уменьшено для хранения.</small><button type="submit" class="gold-button">Сохранить</button>${n?'<button type="button" id="cancel-npc">Отмена</button>':''}</form></details>`;
}
async function uploadedPortrait(file) {
  if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>15*1024*1024)throw new Error('Нужен JPEG, PNG или WebP размером до 15 МБ.');
  const image=await createImageBitmap(file);
  const scale=Math.min(1,720/Math.max(image.width,image.height)),canvas=document.createElement('canvas');
  canvas.width=Math.max(1,Math.round(image.width*scale));canvas.height=Math.max(1,Math.round(image.height*scale));
  const ctx=canvas.getContext('2d');ctx.fillStyle='#000';ctx.fillRect(0,0,canvas.width,canvas.height);ctx.drawImage(image,0,0,canvas.width,canvas.height);image.close();
  for(const quality of [.86,.72,.55,.35]){const src=canvas.toDataURL('image/jpeg',quality);if(src.length<=350000)return src;}
  throw new Error('Изображение слишком сложное для хранения. Выберите меньший файл.');
}
function npcs() {
  const entries=allNpcs().filter(n=>role==='gm'||state.npcs[n.id].visible);
  return title('Действующие лица')+(role==='gm'?npcEditor():'')+(entries.length?`<div class="npc-grid">${entries.map(n=>{const s=state.npcs[n.id];return `<article class="npc-card"><div>${portrait(n,false)}</div><div><span class="eyebrow">${role==='gm'&&!s.visible?'Скрыт · ':''}${esc(n.role)}</span><h2>${esc(n.name)}</h2>${prose(n.summary)}${layers(n,s.level)}${role==='gm'?`<button data-npc="${n.id}">${s.visible?'Скрыть':'Представить игрокам'}</button>${levelControl('npc',n,s.level)}${n.custom?`<button data-edit-npc="${n.id}">Изменить</button><button data-delete-npc="${n.id}" class="danger-button">Удалить</button>`:''}`:''}</div></article>`;}).join('')}</div>`:'<p class="empty-state">Новые лица ещё не представлены.</p>');
}
function eventEditor() {
  const e=state.events.find(e=>e.id===editingEvent);
  return `<div class="events-layout"><form id="event-form" class="panel"><h2>${e?'Изменить объявление':'Новое объявление'}</h2><label>Название<input name="title" maxlength="120" required value="${esc(e?.title||'')}"></label><label>Текст<textarea name="text" rows="7" maxlength="10000" required>${esc(e?.text||'')}</textarea></label><label>Показывать<select name="dayId"><option value="">Во все ночи</option>${game.days.map(d=>`<option value="${d.id}" ${e?.dayId===d.id?'selected':''}>${esc(d.title)}</option>`).join('')}</select></label><label class="checkbox-label"><input type="checkbox" name="visible" ${e?.visible?'checked':''}>Объявить игрокам</label><div class="inline-controls"><button class="gold-button" type="submit">Сохранить</button>${e?'<button type="button" id="cancel-event">Новое объявление</button>':''}</div></form><section class="event-list">${eventCards(state.events,true)}</section></div>`;
}
function rollCharacter() {return game.characters.find(c=>c.id===(role==='gm'?rollDraft.characterId:owner()));}
function rollComposer() {
  const c=rollCharacter(),s=c?state.characters[c.id]:null;
  if(role==='spectator')return '';
  const player=role==='player';
  if(player&&!c)return '<aside class="panel"><p>Подтвердите персонажа, чтобы делать броски. Открытый журнал доступен для чтения.</p><button data-view="roster">Выбрать персонажа</button></aside>';
  if(c&&!c.attributes.some(a=>a.key===rollDraft.attribute))rollDraft.attribute=c.attributes[0].key;
  if(c&&!c.abilities.some(a=>a.key===rollDraft.ability))rollDraft.ability=c.abilities[0].key;
  const options=(items,current)=>items.map(x=>`<option value="${esc(x.key)}" ${x.key===current?'selected':''}>${esc(x.name)} · ${x.value}</option>`).join('');
  return `<aside class="panel roll-composer"><form id="journal-form"><h2>${player?'Бросок персонажа':'Бросок ведущего'}</h2>${player?`<p>${esc(c.name)}</p><label>Характеристика<select name="attribute">${options(c.attributes,rollDraft.attribute)}</select></label><label>Навык<select name="ability">${options(c.abilities,rollDraft.ability)}</select></label><label>Модификатор<input name="modifier" type="number" min="-10" max="10" value="${rollDraft.modifier}"></label>${damagePenalty(s.health)?`<p class="injury-note">${damagePenalty(s.health)===null?'Персонаж обездвижен':`Штраф за ранения: −${damagePenalty(s.health)}`}</p>`:''}`:`<label>От имени<select name="characterId"><option value="">Ведущий</option>${game.characters.map(x=>`<option value="${x.id}" ${x.id===rollDraft.characterId?'selected':''}>${esc(x.name)}</option>`).join('')}</select></label><label>Кубиков d10<input name="pool" type="number" min="0" max="50" value="${rollDraft.pool}"></label><label>Название броска<input name="label" maxlength="120" value="${esc(rollDraft.label)}" placeholder="Например, проверка охраны"></label><label class="checkbox-label"><input name="hidden" type="checkbox" ${rollDraft.hidden?'checked':''}>Скрытый бросок / сообщение</label>`}<label>Сложность<select name="difficulty">${[2,3,4,5,6,7,8,9,10].map(n=>`<option value="${n}" ${n===Number(rollDraft.difficulty)?'selected':''}>${n}</option>`).join('')}</select></label>${c?`<label class="checkbox-label"><input name="willpower" type="checkbox" ${rollDraft.willpower&&s.willpowerCurrent?'checked':''} ${s.willpowerCurrent<1?'disabled':''}>Потратить волю: +1 автоуспех</label><small>Воля: ${s.willpowerCurrent} / ${c.willpower}. Автоуспех не отменяется единицами.</small>`:''}<strong class="roll-pool">Пул: <output id="pool-count"></output>d10</strong><label>Комментарий / сообщение<textarea name="note" rows="3" maxlength="2000" placeholder="Что проверяем?">${esc(rollDraft.note)}</textarea></label><button class="gold-button" type="submit">Бросить</button><button type="button" id="post-message">Отправить сообщение</button></form></aside>`;
}
function timeLabel(date) {return new Date(date).toLocaleTimeString('ru-RU',{hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function outcomeText(result) {
  if(result.outcome==='botch')return 'Полный провал';
  if(result.outcome==='failure')return 'Неудача';
  const n=result.successes,word=n%10===1&&n%100!==11?'успех':n%10>=2&&n%10<=4&&(n%100<12||n%100>14)?'успеха':'успехов';
  return `${n} ${word}`;
}
function journal() {
  let rows=visibleJournal(state,actor());
  if(journalFilter==='mine')rows=rows.filter(r=>r.authorId===playerIdentity.id);
  if(role==='gm'&&journalFilter==='hidden')rows=rows.filter(r=>r.hidden);
  if(role==='gm'&&journalFilter==='public')rows=rows.filter(r=>!r.hidden);
  const messages=rows.slice(-journalCount).reverse();
  return title('Журнал бросков')+`<div class="journal-layout">${rollComposer()}<section class="journal-feed"><label class="feed-filter">Показать<select id="journal-filter"><option value="all" ${journalFilter==='all'?'selected':''}>${role==='gm'?'Все записи':'Все открытые'}</option>${role==='player'?`<option value="mine" ${journalFilter==='mine'?'selected':''}>Мои записи</option>`:''}${role==='gm'?`<option value="public" ${journalFilter==='public'?'selected':''}>Открытые</option><option value="hidden" ${journalFilter==='hidden'?'selected':''}>За ширмой</option>`:''}</select></label>${messages.length?messages.map(r=>`<article class="journal-entry ${r.hidden?'hidden-roll':''}"><header><strong>${esc(r.authorName)}${r.characterName?` · ${esc(r.characterName)}`:''}</strong><time datetime="${esc(r.createdAt)}">${esc(timeLabel(r.createdAt))}</time></header>${r.hidden?'<span class="eyebrow">За ширмой</span>':''}${r.type==='roll'?`<h3>${esc(r.label)}</h3><div class="dice">${r.dice.map(n=>`<span class="${n===1?'die-one':n>=r.difficulty?'die-success':''}">${n}</span>`).join('')}${r.result.automatic?'<span class="automatic-die">+1 ВОЛЯ</span>':''}</div><p class="roll-outcome ${r.result.outcome}">${esc(outcomeText(r.result))}<small>Сложность ${r.difficulty} · успехов ${r.result.raw}, единиц ${r.result.ones}</small></p>`:''}${prose(r.note)}${role==='gm'||role==='player'&&r.authorId===playerIdentity.id?`<button class="text-button danger-button" data-delete-journal="${r.id}">Удалить запись</button>`:''}${r.comments.map(c=>`<div class="roll-comment"><strong>${esc(c.authorName)}</strong>${prose(c.text)}</div>`).join('')}${role==='gm'?`<button class="text-button" data-comment="${r.id}">Комментарий ведущего</button>${commentFor===r.id?`<form class="comment-form" data-comment-form="${r.id}"><textarea name="comment" rows="2" maxlength="2000" required aria-label="Комментарий ведущего"></textarea><button type="submit">Добавить</button></form>`:''}`:''}</article>`).join(''):'<p class="empty-state">Пока нет записей.</p>'}${rows.length>journalCount?'<button id="more-journal">Показать ещё</button>':''}</section></div>`;
}
function render() {
  if(role==='spectator'&&!state.publicViewerEnabled){if(network){location.reload();return;}role='player';view='house';toast('Ведущий закрыл зрительский режим.');}
  if(role==='spectator'&&view==='sheet')view='house';
  const openPanels=Array.from(main.querySelectorAll('details[id][open]'),d=>d.id);
  document.querySelector('#day-title').textContent=day().title;
  document.querySelector('#day-title').dataset.cleanTitle=day().title;
  document.querySelector('#day-date').textContent=`${day().dateLabel} · ${day().period}`;
  const select=document.querySelector('#day-select');
  select.hidden=role!=='gm';select.innerHTML=game.days.map(d=>`<option value="${d.id}" ${d.id===state.dayId?'selected':''}>${esc(d.title)}</option>`).join('');
  document.querySelector('#day-title').hidden=role==='gm';
  document.querySelector('#identity-button').textContent=playerIdentity.name;
  document.querySelector('#identity-button').hidden=network||role!=='player';
  document.querySelector('#spectator-role').hidden=!state.publicViewerEnabled&&role!=='spectator';
  document.querySelectorAll('[data-role]').forEach(b=>{b.setAttribute('aria-pressed',String(b.dataset.role===role));if(network)b.hidden=b.dataset.role!==role;});
  document.querySelectorAll('.main-nav [data-view]').forEach(b=>{
    const v=b.dataset.view;
    b.hidden=v==='sheet'?role==='spectator':v==='npcs'?role!=='gm'&&!allNpcs().some(n=>state.npcs[n.id].visible):false;
    b.setAttribute('aria-current',v===view?'page':'false');
  });
  main.innerHTML=({house,roster,sheet,npcs,journal})[view]();
  openPanels.forEach(id=>{const panel=document.getElementById(id);if(panel)panel.open=true;});
  main.classList.toggle('roster-view',view==='roster');
  if(view==='journal')updateRollPool();
  applyAtmosphere(state,role);
  if(view==='roster'){const grid=main.querySelector('.roster');document.documentElement.style.setProperty('--roster-top',`${Math.ceil(grid.getBoundingClientRect().top+scrollY)}px`);}
}
function renderDialog() {
  if(!opened)return;
  let html='';
  if(opened.kind==='archetype'){
    const ref=archetypeReference(opened.id);
    html=`<h2 id="detail-title">${esc(opened.id)}</h2>${prose(ref.text)}<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">Полное описание · Мир Тьмы вики ↗</a>`;
  } else if(opened.kind==='discipline'){
    const ref=disciplineReference(opened.id,opened.value);
    html=`<h2 id="detail-title">${esc(opened.id)}</h2><p class="person-meta">${ref?.bookName!==opened.id?`В корнике: ${esc(ref?.bookName)} · `:''}Уровень: ${opened.value}</p>${ref?`${ref.powers.length?'':prose(ref.text)}<div class="discipline-powers">${ref.powers.map(p=>`<section><h3>${'●'.repeat(p.level)} · ${esc(p.title)}</h3><dl class="power-system">${[['Пул броска',p.roll],['Сложность',p.difficulty],['Цена',p.cost],['Активация / срок',p.duration]].filter(([,value])=>value).map(([key,value])=>`<div><dt>${esc(key)}</dt><dd>${esc(value)}</dd></div>`).join('')}</dl><a href="${esc(p.url)}" target="_blank" rel="noopener noreferrer">Полная формулировка способности ↗</a></section>`).join('')}</div>${ref.powers.length?'':`<a href="${esc(ref.url)}" target="_blank" rel="noopener noreferrer">Способность в корнике ↗</a>`}`:'<p>Описание ожидается.</p>'}`;
  } else if(opened.kind==='identity'){
    html=`<h2 id="detail-title">Имя игрока</h2><form id="identity-form"><label>Имя<input name="name" maxlength="40" required value="${esc(playerIdentity.name)}"></label><button class="gold-button" type="submit">Сохранить</button></form>`;
  } else if(opened.kind==='character'){
    const c=game.characters.find(c=>c.id===opened.id),s=state.characters[c.id],mine=s.claim?.ownerId===playerIdentity.id;
    html=`<div class="dossier-layout"><div>${portrait(c)}</div><article><h2 id="detail-title">${esc(c.name)}</h2><p class="person-meta">${esc(publicFacts(c))}</p>${prose(publicDescription(c))}${layers(c,s.level,false)}${s.death?`<p class="death-date">Погиб · ${esc(s.death.label)}</p>`:''}<div class="dialog-actions">${role==='spectator'?'':mine&&s.claim.confirmed?'<button class="gold-button" data-view="sheet">Открыть мой лист</button>':s.death?'<p>Персонаж недоступен для выбора.</p>':s.claim&&!mine?'<p>Персонаж уже выбран.</p>':owner()?'<p>У вас уже есть персонаж.</p>':mine?`<button class="gold-button" data-confirm="${c.id}">Подтвердить выбор</button><button data-release="${c.id}">Отменить выбор</button>`:`<button class="gold-button" data-reserve="${c.id}">Выбрать персонажа</button>`}</div></article></div>`;
  } else if(opened.kind==='room'){
    const r=game.rooms.find(r=>r.id===opened.id),s=state.rooms[r.id];
    html=role!=='gm'&&!s.visible?'<h2 id="detail-title">Локация скрыта</h2>':`<h2 id="detail-title">${esc(r.name)}</h2>${r.image?illustration(r.image,'location-illustration'):''}${prose(roomDescription(r))}${role==='gm'?`<button data-room-visible="${r.id}">${s.visible?'Скрыть локацию':'Открыть игрокам'}</button><details class="room-editor"><summary>Изменить описание</summary><form data-room-description="${r.id}"><label>Описание для игроков<textarea name="description" rows="10" maxlength="20000">${esc(roomDescription(r))}</textarea></label><button type="submit" class="gold-button">Сохранить описание</button></form></details>`:''}`;
  }
  document.querySelector('#detail-content').innerHTML=html;
  decorateTitles(document.querySelector('#detail-content'));
}
function show(kind,id){opened={kind,id};renderDialog();dialog.showModal();}
function captureRollDraft(){
  const form=document.querySelector('#journal-form');if(!form)return;
  const f=new FormData(form);
  rollDraft={...rollDraft,pool:Number(f.get('pool')??rollDraft.pool),difficulty:Number(f.get('difficulty')),modifier:Number(f.get('modifier')??0),attribute:f.get('attribute')||rollDraft.attribute,ability:f.get('ability')||rollDraft.ability,characterId:f.get('characterId')||'',willpower:f.has('willpower'),hidden:f.has('hidden'),note:String(f.get('note')||''),label:String(f.get('label')||'')};
}
function currentPool() {
  if(role==='gm')return Math.max(0,Math.min(50,rollDraft.pool));
  const c=rollCharacter();if(!c)return 0;
  const s=state.characters[c.id],penalty=damagePenalty(s.health);
  if(penalty===null)return 0;
  return Math.max(0,(c.attributes.find(a=>a.key===rollDraft.attribute)?.value||0)+(c.abilities.find(a=>a.key===rollDraft.ability)?.value||0)+rollDraft.modifier-penalty);
}
function updateRollPool(){captureRollDraft();const out=document.querySelector('#pool-count');if(out)out.textContent=currentPool();}
async function submitRoll() {
  captureRollDraft();const c=rollCharacter();
  const action={type:'record-roll',id:uuid('roll'),createdAt:timestamp(),characterId:c?.id,attribute:rollDraft.attribute,ability:rollDraft.ability,modifier:rollDraft.modifier,pool:currentPool(),difficulty:rollDraft.difficulty,willpower:rollDraft.willpower,hidden:role==='gm'&&rollDraft.hidden,note:rollDraft.note,label:rollDraft.label,dice:throwD10(currentPool())};
  if(await act(action,'Бросок записан в журнал.')){rollDraft.willpower=false;rollDraft.note='';render();}
}
document.addEventListener('click',async e=>{
  const link=e.target.closest('[data-link-view]');if(link){e.preventDefault();return navigate(link.dataset.linkView);}
  const b=e.target.closest('button');if(!b||b.disabled)return;const d=b.dataset;
  if(d.view)return navigate(d.view);
  if(d.role){if(network)return;captureRollDraft();role=d.role;journalFilter='all';rollDraft.willpower=false;if(role==='spectator')view='house';dialog.close();render();return;}
  if(d.character){if(role==='gm'||role==='player'&&owner()===d.character){selectedSheetCharacter=d.character;return navigate('sheet');}return show('character',d.character);}
  if(d.archetype)return show('archetype',d.archetype);
  if(d.discipline){opened={kind:'discipline',id:d.discipline,value:Number(d.rating)};renderDialog();dialog.showModal();return;}
  if(d.room)return show('room',d.room);
  if(d.reserve)return act({type:'reserve-character',id:d.reserve},'Подтвердите выбранного персонажа.');
  if(d.confirm){if(await act({type:'confirm-character',id:d.confirm},'Персонаж закреплён.'))navigate('sheet');return;}
  if(d.release)return act({type:'release-character',id:d.release});
  if(d.death)return act({type:'set-death',id:d.death,dead:!state.characters[d.death].death});
  if(d.roomVisible)return act({type:'set-room-visible',id:d.roomVisible,visible:!state.rooms[d.roomVisible].visible});
  if(d.editNpc){editingNpc=d.editNpc;render();document.querySelector('#npc-editor').open=true;return;}
  if(d.deleteNpc){if(!confirm('Удалить добавленного персонажа?'))return;if(editingNpc===d.deleteNpc)editingNpc=null;return act({type:'delete-custom-npc',id:d.deleteNpc});}
  if(b.id==='cancel-npc'){editingNpc=null;render();return;}
  if(d.deleteJournal){if(!confirm('Удалить запись из журнала? Потраченная воля не возвращается.'))return;return act({type:'delete-journal',id:d.deleteJournal});}
  if(d.npc)return act({type:'set-npc-visible',id:d.npc,visible:!state.npcs[d.npc].visible});
  if(d.goal)return act({type:'set-goal-visibility',id:d.id,kind:d.goal,visible:d.visible==='true'});
  if(d.bloodVisible)return act({type:'set-blood-visibility',id:d.bloodVisible,visible:d.visible==='true'});
  if(d.bloodStep)return act({type:'set-blood-pool',id:d.id,value:state.characters[d.id].bloodPool+Number(d.bloodStep)});
  if(d.willStep)return act({type:'set-willpower',id:d.id,value:state.characters[d.id].willpowerCurrent+Number(d.willStep)});
  if(d.health!==undefined){const health=[...state.characters[d.id].health];health[Number(d.health)]=(health[Number(d.health)]+1)%4;return act({type:'set-health',id:d.id,health});}
  if(d.masquerade)return act({type:'adjust-masquerade',delta:Number(d.masquerade)});
  if(d.masqueradeVisible)return act({type:'set-masquerade-visibility',visible:d.masqueradeVisible==='true'});
  if(d.publicViewer!==undefined)return act({type:'set-public-viewer',visible:d.publicViewer==='true'},'Доступ зрителей обновлён.');
  if(d.editEvent){editingEvent=d.editEvent;render();return;}
  if(d.toggleEvent)return act({type:'toggle-event',id:d.toggleEvent,visible:d.visible==='true'});
  if(d.deleteEvent){if(editingEvent===d.deleteEvent)editingEvent=null;return act({type:'delete-event',id:d.deleteEvent});}
  if(d.comment){captureRollDraft();commentFor=commentFor===d.comment?null:d.comment;render();return;}
  if(b.id==='identity-button')return show('identity');
  if(b.id==='cancel-event'){editingEvent=null;render();return;}
  if(b.id==='more-journal'){journalCount+=50;render();return;}
  if(b.id==='post-message'){captureRollDraft();if(await act({type:'post-message',id:uuid('message'),createdAt:timestamp(),note:rollDraft.note,hidden:role==='gm'&&rollDraft.hidden})){rollDraft.note='';render();}return;}
  if(b.classList.contains('close'))dialog.close();
});
document.addEventListener('submit',async e=>{
  if(e.target.dataset.roomDescription){e.preventDefault();act({type:'save-room-description',id:e.target.dataset.roomDescription,text:String(new FormData(e.target).get('description'))},'Описание сохранено.');return;}
  if(e.target.id==='npc-form'){
    e.preventDefault();if(role!=='gm')return;const form=e.target,f=new FormData(form),button=form.querySelector('[type="submit"]');button.disabled=true;
    const npcId=editingNpc||uuid('custom'),existing=allNpcs().find(n=>n.id===npcId);
    try{
      const file=f.get('portrait'),src=file?.size?await uploadedPortrait(file):f.has('removePortrait')?'':existing?.portrait?.src||'';
      if(role!=='gm')return;
      if(await act({type:'save-custom-npc',item:{id:npcId,name:String(f.get('name')),role:String(f.get('role')),summary:String(f.get('summary')),portrait:{src}}},'Персонаж сохранён.')){editingNpc=null;render();}
    }catch(error){toast(error.message||'Не удалось загрузить изображение.');}finally{button.disabled=false;}return;
  }
  if(e.target.id==='journal-form'){e.preventDefault();return submitRoll();}
  if(e.target.id==='identity-form'){
    e.preventDefault();const name=String(new FormData(e.target).get('name')).trim();if(!name)return;
    playerIdentity={id:`player:${name.toLocaleLowerCase('ru-RU')}`,name};
    try{storage?.setItem('igra-preview-identity-v1',JSON.stringify(playerIdentity));}catch{}
    dialog.close();render();return;
  }
  if(e.target.id==='event-form'){
    e.preventDefault();const f=new FormData(e.target);
    if(await act({type:'save-event',id:editingEvent||uuid('event'),title:String(f.get('title')),text:String(f.get('text')),dayId:f.get('dayId')||null,visible:f.has('visible')},'Объявление сохранено.')){editingEvent=null;render();}return;
  }
  if(e.target.dataset.commentForm){
    e.preventDefault();captureRollDraft();if(await act({type:'comment-roll',id:e.target.dataset.commentForm,text:String(new FormData(e.target).get('comment')),createdAt:timestamp()})){commentFor=null;render();}
  }
});
document.addEventListener('change',e=>{
  const el=e.target;
  if(el.id==='day-select')return act({type:'set-day',id:el.value});
  if(el.dataset.level)return act({type:`set-${el.dataset.level}-level`,id:el.dataset.id,level:Number(el.value)});
  if(el.dataset.blood)return act({type:'set-blood-pool',id:el.dataset.blood,value:Number(el.value)});
  if(el.id==='gm-sheet-select'){selectedSheetCharacter=el.value;render();return;}
  if(el.id==='journal-filter'){captureRollDraft();journalFilter=el.value;render();return;}
  if(el.closest('#journal-form')){captureRollDraft();if(el.name==='characterId')render();else updateRollPool();}
});
document.addEventListener('input',async e=>{
  if(e.target.closest('#journal-form'))updateRollPool();
  if(e.target.id!=='notes'||role!=='player')return;
  try{state=await session.dispatch({type:'save-note',id:owner(),text:e.target.value},actor());document.querySelector('#notes-status').textContent='Сохранено';}catch(error){toast(error.message);}
});
dialog.addEventListener('close',()=>{opened=null;});
dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});
window.addEventListener('storage',e=>{if(!network&&e.key==='igra-workbench-v2'&&session.refresh(e.newValue)){state=session.read();render();if(opened)renderDialog();}});
function fitRoster(){if(view==='roster'){const grid=main.querySelector('.roster');if(grid)document.documentElement.style.setProperty('--roster-top',`${Math.ceil(grid.getBoundingClientRect().top+scrollY)}px`);}}
window.addEventListener('resize',fitRoster);
document.fonts?.ready.then(fitRoster);
if(typeof ResizeObserver!=='undefined'){const layoutObserver=new ResizeObserver(fitRoster);layoutObserver.observe(document.querySelector('.masthead'));layoutObserver.observe(document.querySelector('.main-nav'));}
window.addEventListener('hashchange',()=>navigate(views.includes(location.hash.slice(1))?location.hash.slice(1):'house',false));
render();

if(network){
 const name=document.createElement('span');name.className='online-name';name.textContent=initial.actor.name;document.querySelector('.role-panel').prepend(name);
 const leave=document.createElement('button');leave.className='text-button';leave.textContent='Выйти';leave.onclick=()=>session.logout();document.querySelector('.role-panel').append(leave);
 session.subscribe(snapshot=>{
  captureRollDraft();
  const active=document.activeElement, focusId=active?.id, focusName=active?.name;
  const formId=active?.closest('form')?.id, roomId=active?.closest('form')?.dataset.roomDescription;
  const value=active?.value,start=active?.selectionStart,end=active?.selectionEnd;
  const drafts=Array.from(document.querySelectorAll('#event-form input,#event-form textarea,#event-form select,#npc-form input,#npc-form textarea,form[data-room-description] textarea'),el=>({form:el.closest('form').id,room:el.closest('form').dataset.roomDescription,name:el.name,value:el.value,checked:el.checked,files:el.type==='file'?el.files:null}));
  const roomEditorOpen=document.querySelector('.room-editor')?.open;
  initial=snapshot;game=snapshot.content;state=snapshot.state;role=snapshot.actor.role;render();if(opened)renderDialog();
  if(roomEditorOpen&&document.querySelector('.room-editor'))document.querySelector('.room-editor').open=true;
  for(const d of drafts){const f=d.room?document.querySelector(`form[data-room-description="${d.room}"]`):document.getElementById(d.form);const el=f?.elements.namedItem(d.name);if(el){if(el.type==='file'){if(d.files?.length)el.files=d.files;}else el.value=d.value;if(el.type==='checkbox')el.checked=d.checked;}}
  const f=roomId?document.querySelector(`form[data-room-description="${roomId}"]`):document.getElementById(formId);
  const replacement=focusId?document.getElementById(focusId):f?.elements.namedItem(focusName);
  if(replacement&&active?.matches('input:not([type=file]),textarea,select')){if(focusId==='notes')replacement.value=value;replacement.focus({preventScroll:true});if(start!==null&&start!==undefined&&replacement.setSelectionRange&&replacement.type!=='number'&&replacement.tagName!=='SELECT'){try{replacement.setSelectionRange(start,end);}catch{}}}
 });
}
